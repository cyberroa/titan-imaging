from __future__ import annotations

import datetime as dt

import strawberry
from strawberry.types import Info

from app.ai.snapshots import customer_warmth_history
from app.campaign_sequence import campaign_progress
from app.models import Campaign, Customer
from app.site_stats import site_stats


@strawberry.type
class PathCount:
    path: str
    views: int


@strawberry.type
class SourceCount:
    source: str
    views: int


@strawberry.type
class SiteStats:
    range: str
    pageviews: int
    events: int
    unique_sessions: int
    top_pages: list[PathCount]
    sources: list[SourceCount]


@strawberry.type
class CampaignProgress:
    total: int
    sent: int
    remaining: int
    failed: int
    queued: int
    days: int
    day_index: int
    daily_quota: int | None
    percent: int
    previewed_at: str | None
    sequence_ends_on: str | None
    mail_domain_id: str | None


@strawberry.type(name="Campaign")
class CampaignGql:
    id: str
    name: str
    status: str
    mail_domain_id: str | None
    progress: CampaignProgress


@strawberry.type
class WarmthPoint:
    date: str
    score: float
    rank: int | None


@strawberry.type
class TimelineEntry:
    kind: str
    occurred_at: dt.datetime
    label: str


@strawberry.type
class CustomerAnalytics:
    id: str
    email: str
    name: str | None
    company: str | None
    warmth: list[WarmthPoint]
    timeline: list[TimelineEntry]


@strawberry.type
class LiveVisitorCustomer:
    id: str
    email: str
    name: str | None
    company: str | None


@strawberry.type
class LiveVisitor:
    id: str
    first_seen_at: dt.datetime
    last_seen_at: dt.datetime
    score: float
    current_url: str | None
    latest_search: str | None
    parts_viewed: list[str]
    customer: LiveVisitorCustomer | None


def _db(info: Info):
    return info.context["db"]


@strawberry.type
class Query:
    @strawberry.field
    def site_stats(self, info: Info, range: str = "30d") -> SiteStats:
        raw = site_stats(_db(info), range)
        return SiteStats(
            range=raw["range"],
            pageviews=raw["pageviews"],
            events=raw["events"],
            unique_sessions=raw["unique_sessions"],
            top_pages=[PathCount(path=p["path"], views=p["views"]) for p in raw["top_pages"]],
            sources=[SourceCount(source=s["source"], views=s["views"]) for s in raw["sources"]],
        )

    @strawberry.field
    def campaign(self, info: Info, id: strawberry.ID) -> CampaignGql | None:
        c = _db(info).get(Campaign, str(id))
        if not c:
            return None
        p = campaign_progress(_db(info), c)
        return CampaignGql(
            id=str(c.id),
            name=c.name,
            status=c.status,
            mail_domain_id=str(c.mail_domain_id) if c.mail_domain_id else None,
            progress=CampaignProgress(
                total=p["total"],
                sent=p["sent"],
                remaining=p["remaining"],
                failed=p["failed"],
                queued=p["queued"],
                days=p["days"],
                day_index=p["day_index"],
                daily_quota=p["daily_quota"],
                percent=p["percent"],
                previewed_at=p["previewed_at"],
                sequence_ends_on=p["sequence_ends_on"],
                mail_domain_id=p["mail_domain_id"],
            ),
        )

    @strawberry.field
    def customer_analytics(self, info: Info, id: strawberry.ID) -> CustomerAnalytics | None:
        from app.api.v1.routes.workbench_customers import customer_timeline

        db = _db(info)
        cust = db.get(Customer, str(id))
        if not cust:
            return None
        warmth_raw = customer_warmth_history(db, cust.id)
        try:
            tl = customer_timeline(str(cust.id), db)
            timeline = [
                TimelineEntry(kind=i.kind, occurred_at=i.occurred_at, label=i.label)
                for i in (tl.items or [])[:80]
            ]
        except Exception:
            timeline = []
        return CustomerAnalytics(
            id=str(cust.id),
            email=cust.email,
            name=cust.name,
            company=cust.company,
            warmth=[
                WarmthPoint(date=w["date"], score=float(w["score"]), rank=w.get("rank"))
                for w in warmth_raw
            ],
            timeline=timeline,
        )

    @strawberry.field
    def live_visitors(self, info: Info, minutes: int = 15) -> list[LiveVisitor]:
        from app.api.v1.routes.workbench_sessions import live_visitors as load_live

        rows = load_live(_db(info), minutes)
        out: list[LiveVisitor] = []
        for r in rows:
            cust = None
            if r.customer:
                cust = LiveVisitorCustomer(
                    id=r.customer.id,
                    email=r.customer.email,
                    name=r.customer.name,
                    company=r.customer.company,
                )
            out.append(
                LiveVisitor(
                    id=r.id,
                    first_seen_at=r.first_seen_at,
                    last_seen_at=r.last_seen_at,
                    score=r.score,
                    current_url=r.current_url,
                    latest_search=r.latest_search,
                    parts_viewed=list(r.parts_viewed or []),
                    customer=cust,
                )
            )
        return out


schema = strawberry.Schema(query=Query)
