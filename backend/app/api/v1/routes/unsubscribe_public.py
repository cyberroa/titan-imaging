from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import CampaignRecipient, InventoryAlertSubscription
from app.suppression import suppress
from app.unsubscribe_tokens import verify_token

router = APIRouter()


def _page(title: str, body_html: str, status: int = 200) -> HTMLResponse:
    html = f"""<!doctype html>
<html><head><meta charset="utf-8"><title>{title}</title>
<style>
  body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b0e;color:#e5e7eb;margin:0;padding:48px 16px;text-align:center}}
  .card{{max-width:520px;margin:0 auto;background:#14141a;border:1px solid #2a2a35;border-radius:12px;padding:32px}}
  h1{{margin:0 0 16px;font-size:22px}}
  p{{color:#9ca3af;line-height:1.6}}
  a{{color:#a7d5ff}}
</style></head>
<body><div class="card"><h1>{title}</h1>{body_html}</div></body></html>"""
    return HTMLResponse(html, status_code=status)


@router.get("/unsubscribe", response_class=HTMLResponse)
def unsubscribe_get(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    payload = verify_token(token)
    if not payload:
        return _page(
            "Unsubscribe link invalid",
            "<p>This unsubscribe link is invalid or has expired. "
            "Reply to any of our emails and we'll remove you manually.</p>",
            status=400,
        )

    email = payload["e"]
    campaign_id = payload.get("c")

    suppress(db, email, reason="user-unsubscribe", source="email-link")

    now = dt.datetime.now(dt.timezone.utc)
    db.execute(
        update(InventoryAlertSubscription)
        .where(InventoryAlertSubscription.email == email)
        .values(active=False)
    )
    stmt = (
        update(CampaignRecipient)
        .where(CampaignRecipient.email == email)
        .values(unsubscribed_at=now, status="unsubscribed")
    )
    if campaign_id:
        stmt = stmt.where(CampaignRecipient.campaign_id == campaign_id)
    db.execute(stmt)
    db.commit()

    return _page(
        "You're unsubscribed",
        f"<p>{email} has been removed from Titan Imaging emails. "
        "We're sorry to see you go — reply to any email if this was a mistake.</p>",
    )


@router.post("/unsubscribe", response_class=HTMLResponse)
def unsubscribe_post(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """RFC 8058 one-click unsubscribe target."""
    return unsubscribe_get(token=token, db=db)
