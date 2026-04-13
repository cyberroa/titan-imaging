from __future__ import annotations

import uuid

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Category, Part


def _slugify(s: str) -> str:
    return s.strip().lower().replace(" ", "-")


def main() -> None:
    db = SessionLocal()
    try:
        existing = {c.slug for c in db.execute(select(Category)).scalars().all()}
        categories = [
            ("CT", "ct"),
            ("PET", "pet"),
            ("General", "general"),
        ]
        by_slug: dict[str, Category] = {}
        for name, slug in categories:
            if slug in existing:
                by_slug[slug] = db.execute(select(Category).where(Category.slug == slug)).scalar_one()
                continue
            c = Category(id=uuid.uuid4(), name=name, slug=slug)
            db.add(c)
            by_slug[slug] = c

        # Minimal seed parts. Keep IDs stable by part_number uniqueness.
        parts = [
            ("CT-1001", "CT X-Ray Tube Assembly", "ct", 3),
            ("CT-1002", "CT Detector Module", "ct", 8),
            ("CT-1003", "CT Gantry Board", "ct", 0),
            ("PET-2001", "PET Detector Crystal", "pet", 5),
            ("PET-2002", "PET PMT Assembly", "pet", 0),
            ("GEN-4001", "Power Supply Unit", "general", 12),
        ]

        existing_parts = {p.part_number for p in db.execute(select(Part)).scalars().all()}
        for part_number, name, cat_slug, stock in parts:
            if part_number in existing_parts:
                continue
            db.add(
                Part(
                    id=uuid.uuid4(),
                    part_number=part_number,
                    name=name,
                    description=None,
                    category=by_slug.get(cat_slug),
                    stock_quantity=stock,
                    status="in_stock" if stock > 0 else "out_of_stock",
                )
            )

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

