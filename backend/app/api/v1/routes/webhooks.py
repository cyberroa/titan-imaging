from __future__ import annotations

import base64
import datetime as dt
import hashlib
import hmac
import json
import time
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Campaign, CampaignRecipient, Event
from app.schemas import OkOut
from app.settings import get_settings
from app.suppression import suppress

router = APIRouter(prefix="/webhooks")


EVENT_FIELD_MAP: dict[str, str] = {
    "email.sent": "sent_at",
    "email.delivered": "delivered_at",
    "email.opened": "opened_at",
    "email.clicked": "clicked_at",
    "email.bounced": "bounced_at",
    "email.complained": "complained_at",
}


def _verify_svix(secret: str, svix_id: str, svix_timestamp: str, body: bytes, svix_signature: str) -> bool:
    """Verify a Svix/Resend webhook signature.

    Secret format: `whsec_<base64>` per Resend docs. Header `svix-signature` is a
    space-separated list of `v1,<base64sig>` pairs.
    """
    if not (secret and svix_id and svix_timestamp and svix_signature):
        return False
    try:
        ts = int(svix_timestamp)
    except ValueError:
        return False
    if abs(time.time() - ts) > 60 * 5:
        return False
    raw_secret = secret
    if raw_secret.startswith("whsec_"):
        raw_secret = raw_secret[len("whsec_") :]
    try:
        key = base64.b64decode(raw_secret)
    except Exception:
        key = raw_secret.encode("utf-8")
    signed = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + body
    expected = base64.b64encode(
        hmac.new(key, signed, hashlib.sha256).digest()
    ).decode("ascii")
    for pair in svix_signature.split(" "):
        if not pair:
            continue
        parts = pair.split(",", 1)
        if len(parts) != 2:
            continue
        scheme, sig = parts
        if scheme == "v1" and hmac.compare_digest(sig, expected):
            return True
    return False


def _bump_stats(camp: Campaign, event_type: str) -> None:
    stats = dict(camp.stats_json or {})
    key = {
        "email.delivered": "delivered",
        "email.opened": "opened",
        "email.clicked": "clicked",
        "email.bounced": "bounced",
        "email.complained": "complained",
    }.get(event_type)
    if key:
        stats[key] = int(stats.get(key, 0) or 0) + 1
        camp.stats_json = stats


@router.post("/resend", response_model=OkOut)
async def resend_webhook(
    request: Request,
    svix_id: str | None = Header(default=None, alias="svix-id"),
    svix_timestamp: str | None = Header(default=None, alias="svix-timestamp"),
    svix_signature: str | None = Header(default=None, alias="svix-signature"),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    body_bytes = await request.body()

    if settings.resend_webhook_secret:
        if not _verify_svix(
            settings.resend_webhook_secret,
            svix_id or "",
            svix_timestamp or "",
            body_bytes,
            svix_signature or "",
        ):
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}") from e

    event_type = payload.get("type") or ""
    data = payload.get("data") or {}
    message_id = data.get("email_id") or data.get("id")
    to_list = data.get("to") or []
    to_email = to_list[0] if isinstance(to_list, list) and to_list else data.get("to")
    if isinstance(to_email, str):
        to_email = to_email.strip().lower()

    tags = data.get("tags") or []
    campaign_id = None
    if isinstance(tags, list):
        for t in tags:
            if isinstance(t, dict) and t.get("name") == "campaign_id":
                campaign_id = t.get("value")
                break

    recip: CampaignRecipient | None = None
    if message_id:
        recip = db.scalar(
            select(CampaignRecipient).where(
                CampaignRecipient.resend_message_id == message_id
            )
        )
    if recip is None and campaign_id and to_email:
        recip = db.scalar(
            select(CampaignRecipient).where(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.email == to_email,
            )
        )

    now = dt.datetime.now(dt.timezone.utc)
    if recip:
        field = EVENT_FIELD_MAP.get(event_type)
        if field and getattr(recip, field) is None:
            setattr(recip, field, now)
        if event_type == "email.bounced":
            recip.status = "bounced"
            if to_email:
                suppress(db, to_email, reason="hard-bounce", source="resend")
        elif event_type == "email.complained":
            recip.status = "complained"
            if to_email:
                suppress(db, to_email, reason="complaint", source="resend")
        elif event_type == "email.delivered" and recip.status in ("queued", "sent"):
            recip.status = "delivered"
        camp = db.get(Campaign, recip.campaign_id)
        if camp:
            _bump_stats(camp, event_type)

    ev = Event(
        id=uuid.uuid4(),
        customer_id=recip.customer_id if recip else None,
        type=event_type,
        url=None,
        payload={"resend": data},
        occurred_at=now,
    )
    db.add(ev)
    db.commit()
    return OkOut()


# --------------------------------------------------------------------------
# Social (Make → our API)
# --------------------------------------------------------------------------


def _verify_social(secret: str, signature: str | None, body: bytes) -> bool:
    if not (secret and signature):
        return False
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    provided = signature.lower().removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)


@router.post("/social", response_model=OkOut)
async def social_webhook(
    request: Request,
    x_signature: str | None = Header(default=None, alias="X-Signature"),
    db: Session = Depends(get_db),
):
    """
    Called by the Make scenario after it posts to LinkedIn. Expected JSON:
      { "post_id": "<our id>", "external_id": "<urn:li:share:...>",
        "status": "posted" | "failed", "response": {...} }
    """
    from app.models import SocialPost

    settings = get_settings()
    body_bytes = await request.body()
    if settings.social_callback_secret:
        if not _verify_social(settings.social_callback_secret, x_signature, body_bytes):
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}") from e

    post_id = payload.get("post_id")
    if not post_id:
        raise HTTPException(status_code=400, detail="post_id required")
    post = db.get(SocialPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Social post not found")

    status = (payload.get("status") or "").lower()
    if status == "posted":
        post.status = "posted"
        post.posted_at = dt.datetime.now(dt.timezone.utc)
        post.external_id = payload.get("external_id")
        post.error = None
    elif status == "failed":
        post.status = "failed"
        post.error = payload.get("error") or "unknown error"
    else:
        post.status = status or post.status
    post.response_json = payload.get("response") or payload

    db.commit()
    return OkOut()
