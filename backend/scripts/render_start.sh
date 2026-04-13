#!/usr/bin/env bash
# Used on Render free tier (no pre-deploy); runs migrate + seed then the API.
set -euo pipefail
alembic upgrade head
python -m app.scripts.seed
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
