from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWTError

from app.settings import get_settings


@dataclass(frozen=True)
class AdminUser:
    sub: str
    email: str


def decode_admin_token(authorization: str | None) -> AdminUser:
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(status_code=503, detail="Admin auth not configured")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        options = {"require": ["exp", "sub"]}
        issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None
        decode_kwargs: dict = {
            "algorithms": ["HS256"],
            "audience": "authenticated",
            "options": options,
        }
        if issuer:
            decode_kwargs["issuer"] = issuer
        decoded = jwt.decode(token, settings.supabase_jwt_secret, **decode_kwargs)
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token") from None

    email = decoded.get("email")
    if not email or not isinstance(email, str):
        raise HTTPException(status_code=401, detail="Token missing email")

    allow = settings.admin_email_allowlist_set
    if allow and email.strip().lower() not in allow:
        raise HTTPException(status_code=403, detail="Email not allowed for admin")

    sub = decoded.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return AdminUser(sub=str(sub), email=email.strip().lower())


async def get_current_admin(authorization: str | None = Header(None)) -> AdminUser:
    return decode_admin_token(authorization)
