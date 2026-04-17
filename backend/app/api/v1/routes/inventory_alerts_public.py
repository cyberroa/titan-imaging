from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.inventory_alerts import subscribe_email
from app.models import Part
from app.schemas import InventoryAlertSubscribeIn, OkOut
from app.settings import get_settings

router = APIRouter()


@router.post("/inventory-alerts/subscribe", response_model=OkOut)
def post_inventory_alert_subscribe(body: InventoryAlertSubscribeIn, db: Session = Depends(get_db)):
    pn = body.part_number.strip()
    part = db.scalar(select(Part).where(Part.part_number == pn))
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    subscribe_email(db, str(body.email), part.id, query_text=body.query_text)
    db.commit()
    return OkOut()


@router.get("/inventory-alerts/unsubscribe")
def get_inventory_alert_unsubscribe(
    token: str = Query(..., min_length=10),
    db: Session = Depends(get_db),
):
    from app.models import InventoryAlertSubscription

    sub = db.scalar(
        select(InventoryAlertSubscription).where(InventoryAlertSubscription.unsubscribe_token == token)
    )
    if sub:
        sub.active = False
        db.commit()
    settings = get_settings()
    base = (settings.public_site_url or "http://localhost:3000").rstrip("/")
    return RedirectResponse(url=f"{base}/inventory?unsubscribed=1", status_code=302)
