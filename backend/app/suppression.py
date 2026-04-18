from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Unsubscribe


def is_suppressed(db: Session, email: str) -> bool:
    """Return True if the email is on the global unsubscribe list."""
    e = (email or "").strip().lower()
    if not e:
        return False
    return db.scalar(select(Unsubscribe).where(Unsubscribe.email == e)) is not None


def suppress(
    db: Session,
    email: str,
    reason: str | None = None,
    source: str | None = None,
) -> Unsubscribe:
    """Add (or return existing) global suppression row for this email. Does not commit."""
    e = (email or "").strip().lower()
    existing = db.scalar(select(Unsubscribe).where(Unsubscribe.email == e))
    if existing:
        return existing
    row = Unsubscribe(id=uuid.uuid4(), email=e, reason=reason, source=source)
    db.add(row)
    db.flush()
    return row


def now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)
