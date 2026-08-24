from __future__ import annotations

from typing import Any

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session

from app.models import Customer, Segment
from app.segments import build_segment_query


def _token_clauses(q: str) -> list[Any]:
    tokens = [t for t in q.lower().split() if t]
    if not tokens:
        return []
    clauses = []
    for token in tokens:
        like = f"%{token}%"
        clauses.append(
            or_(
                func.coalesce(Customer.search_document, "").ilike(like),
                Customer.email.ilike(like),
                func.coalesce(Customer.website, "").ilike(like),
            )
        )
    return clauses


def _apply_customer_search(base: Select, q: str | None) -> Select:
    doc = func.coalesce(Customer.search_document, "")
    if not q or not q.strip():
        return base.order_by(Customer.created_at.desc())

    term = q.strip()
    like_full = f"%{term.lower()}%"

    # ILIKE-only conditions (works before pg_trgm migration; similarity added when available)
    conditions: list[Any] = [
        doc.ilike(like_full),
        Customer.email.ilike(like_full),
        func.coalesce(Customer.name, "").ilike(like_full),
        func.coalesce(Customer.company, "").ilike(like_full),
        func.coalesce(Customer.website, "").ilike(like_full),
        func.coalesce(Customer.phone, "").ilike(like_full),
        func.coalesce(Customer.role, "").ilike(like_full),
        func.coalesce(Customer.source, "").ilike(like_full),
        func.coalesce(Customer.notes, "").ilike(like_full),
    ]

    token_clauses = _token_clauses(term)
    if token_clauses:
        conditions.append(and_(*token_clauses) if len(token_clauses) > 1 else token_clauses[0])

    return base.where(or_(*conditions)).order_by(Customer.created_at.desc())


def search_customers(
    db: Session,
    q: str | None,
    *,
    segment_filter_json: dict[str, Any] | None = None,
    tag: str | None = None,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[Customer], int]:
    if segment_filter_json is not None:
        base = build_segment_query(segment_filter_json)
    else:
        base = select(Customer)

    if tag:
        base = base.where(Customer.tags.any(tag))

    filtered = _apply_customer_search(base, q)

    count_q = filtered.with_only_columns(func.count(Customer.id)).order_by(None)
    total = int(db.scalar(count_q) or 0)

    rows = db.execute(filtered.offset(offset).limit(limit)).scalars().all()
    return list(rows), total


def search_segments(
    db: Session,
    q: str | None,
    *,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[Segment], int]:
    base = select(Segment)
    if q and q.strip():
        term = q.strip()
        like = f"%{term.lower()}%"
        base = base.where(
            or_(
                Segment.name.ilike(like),
                Segment.slug.ilike(like),
                func.coalesce(Segment.description, "").ilike(like),
            )
        ).order_by(Segment.name.asc())
    else:
        base = base.order_by(Segment.name.asc())

    count_q = base.with_only_columns(func.count(Segment.id)).order_by(None)
    total = int(db.scalar(count_q) or 0)
    rows = db.execute(base.offset(offset).limit(limit)).scalars().all()
    return list(rows), total
