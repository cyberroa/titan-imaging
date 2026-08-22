from __future__ import annotations

import datetime as dt

from app.models import Event

EVENT_WEIGHTS: dict[str, float] = {
    "page_view": 1.0,
    "identify": 5.0,
    "inventory_search": 8.0,
    "part_view": 10.0,
    "part_click": 12.0,
    "part_alert_subscribe": 25.0,
    "contact_submit": 40.0,
    "sell_submit": 35.0,
    "email.sent": 2.0,
    "email.delivered": 2.0,
    "email.opened": 5.0,
    "email.clicked": 15.0,
}

DEFAULT_WEIGHT = 1.0
HALF_LIFE_HOURS = 24.0
HOT_LEAD_THRESHOLD = 30.0


def _as_utc(value: dt.datetime) -> dt.datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=dt.timezone.utc)
    return value


def decay_factor(occurred_at: dt.datetime, now: dt.datetime) -> float:
    age_hours = max(0.0, (now - _as_utc(occurred_at)).total_seconds() / 3600.0)
    return 0.5 ** (age_hours / HALF_LIFE_HOURS)


def compute_score(events: list[Event], now: dt.datetime | None = None) -> float:
    now = now or dt.datetime.now(dt.timezone.utc)
    total = 0.0
    for ev in events:
        weight = EVENT_WEIGHTS.get(ev.type, DEFAULT_WEIGHT)
        total += weight * decay_factor(ev.occurred_at, now)
    return round(total, 1)


def summarize_session_activity(events: list[Event]) -> dict[str, object]:
    sorted_events = sorted(events, key=lambda e: e.occurred_at, reverse=True)
    current_url: str | None = None
    latest_search: str | None = None
    parts_viewed: list[str] = []

    for ev in sorted_events:
        payload = ev.payload or {}
        if ev.type == "page_view" and current_url is None:
            current_url = ev.url
        if ev.type == "inventory_search" and latest_search is None:
            query = payload.get("query") or payload.get("q")
            if query:
                latest_search = str(query)
        if ev.type == "part_view":
            label = payload.get("part_number") or payload.get("partNumber") or payload.get("name")
            if label:
                text = str(label)
                if text not in parts_viewed:
                    parts_viewed.append(text)

    return {
        "current_url": current_url,
        "latest_search": latest_search,
        "parts_viewed": parts_viewed[:5],
    }
