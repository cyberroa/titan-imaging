from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routes import (
    admin,
    admin_campaigns,
    admin_customers,
    admin_social,
    admin_templates,
    categories,
    contact,
    events_public,
    inventory_alerts_public,
    parts,
    sell,
    unsubscribe_public,
    webhooks,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(parts.router, tags=["parts"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(contact.router, tags=["contact"])
api_router.include_router(sell.router, tags=["sell"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(admin_customers.router, tags=["admin-customers"])
api_router.include_router(admin_templates.router, tags=["admin-templates"])
api_router.include_router(admin_campaigns.router, tags=["admin-campaigns"])
api_router.include_router(admin_social.router, tags=["admin-social"])
api_router.include_router(inventory_alerts_public.router, tags=["inventory-alerts"])
api_router.include_router(events_public.router, tags=["events"])
api_router.include_router(unsubscribe_public.router, tags=["unsubscribe"])
api_router.include_router(webhooks.router, tags=["webhooks"])

