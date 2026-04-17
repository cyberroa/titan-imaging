from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Part


def is_part_available(part: Part) -> bool:
    if part.stock_quantity <= 0:
        return False
    s = (part.status or "").lower()
    return s not in ("out_of_stock", "discontinued")


def refresh_part_search_vector(db: Session, part: Part) -> None:
    desc = part.description or ""
    db.execute(
        text(
            """
            UPDATE parts
            SET search_vector = to_tsvector(
                'english',
                coalesce(:pn, '') || ' ' || coalesce(:nm, '') || ' ' || coalesce(:desc, '')
            )
            WHERE id = :id
            """
        ),
        {"pn": part.part_number, "nm": part.name, "desc": desc, "id": part.id},
    )
