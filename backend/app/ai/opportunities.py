from __future__ import annotations

import datetime as dt
import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.engagement import HOT_LEAD_THRESHOLD, compute_score
from app.models import (
    CampaignRecipient,
    ContactSubmission,
    Customer,
    CustomerEngagementSnapshot,
    Event,
    OpportunitySnapshot,
    SellSubmission,
)

logger = logging.getLogger(__name__)

OPPORTUNITY_TYPES = (
    "warm_parts_inquiry",
    "cooling_engaged",
    "sell_equipment",
    "consent_ready_nurture",
    "hot_lead",
)


def _as_utc(value: dt.datetime) -> dt.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.timezone.utc)
    return value


def detect_customer_opportunities(
    db: Session,
    customer: Customer,
    *,
    as_of: dt.date | None = None,
    now: dt.datetime | None = None,
) -> list[dict[str, Any]]:
    """Rule-first opportunity detection for one customer."""
    day = as_of or dt.date.today()
    now = now or dt.datetime.now(dt.timezone.utc)
    since_7 = now - dt.timedelta(days=7)
    since_3 = now - dt.timedelta(days=3)

    events = list(
        db.execute(
            select(Event)
            .where(Event.customer_id == customer.id)
            .order_by(Event.occurred_at.desc())
            .limit(120)
        )
        .scalars()
        .all()
    )
    score = compute_score(events, now)

    snaps = list(
        db.execute(
            select(CustomerEngagementSnapshot)
            .where(CustomerEngagementSnapshot.customer_id == customer.id)
            .order_by(CustomerEngagementSnapshot.snapshot_date.desc())
            .limit(8)
        )
        .scalars()
        .all()
    )
    latest_warmth = float(snaps[0].score) if snaps else score
    prior_warmth = float(snaps[min(6, len(snaps) - 1)].score) if len(snaps) > 1 else latest_warmth
    warmth_delta = latest_warmth - prior_warmth

    contacts = list(
        db.execute(
            select(ContactSubmission)
            .where(ContactSubmission.email == customer.email)
            .order_by(ContactSubmission.created_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )
    sells = list(
        db.execute(
            select(SellSubmission)
            .where(SellSubmission.email == customer.email)
            .order_by(SellSubmission.created_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )

    recent_part_views = sum(
        1
        for e in events
        if e.type in ("part_view", "part_click", "inventory_search")
        and _as_utc(e.occurred_at) >= since_7
    )
    recent_email_engage = False
    recip = list(
        db.execute(
            select(CampaignRecipient)
            .where(CampaignRecipient.email == customer.email)
            .order_by(CampaignRecipient.created_at.desc())
            .limit(20)
        )
        .scalars()
        .all()
    )
    for r in recip:
        if (r.opened_at and _as_utc(r.opened_at) >= since_7) or (
            r.clicked_at and _as_utc(r.clicked_at) >= since_7
        ):
            recent_email_engage = True
            break

    found: list[dict[str, Any]] = []

    # hot_lead
    if score >= HOT_LEAD_THRESHOLD:
        found.append(
            {
                "opportunity_type": "hot_lead",
                "score": round(score, 1),
                "reasons": [f"Engagement score {score} ≥ hot threshold {HOT_LEAD_THRESHOLD}"],
            }
        )

    # sell_equipment
    sell_hit = None
    for s in sells:
        if _as_utc(s.created_at) >= since_7 or (s.ai_intent or "") == "sell_equipment":
            sell_hit = s
            break
    if sell_hit:
        reasons = ["Sell inquiry on file"]
        if sell_hit.ai_intent:
            reasons.append(f"Intent: {sell_hit.ai_intent}")
        found.append(
            {
                "opportunity_type": "sell_equipment",
                "score": round(max(score, 25.0), 1),
                "reasons": reasons,
            }
        )

    # warm_parts_inquiry
    urgent_contact = any(
        (c.ai_urgency or "") == "high" and _as_utc(c.created_at) >= since_3 for c in contacts
    )
    parts_intent = any(
        (c.ai_intent or "") in ("parts_inquiry", "service_request")
        and _as_utc(c.created_at) >= since_7
        for c in contacts
    )
    if (urgent_contact or parts_intent or recent_part_views >= 2) and (
        score >= 15 or warmth_delta > 0 or recent_part_views
    ):
        reasons = []
        if urgent_contact:
            reasons.append("High-urgency contact in last 3 days")
        if parts_intent:
            reasons.append("Parts/service intent on recent contact")
        if recent_part_views:
            reasons.append(f"{recent_part_views} part views/searches in 7 days")
        if warmth_delta > 0:
            reasons.append(f"Warmth rising (+{warmth_delta:.1f})")
        found.append(
            {
                "opportunity_type": "warm_parts_inquiry",
                "score": round(max(score, 20.0 + recent_part_views), 1),
                "reasons": reasons or ["Parts interest signals"],
            }
        )

    # cooling_engaged
    if (recent_email_engage or prior_warmth >= HOT_LEAD_THRESHOLD * 0.6) and warmth_delta < -3:
        found.append(
            {
                "opportunity_type": "cooling_engaged",
                "score": round(abs(warmth_delta) + 10, 1),
                "reasons": [
                    f"Warmth dropped {warmth_delta:.1f} over recent snapshots",
                    "Prior email engagement or elevated warmth",
                ],
            }
        )

    # consent_ready_nurture
    if customer.consent_marketing and score < 12 and recent_part_views == 0 and not sell_hit:
        found.append(
            {
                "opportunity_type": "consent_ready_nurture",
                "score": 8.0,
                "reasons": ["Marketing consent with low recent activity"],
            }
        )

    return found


def run_opportunity_detection(
    db: Session,
    *,
    as_of: dt.date | None = None,
    customer_limit: int = 2000,
) -> dict[str, Any]:
    day = as_of or dt.date.today()
    now = dt.datetime.now(dt.timezone.utc)
    customers = list(
        db.execute(select(Customer).order_by(Customer.updated_at.desc()).limit(customer_limit))
        .scalars()
        .all()
    )
    written = 0
    by_type: dict[str, int] = {t: 0 for t in OPPORTUNITY_TYPES}

    for c in customers:
        opps = detect_customer_opportunities(db, c, as_of=day, now=now)
        for opp in opps:
            otype = opp["opportunity_type"]
            existing = db.scalar(
                select(OpportunitySnapshot).where(
                    OpportunitySnapshot.customer_id == c.id,
                    OpportunitySnapshot.opportunity_type == otype,
                    OpportunitySnapshot.as_of_date == day,
                )
            )
            if existing:
                existing.score = opp["score"]
                existing.reasons = opp["reasons"]
            else:
                db.add(
                    OpportunitySnapshot(
                        id=uuid.uuid4(),
                        customer_id=c.id,
                        opportunity_type=otype,
                        score=opp["score"],
                        reasons=opp["reasons"],
                        as_of_date=day,
                    )
                )
            written += 1
            by_type[otype] = by_type.get(otype, 0) + 1

    db.commit()
    return {
        "as_of_date": day.isoformat(),
        "customers_scanned": len(customers),
        "snapshots_written": written,
        "by_type": by_type,
    }


def customer_latest_opportunities(db: Session, customer_id: uuid.UUID, days: int = 7) -> list[dict]:
    since = dt.date.today() - dt.timedelta(days=days)
    rows = (
        db.execute(
            select(OpportunitySnapshot)
            .where(
                OpportunitySnapshot.customer_id == customer_id,
                OpportunitySnapshot.as_of_date >= since,
            )
            .order_by(OpportunitySnapshot.score.desc(), OpportunitySnapshot.as_of_date.desc())
        )
        .scalars()
        .all()
    )
    # Dedupe by type keeping highest score / newest
    best: dict[str, OpportunitySnapshot] = {}
    for r in rows:
        prev = best.get(r.opportunity_type)
        if not prev or float(r.score) > float(prev.score):
            best[r.opportunity_type] = r
    return [
        {
            "opportunity_type": r.opportunity_type,
            "score": float(r.score),
            "reasons": r.reasons or [],
            "as_of_date": r.as_of_date.isoformat(),
        }
        for r in best.values()
    ]
