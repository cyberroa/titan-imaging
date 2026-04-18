from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str


class PartOut(BaseModel):
    id: str
    part_number: str
    name: str
    description: str | None = None
    category: str | None = None
    stock_quantity: int
    status: str
    price: float | None = None


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=5, max_length=10_000)


class SellIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    company: str | None = Field(default=None, max_length=200)
    part_details: str = Field(min_length=5, max_length=10_000)
    message: str | None = Field(default=None, max_length=10_000)


class OkOut(BaseModel):
    ok: bool = True


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str | None = Field(default=None, max_length=120)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    slug: str | None = Field(default=None, min_length=1, max_length=120)


class PartCreate(BaseModel):
    part_number: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=20_000)
    category_slug: str | None = Field(default=None, max_length=120)
    stock_quantity: int = Field(ge=0, default=0)
    price: float | None = Field(default=None, ge=0)
    status: str = Field(default="in_stock", max_length=24)


class PartUpdate(BaseModel):
    part_number: str | None = Field(default=None, min_length=1, max_length=80)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=20_000)
    category_slug: str | None = Field(default=None, max_length=120)
    stock_quantity: int | None = Field(default=None, ge=0)
    price: float | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=24)


class ImportRowError(BaseModel):
    row: int
    message: str


class ImportResult(BaseModel):
    created: int = 0
    updated: int = 0
    errors: list[ImportRowError] = []


class InventoryAlertSubscribeIn(BaseModel):
    email: EmailStr
    part_number: str = Field(min_length=1, max_length=80)
    query_text: str | None = Field(default=None, max_length=2000)


class OutreachSendIn(BaseModel):
    recipients: list[EmailStr] = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=20_000)


class OutreachSendOut(BaseModel):
    sent: int


# --------------------------------------------------------------------------
# Phase 4A — Customers
# --------------------------------------------------------------------------


class CustomerBase(BaseModel):
    email: EmailStr
    name: str | None = Field(default=None, max_length=200)
    company: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    role: str | None = Field(default=None, max_length=120)
    tags: list[str] = Field(default_factory=list)
    source: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=20_000)
    consent_marketing: bool = False
    consent_source: str | None = Field(default=None, max_length=120)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = Field(default=None, max_length=200)
    company: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    role: str | None = Field(default=None, max_length=120)
    tags: list[str] | None = None
    source: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=20_000)
    consent_marketing: bool | None = None
    consent_source: str | None = Field(default=None, max_length=120)


class CustomerOut(BaseModel):
    id: str
    email: str
    name: str | None = None
    company: str | None = None
    phone: str | None = None
    role: str | None = None
    tags: list[str] = Field(default_factory=list)
    source: str | None = None
    notes: str | None = None
    consent_marketing: bool = False
    consent_source: str | None = None
    consent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CustomerImportResult(BaseModel):
    created: int = 0
    updated: int = 0
    errors: list[ImportRowError] = []


# --------------------------------------------------------------------------
# Phase 4A — Segments
# --------------------------------------------------------------------------


class SegmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=20_000)
    filter_json: dict[str, Any] = Field(default_factory=dict)


class SegmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=20_000)
    filter_json: dict[str, Any] | None = None


class SegmentOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    filter_json: dict[str, Any] = Field(default_factory=dict)


class SegmentPreviewOut(BaseModel):
    count: int
    sample: list[CustomerOut] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Phase 4A — Templates
# --------------------------------------------------------------------------


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=200)
    subject: str = Field(min_length=1, max_length=255)
    preheader: str | None = Field(default=None, max_length=255)
    body_md: str = Field(default="")
    body_html: str | None = None
    from_name: str | None = Field(default=None, max_length=120)
    reply_to: EmailStr | None = None
    tags: list[str] = Field(default_factory=list)


class TemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    subject: str | None = Field(default=None, min_length=1, max_length=255)
    preheader: str | None = Field(default=None, max_length=255)
    body_md: str | None = None
    body_html: str | None = None
    from_name: str | None = Field(default=None, max_length=120)
    reply_to: EmailStr | None = None
    tags: list[str] | None = None


class TemplateOut(BaseModel):
    id: str
    name: str
    slug: str
    subject: str
    preheader: str | None = None
    body_md: str
    body_html: str | None = None
    from_name: str | None = None
    reply_to: str | None = None
    tags: list[str] = Field(default_factory=list)


class TemplatePreviewIn(BaseModel):
    sample: dict[str, Any] = Field(default_factory=dict)


class TemplatePreviewOut(BaseModel):
    subject: str
    html: str
    text: str


# --------------------------------------------------------------------------
# Phase 4A — Campaigns
# --------------------------------------------------------------------------


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    template_id: str
    segment_id: str | None = None
    scheduled_at: datetime | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    template_id: str | None = None
    segment_id: str | None = None
    scheduled_at: datetime | None = None
    status: str | None = Field(default=None, max_length=24)


class CampaignOut(BaseModel):
    id: str
    name: str
    template_id: str
    segment_id: str | None = None
    status: str
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    stats_json: dict[str, Any] = Field(default_factory=dict)
    created_by: str | None = None
    created_at: datetime


class CampaignRecipientOut(BaseModel):
    id: str
    email: str
    customer_id: str | None = None
    status: str
    resend_message_id: str | None = None
    error: str | None = None
    sent_at: datetime | None = None
    delivered_at: datetime | None = None
    opened_at: datetime | None = None
    clicked_at: datetime | None = None
    bounced_at: datetime | None = None
    complained_at: datetime | None = None
    unsubscribed_at: datetime | None = None


class CampaignSendOut(BaseModel):
    campaign_id: str
    queued: int
    skipped_suppressed: int
    errors: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Phase 4A — Events, social
# --------------------------------------------------------------------------


class EventIn(BaseModel):
    type: str = Field(min_length=1, max_length=80)
    url: str | None = Field(default=None, max_length=2000)
    cookie_id: str | None = Field(default=None, max_length=64)
    email: EmailStr | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class EventOut(BaseModel):
    id: str
    type: str
    url: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime


class SocialPostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=6000)
    link_url: str | None = Field(default=None, max_length=2000)
    first_comment: str | None = Field(default=None, max_length=6000)
    image_url: str | None = Field(default=None, max_length=2000)
    scheduled_at: datetime | None = None


class SocialPostOut(BaseModel):
    id: str
    channel: str
    body: str
    link_url: str | None = None
    first_comment: str | None = None
    image_url: str | None = None
    status: str
    external_id: str | None = None
    error: str | None = None
    scheduled_at: datetime | None = None
    posted_at: datetime | None = None
    created_at: datetime


class TimelineItem(BaseModel):
    kind: str
    occurred_at: datetime
    label: str
    data: dict[str, Any] = Field(default_factory=dict)


class CustomerTimelineOut(BaseModel):
    customer: CustomerOut
    items: list[TimelineItem] = Field(default_factory=list)

