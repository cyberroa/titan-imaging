from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.db import get_db
from app.models import EmailTemplate, Segment
from app.schemas import (
    OkOut,
    SegmentCreate,
    SegmentOut,
    SegmentPreviewOut,
    SegmentUpdate,
    TemplateCreate,
    TemplateOut,
    TemplatePreviewIn,
    TemplatePreviewOut,
    TemplateUpdate,
)
from app.segments import segment_count, segment_customers
from app.templating import template_to_text_html

router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_admin)])


def _slugify(s: str) -> str:
    return "-".join(s.strip().lower().replace("_", "-").split())


# --------------------------------------------------------------------------
# Templates
# --------------------------------------------------------------------------


def _template_to_out(t: EmailTemplate) -> TemplateOut:
    return TemplateOut(
        id=str(t.id),
        name=t.name,
        slug=t.slug,
        subject=t.subject,
        preheader=t.preheader,
        body_md=t.body_md,
        body_html=t.body_html,
        from_name=t.from_name,
        reply_to=t.reply_to,
        tags=list(t.tags or []),
    )


@router.get("/templates", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    rows = db.execute(select(EmailTemplate).order_by(EmailTemplate.name.asc())).scalars().all()
    return [_template_to_out(t) for t in rows]


@router.post("/templates", response_model=TemplateOut)
def create_template(body: TemplateCreate, db: Session = Depends(get_db)):
    slug = (body.slug or _slugify(body.name)).strip()
    if db.scalar(select(EmailTemplate).where(EmailTemplate.slug == slug)) is not None:
        raise HTTPException(status_code=400, detail="Template slug already exists")
    t = EmailTemplate(
        id=uuid.uuid4(),
        name=body.name.strip(),
        slug=slug,
        subject=body.subject,
        preheader=body.preheader,
        body_md=body.body_md or "",
        body_html=body.body_html,
        from_name=body.from_name,
        reply_to=str(body.reply_to) if body.reply_to else None,
        tags=body.tags or [],
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _template_to_out(t)


@router.get("/templates/{template_id}", response_model=TemplateOut)
def get_template(template_id: str, db: Session = Depends(get_db)):
    t = db.get(EmailTemplate, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return _template_to_out(t)


@router.patch("/templates/{template_id}", response_model=TemplateOut)
def update_template(template_id: str, body: TemplateUpdate, db: Session = Depends(get_db)):
    t = db.get(EmailTemplate, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if body.slug is not None:
        new_slug = body.slug.strip()
        other = db.scalar(
            select(EmailTemplate).where(
                EmailTemplate.slug == new_slug, EmailTemplate.id != t.id
            )
        )
        if other is not None:
            raise HTTPException(status_code=400, detail="Slug already in use")
        t.slug = new_slug
    for field in ("name", "subject", "preheader", "body_md", "body_html", "from_name"):
        v = getattr(body, field)
        if v is not None:
            setattr(t, field, v)
    if body.reply_to is not None:
        t.reply_to = str(body.reply_to) or None
    if body.tags is not None:
        t.tags = body.tags
    db.commit()
    db.refresh(t)
    return _template_to_out(t)


@router.delete("/templates/{template_id}", response_model=OkOut)
def delete_template(template_id: str, db: Session = Depends(get_db)):
    t = db.get(EmailTemplate, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(t)
    db.commit()
    return OkOut()


@router.post("/templates/{template_id}/preview", response_model=TemplatePreviewOut)
def preview_template(
    template_id: str,
    body: TemplatePreviewIn,
    db: Session = Depends(get_db),
):
    t = db.get(EmailTemplate, template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    sample = body.sample or {
        "name": "Jane Doe",
        "company": "St. Mary's Radiology",
        "email": "jane@example.com",
    }
    subject, html_out, text_out = template_to_text_html(
        t.subject, t.body_md, t.body_html, sample
    )
    return TemplatePreviewOut(subject=subject, html=html_out, text=text_out)


# --------------------------------------------------------------------------
# Segments
# --------------------------------------------------------------------------


def _segment_to_out(s: Segment) -> SegmentOut:
    return SegmentOut(
        id=str(s.id),
        name=s.name,
        slug=s.slug,
        description=s.description,
        filter_json=dict(s.filter_json or {}),
    )


@router.get("/segments", response_model=list[SegmentOut])
def list_segments(db: Session = Depends(get_db)):
    rows = db.execute(select(Segment).order_by(Segment.name.asc())).scalars().all()
    return [_segment_to_out(s) for s in rows]


@router.post("/segments", response_model=SegmentOut)
def create_segment(body: SegmentCreate, db: Session = Depends(get_db)):
    slug = (body.slug or _slugify(body.name)).strip()
    if db.scalar(select(Segment).where(Segment.slug == slug)) is not None:
        raise HTTPException(status_code=400, detail="Segment slug already exists")
    s = Segment(
        id=uuid.uuid4(),
        name=body.name.strip(),
        slug=slug,
        description=body.description,
        filter_json=body.filter_json or {},
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _segment_to_out(s)


@router.get("/segments/{segment_id}", response_model=SegmentOut)
def get_segment(segment_id: str, db: Session = Depends(get_db)):
    s = db.get(Segment, segment_id)
    if not s:
        raise HTTPException(status_code=404, detail="Segment not found")
    return _segment_to_out(s)


@router.patch("/segments/{segment_id}", response_model=SegmentOut)
def update_segment(segment_id: str, body: SegmentUpdate, db: Session = Depends(get_db)):
    s = db.get(Segment, segment_id)
    if not s:
        raise HTTPException(status_code=404, detail="Segment not found")
    if body.slug is not None:
        new_slug = body.slug.strip()
        other = db.scalar(
            select(Segment).where(Segment.slug == new_slug, Segment.id != s.id)
        )
        if other is not None:
            raise HTTPException(status_code=400, detail="Slug already in use")
        s.slug = new_slug
    for field in ("name", "description"):
        v = getattr(body, field)
        if v is not None:
            setattr(s, field, v)
    if body.filter_json is not None:
        s.filter_json = body.filter_json
    db.commit()
    db.refresh(s)
    return _segment_to_out(s)


@router.delete("/segments/{segment_id}", response_model=OkOut)
def delete_segment(segment_id: str, db: Session = Depends(get_db)):
    s = db.get(Segment, segment_id)
    if not s:
        raise HTTPException(status_code=404, detail="Segment not found")
    db.delete(s)
    db.commit()
    return OkOut()


@router.post("/segments/{segment_id}/preview", response_model=SegmentPreviewOut)
def preview_segment(segment_id: str, db: Session = Depends(get_db)):
    from app.api.v1.routes.admin_customers import _customer_to_out

    s = db.get(Segment, segment_id)
    if not s:
        raise HTTPException(status_code=404, detail="Segment not found")
    total = segment_count(db, s.filter_json)
    sample_rows = segment_customers(db, s.filter_json, limit=25)
    return SegmentPreviewOut(
        count=total, sample=[_customer_to_out(c) for c in sample_rows]
    )
