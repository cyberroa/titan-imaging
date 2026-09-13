"""Staff notification inbox."""

from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.notifications import notification_out
from app.auth import WorkbenchUser, get_current_workbench_user
from app.db import get_db
from app.models import WorkbenchNotification, WorkbenchStaff
from app.settings import get_settings
from app.staff_permissions import CAPABILITIES, is_owner_tier, sync_legacy_role

router = APIRouter(prefix="/workbench", dependencies=[Depends(get_current_workbench_user)])


def _ensure_staff(db: Session, admin: WorkbenchUser) -> WorkbenchStaff:
    row = db.scalar(select(WorkbenchStaff).where(WorkbenchStaff.email == admin.email))
    if row:
        settings = get_settings()
        if admin.email in settings.owner_emails_set and not is_owner_tier(row):
            row.staff_tier = "owner"
            row.capabilities = sorted(CAPABILITIES)
            sync_legacy_role(row)
            db.commit()
            db.refresh(row)
        return row
    settings = get_settings()
    is_owner = admin.email in settings.owner_emails_set
    row = WorkbenchStaff(
        id=uuid.uuid4(),
        email=admin.email,
        display_name=admin.email.split("@")[0],
        role="owner" if is_owner else "admin",
        staff_tier="owner" if is_owner else "admin",
        capabilities=sorted(CAPABILITIES) if is_owner else [],
    )
    sync_legacy_role(row)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
    limit: int = Query(default=30, ge=1, le=100),
):
    me = _ensure_staff(db, admin)
    unread = int(
        db.scalar(
            select(func.count())
            .select_from(WorkbenchNotification)
            .where(
                WorkbenchNotification.staff_id == me.id,
                WorkbenchNotification.read_at.is_(None),
            )
        )
        or 0
    )
    rows = (
        db.execute(
            select(WorkbenchNotification)
            .where(WorkbenchNotification.staff_id == me.id)
            .order_by(
                WorkbenchNotification.read_at.isnot(None),
                WorkbenchNotification.created_at.desc(),
            )
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return {"unread_count": unread, "items": [notification_out(r) for r in rows]}


@router.post("/notifications/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    me = _ensure_staff(db, admin)
    try:
        nid = uuid.UUID(notification_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Notification not found") from exc
    row = db.get(WorkbenchNotification, nid)
    if not row or row.staff_id != me.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    if row.read_at is None:
        row.read_at = dt.datetime.now(dt.timezone.utc)
        db.commit()
        db.refresh(row)
    return notification_out(row)


@router.post("/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    me = _ensure_staff(db, admin)
    now = dt.datetime.now(dt.timezone.utc)
    rows = list(
        db.execute(
            select(WorkbenchNotification).where(
                WorkbenchNotification.staff_id == me.id,
                WorkbenchNotification.read_at.is_(None),
            )
        )
        .scalars()
        .all()
    )
    for row in rows:
        row.read_at = now
    db.commit()
    return {"marked": len(rows)}
