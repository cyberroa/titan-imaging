"""Studio Agent: classify spoken/typed requests and dispatch CRM or copy actions."""

from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.ai.client import chat_completion, resolve_model
from app.customer_search import search_customers
from app.models import Customer
from app.settings import get_settings

logger = logging.getLogger(__name__)

INTENTS = frozenset({"log_engagement", "draft_copy", "lookup", "research", "note"})

_CLASSIFY_SYSTEM = """You classify staff requests for Titan Imaging Workbench Studio Agent.
Return JSON only: {"intent":"...","query":"...","note":"..."}
intent must be one of:
- log_engagement: they described a call, meeting, or customer conversation to record
- draft_copy: they want an email, LinkedIn post, or outreach drafted (do not log CRM)
- lookup: they want to find which customer/account they mean
- research: they want the research agent queued on an account
- note: they want a CRM note saved, not a full engagement
query: short search string (company, person, email) if mentioned, else empty
note: the note or reason text if intent is note or research, else empty
If a customer is already attached and they describe a conversation, prefer log_engagement.
If no customer is attached and they name a hospital/company, prefer lookup unless they clearly want a draft.
"""


def _heuristic_intent(text: str, has_customer: bool) -> str:
    t = text.lower()
    if re.search(r"\b(find|lookup|who is|which account|search)\b", t):
        return "lookup"
    if re.search(r"\b(research|dossier|investigate|look into)\b", t):
        return "research"
    if re.search(r"\b(note|jot|remind)\b", t) and not re.search(r"\b(call|meeting|spoke)\b", t):
        return "note"
    if re.search(r"\b(draft|write|compose|email|linkedin|outreach|subject)\b", t):
        return "draft_copy"
    if has_customer:
        return "log_engagement"
    return "lookup"


async def classify_agent_intent(text: str, *, has_customer: bool) -> dict[str, str]:
    settings = get_settings()
    fallback = {
        "intent": _heuristic_intent(text, has_customer),
        "query": "",
        "note": text[:2000],
    }
    try:
        raw = await chat_completion(
            messages=[
                {"role": "system", "content": _CLASSIFY_SYSTEM},
                {
                    "role": "user",
                    "content": json.dumps(
                        {"text": text[:4000], "customer_attached": has_customer}
                    ),
                },
            ],
            model=resolve_model("studio", settings),
            response_format="json",
            temperature=0.1,
            max_tokens=400,
            settings=settings,
        )
        data = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(data, dict):
            return fallback
        intent = str(data.get("intent") or fallback["intent"]).strip()
        if intent not in INTENTS:
            intent = fallback["intent"]
        return {
            "intent": intent,
            "query": str(data.get("query") or "").strip()[:200],
            "note": str(data.get("note") or "").strip()[:2000],
        }
    except Exception:
        logger.exception("Studio agent classify failed; using heuristic")
        return fallback


def customer_hit(c: Customer) -> dict[str, Any]:
    return {
        "id": str(c.id),
        "email": c.email,
        "name": c.name,
        "company": c.company,
    }


def search_accounts(db: Session, q: str, limit: int = 8) -> list[dict[str, Any]]:
    term = (q or "").strip()
    if not term:
        return []
    rows, _ = search_customers(db, term, limit=limit, offset=0)
    return [customer_hit(c) for c, _ in rows]


def resolve_customer(
    db: Session,
    *,
    customer_id: str | None,
    text: str,
    query: str,
) -> Customer | None:
    from app.ai.engagement import match_customer_from_email_text

    if customer_id:
        c = db.get(Customer, customer_id)
        if c:
            return c
    matched = match_customer_from_email_text(db, text)
    if matched:
        return matched
    hits = search_accounts(db, query or text, limit=5)
    if len(hits) == 1:
        return db.get(Customer, hits[0]["id"])
    return None
