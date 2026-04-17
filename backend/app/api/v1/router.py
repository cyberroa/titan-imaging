from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.routes import admin, categories, contact, inventory_alerts_public, parts, sell

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(parts.router, tags=["parts"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(contact.router, tags=["contact"])
api_router.include_router(sell.router, tags=["sell"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(inventory_alerts_public.router, tags=["inventory-alerts"])

