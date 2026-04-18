# Titan Imaging

Public marketing site + admin analytics/CRM platform for Titan Imaging
(refurbished CT/PET parts).

- **Frontend:** Next.js 15 (App Router, TypeScript, Tailwind) deployed to Vercel.
- **Backend:** FastAPI + SQLAlchemy + Alembic, deployed to Render.
- **Data + auth:** Supabase (Postgres, Google OAuth, JWKS).
- **Email:** Resend (transactional + campaigns) with CAN-SPAM footers and
  global unsubscribe.
- **Social:** Make scenario that publishes to LinkedIn; see
  [`docs/phase4a-make-setup.md`](docs/phase4a-make-setup.md).

## Repo layout

```
backend/               FastAPI app, Alembic migrations, requirements.txt
frontend/              Next.js app
docs/
  deploy-staging.md       Staging environment setup (Supabase/Render/Vercel/Resend/Make)
  phase4a-make-setup.md   Make/LinkedIn runbook
  privacy.md              Privacy + consent policy (public + internal)
inventory-templates/
  README.md               Bulk-import conventions
  inventory_import_template.csv
  customer_import_template.csv
  campaigns/              Starter email templates (Markdown)
implementation-plan.md  Phase-by-phase plan
```

## Local dev quickstart

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows / PowerShell
pip install -r requirements.txt
copy .env.example .env    # fill DATABASE_URL etc.
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
copy .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000. The admin app lives at `/admin`; sign in with a
Google account whose email is on `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST` and
`ADMIN_EMAIL_ALLOWLIST`.

## Admin features

- **Parts / Categories / Import** — inventory CRUD and bulk upload.
- **Customers** — CRM with CSV/XLSX import, timeline view, tagging, consent.
- **Templates / Segments / Campaigns** — build reusable email templates,
  define customer segments (filter JSON), send batched campaigns via Resend
  with open/click/bounce tracking.
- **Alerts / Outreach** — legacy inventory alert subscribers + one-off blasts.
- **Social** — compose LinkedIn posts that POST to a Make scenario.

## Phase 4A deployment checklist

1. Apply the new migration: `alembic upgrade head` against Supabase.
2. Add the Phase 4A env vars on Render:
   - `RESEND_WEBHOOK_SECRET`
   - `MAILING_ADDRESS`
   - `UNSUBSCRIBE_SIGNING_SECRET`
   - `SOCIAL_WEBHOOK_URL` and `SOCIAL_CALLBACK_SECRET`
3. Add `NEXT_PUBLIC_ENABLE_TRACKING=true` on Vercel (or `false` to silence
   analytics).
4. In Resend, add a webhook that points to
   `https://<render-host>/api/v1/webhooks/resend` and paste its signing
   secret into `RESEND_WEBHOOK_SECRET`.
5. Build the Make scenario following `docs/phase4a-make-setup.md` and paste
   its webhook URL into `SOCIAL_WEBHOOK_URL`.

## Staging environment

Before the `titanimagingservice.com` domain cuts over to the production
Vercel deployment, the existing environment doubles as a dev/demo. Once the
domain is live, spin up a parallel staging tier following
[`docs/deploy-staging.md`](docs/deploy-staging.md). Staging gives you a safe
place to test migrations, email sends, and Make scenarios without touching
real customers.

## Privacy

See [`docs/privacy.md`](docs/privacy.md). TL;DR: marketing emails only go to
contacts with explicit consent or specific inventory-alert opt-ins; every
email has a one-click unsubscribe; tracking is consent-gated on the public
site.
