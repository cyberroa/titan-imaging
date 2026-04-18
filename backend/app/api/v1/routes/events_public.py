from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import BrowserSession, Customer, Event
from app.schemas import EventIn, OkOut

router = APIRouter()


MAX_PAYLOAD_BYTES = 16_000


def _truncate_payload(p: dict | None) -> dict:
    if not p:
        return {}
    out = {}
    for k, v in p.items():
        if isinstance(v, str) and len(v) > 2000:
            out[k] = v[:2000]
        else:
            out[k] = v
    return out


@router.post("/events", response_model=OkOut)
async def ingest_event(
    body: EventIn,
    request: Request,
    db: Session = Depends(get_db),
):
    now = dt.datetime.now(dt.timezone.utc)

    session: BrowserSession | None = None
    if body.cookie_id:
        cid = body.cookie_id.strip()[:64]
        session = db.scalar(select(BrowserSession).where(BrowserSession.cookie_id == cid))
        if not session:
            session = BrowserSession(
                id=uuid.uuid4(),
                cookie_id=cid,
                user_agent=request.headers.get("user-agent", "")[:2000] or None,
                referrer=(body.payload or {}).get("referrer"),
            )
            db.add(session)
            db.flush()
        else:
            session.last_seen_at = now

    customer: Customer | None = None
    if body.email:
        email = str(body.email).strip().lower()
        customer = db.scalar(select(Customer).where(Customer.email == email))
        if customer is None:
            customer = Customer(
                id=uuid.uuid4(),
                email=email,
                source="web",
                tags=[],
            )
            db.add(customer)
            db.flush()
        if session and session.customer_id is None:
            session.customer_id = customer.id

    ev = Event(
        id=uuid.uuid4(),
        session_id=session.id if session else None,
        customer_id=customer.id if customer else None,
        type=body.type.strip()[:80],
        url=(body.url or "")[:2000] or None,
        payload=_truncate_payload(body.payload),
        occurred_at=now,
    )
    db.add(ev)
    db.commit()
    return OkOut()
