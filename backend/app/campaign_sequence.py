from __future__ import annotations

import datetime as dt
import math
import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.customer_utils import customer_template_variables, manual_recipient_variables
from app.email import send_campaign_email
from app.models import Campaign, CampaignRecipient, Customer, EmailTemplate, MailDomain, Segment
from app.segments import segment_count, segment_customers
from app.suppression import is_suppressed
from app.templating import template_to_text_html


def compute_sequence(audience_size: int, max_per_day: int, max_days: int) -> tuple[int, int]:
    n = max(0, audience_size)
    cap = max(1, max_per_day)
    span = max(1, max_days)
    if n == 0:
        return 1, cap
    days = min(span, max(1, math.ceil(n / cap)))
    quota = min(cap, math.ceil(n / days))
    return days, quota


def campaign_progress(db: Session, c: Campaign) -> dict[str, Any]:
    total = db.scalar(
        select(func.count()).select_from(CampaignRecipient).where(CampaignRecipient.campaign_id == c.id)
    ) or 0
    sent = db.scalar(
        select(func.count()).select_from(CampaignRecipient).where(
            CampaignRecipient.campaign_id == c.id,
            CampaignRecipient.status == "sent",
        )
    ) or 0
    failed = db.scalar(
        select(func.count()).select_from(CampaignRecipient).where(
            CampaignRecipient.campaign_id == c.id,
            CampaignRecipient.status == "failed",
        )
    ) or 0
    queued = db.scalar(
        select(func.count()).select_from(CampaignRecipient).where(
            CampaignRecipient.campaign_id == c.id,
            CampaignRecipient.status == "queued",
        )
    ) or 0
    remaining = queued
    days = 1
    day_index = 1
    if c.sequence_started_at and c.sequence_ends_on:
        start = c.sequence_started_at.date()
        end = c.sequence_ends_on
        days = max(1, (end - start).days + 1)
        today = dt.datetime.now(dt.timezone.utc).date()
        day_index = min(days, max(1, (today - start).days + 1))
    pct = int(round((sent / total) * 100)) if total else 0
    return {
        "total": int(total),
        "sent": int(sent),
        "failed": int(failed),
        "queued": int(queued),
        "remaining": int(remaining),
        "days": days,
        "day_index": day_index,
        "daily_quota": c.daily_quota,
        "percent": pct,
        "previewed_at": c.previewed_at.isoformat() if c.previewed_at else None,
        "sequence_ends_on": c.sequence_ends_on.isoformat() if c.sequence_ends_on else None,
        "mail_domain_id": str(c.mail_domain_id) if c.mail_domain_id else None,
    }


def queue_audience(db: Session, c: Campaign) -> tuple[int, int, int]:
    """Create queued recipients. Returns queued, skipped_suppressed, skipped_consent."""
    if c.segment_id:
        seg = db.get(Segment, c.segment_id)
        if not seg:
            raise ValueError("Segment missing")
        audience = segment_customers(db, seg.filter_json, limit=None)
        audience_total = segment_count(db, seg.filter_json)
    else:
        audience = list(db.execute(select(Customer)).scalars().all())
        audience_total = len(audience)

    skipped_suppressed = 0
    skipped_consent = 0
    queued = 0
    seen: set[str] = set()
    for cust in audience:
        email = (cust.email or "").strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        if not getattr(cust, "consent_marketing", False):
            skipped_consent += 1
            continue
        if is_suppressed(db, email):
            skipped_suppressed += 1
            continue
        existing = db.scalar(
            select(CampaignRecipient).where(
                CampaignRecipient.campaign_id == c.id,
                CampaignRecipient.email == email,
            )
        )
        if existing:
            continue
        db.add(
            CampaignRecipient(
                id=uuid.uuid4(),
                campaign_id=c.id,
                customer_id=cust.id,
                email=email,
                status="queued",
            )
        )
        queued += 1
    stats = dict(c.stats_json or {})
    stats.update(
        {
            "audience_total": audience_total,
            "queued": queued,
            "skipped_suppressed": skipped_suppressed,
            "skipped_consent": skipped_consent,
        }
    )
    c.stats_json = stats
    db.commit()
    return queued, skipped_suppressed, skipped_consent


def assign_schedule(db: Session, c: Campaign, days: int) -> None:
    rows = list(
        db.execute(
            select(CampaignRecipient)
            .where(CampaignRecipient.campaign_id == c.id, CampaignRecipient.status == "queued")
            .order_by(CampaignRecipient.created_at.asc())
        )
        .scalars()
        .all()
    )
    start = dt.datetime.now(dt.timezone.utc).date()
    for i, r in enumerate(rows):
        offset = i % max(1, days)
        r.scheduled_for = start + dt.timedelta(days=offset)
    c.sequence_started_at = dt.datetime.now(dt.timezone.utc)
    c.sequence_ends_on = start + dt.timedelta(days=max(1, days) - 1)
    db.commit()


def _reset_domain_day(domain: MailDomain, today: dt.date) -> None:
    if domain.last_sent_date != today:
        domain.sent_today = 0
        domain.last_sent_date = today


async def send_due_batch(db: Session, c: Campaign, limit: int) -> dict[str, int]:
    tpl = db.get(EmailTemplate, c.template_id)
    if not tpl:
        return {"sent": 0, "failed": 0}
    today = dt.datetime.now(dt.timezone.utc).date()
    pending = list(
        db.execute(
            select(CampaignRecipient)
            .options(selectinload(CampaignRecipient.customer))
            .where(
                CampaignRecipient.campaign_id == c.id,
                CampaignRecipient.status == "queued",
                or_(
                    CampaignRecipient.scheduled_for.is_(None),
                    CampaignRecipient.scheduled_for <= today,
                ),
            )
            .order_by(CampaignRecipient.scheduled_for.asc(), CampaignRecipient.created_at.asc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    domain = db.get(MailDomain, c.mail_domain_id) if c.mail_domain_id else None
    from_email = domain.from_email if domain else None
    tags = [{"name": "campaign_id", "value": str(c.id)}]
    sent = 0
    failed = 0
    now = dt.datetime.now(dt.timezone.utc)
    for r in pending:
        try:
            variables = (
                customer_template_variables(r.customer)
                if r.customer
                else manual_recipient_variables(r.email)
            )
            subject, html_out, text_out = template_to_text_html(
                tpl.subject, tpl.body_md, tpl.body_html, variables
            )
            ok, msg_id = await send_campaign_email(
                r.email,
                subject,
                text_out,
                html=html_out,
                campaign_id=str(c.id),
                tags=tags,
                from_email=from_email,
            )
            if ok:
                r.status = "sent"
                r.sent_at = now
                r.resend_message_id = msg_id
                sent += 1
                if domain:
                    _reset_domain_day(domain, today)
                    domain.sent_today = int(domain.sent_today or 0) + 1
            else:
                r.status = "failed"
                r.error = "send failed"
                failed += 1
        except Exception as exc:
            r.status = "failed"
            r.error = f"{type(exc).__name__}: {exc}"[:500]
            failed += 1
        db.commit()

    stats = dict(c.stats_json or {})
    stats["sent"] = int(stats.get("sent") or 0) + sent
    stats["failed"] = int(stats.get("failed") or 0) + failed
    left = db.scalar(
        select(func.count()).select_from(CampaignRecipient).where(
            CampaignRecipient.campaign_id == c.id,
            CampaignRecipient.status == "queued",
        )
    ) or 0
    if left == 0:
        c.status = "sent" if not failed and not stats.get("failed") else "sent_with_errors"
        c.sent_at = now
        stats["finished_at"] = now.isoformat()
    else:
        c.status = "running"
    c.stats_json = stats
    db.commit()
    return {"sent": sent, "failed": failed, "remaining": int(left)}


async def tick_sequences(db: Session) -> dict[str, Any]:
    today = dt.datetime.now(dt.timezone.utc).date()
    rows = list(
        db.execute(
            select(Campaign).where(Campaign.status.in_(("armed", "running", "sending")))
        )
        .scalars()
        .all()
    )
    out: list[dict[str, Any]] = []
    for c in rows:
        domain = db.get(MailDomain, c.mail_domain_id) if c.mail_domain_id else None
        cap = c.daily_quota or 80
        if domain:
            _reset_domain_day(domain, today)
            remaining_cap = max(0, int(domain.daily_cap) - int(domain.sent_today or 0))
            cap = min(cap, remaining_cap)
        if cap <= 0:
            out.append({"campaign_id": str(c.id), "skipped": "domain_cap"})
            continue
        result = await send_due_batch(db, c, cap)
        out.append({"campaign_id": str(c.id), **result})
    return {"campaigns": out}
