from __future__ import annotations

import json

import httpx

from app.settings import get_settings


async def maybe_send_admin_email(subject: str, text: str, payload: dict) -> None:
    """
    Best-effort email. Never raise to callers; failures should not break form UX.
    """
    settings = get_settings()
    if not settings.resend_api_key or not settings.admin_notify_email:
        return

    email_from = settings.email_from or settings.admin_notify_email

    body = {
        "from": email_from,
        "to": [settings.admin_notify_email],
        "subject": subject,
        "text": f"{text}\n\n---\n\n{json.dumps(payload, indent=2, default=str)}",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "https://api.resend.com/emails",
                json=body,
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )
    except Exception:
        # Fail open by design (logging can be added later).
        return

