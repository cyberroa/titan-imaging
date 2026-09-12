from __future__ import annotations

import json
import re
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AiEvalCase, AiStudioRun

_EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
_PHONE_RE = re.compile(r"(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}")

OFFER_CHECKS: list[tuple[str, re.Pattern[str]]] = [
    ("parts", re.compile(r"\bparts?\b", re.I)),
    ("audit", re.compile(r"\baudit", re.I)),
    ("repairs", re.compile(r"\b(repair|service contract|pm schedule)\b", re.I)),
    ("used_system", re.compile(r"\b(pre-?owned|refurbished|used system)\b", re.I)),
    ("new_system", re.compile(r"\bnew (system|ge)\b", re.I)),
    ("sell_to_us", re.compile(r"\b(sell[- ]to[- ]us|selling (equipment|to titan))\b", re.I)),
]

FORBIDDEN = re.compile(
    r"\b(fda[- ]?(approved|cleared)|lifetime warranty|guaranteed results)\b",
    re.I,
)


def redact_text(value: str) -> str:
    out = _EMAIL_RE.sub("[email]", value)
    return _PHONE_RE.sub("[phone]", out)


def redact_context(obj: Any) -> Any:
    if isinstance(obj, str):
        return redact_text(obj)
    if isinstance(obj, dict):
        skip = {"id", "customer_id", "segment_id"}
        return {k: (v if k in skip else redact_context(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact_context(v) for v in obj]
    return obj


def _next_split(db: Session) -> str:
    n = db.scalar(select(func.count()).select_from(AiEvalCase)) or 0
    return "holdout" if int(n) % 5 == 4 else "dev"


def save_gold_case(
    db: Session,
    *,
    gold_output: str,
    created_by: str | None,
    run_id: str | None = None,
    user_prompt: str | None = None,
    system_prompt: str | None = None,
    context: dict | None = None,
    task: str = "email",
) -> AiEvalCase:
    gold = redact_text(gold_output.strip())
    if not gold:
        raise ValueError("gold_output required")
    run: AiStudioRun | None = None
    if run_id:
        run = db.get(AiStudioRun, run_id)
    user = redact_text((user_prompt if user_prompt is not None else (run.user_prompt if run else "")).strip())
    system = (system_prompt if system_prompt is not None else (run.system_prompt if run else "")).strip()
    ctx = redact_context(context if context is not None else (run.context_json if run else {}))
    if not user:
        raise ValueError("user_prompt required (or a Studio run id)")
    row = AiEvalCase(
        id=uuid.uuid4(),
        run_id=run.id if run else None,
        task=(task or "email")[:24],
        eval_split=_next_split(db),
        system_prompt=system,
        user_prompt=user,
        context_json=ctx if isinstance(ctx, dict) else {},
        gold_output=gold,
        created_by=created_by,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9']+", text.lower()) if len(t) > 2}


def overlap_f1(pred: str, gold: str) -> float:
    a, b = tokenize(pred), tokenize(gold)
    if not a or not b:
        return 0.0
    inter = len(a & b)
    prec = inter / len(a)
    rec = inter / len(b)
    if prec + rec == 0:
        return 0.0
    return 2 * prec * rec / (prec + rec)


def checklist_score(pred: str, gold: str) -> dict[str, Any]:
    missing: list[str] = []
    for name, pat in OFFER_CHECKS:
        if pat.search(gold) and not pat.search(pred):
            missing.append(name)
    forbidden = bool(FORBIDDEN.search(pred) and not FORBIDDEN.search(gold))
    ok = not missing and not forbidden
    return {"ok": ok, "missing_offers": missing, "forbidden_claim": forbidden}


def build_eval_user(case: AiEvalCase) -> str:
    user = case.user_prompt
    ctx = case.context_json or {}
    if ctx:
        user = f"{user}\n\nContext JSON:\n{json.dumps(ctx, default=str)}"
    return user


def case_to_out(row: AiEvalCase) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "run_id": str(row.run_id) if row.run_id else None,
        "task": row.task,
        "eval_split": row.eval_split,
        "created_at": row.created_at.isoformat(),
    }
