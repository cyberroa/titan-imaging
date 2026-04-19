# Production cutover checklist

Items to plan for when Titan Imaging moves from a demo/dev deployment to
serving real customers at `titanimagingservice.com`. Not everything here is
urgent today — this doc is the "future you" reference so nothing gets
forgotten.

## Backend cold starts (Render free tier)

**Problem.** The backend currently runs on Render's free tier, which spins
the container down after ~15 minutes of inactivity. The first request after
idle takes ~50 seconds to return while Render provisions a fresh instance.
That's unacceptable once customers are actually hitting the site — a 50s
delay on the first page load will look broken.

**Option A — Upgrade to Render Starter ($7/mo).**

The direct fix. Starter plan keeps one instance always-on, no cold starts,
and doubles the RAM (512MB → 1GB) which helps when a campaign send spawns
multiple outbound HTTPS requests in parallel.

- Pros: Single action (toggle plan in Render dashboard). No code changes.
  Predictable latency. Also gives you zero-downtime deploys.
- Cons: $84/year per backend service. With staging, that's $168/year total
  if both are always-on.
- When to pull the trigger: the day the domain cuts over, or the first
  time a real customer reports slowness.

**Option B — External pinger keeping the free tier warm.**

Services like [Better Stack](https://betterstack.com/uptime) (formerly
Better Uptime), [UptimeRobot](https://uptimerobot.com), or
[cron-job.org](https://cron-job.org) can hit your `/health` endpoint every
5–14 minutes for free, which prevents Render from ever idling the
container.

- Pros: Free. Also gives you real uptime monitoring with email/SMS alerts
  for free (valuable on its own).
- Cons: Technically "against the spirit" of Render's free tier — Render
  could tighten their policy. Uses your free-tier compute hours faster (but
  the free tier gives 750 hours/month per service and a month has only
  ~730, so it's fine).
- Recommended setup regardless of hosting tier, because monitoring/alerts
  are useful.

Recommended free-tier pinger: **Better Stack** (more polished UI,
supports status pages). Configure:
- Monitor URL: `https://titan-imaging-api.onrender.com/health`
- Frequency: every 3 minutes (Render idles after ~15, so 3 min is safe)
- Alert channels: email to you + wife
- Create a second monitor for staging once that exists

**Option C — Move to a different host.**

If the $7/mo per service is a sticking point, alternatives with better
free/cheap tiers:

- [Fly.io](https://fly.io) — "scale-to-zero" is opt-in, can keep free VMs
  warm. Paid plans start at $1.94/mo for a shared-cpu-1x@256MB.
- [Railway](https://railway.app) — $5/mo includes $5 of usage, typically
  enough for a small FastAPI app.
- [Vercel Python Functions](https://vercel.com/docs/functions/runtimes/python) —
  free for light usage, but the FastAPI layout needs refactoring and
  serverless has its own cold-start/connection-pooling gotchas with
  SQLAlchemy.

Moving hosts is a half-day effort plus env-var migration. Not worth it
unless you're actively squeezed on cost — the $7/mo Starter plan is almost
always the right answer for a small business.

**Recommendation.** On cutover day:
1. Upgrade production Render to **Starter ($7/mo)**.
2. Leave **staging on Free** (cold starts are fine there).
3. Set up **Better Stack monitoring** on both prod and staging.

Total monthly add: $7 + $0 = $7.

## Email deliverability hardening

Before blasting real customer campaigns, verify:

- [ ] SPF, DKIM, DMARC all pass for `titanimagingservice.com` (Resend shows
      green checks on all three).
- [ ] DMARC policy set to at least `p=none` with `rua=mailto:postmaster@...`
      so you can observe delivery reports. Escalate to `p=quarantine` after
      a month of clean reports.
- [ ] Sender address uses a role alias (`hello@...`, `support@...`,
      `owner@...`) not a personal name. Forwards to a shared Gmail.
- [ ] First "warm up" send goes to a small segment (5–20 known-good
      contacts) not a full customer blast. Campaign send pipeline handles
      batching, but reputation is built over days, not minutes.
- [ ] `MAILING_ADDRESS` reflects a real, verifiable street address
      (P.O. box OK). This is legally required by CAN-SPAM, not optional.
- [ ] Test that `List-Unsubscribe` headers are present in sent mail (view
      the raw source in Gmail — "Show original").

## DNS + domain cutover checklist

When flipping `titanimagingservice.com` to point at Vercel:

- [ ] Add domain in Vercel → Settings → Domains.
- [ ] Update DNS `A` / `CNAME` at the registrar per Vercel's instructions.
- [ ] Wait for propagation (up to 24h, usually <1h).
- [ ] Update Supabase Auth → URL Configuration → Site URL to
      `https://titanimagingservice.com`.
- [ ] Update Google Cloud OAuth → Authorized origins + redirect URIs to
      include `https://titanimagingservice.com`.
- [ ] Update Render env vars:
      - `PUBLIC_SITE_URL=https://titanimagingservice.com`
      - `CORS_ORIGINS=https://titanimagingservice.com,https://titan-imaging-staging.vercel.app`
- [ ] Update Vercel env vars: `NEXT_PUBLIC_SITE_URL` to production domain.
- [ ] Update Resend: verify `titanimagingservice.com`, then change
      `EMAIL_FROM` and `EMAIL_FROM_CUSTOMER` on Render to
      `hello@titanimagingservice.com`.
- [ ] Stand up staging environment following
      [`deploy-staging.md`](deploy-staging.md) so the existing prod infra
      becomes the real prod, and staging absorbs break-things work.

## Database (Supabase) upgrades to consider

Free tier gives 500MB DB + 2GB egress. Fine for the first 12–18 months.
When you do outgrow it:

- **Pro plan ($25/mo)**: 8GB DB, automated daily backups, point-in-time
  recovery up to 7 days. The backup story alone is worth the upgrade once
  you have real customer data.
- **Enable RLS (Row-Level Security)**: currently we rely on backend-only
  access via service role. If you ever add a customer-facing feature that
  reads from Supabase directly (loyalty dashboard, self-serve portal,
  etc.), turn on RLS on every table before exposing it.

## Performance + scaling

When traffic grows past ~1,000 monthly visitors:

- Add a CDN cache policy for inventory images (Vercel does this
  automatically for `/_next/image`).
- Add a Postgres index on `events(customer_id, occurred_at DESC)` once the
  events table exceeds ~100k rows. Check with:
  ```sql
  SELECT count(*) FROM events;
  ```
- Consider a Supabase read replica for analytics queries once customer
  timeline lookups slow down.

## Security

Before going fully live:

- [ ] Rotate all secrets that were ever pasted into Slack, email, or
      commit messages — generate fresh values for
      `UNSUBSCRIBE_SIGNING_SECRET`, `SOCIAL_CALLBACK_SECRET`,
      `RESEND_WEBHOOK_SECRET`, `SUPABASE_JWT_SECRET`.
- [ ] Confirm `.env` files are gitignored (`backend/.env`,
      `frontend/.env.local`) — already done.
- [ ] Enable 2FA on Supabase, Render, Vercel, Resend, Make, Google Cloud,
      GitHub for both you and your wife.
- [ ] Review `ADMIN_EMAIL_ALLOWLIST` / `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST` —
      remove any test emails, keep it tight.
- [ ] Set up GitHub branch protection on `main`: require PR review,
      require status checks to pass.

## Observability

Worth adding once you have real customer traffic:

- **Error tracking**: [Sentry](https://sentry.io) free tier gets you
  5,000 events/month, covers both FastAPI (via `sentry-sdk[fastapi]`) and
  Next.js (via `@sentry/nextjs`). 30-minute setup.
- **Uptime monitoring**: Better Stack (see cold-start section above).
- **Business dashboards**: once Phase 4B GraphQL layer lands, a simple
  Metabase/Retool/Supabase-native dashboard against the `events` +
  `campaigns` + `customers` tables gives staff useful daily visibility
  (email open rates, top-searched part numbers, etc.).

## Rough cost projection (monthly)

On cutover day with the above recommendations:

| Service | Plan | Monthly |
|---|---|---|
| Vercel | Hobby (frontend) | $0 |
| Render (prod) | Starter | $7 |
| Render (staging) | Free | $0 |
| Supabase (prod) | Free → Pro once >500MB | $0 → $25 |
| Supabase (staging) | Free | $0 |
| Resend | Free (3k/mo) → Pro ($20) once >3k | $0 → $20 |
| Make | Free (1k ops/mo) | $0 |
| Better Stack | Free | $0 |
| **Total** | | **$7 → $52** |

The jump to ~$52/month happens only when you actually outgrow free tiers,
which for Titan Imaging's volume is likely 12+ months out.
