from __future__ import annotations

import logging
import uuid
from typing import Any

import httpx

from app.settings import get_settings

logger = logging.getLogger(__name__)


async def generate_gemini_image(prompt: str, *, size: str = "1024x1024") -> str | None:
    """Generate image via Google Gemini API; returns data URL or None if not configured."""
    settings = get_settings()
    key = (settings.google_ai_api_key or "").strip()
    if not key:
        return None

    model = settings.gemini_image_model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=body)
        if resp.status_code >= 400:
            logger.warning("Gemini image error %s: %s", resp.status_code, resp.text[:300])
            return None
        data = resp.json()
        for cand in data.get("candidates") or []:
            for part in (cand.get("content") or {}).get("parts") or []:
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                    return f"data:{mime};base64,{inline['data']}"
    except httpx.HTTPError:
        logger.exception("Gemini image request failed")
    return None


def store_image_data_url(data_url: str) -> str:
    """For MVP return data URL as-is; production can upload to Supabase Storage."""
    return data_url
