from __future__ import annotations

import datetime as dt
from collections import Counter
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Event

RANGE_HOURS = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
    "90d": 24 * 90,
    "6m": 24 * 182,
}


def site_stats(db: Session, range_id: str = "30d") -> dict:
    hours = RANGE_HOURS.get(range_id, RANGE_HOURS["30d"])
    since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=hours)
    rows = list(
        db.execute(select(Event).where(Event.occurred_at >= since).order_by(Event.occurred_at.desc()))
        .scalars()
        .all()
    )
    pageviews = [r for r in rows if r.type == "page_view"]
    sessions = {str(r.session_id) for r in rows if r.session_id}
    pages: Counter[str] = Counter()
    referrers: Counter[str] = Counter()
    for r in pageviews:
        path = "/"
        if r.url:
            try:
                path = urlparse(r.url).path or "/"
            except Exception:
                path = r.url[:80]
        pages[path] += 1
        ref = ""
        if isinstance(r.payload, dict):
            ref = str(r.payload.get("referrer") or "")
        host = ""
        if ref:
            try:
                host = urlparse(ref).netloc or "direct"
            except Exception:
                host = "direct"
        else:
            host = "direct"
        referrers[host] += 1
    return {
        "range": range_id,
        "pageviews": len(pageviews),
        "events": len(rows),
        "unique_sessions": len(sessions),
        "top_pages": [{"path": p, "views": n} for p, n in pages.most_common(12)],
        "sources": [{"source": s, "views": n} for s, n in referrers.most_common(12)],
    }
