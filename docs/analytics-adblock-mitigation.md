# Analytics / ad-blocker mitigation

> **Status:** Option A (accept loss) in effect today. Plan to migrate to
> Option B before the verified-domain launch, and to Option C once the
> site has paid advertising traffic or crosses ~1k visitors/day.

## Context

Our Phase 4A engagement tracking sends anonymous browser events to
`POST /api/v1/events` on the Render backend. Privacy-oriented browsers
and ad blockers (Brave Shields, uBlock Origin, AdGuard, Pi-hole, NextDNS,
EasyPrivacy-based extensions, etc.) block this request before it leaves
the browser because:

1. The path contains the word `events`, a well-known tracker heuristic
2. The request is cross-origin (Vercel frontend → Render backend)
3. The payload shape (JSON with a `cookie_id` field) matches fingerprints
   of known analytics SaaS

Discovered during Phase 4A smoke testing on 2026-04-19 — events silently
failed in Brave until Shields was disabled for the site. The backend
`try/catch` in `track.ts` swallows the failure so the user never sees
an error; requests just vanish.

## Impact estimate

Rough industry numbers for a B2B professional audience:

| Browser / extension | Approx share of visitors | Blocks our current setup |
|---|---|---|
| Brave with Shields default | ~1-3% | Yes |
| Chrome/Edge with uBlock Origin | ~8-15% | Yes (EasyPrivacy list) |
| Firefox with Enhanced Tracking Protection | ~3-5% | Partially (strict mode only) |
| Safari with Intelligent Tracking Prevention | ~18% of all traffic | Cookie persistence degraded, not blocked |
| Network-level blocking (Pi-hole, NextDNS) | 1-3% | Yes |
| Everything else | Remainder | Tracked normally |

Total engagement-data loss on our current setup: expect **10-20%** of real
visitors silently untracked. For Titan's low-volume B2B audience
(thousands of hospitals and biomed buyers, not millions of consumers),
the absolute numbers are small and the signal-to-noise ratio of what does
come through is still very usable.

## Options considered

### Option A — Accept the loss, document it

Do nothing in code. Acknowledge the gap in our privacy policy and
internal documentation. Rely on the ~80%+ of visitors who do get
tracked for signal.

**Effort:** 1 minute (write a sentence in `docs/privacy.md`).

**Coverage recovered:** 0%.

**When to use:** during early stages where traffic is low and missing
data doesn't materially change decisions. Appropriate for Titan today
while we're still validating Phase 4A operationally.

### Option B — Rename the endpoint path to a non-tracker-looking name

Change `/api/v1/events` to something that doesn't match blocklist path
heuristics. Reasonable candidates:

- `/api/v1/activity`
- `/api/v1/session-log`
- `/api/v1/pulse`
- `/api/v1/ingest`

Also worth renaming the Supabase `events` table to match (or leave the
table and only rename the API route — the frontend doesn't see the
table name).

**Effort:** ~15 min.

- Update `backend/app/api/v1/routes/events_public.py` — rename route
- Update `backend/app/api/v1/router.py` if the path is registered there
- Update `frontend/lib/track.ts` — change the endpoint constant
- Optional: rename `events` table via Alembic migration (and update all
  backend queries that reference it, plus the Resend webhook handler
  that writes `email.sent`/`email.delivered` rows into the same table)
- If keeping the table, keep the `event_type` values like `page_view`
  unchanged — that's the field we query on

**Coverage recovered:** ~50-60% of what Option A loses. EasyPrivacy
path-based rules won't match. Deep-inspection blockers that look at
payload structure and Origin+Referer combos (uBlock Origin in medium
mode, some Brave heuristics) may still block. Estimate this gets us
to ~90% of real visitors tracked vs ~80% today.

**When to use:** cheap intermediate step before committing to Option C.
Good fit for the window between Phase 4A launch and having real paid
traffic. **This is Titan's planned next step.**

### Option C — First-party proxy through Vercel (gold standard)

Make tracking requests hit the Vercel domain directly (same-origin),
then have Next.js rewrite or proxy them server-side to Render. The
browser never sees a cross-origin request, so shields and ad blockers
don't flag them at all.

**Flow:**

1. `track.ts` calls `POST /api/t` (same-origin, relative URL)
2. `next.config.js` has a `rewrites` rule: `/api/t` →
   `https://titan-imaging-api.onrender.com/api/v1/activity`
   (or whatever we renamed it to in Option B)
3. Browser sees only same-origin first-party requests — no shields or
   adblock rules trip
4. Render backend handles the actual ingest unchanged

**Effort:** ~45 min.

- Add `rewrites()` entry in `frontend/next.config.js`
- Update `frontend/lib/track.ts` to use the same-origin relative path
- Update `backend/app/api/v1/routes/events_public.py` CORS-sensitive
  details (Origin header will differ)
- Verify rewrite latency is acceptable (Vercel Edge Network adds
  ~10-50 ms on top of the Render call)
- Monitor Vercel serverless invocations budget — tracking can burn
  through free-tier limits fast on high-traffic sites

**Coverage recovered:** ~95%+ of real visitors tracked. Only network-
level blockers (Pi-hole, NextDNS) that block by domain can still
filter, and even then only if they've specifically flagged the Vercel
domain — which they won't, since Vercel is a general-purpose platform.

**Trade-offs:**

- Tracking calls count against Vercel Hobby's 1M invocations/month
  (plenty for Titan today, but scales with traffic)
- Cold starts on Vercel serverless functions can delay tracking by up
  to ~300 ms (negligible — tracking is async anyway)
- Requires the Option B rename to have happened first for a clean path
  on the backend side

**When to use:** once Titan has meaningful advertising traffic, paying
customers, or general-public awareness driving visitors. **Plan: flip
to this after the verified-domain cutover and the first real outbound
campaign demonstrates traffic.**

## Decision

| Horizon | Plan |
|---|---|
| Today (while finishing Phase 4A) | Option A — accept the loss, document it |
| Before Phase 4B Sprint 1 ships | Option B — rename path to avoid blocklist matches |
| After first real customer traffic | Option C — first-party Vercel proxy for full recovery |

## When to revisit

- When engagement metrics consistently feel "under-reported" vs known
  customer activity (e.g. your uncle says "I know this customer was on
  the site for an hour yesterday" but the events table shows 3 rows)
- When Vercel analytics shows significantly more pageviews than our
  `events` table records
- When a paid ad campaign drives measurable traffic and we want
  attribution accuracy

## Cross-references

- Route implementation: `backend/app/api/v1/routes/events_public.py`
- Tracking client: `frontend/lib/track.ts`
- Consent banner: `frontend/components/ConsentBanner.tsx`
- Privacy notice: `docs/privacy.md`
- Phase 4A production cutover checklist: `docs/production-cutover.md`
