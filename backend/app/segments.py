from __future__ import annotations

from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Customer, Unsubscribe


def build_segment_query(filter_json: dict[str, Any] | None) -> Select:
    """
    Build a SELECT Customer query from a segment's `filter_json`.

    Supported keys (all optional, AND-combined):
      - consent_marketing: bool
      - source: str (exact match)
      - tags_any: list[str] (customer.tags && filter)
      - tags_all: list[str] (customer.tags @> filter)
      - email_contains: str (ILIKE)
      - company_contains: str (ILIKE)
      - exclude_unsubscribed: bool (default true)
    """
    f = filter_json or {}
    q: Select = select(Customer)

    if f.get("consent_marketing") is True:
        q = q.where(Customer.consent_marketing.is_(True))
    elif f.get("consent_marketing") is False:
        q = q.where(Customer.consent_marketing.is_(False))

    source = f.get("source")
    if isinstance(source, str) and source.strip():
        q = q.where(Customer.source == source.strip())

    tags_any = f.get("tags_any") or []
    if isinstance(tags_any, list) and tags_any:
        q = q.where(Customer.tags.op("&&")(list(tags_any)))

    tags_all = f.get("tags_all") or []
    if isinstance(tags_all, list) and tags_all:
        q = q.where(Customer.tags.op("@>")(list(tags_all)))

    ec = f.get("email_contains")
    if isinstance(ec, str) and ec.strip():
        q = q.where(Customer.email.ilike(f"%{ec.strip()}%"))

    cc = f.get("company_contains")
    if isinstance(cc, str) and cc.strip():
        q = q.where(Customer.company.ilike(f"%{cc.strip()}%"))

    if f.get("exclude_unsubscribed", True):
        sub_q = select(Unsubscribe.email)
        q = q.where(Customer.email.notin_(sub_q))

    return q.order_by(Customer.created_at.desc())


def segment_count(db: Session, filter_json: dict[str, Any] | None) -> int:
    q = (
        build_segment_query(filter_json)
        .with_only_columns(func.count(Customer.id))
        .order_by(None)
    )
    return int(db.scalar(q) or 0)


def segment_customers(
    db: Session, filter_json: dict[str, Any] | None, limit: int | None = None
) -> list[Customer]:
    q = build_segment_query(filter_json)
    if limit:
        q = q.limit(limit)
    return list(db.execute(q).scalars().all())
