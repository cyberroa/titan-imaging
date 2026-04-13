from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Category
from app.schemas import CategoryOut

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    rows = db.execute(select(Category).order_by(Category.name.asc())).scalars().all()
    return [CategoryOut(id=str(c.id), name=c.name, slug=c.slug) for c in rows]

