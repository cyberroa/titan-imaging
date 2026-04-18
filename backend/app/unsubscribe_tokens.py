from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time

from app.settings import get_settings


def _secret() -> bytes:
    settings = get_settings()
    s = (
        settings.unsubscribe_signing_secret
        or settings.supabase_jwt_secret
        or "dev-only-please-configure-UNSUBSCRIBE_SIGNING_SECRET"
    )
    return s.encode("utf-8")


def _b64u_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64u_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def make_token(email: str, campaign_id: str | None = None, ttl_days: int = 365) -> str:
    """Issue a signed, URL-safe unsubscribe token for an email."""
    payload = {
        "e": email.strip().lower(),
        "c": campaign_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl_days * 24 * 3600,
        "n": secrets.token_urlsafe(6),
    }
    body = _b64u_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(_secret(), body.encode("ascii"), hashlib.sha256).digest()
    return f"{body}.{_b64u_encode(sig)}"


def verify_token(token: str) -> dict | None:
    """Return the decoded payload if valid and non-expired, else None."""
    try:
        body, sig = token.split(".", 1)
    except ValueError:
        return None
    expected = hmac.new(_secret(), body.encode("ascii"), hashlib.sha256).digest()
    try:
        if not hmac.compare_digest(expected, _b64u_decode(sig)):
            return None
        payload = json.loads(_b64u_decode(body))
    except Exception:
        return None
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    email = payload.get("e")
    if not isinstance(email, str) or "@" not in email:
        return None
    return payload
