## Titan Imaging API (Phase 2)

FastAPI backend for parts search and form submissions. Uses **direct Postgres** (Supabase)
via `DATABASE_URL`.

### Local setup

1. Create `backend/.env` (see `backend/.env.example`).
2. Create a venv and install deps.

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

3. Run migrations and seed.

```bash
alembic upgrade head
python -m app.scripts.seed
```

4. Start the server.

```bash
uvicorn app.main:app --reload --port 8000
```

### Endpoints

- `GET /health`
- `GET /api/v1/categories`
- `GET /api/v1/parts?search=&category=&limit=`
- `GET /api/v1/parts/{id}`
- `POST /api/v1/contact`
- `POST /api/v1/sell`

