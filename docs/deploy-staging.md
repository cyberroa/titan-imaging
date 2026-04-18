# Staging environment setup

How to stand up a parallel staging copy of Titan Imaging (Supabase + Render +
Vercel + Make + Resend) so new features can be tested against non-production
data before promotion to `main`.

Estimated time: **~45 minutes** (mostly DNS/OAuth propagation waits).

## When to run this

Run this guide when you're ready to treat the current deploy as real
production — typically right before cutting `titanimagingservice.com` over
to Vercel. Until then, the existing deploy doubles as a dev/demo environment
and a dedicated staging tier isn't strictly necessary.

Once staging exists, the workflow becomes:

- Feature branch → PR into `staging` → test on staging
- `staging` → PR into `main` → auto-deploy to production

## Architecture after setup

| Layer | Production | Staging |
|---|---|---|
| Git branch | `main` | `staging` |
| Supabase project | `titanimaging` | `titanimaging-staging` |
| Render service | `titan-imaging-api` | `titan-imaging-api-staging` |
| Vercel env | Production | Preview (staging branch) |
| Resend webhook | prod endpoint | separate staging endpoint |
| Make scenario | prod scenario | separate staging scenario |

Each layer is fully isolated — data, auth, email send reputation, and webhook
signing secrets never cross between the two environments.

## Prerequisites

- Admin access to:
  - GitHub repo
  - Supabase organization
  - Render team
  - Vercel team
  - Google Cloud Console (to edit the OAuth client)
  - Resend account
  - Make account (optional at staging setup time)
- Local Git Bash or PowerShell with the backend venv working (see
  [`backend/README.md`](../backend/README.md)).

## Step A — Create the `staging` branch

Long-lived branch that maps 1:1 to the staging deployments.

```bash
cd ~/Documents/GitHub/titanimaging
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

## Step B — Staging Supabase project

1. [supabase.com](https://supabase.com) → **New project**.
   - Name: `titanimaging-staging`
   - Region: **same as production** (e.g. `us-east-1`) to minimize latency
     when Render + Vercel staging hit it.
   - DB password: use a **different** password than prod. Store in your
     password manager.
   - Plan: Free tier.
2. Wait ~2 minutes for provisioning.
3. Collect these values — you'll paste them into Render and Vercel:

   | Label in Supabase | Where to find | Used as |
   |---|---|---|
   | Project URL | Settings → API | `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` public key | Settings → API | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | JWT secret | Settings → API → JWT Settings | `SUPABASE_JWT_SECRET` |
   | Connection string (URI) | Settings → Database → Connection string | `DATABASE_URL` |

   Use the **Session pooler** connection string (port 5432), **not** the
   transaction pooler (6543) — Alembic migrations require session-mode
   connections.

## Step C — Supabase Auth config (staging)

1. Auth → **URL Configuration**:
   - Site URL: leave blank for now, fill in after Step F.
   - Redirect URLs: add both of these (one per line):
     ```
     https://titan-imaging-staging.vercel.app/**
     http://localhost:3000/**
     ```
2. Auth → **Providers → Google**:
   - Enable Google.
   - Client ID / Client Secret: **reuse the same pair from production** — a
     single Google OAuth client can back multiple Supabase projects.
3. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client:
   - **Authorized redirect URIs**: add the staging Supabase callback:
     ```
     https://<staging-supabase-ref>.supabase.co/auth/v1/callback
     ```
   - **Authorized JavaScript origins**: add:
     ```
     https://titan-imaging-staging.vercel.app
     ```

## Step D — Run migrations against staging DB

From `backend/` with the venv activated:

```bash
cd ~/Documents/GitHub/titanimaging/backend
source .venv/Scripts/activate          # Git Bash
# .venv\Scripts\activate                # PowerShell

export DATABASE_URL="<STAGING-supabase-URI>"    # Git Bash
# $env:DATABASE_URL="<STAGING-supabase-URI>"    # PowerShell

alembic current
alembic upgrade head
```

Verify in staging Supabase → **Table Editor** that these tables exist:

- Base: `parts`, `categories`, `contact_submissions`, `sell_submissions`,
  `inventory_alert_subscriptions`
- Phase 4A: `customers`, `segments`, `templates`, `campaigns`,
  `campaign_recipients`, `unsubscribes`, `sessions`, `events`, `social_posts`

> After running migrations against staging, **unset or re-export** your local
> `DATABASE_URL` to avoid accidentally running future migrations against the
> wrong DB. Easy trap.

## Step E — Staging Render service

1. Render → **New → Web Service**.
2. Repository: same GitHub repo.
3. **Branch: `staging`** (critical — not `main`).
4. Root directory: `backend`.
5. Build command + start command: copy from the production service
   (typically `pip install -r requirements.txt` and
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
6. Name: `titan-imaging-api-staging`.
7. Plan: Free tier is sufficient.

### Environment variables

Values marked **(staging)** must differ from production. Values marked
**(shared)** can reuse the same value.

```
# Database + auth (staging)
DATABASE_URL=<STAGING supabase session-pooler URI>
SUPABASE_URL=https://<staging-ref>.supabase.co
SUPABASE_JWT_SECRET=<staging JWT secret>

# Admin access (shared or expanded for testers)
ADMIN_EMAIL_ALLOWLIST=you@example.com,wife@example.com

# CORS + public URLs (staging)
CORS_ORIGINS=https://titan-imaging-staging.vercel.app,http://localhost:3000
PUBLIC_SITE_URL=https://titan-imaging-staging.vercel.app
PUBLIC_API_URL=https://titan-imaging-api-staging.onrender.com

# Resend (shared key OK; separate webhook)
RESEND_API_KEY=<same as prod or a second key named "staging">
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_CUSTOMER=onboarding@resend.dev
ADMIN_NOTIFY_EMAIL=you@example.com
RESEND_WEBHOOK_SECRET=<added AFTER creating staging webhook — see Step H>

# CAN-SPAM footer (shared)
MAILING_ADDRESS=Titan Imaging (STAGING), <real street address>

# Unsubscribe tokens (staging)
UNSUBSCRIBE_SIGNING_SECRET=<fresh 48-char random; generate with below>

# Social / Make (staging Make scenario — blank until Step I)
SOCIAL_WEBHOOK_URL=
SOCIAL_CALLBACK_SECRET=<fresh 48-char random>
```

Generate the random secrets locally:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Run it once per secret (`UNSUBSCRIBE_SIGNING_SECRET` and
`SOCIAL_CALLBACK_SECRET`). Do **not** reuse production values.

Save → Render auto-deploys the `staging` branch. Takes ~5 minutes. Confirm
the deploy goes green in **Events** before moving on.

## Step F — Staging Vercel environment

Vercel treats any non-production branch as "Preview." We piggyback on that
mechanism so the `staging` branch auto-deploys to a stable Preview URL.

1. Vercel → your project → **Settings → Git**.
   - **Production Branch: `main`** — confirm, do not change.
2. Vercel → **Settings → Environment Variables**. For every `NEXT_PUBLIC_*`
   variable, set two distinct values using the environment checkboxes:
   - Production only → production values (leave as-is)
   - Preview only → staging values (below)

   Staging `NEXT_PUBLIC_*` values:
   ```
   NEXT_PUBLIC_API_URL=https://titan-imaging-api-staging.onrender.com
   NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
   NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST=you@example.com,wife@example.com
   NEXT_PUBLIC_SITE_URL=https://titan-imaging-staging.vercel.app
   NEXT_PUBLIC_ENABLE_TRACKING=true
   ```

3. Trigger a Preview deploy on the `staging` branch:

   ```bash
   git checkout staging
   git commit --allow-empty -m "trigger staging deploy"
   git push origin staging
   ```

4. Vercel assigns a generated Preview URL
   (`titan-imaging-git-staging-<user>.vercel.app` or similar).
5. Assign a stable staging alias:
   - Vercel → **Settings → Domains** → **Add** → `titan-imaging-staging.vercel.app`.
   - Under "Git Branch", select `staging`. Save.
   - From now on, every `staging` branch deploy is reachable at that URL.

6. Go back to **staging Supabase → Auth → URL Configuration** and set
   **Site URL = `https://titan-imaging-staging.vercel.app`**.

## Step G — Smoke-test staging end-to-end (auth + admin + tracking)

1. Open `https://titan-imaging-staging.vercel.app/admin` in an incognito
   window.
2. Sign in with a Google account that's on
   `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST`. The redirect should land back on
   `/admin`, not prod.
3. Verify each admin page loads without errors:
   - `/admin/parts`, `/admin/categories`, `/admin/import`
   - `/admin/customers`, `/admin/templates`, `/admin/segments`,
     `/admin/campaigns`, `/admin/social`
   - `/admin/alerts`, `/admin/outreach`
4. Open the public site `https://titan-imaging-staging.vercel.app` in a
   fresh incognito session → accept the consent banner → navigate to
   `/inventory` → in devtools Network tab, confirm `POST /api/v1/events`
   returns 200. That proves tracking is wired.

## Step H — Resend webhook for staging

Each environment needs its own Resend webhook so event payloads update the
right DB.

1. Resend dashboard → **Webhooks** → **Add Endpoint**.
2. Endpoint URL:
   ```
   https://titan-imaging-api-staging.onrender.com/api/v1/webhooks/resend
   ```
3. Events to subscribe to:
   - `email.sent`
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
4. Resend generates a **Signing Secret** (`whsec_...`). Copy it.
5. Render → staging service → Environment → set
   `RESEND_WEBHOOK_SECRET=whsec_...` → save (triggers redeploy).

Repeat the exact same steps for production if you haven't already — use the
production endpoint URL and a **separate** webhook entry in Resend. Do not
share signing secrets across environments.

## Step I — Make scenario for staging (optional but recommended)

Do **not** point the staging social composer at your production LinkedIn
Page — it will publish real posts. Two safe options:

**Option 1 — Test-mode scenario (simplest).** Clone the production Make
scenario (`docs/phase4a-make-setup.md`). In the cloned scenario, switch the
LinkedIn module to "Disabled" or "Test only," so Make still exercises the
webhook contract but skips the actual LinkedIn API call.

**Option 2 — Echo-back scenario.** A Make scenario whose only modules are
the Webhook trigger and an HTTP module that POSTs a synthetic success
payload back to
`https://titan-imaging-api-staging.onrender.com/api/v1/webhooks/social`
with a valid HMAC signature. Useful for automated tests of the DB flow
without touching LinkedIn at all.

Either way: paste the new Make webhook URL into staging Render's
`SOCIAL_WEBHOOK_URL` environment variable.

## Step J — End-to-end campaign smoke test

This is the final "does everything actually work" test.

1. In staging `/admin/customers`, add yourself as a customer with
   `consent_marketing = true`.
2. In staging `/admin/templates`, create a template:
   - Slug: `sanity-check`
   - Subject: `Staging sanity check`
   - Body (MD): `Hi {{ name }}, this is from staging.`
3. In staging `/admin/segments`, create a segment with filter
   `{"consent_marketing": true}`. Preview should show 1 customer (you).
4. In staging `/admin/campaigns`, compose a campaign pointing at the
   template + segment → **Send now**.
5. Within a minute you should receive the email. Open it, click the
   unsubscribe link.
6. Back in staging `/admin/campaigns/<id>`, the recipient row should flip
   `sent → delivered → opened → unsubscribed` as Resend webhooks land.
7. Confirm in Supabase Table Editor that:
   - `campaign_recipients` got a row.
   - `events` got `email.sent` / `email.delivered` / `email.opened` / etc.
   - `unsubscribes` got your email.

If all of that passes, staging is functioning identically to production.

## Ongoing workflow

### Adding a feature

```bash
git checkout staging
git pull
git checkout -b feat/my-feature
# ... work ...
git push -u origin feat/my-feature
```

Open a PR **into `staging`** (not `main`). Vercel creates a per-PR Preview
deploy. Test there. When happy, merge the PR into `staging`.

### Promoting staging to production

Once you've smoke-tested on `titan-imaging-staging.vercel.app`:

```bash
git checkout main
git pull
git merge --no-ff staging
git push origin main
```

Or open a PR `staging` → `main` and merge via the GitHub UI (preferred —
leaves a cleaner audit trail).

### Migrations

Always apply to **both** DBs. Order matters: staging first, then prod after
verifying nothing broke.

```bash
# Against staging
export DATABASE_URL="<STAGING URI>"
alembic upgrade head

# Against production
export DATABASE_URL="<PROD URI>"
alembic upgrade head

unset DATABASE_URL   # Git Bash
# Remove-Item Env:DATABASE_URL   # PowerShell
```

### Hotfixes

If prod breaks and staging is ahead of prod, don't force-merge staging. Branch
from `main`, fix, PR into `main`, then immediately merge `main` back into
`staging` to keep the two branches from diverging:

```bash
git checkout main && git pull
git checkout -b hotfix/<thing>
# fix, commit, push, PR into main, merge
git checkout staging
git pull
git merge main
git push origin staging
```

## Troubleshooting

**OAuth redirect lands on prod when signing into staging.** Your staging
Supabase "Site URL" is still blank or points to prod. Auth → URL
Configuration → set to `https://titan-imaging-staging.vercel.app`.

**Staging admin page shows "You are not authorized."** Your email isn't in
`NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST` (frontend check) or
`ADMIN_EMAIL_ALLOWLIST` (backend check). Both must list your email.

**Events POST returns 404 from staging public site.** `NEXT_PUBLIC_API_URL`
(Vercel Preview env) doesn't match the staging Render URL. Fix and redeploy.

**CORS errors hitting staging backend from staging frontend.** Render's
`CORS_ORIGINS` is missing `https://titan-imaging-staging.vercel.app`. Add it
and redeploy.

**Alembic upgrade fails with "Tenant or user not found."** You copied the
short `postgres` username instead of the full `postgres.<project-ref>`
format. Use the URI exactly as Supabase displays it.

**Emails from staging arrive with the prod `MAILING_ADDRESS` in the
footer.** The staging Render service didn't pick up the env var, or
redeploy hasn't completed. Force redeploy from Render → Manual Deploy →
Clear build cache & deploy.

**Changes on `main` don't show up in staging.** `main` has moved ahead of
`staging`. Merge back:
```bash
git checkout staging
git pull
git merge main
git push
```

## Cost

All staging infra is designed to fit free tiers:

| Service | Free tier | Staging usage |
|---|---|---|
| Supabase | 500MB DB, 2GB egress | Nowhere near cap |
| Render | 750 hours/month | One web service, cold-starts on idle |
| Vercel | Unlimited hobby | Preview deploys free |
| Resend | 3,000 emails/month | Testing only; well under |
| Make | 1,000 ops/month | LinkedIn tests; well under |

Cold starts on Render's free tier add ~30s latency to the first request
after idle. That's acceptable for staging. Production should stay on a paid
Render tier to avoid the cold start.

## Teardown

If you need to tear staging down (e.g. consolidating costs):

1. Delete the Render staging web service.
2. Delete the Vercel alias `titan-imaging-staging.vercel.app`.
3. Pause or delete the staging Supabase project.
4. Delete the staging Resend webhook.
5. Delete the staging Make scenario.
6. Leave the `staging` Git branch alone — it's cheap and useful to keep.
