from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Category, Part
from app.schemas import PartOut

router = APIRouter()


@router.get("/parts", response_model=list[PartOut])
def list_parts(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None, description="Category slug"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = select(Part, Category).select_from(Part).join(Category, isouter=True)

    filters = []
    if category:
        filters.append(Category.slug == category)
    if search:
        s = search.strip()
        if s:
            like = f"%{s}%"
            filters.append(or_(Part.part_number.ilike(like), Part.name.ilike(like)))

    if filters:
        q = q.where(and_(*filters))

    q = q.order_by(Part.part_number.asc()).limit(limit)
    rows = db.execute(q).all()

    out: list[PartOut] = []
    for part, cat in rows:
        out.append(
            PartOut(
                id=str(part.id),
                part_number=part.part_number,
                name=part.name,
                description=part.description,
                category=cat.slug if cat else None,
                stock_quantity=part.stock_quantity,
                status=part.status,
                price=float(part.price) if part.price is not None else None,
            )
        )
    return out


@router.get("/parts/{part_id}", response_model=PartOut)
def get_part(part_id: str, db: Session = Depends(get_db)):
    q = (
        select(Part, Category)
        .select_from(Part)
        .join(Category, isouter=True)
        .where(Part.id == part_id)
    )
    row = db.execute(q).first()
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Part not found")
    part, cat = row
    return PartOut(
        id=str(part.id),
        part_number=part.part_number,
        name=part.name,
        description=part.description,
        category=cat.slug if cat else None,
        stock_quantity=part.stock_quantity,
        status=part.status,
        price=float(part.price) if part.price is not None else None,
    )

