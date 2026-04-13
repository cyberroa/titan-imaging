from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.email import maybe_send_admin_email
from app.models import ContactSubmission
from app.schemas import ContactIn, OkOut

router = APIRouter()


@router.post("/contact", response_model=OkOut)
async def submit_contact(payload: ContactIn, db: Session = Depends(get_db)):
    row = ContactSubmission(
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )
    db.add(row)
    db.commit()

    await maybe_send_admin_email(
        subject=f"New contact: {row.subject}",
        text="New contact submission received.",
        payload={"name": row.name, "email": row.email, "subject": row.subject, "message": row.message},
    )

    return OkOut(ok=True)

