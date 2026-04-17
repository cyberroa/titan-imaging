from __future__ import annotations

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

