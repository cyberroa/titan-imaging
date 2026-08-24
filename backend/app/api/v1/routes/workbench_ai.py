from __future__ import annotations

import logging
import uuid
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.campaign_copy import generate_email_draft, generate_social_draft
from app.ai.client import AiDisabledError, AiError, ai_is_ready, resolve_model
from app.ai.daily_report import deliver_daily_briefing, generate_daily_briefing
from app.ai.goals import refresh_all_auto_goals
from app.ai.opportunities import run_opportunity_detection
from app.ai.segments_ai import approve_ai_segment, propose_segment, reject_ai_segment
from app.ai.snapshots import customer_warmth_history, run_engagement_snapshots
from app.ai.studio import (
    promote_studio_output,
    seed_default_presets,
    studio_complete,
    studio_image,
)
from app.auth import WorkbenchUser, get_current_workbench_user
from app.competitors.scrape import scrape_all_active_sources
from app.db import get_db
from app.graph_crm import build_market_graph
from app.models import AiPromptPreset, AiStudioRun, DailyBriefing
from app.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workbench/ai", dependencies=[Depends(get_current_workbench_user)])


def _verify_cron(x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")) -> None:
    secret = (get_settings().cron_secret or "").strip()
    if not secret or not x_cron_secret or x_cron_secret.strip() != secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")


@router.get("/status")
def ai_extended_status():
    s = get_settings()
    return {
        "enabled": bool(s.ai_enabled),
        "configured": ai_is_ready(s),
        "models": {
            "default": s.ai_model_default,
            "briefing": resolve_model("briefing", s),
            "sentiment": resolve_model("sentiment", s),
            "segment": resolve_model("segment", s),
            "campaign": resolve_model("campaign", s),
            "daily_report": resolve_model("daily_report", s),
            "studio": resolve_model("studio", s),
        },
        "gemini_configured": bool((s.google_ai_api_key or "").strip()),
        "allowed_models": s.ai_allowed_models_list,
    }


@router.get("/models")
def list_models():
    s = get_settings()
    return {"models": s.ai_allowed_models_list, "default": s.ai_model_default}


# --- Prompt presets ---


@router.get("/prompts")
def list_prompts(db: Session = Depends(get_db)):
    rows = db.execute(select(AiPromptPreset).order_by(AiPromptPreset.name.asc())).scalars().all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "slug": r.slug,
            "category": r.category,
            "system_prompt": r.system_prompt,
            "user_prompt_template": r.user_prompt_template,
        }
        for r in rows
    ]


@router.post("/prompts/seed")
def seed_prompts(db: Session = Depends(get_db)):
    return {"added": seed_default_presets(db)}


@router.post("/prompts")
def create_prompt(
    body: dict[str, Any],
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    import re

    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name required")
    slug = (body.get("slug") or name).strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")[:200]
    base_slug = slug
    n = 2
    while db.scalar(select(AiPromptPreset).where(AiPromptPreset.slug == slug)) is not None:
        slug = f"{base_slug[:190]}-{n}"
        n += 1
    row = AiPromptPreset(
        id=uuid.uuid4(),
        name=name,
        slug=slug,
        category=(body.get("category") or "general")[:80],
        system_prompt=(body.get("system_prompt") or "")[:20_000],
        user_prompt_template=(body.get("user_prompt_template") or "")[:20_000],
        created_by=admin.email,
    )
    db.add(row)
    db.commit()
    return {"id": str(row.id), "slug": row.slug}


@router.patch("/prompts/{preset_id}")
def update_prompt(preset_id: str, body: dict[str, Any], db: Session = Depends(get_db)):
    row = db.get(AiPromptPreset, preset_id)
    if not row:
        raise HTTPException(status_code=404, detail="Preset not found")
    for key in ("name", "category", "system_prompt", "user_prompt_template"):
        if key in body and body[key] is not None:
            setattr(row, key, body[key])
    db.commit()
    return {"ok": True}


@router.delete("/prompts/{preset_id}")
def delete_prompt(preset_id: str, db: Session = Depends(get_db)):
    row = db.get(AiPromptPreset, preset_id)
    if not row:
        raise HTTPException(status_code=404, detail="Preset not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# --- Studio ---


@router.post("/studio/complete")
async def studio_complete_endpoint(
    body: dict[str, Any],
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    try:
        run = await studio_complete(
            db,
            model=body.get("model"),
            system_prompt=body.get("system"),
            user_prompt=(body.get("user") or "").strip(),
            context=body.get("context") or {},
            created_by=admin.email,
            preset_id=uuid.UUID(body["preset_id"]) if body.get("preset_id") else None,
        )
    except AiDisabledError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "id": str(run.id),
        "model": run.model,
        "output_text": run.output_text,
        "created_at": run.created_at.isoformat(),
    }


@router.post("/studio/image")
async def studio_image_endpoint(
    body: dict[str, Any],
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt required")
    try:
        run = await studio_image(db, prompt=prompt, created_by=admin.email)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"id": str(run.id), "output_image_url": run.output_image_url}


@router.get("/studio/runs")
def list_studio_runs(db: Session = Depends(get_db), limit: int = 30):
    rows = (
        db.execute(select(AiStudioRun).order_by(AiStudioRun.created_at.desc()).limit(limit))
        .scalars()
        .all()
    )
    return [
        {
            "id": str(r.id),
            "model": r.model,
            "user_prompt": r.user_prompt[:200],
            "output_text": (r.output_text or "")[:500],
            "output_image_url": r.output_image_url,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.post("/studio/promote")
def studio_promote(
    body: dict[str, Any],
    db: Session = Depends(get_db),
    admin: WorkbenchUser = Depends(get_current_workbench_user),
):
    try:
        result = promote_studio_output(
            db,
            output_text=(body.get("output_text") or "").strip(),
            target=(body.get("target") or "template"),
            name=(body.get("name") or "AI Draft")[:200],
            image_url=body.get("image_url"),
            created_by=admin.email,
            segment_id=uuid.UUID(body["segment_id"]) if body.get("segment_id") else None,
            template_id=body.get("template_id"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


# --- Segments AI ---


@router.post("/segments/propose")
async def segments_propose(db: Session = Depends(get_db)):
    try:
        seg = await propose_segment(db)
    except AiDisabledError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "id": str(seg.id),
        "name": seg.name,
        "slug": seg.slug,
        "description": seg.description,
        "filter_json": seg.filter_json,
        "ai_proposal_status": seg.ai_proposal_status,
        "ai_rationale": seg.ai_rationale,
    }


@router.post("/segments/{segment_id}/approve")
def segments_approve(segment_id: str, db: Session = Depends(get_db)):
    try:
        seg = approve_ai_segment(db, uuid.UUID(segment_id))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"id": str(seg.id), "ai_proposal_status": seg.ai_proposal_status}


@router.post("/segments/{segment_id}/reject")
def segments_reject(segment_id: str, db: Session = Depends(get_db)):
    try:
        seg = reject_ai_segment(db, uuid.UUID(segment_id))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"id": str(seg.id), "ai_proposal_status": seg.ai_proposal_status}


# --- Campaign / social drafts ---


@router.post("/campaign/draft")
async def campaign_draft(body: dict[str, Any]):
    try:
        data = await generate_email_draft(
            goal=(body.get("goal") or "nurture warm leads"),
            segment_name=body.get("segment_name"),
            context=body.get("context"),
        )
    except AiDisabledError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return data


@router.post("/social/draft")
async def social_draft(body: dict[str, Any]):
    try:
        data = await generate_social_draft(
            goal=(body.get("goal") or "LinkedIn awareness post"),
            context=body.get("context"),
        )
    except AiDisabledError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return data


# --- Graph ---


@router.get("/graph")
def market_graph(scope: str = "market", db: Session = Depends(get_db)):
    return build_market_graph(db, scope=scope)


# --- Warmth ---


@router.get("/customers/{customer_id}/warmth")
def customer_warmth(customer_id: str, db: Session = Depends(get_db)):
    return {"history": customer_warmth_history(db, uuid.UUID(customer_id))}


@router.post("/jobs/snapshots", dependencies=[Depends(_verify_cron)])
def job_snapshots(db: Session = Depends(get_db)):
    return run_engagement_snapshots(db)


@router.post("/jobs/snapshots/manual")
def job_snapshots_manual(db: Session = Depends(get_db)):
    return run_engagement_snapshots(db)


@router.post("/jobs/opportunities", dependencies=[Depends(_verify_cron)])
def job_opportunities(db: Session = Depends(get_db)):
    return run_opportunity_detection(db)


@router.post("/jobs/opportunities/manual")
def job_opportunities_manual(db: Session = Depends(get_db)):
    return run_opportunity_detection(db)


@router.post("/jobs/goals-refresh", dependencies=[Depends(_verify_cron)])
def job_goals_refresh(db: Session = Depends(get_db)):
    return refresh_all_auto_goals(db)


@router.post("/jobs/goals-refresh/manual")
def job_goals_refresh_manual(db: Session = Depends(get_db)):
    return refresh_all_auto_goals(db)


@router.post("/jobs/competitors-scrape", dependencies=[Depends(_verify_cron)])
async def job_competitors_scrape(db: Session = Depends(get_db)):
    return await scrape_all_active_sources(db)


@router.post("/jobs/competitors-scrape/manual")
async def job_competitors_scrape_manual(db: Session = Depends(get_db)):
    return await scrape_all_active_sources(db)


# --- Daily briefings ---


@router.get("/briefings")
def list_briefings(db: Session = Depends(get_db), limit: int = 30):
    rows = (
        db.execute(select(DailyBriefing).order_by(DailyBriefing.report_date.desc()).limit(limit))
        .scalars()
        .all()
    )
    return [
        {
            "id": str(r.id),
            "report_date": r.report_date.isoformat(),
            "title": r.title,
            "markdown_body": r.markdown_body,
            "chart_payload": r.chart_payload,
            "emailed_at": r.emailed_at.isoformat() if r.emailed_at else None,
            "slacked_at": r.slacked_at.isoformat() if r.slacked_at else None,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/briefings/{briefing_id}")
def get_briefing(briefing_id: str, db: Session = Depends(get_db)):
    r = db.get(DailyBriefing, briefing_id)
    if not r:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return {
        "id": str(r.id),
        "report_date": r.report_date.isoformat(),
        "title": r.title,
        "markdown_body": r.markdown_body,
        "html_body": r.html_body,
        "chart_payload": r.chart_payload,
    }


@router.post("/briefings/generate")
async def generate_briefing_manual(db: Session = Depends(get_db)):
    try:
        row = await generate_daily_briefing(db)
    except AiDisabledError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"id": str(row.id), "title": row.title}


@router.post("/briefings/{briefing_id}/deliver")
async def deliver_briefing(briefing_id: str, db: Session = Depends(get_db)):
    r = db.get(DailyBriefing, briefing_id)
    if not r:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return await deliver_daily_briefing(db, r)


@router.post("/jobs/daily-briefing", dependencies=[Depends(_verify_cron)])
async def job_daily_briefing(db: Session = Depends(get_db)):
    try:
        row = await generate_daily_briefing(db)
        delivery = await deliver_daily_briefing(db, row)
    except AiDisabledError:
        return {"skipped": True, "reason": "AI disabled"}
    except AiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"id": str(row.id), "delivery": delivery}
