from __future__ import annotations

import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.email import send_customer_email
from app.models import InventoryAlertSubscription, Part
from app.part_utils import is_part_available
from app.settings import get_settings


def generate_unsubscribe_token() -> str:
    return secrets.token_urlsafe(32)


async def notify_subscribers_if_became_available(
    db: Session,
    part: Part,
    was_available: bool | None,
) -> None:
    """
    If the part just became available (was not available, now is), email active subscribers once.
    was_available=None skips the transition check (e.g. new part already in stock).
    """
    now = is_part_available(part)
    if not now:
        return
    if was_available is True:
        return

    settings = get_settings()
    base_url = (settings.public_site_url or "").rstrip("/")
    api_base = (settings.public_api_url or settings.public_site_url or "").rstrip("/")
    q = (
        select(InventoryAlertSubscription)
        .where(
            InventoryAlertSubscription.part_id == part.id,
            InventoryAlertSubscription.active.is_(True),
        )
        .order_by(InventoryAlertSubscription.created_at.asc())
    )
    subs = list(db.execute(q).scalars().all())
    if not subs:
        return

    from datetime import datetime, timezone

    now_ts = datetime.now(timezone.utc)
    for sub in subs:
        if sub.last_notified_at is not None:
            continue
        unsub_path = f"/api/v1/inventory-alerts/unsubscribe?token={sub.unsubscribe_token}"
        unsub = f"{api_base}{unsub_path}" if api_base else unsub_path
        subject = f"In stock: {part.part_number} — {part.name}"
        text_body = (
            f"Good news — this part is available now:\n\n"
            f"{part.part_number} — {part.name}\n\n"
            f"View inventory: {base_url}/inventory\n\n"
            f"Unsubscribe: {unsub}"
        )
        await send_customer_email(sub.email, subject, text_body)
        sub.last_notified_at = now_ts
    db.flush()


def subscribe_email(
    db: Session,
    email: str,
    part_id: uuid.UUID,
    query_text: str | None = None,
) -> InventoryAlertSubscription:
    token = generate_unsubscribe_token()
    existing = db.execute(
        select(InventoryAlertSubscription).where(
            InventoryAlertSubscription.email == email.strip().lower(),
            InventoryAlertSubscription.part_id == part_id,
        )
    ).scalar_one_or_none()
    if existing:
        existing.active = True
        existing.query_text = query_text or existing.query_text
        db.flush()
        return existing

    sub = InventoryAlertSubscription(
        id=uuid.uuid4(),
        email=email.strip().lower(),
        part_id=part_id,
        query_text=query_text,
        active=True,
        unsubscribe_token=token,
    )
    db.add(sub)
    db.flush()
    return sub
