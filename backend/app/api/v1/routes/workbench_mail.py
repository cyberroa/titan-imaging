from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_workbench_user
from app.db import get_db
from app.models import MailDomain
from app.schemas import MailDomainCreate, MailDomainOut, OkOut

router = APIRouter(prefix="/workbench/mail-domains", dependencies=[Depends(get_current_workbench_user)])


def _out(d: MailDomain) -> MailDomainOut:
    return MailDomainOut(
        id=str(d.id),
        hostname=d.hostname,
        from_email=d.from_email,
        daily_cap=d.daily_cap,
        warmup_stage=d.warmup_stage,
        sent_today=d.sent_today,
        last_sent_date=d.last_sent_date,
        active=d.active,
        resend_domain_id=d.resend_domain_id,
    )


@router.get("", response_model=list[MailDomainOut])
def list_mail_domains(db: Session = Depends(get_db)):
    rows = db.execute(select(MailDomain).order_by(MailDomain.hostname.asc())).scalars().all()
    return [_out(d) for d in rows]


@router.post("", response_model=MailDomainOut)
def create_mail_domain(body: MailDomainCreate, db: Session = Depends(get_db)):
    host = body.hostname.strip().lower()
    d = MailDomain(
        id=uuid.uuid4(),
        hostname=host,
        from_email=str(body.from_email).strip(),
        daily_cap=body.daily_cap,
        resend_domain_id=body.resend_domain_id,
        active=True,
    )
    db.add(d)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Hostname already registered")
    db.refresh(d)
    return _out(d)


@router.delete("/{domain_id}", response_model=OkOut)
def delete_mail_domain(domain_id: str, db: Session = Depends(get_db)):
    d = db.get(MailDomain, domain_id)
    if not d:
        raise HTTPException(status_code=404, detail="Mail domain not found")
    d.active = False
    db.commit()
    return OkOut()
