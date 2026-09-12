from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
from pathlib import Path
from statistics import mean

from sqlalchemy import select

from app.ai.client import chat_completion, resolve_model
from app.ai.eval import build_eval_user, checklist_score, overlap_f1
from app.ai.prompts import STUDIO_DEFAULT_SYSTEM
from app.db import SessionLocal
from app.models import AiEvalCase

OUT_PATH = Path(__file__).resolve().parents[2] / "evals" / "latest.json"


async def _run(split: str | None) -> dict:
    db = SessionLocal()
    try:
        q = select(AiEvalCase).where(AiEvalCase.task == "email")
        if split:
            q = q.where(AiEvalCase.eval_split == split)
        cases = list(db.execute(q.order_by(AiEvalCase.created_at.asc())).scalars().all())
        if not cases:
            return {"cases": 0, "message": "No gold cases yet. Save as gold from Studio."}

        model = resolve_model("studio")
        rows: list[dict] = []
        for case in cases:
            pred = await chat_completion(
                messages=[
                    {"role": "system", "content": STUDIO_DEFAULT_SYSTEM},
                    {"role": "user", "content": build_eval_user(case)},
                ],
                model=model,
                response_format="text",
                temperature=0.2,
                max_tokens=2000,
            )
            check = checklist_score(pred, case.gold_output)
            f1 = overlap_f1(pred, case.gold_output)
            rows.append(
                {
                    "id": str(case.id),
                    "split": case.eval_split,
                    "overlap_f1": round(f1, 4),
                    "checklist_ok": check["ok"],
                    "missing_offers": check["missing_offers"],
                    "forbidden_claim": check["forbidden_claim"],
                }
            )
        report = {
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "model": model,
            "cases": len(rows),
            "mean_overlap_f1": round(mean(r["overlap_f1"] for r in rows), 4),
            "checklist_pass_rate": round(sum(1 for r in rows if r["checklist_ok"]) / len(rows), 4),
            "rows": rows,
        }
        OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return report
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Replay Studio gold cases against the current system prompt.")
    parser.add_argument("--split", choices=["dev", "holdout"], default=None)
    args = parser.parse_args()
    report = asyncio.run(_run(args.split))
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, indent=2))
    if report.get("rows"):
        print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
