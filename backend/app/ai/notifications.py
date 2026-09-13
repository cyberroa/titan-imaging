"""In-app Workbench alerts from analytics-quality signals."""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.engagement import analytics_overview
from app.ai.opportunities import hot_opportunities_above_threshold
from app.models import MarketingGoal, WorkbenchNotification, WorkbenchStaff
from app.staff_permissions import effective_capabilities, is_owner_tier

RECIPIENT_CAPS = frozenset({"marketing", "sales"})
READ_COOLDOWN = dt.timedelta(hours=24)


def _recipient_staff(db: Session) -> list[WorkbenchStaff]:
    rows = list(
        db.execute(select(WorkbenchStaff).where(WorkbenchStaff.active.is_(True))).scalars().all()
    )
    out: list[WorkbenchStaff] = []
    for s in rows:
        caps = effective_capabilities(s)
        if is_owner_tier(s) or caps & RECIPIENT_CAPS:
            out.append(s)
    return out


def collect_candidates(db: Session) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    for row in hot_opportunities_above_threshold(db, min_score=40.0, days=1)[:20]:
        cid = row["customer_id"]
        who = row.get("company") or row.get("name") or row.get("email") or "lead"
        kind = str(row.get("opportunity_type") or "hot_lead")[:40]
        href = f"/workbench/customers/{cid}"
        if kind == "hot_lead":
            href = f"/workbench/studio?mode=agent&customer={cid}"
        items.append(
            {
                "kind": kind if kind in ("hot_lead", "sell_equipment", "warm_parts_inquiry") else "hot_lead",
                "title": f"Hot lead — {who}",
                "body": "; ".join(str(r) for r in (row.get("reasons") or [])[:3])
                or f"Score {row.get('score')}",
                "href": href,
                "dedup_key": f"{kind}:{cid}",
                "payload": {"customer_id": cid, "score": row.get("score")},
            }
        )

    overview = analytics_overview(db, hours=24)
    for p in overview.get("progressions") or []:
        kind = str(p.get("type") or "stage_suggestion")[:40]
        cid = p.get("customer_id")
        href = (p.get("actions") or [{}])[0].get("href") or "/workbench/analytics"
        if not href and cid:
            href = f"/workbench/customers/{cid}"
        items.append(
            {
                "kind": kind,
                "title": str(p.get("title") or "Pipeline update")[:300],
                "body": str(p.get("detail") or "")[:4000],
                "href": str(href)[:500],
                "dedup_key": f"{kind}:{cid or 'none'}",
                "payload": {
                    "customer_id": cid,
                    "suggested_stage": p.get("suggested_stage"),
                },
            }
        )

    goals = list(
        db.execute(select(MarketingGoal).where(MarketingGoal.active.is_(True))).scalars().all()
    )
    for g in goals:
        threshold = g.draft_on_threshold
        count = g.last_member_count
        if threshold is None or count is None or count < threshold:
            continue
        items.append(
            {
                "kind": "goal_threshold",
                "title": f"Goal threshold — {g.name}",
                "body": f"{count} members (threshold {threshold}). Ready for a draft.",
                "href": "/workbench/goals",
                "dedup_key": f"goal_threshold:{g.id}:{threshold}",
                "payload": {"goal_id": str(g.id), "count": count},
            }
        )

    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for item in items:
        key = item["dedup_key"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique[:40]


def upsert_for_staff(
    db: Session,
    staff_id: uuid.UUID,
    candidate: dict[str, Any],
    *,
    now: dt.datetime,
) -> str:
    existing = db.scalar(
        select(WorkbenchNotification).where(
            WorkbenchNotification.staff_id == staff_id,
            WorkbenchNotification.dedup_key == candidate["dedup_key"],
        )
    )
    if existing is None:
        db.add(
            WorkbenchNotification(
                id=uuid.uuid4(),
                staff_id=staff_id,
                kind=candidate["kind"][:40],
                title=candidate["title"][:300],
                body=(candidate.get("body") or "")[:8000],
                href=(candidate.get("href") or "/workbench/analytics")[:500],
                dedup_key=candidate["dedup_key"][:200],
                payload=candidate.get("payload") or {},
            )
        )
        return "inserted"
    if existing.read_at is None:
        return "skipped_unread"
    if existing.read_at > now - READ_COOLDOWN:
        return "skipped_cooldown"
    existing.read_at = None
    existing.title = candidate["title"][:300]
    existing.body = (candidate.get("body") or "")[:8000]
    existing.href = (candidate.get("href") or existing.href)[:500]
    existing.kind = candidate["kind"][:40]
    existing.payload = candidate.get("payload") or existing.payload
    existing.created_at = now
    return "reopened"


def tick_notifications(db: Session) -> dict[str, Any]:
    now = dt.datetime.now(dt.timezone.utc)
    candidates = collect_candidates(db)
    recipients = _recipient_staff(db)
    inserted = skipped = reopened = 0
    for staff in recipients:
        for cand in candidates:
            result = upsert_for_staff(db, staff.id, cand, now=now)
            if result == "inserted":
                inserted += 1
            elif result == "reopened":
                reopened += 1
            else:
                skipped += 1
    db.commit()
    return {
        "recipients": len(recipients),
        "candidates": len(candidates),
        "inserted": inserted,
        "reopened": reopened,
        "skipped": skipped,
    }


def notification_out(row: WorkbenchNotification) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "kind": row.kind,
        "title": row.title,
        "body": row.body,
        "href": row.href,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "read_at": row.read_at.isoformat() if row.read_at else None,
        "unread": row.read_at is None,
    }
