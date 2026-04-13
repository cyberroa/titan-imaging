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

