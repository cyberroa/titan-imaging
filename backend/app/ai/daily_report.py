from __future__ import annotations

import datetime as dt
import json
import logging
import uuid

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.client import chat_completion, resolve_model
from app.ai.prompts import DAILY_REPORT_SYSTEM, daily_report_user_prompt
from app.ai.snapshots import run_engagement_snapshots, warmth_movers
from app.email import send_admin_email
from app.engagement import HOT_LEAD_THRESHOLD, compute_score
from app.models import Campaign, Customer, DailyBriefing, Event, MarketingGoal
from app.settings import get_settings

logger = logging.getLogger(__name__)


def _markdown_to_html(md: str) -> str:
    lines = md.split("\n")
    parts: list[str] = []
    for line in lines:
        if line.startswith("## "):
            parts.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("# "):
            parts.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("- "):
            parts.append(f"<li>{line[2:]}</li>")
        elif line.strip():
            parts.append(f"<p>{line}</p>")
    body = "\n".join(parts)
    return f"<html><body style='font-family:sans-serif;max-width:720px'>{body}</body></html>"


def gather_daily_aggregates(db: Session) -> dict:
    now = dt.datetime.now(dt.timezone.utc)
    hot: list[dict] = []
    customers = db.execute(select(Customer).limit(500)).scalars().all()
    for c in customers:
        events = db.execute(select(Event).where(Event.customer_id == c.id).limit(80)).scalars().all()
        score = compute_score(list(events), now)
        if score >= HOT_LEAD_THRESHOLD:
            hot.append({"email": c.email, "name": c.name, "company": c.company, "score": score})
    hot.sort(key=lambda x: x["score"], reverse=True)

    campaigns_sent = db.scalar(
        select(func.count()).select_from(Campaign).where(Campaign.status == "sent")
    ) or 0
    campaigns_draft = db.scalar(
        select(func.count()).select_from(Campaign).where(Campaign.status == "draft")
    ) or 0

    return {
        "report_date": dt.date.today().isoformat(),
        "hot_leads": hot[:15],
        "warmth_movers": warmth_movers(db),
        "customer_count": db.scalar(select(func.count()).select_from(Customer)) or 0,
        "campaigns": {"sent": campaigns_sent, "draft": campaigns_draft},
        "goals": [
            {
                "name": g.name,
                "member_count": g.last_member_count,
                "status": g.segment_link_status,
                "opportunity_types": list(g.opportunity_types or []),
            }
            for g in db.execute(
                select(MarketingGoal)
                .where(MarketingGoal.active.is_(True))
                .order_by(MarketingGoal.updated_at.desc())
                .limit(10)
            )
            .scalars()
            .all()
        ],
    }


async def generate_daily_briefing(db: Session, *, for_date: dt.date | None = None) -> DailyBriefing:
    day = for_date or dt.date.today()
    run_engagement_snapshots(db, for_date=day)
    aggregates = gather_daily_aggregates(db)
    raw = await chat_completion(
        messages=[
            {"role": "system", "content": DAILY_REPORT_SYSTEM},
            {"role": "user", "content": daily_report_user_prompt(json.dumps(aggregates, default=str))},
        ],
        model=resolve_model("daily_report"),
        response_format="json",
        temperature=0.35,
        max_tokens=1500,
    )
    data = json.loads(raw)
    title = (data.get("title") or f"Daily CRM Briefing — {day.isoformat()}").strip()
    markdown_body = (data.get("markdown_body") or "").strip()
    html_body = _markdown_to_html(markdown_body)
    model = resolve_model("daily_report")

    existing = db.scalar(select(DailyBriefing).where(DailyBriefing.report_date == day))
    if existing:
        existing.title = title
        existing.markdown_body = markdown_body
        existing.html_body = html_body
        existing.chart_payload = aggregates
        existing.model = model
        row = existing
    else:
        row = DailyBriefing(
            id=uuid.uuid4(),
            report_date=day,
            title=title,
            markdown_body=markdown_body,
            html_body=html_body,
            chart_payload=aggregates,
            model=model,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


async def deliver_daily_briefing(db: Session, briefing: DailyBriefing) -> dict[str, bool]:
    settings = get_settings()
    emailed = False
    slacked = False
    now = dt.datetime.now(dt.timezone.utc)

    recipients = settings.staff_briefing_emails_list or list(settings.admin_email_allowlist_set)
    if recipients and briefing.html_body:
        subject = briefing.title
        for addr in recipients:
            if await send_admin_email(addr, subject, briefing.html_body):
                emailed = True
        if emailed:
            briefing.emailed_at = now

    webhook = (settings.slack_webhook_url or "").strip()
    if webhook:
        summary = briefing.markdown_body[:1500]
        payload = {
            "text": f"*{briefing.title}*\n{summary}\n\nView admin briefings for full report.",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(webhook, json=payload)
                if resp.status_code < 400:
                    slacked = True
                    briefing.slacked_at = now
        except httpx.HTTPError:
            logger.exception("Slack webhook failed")

    db.commit()
    return {"emailed": emailed, "slacked": slacked}
