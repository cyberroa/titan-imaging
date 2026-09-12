from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import WorkbenchUser, get_current_workbench_user
from app.campaign_sequence import (
    assign_schedule,
    campaign_progress,
    compute_sequence,
    queue_audience,
    send_due_batch,
)
from app.customer_utils import customer_template_variables
from app.db import get_db
from app.email_preview import render_inbox_preview
from app.models import Campaign, CampaignRecipient, Customer, EmailTemplate, MailDomain
from app.schemas import (
    CampaignArmIn,
    CampaignCreate,
    CampaignOut,
    CampaignRecipientOut,
    CampaignSendOut,
    CampaignUpdate,
    OkOut,
    TemplatePreviewIn,
    TemplatePreviewOut,
)

router = APIRouter(prefix="/workbench/campaigns", dependencies=[Depends(get_current_workbench_user)])


def _campaign_to_out(db: Session, c: Campaign) -> CampaignOut:
    return CampaignOut(
        id=str(c.id),
        name=c.name,
        template_id=str(c.template_id),
        segment_id=str(c.segment_id) if c.segment_id else None,
        mail_domain_id=str(c.mail_domain_id) if c.mail_domain_id else None,
        status=c.status,
        scheduled_at=c.scheduled_at,
        sent_at=c.sent_at,
        previewed_at=c.previewed_at,
        sequence_started_at=c.sequence_started_at,
        sequence_ends_on=c.sequence_ends_on,
        daily_quota=c.daily_quota,
        stats_json=dict(c.stats_json or {}),
        progress=campaign_progress(db, c),
        created_by=c.created_by,
        created_at=c.created_at,
    )


def _recipient_to_out(r: CampaignRecipient) -> CampaignRecipientOut:
    return CampaignRecipientOut(
        id=str(r.id),
        email=r.email,
        customer_id=str(r.customer_id) if r.customer_id else None,
        status=r.status,
        resend_message_id=r.resend_message_id,
        error=r.error,
        sent_at=r.sent_at,
        delivered_at=r.delivered_at,
        opened_at=r.opened_at,
        clicked_at=r.clicked_at,
        bounced_at=r.bounced_at,
        complained_at=r.complained_at,
        unsubscribed_at=r.unsubscribed_at,
    )


@router.get("", response_model=list[CampaignOut])
def list_campaigns(db: Session = Depends(get_db)):
    rows = (
        db.execute(select(Campaign).order_by(Campaign.created_at.desc())).scalars().all()
    )
    return [_campaign_to_out(db, c) for c in rows]


@router.post("", response_model=CampaignOut)
def create_campaign(
    body: CampaignCreate,
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    tpl = db.get(EmailTemplate, body.template_id)
    if not tpl:
        raise HTTPException(status_code=400, detail="Template not found")
    if body.segment_id:
        seg = db.get(Segment, body.segment_id)
        if not seg:
            raise HTTPException(status_code=400, detail="Segment not found")
    c = Campaign(
        id=uuid.uuid4(),
        name=body.name.strip(),
        template_id=uuid.UUID(body.template_id),
        segment_id=uuid.UUID(body.segment_id) if body.segment_id else None,
        status="draft",
        scheduled_at=body.scheduled_at,
        stats_json={},
        created_by=admin.email,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _campaign_to_out(db, c)


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _campaign_to_out(db, c)


@router.patch("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: str, body: CampaignUpdate, db: Session = Depends(get_db)
):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status not in ("draft", "scheduled"):
        raise HTTPException(
            status_code=400, detail="Campaign cannot be edited once sending/sent"
        )
    if body.name is not None:
        c.name = body.name.strip()
    if body.template_id is not None:
        tpl = db.get(EmailTemplate, body.template_id)
        if not tpl:
            raise HTTPException(status_code=400, detail="Template not found")
        c.template_id = uuid.UUID(body.template_id)
    if body.segment_id is not None:
        if body.segment_id == "":
            c.segment_id = None
        else:
            seg = db.get(Segment, body.segment_id)
            if not seg:
                raise HTTPException(status_code=400, detail="Segment not found")
            c.segment_id = uuid.UUID(body.segment_id)
    if body.scheduled_at is not None:
        c.scheduled_at = body.scheduled_at
    if body.status is not None and body.status in ("draft", "scheduled"):
        c.status = body.status
    db.commit()
    db.refresh(c)
    return _campaign_to_out(db, c)


@router.delete("/{campaign_id}", response_model=OkOut)
def delete_campaign(campaign_id: str, db: Session = Depends(get_db)):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status in ("sending",):
        raise HTTPException(status_code=400, detail="Campaign is currently sending")
    db.delete(c)
    db.commit()
    return OkOut()


@router.post("/{campaign_id}/preview", response_model=TemplatePreviewOut)
def preview_campaign(
    campaign_id: str,
    body: TemplatePreviewIn,
    db: Session = Depends(get_db),
):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    tpl = db.get(EmailTemplate, c.template_id)
    if not tpl:
        raise HTTPException(status_code=400, detail="Template missing")
    sample = dict(body.sample or {})
    if body.customer_id:
        cust = db.get(Customer, body.customer_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
        sample = {**customer_template_variables(cust), **sample}
    if not sample:
        sample = {
            "name": "Jane Doe",
            "company": "St. Mary's Radiology",
            "email": "jane@example.com",
        }
    subject, html_out, text_out = render_inbox_preview(
        tpl.subject, tpl.body_md, tpl.body_html, sample, campaign_id=str(c.id)
    )
    c.previewed_at = dt.datetime.now(dt.timezone.utc)
    db.commit()
    return TemplatePreviewOut(subject=subject, html=html_out, text=text_out)


@router.post("/{campaign_id}/arm", response_model=CampaignOut)
def arm_campaign(campaign_id: str, body: CampaignArmIn, db: Session = Depends(get_db)):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status not in ("draft", "scheduled", "paused"):
        raise HTTPException(status_code=400, detail=f"Campaign is already {c.status}")
    if not c.previewed_at:
        raise HTTPException(status_code=400, detail="Preview the HTML email before arming")
    domain = db.get(MailDomain, body.mail_domain_id)
    if not domain or not domain.active:
        raise HTTPException(status_code=400, detail="Active mail domain required")
    queued, skipped_suppressed, skipped_consent = queue_audience(db, c)
    db.refresh(c)
    if queued == 0:
        raise HTTPException(
            status_code=400,
            detail="No consented recipients to queue (check consent and suppression)",
        )
    days, quota = compute_sequence(queued, min(body.max_per_day, domain.daily_cap), body.max_days)
    c.mail_domain_id = domain.id
    c.daily_quota = quota
    c.status = "armed"
    assign_schedule(db, c, days)
    stats = dict(c.stats_json or {})
    stats.update(
        {
            "queued": queued,
            "skipped_suppressed": skipped_suppressed,
            "skipped_consent": skipped_consent,
            "max_per_day": body.max_per_day,
            "max_days": body.max_days,
            "sequence_days": days,
        }
    )
    c.stats_json = stats
    db.commit()
    db.refresh(c)
    return _campaign_to_out(db, c)


@router.post("/{campaign_id}/pause", response_model=CampaignOut)
def pause_campaign(campaign_id: str, db: Session = Depends(get_db)):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status not in ("armed", "running", "sending"):
        raise HTTPException(status_code=400, detail="Campaign is not running")
    c.status = "paused"
    db.commit()
    db.refresh(c)
    return _campaign_to_out(db, c)


@router.get("/{campaign_id}/recipients", response_model=list[CampaignRecipientOut])
def list_campaign_recipients(
    campaign_id: str,
    db: Session = Depends(get_db),
):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    rows = (
        db.execute(
            select(CampaignRecipient)
            .where(CampaignRecipient.campaign_id == c.id)
            .order_by(CampaignRecipient.created_at.asc())
            .limit(1000)
        )
        .scalars()
        .all()
    )
    return [_recipient_to_out(r) for r in rows]


@router.post("/{campaign_id}/send", response_model=CampaignSendOut)
async def send_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
):
    c = db.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status not in ("draft", "scheduled"):
        raise HTTPException(status_code=400, detail=f"Campaign is already {c.status}")
    if not c.previewed_at:
        raise HTTPException(status_code=400, detail="Preview the HTML email before sending")
    queued, skipped_suppressed, skipped_consent = queue_audience(db, c)
    db.refresh(c)
    if queued == 0:
        raise HTTPException(
            status_code=400,
            detail="No consented recipients to queue (check consent and suppression)",
        )
    assign_schedule(db, c, 1)
    c.status = "sending"
    db.commit()
    result = await send_due_batch(db, c, max(queued, 1) + 50)
    return CampaignSendOut(
        campaign_id=str(c.id),
        queued=queued,
        skipped_suppressed=skipped_suppressed + skipped_consent,
        errors=[],
    )

