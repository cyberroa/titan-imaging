# Transferring the Vercel project between accounts

When to do this: you need to move the Vercel project from one personal
(Hobby) account to another — for example, if the sole deployer changes, or
if the project was originally set up on someone else's account.

Estimated time: **~5 minutes** end-to-end, no production downtime.

## When you need this

The primary scenario: Vercel's **Hobby (free) plan is single-user and
non-commercial**. If the GitHub repo is private and commits come from
anyone other than the Vercel account owner, Vercel blocks the deploy with:

> `<committer>` is attempting to deploy a commit to `<team>`'s projects
> team on Vercel, but is not a member of this team.

**Ways out of that state:**

| Approach | Cost | When to use |
|---|---|---|
| Transfer project to whoever actually pushes code (this doc) | Free | Solo-deployer setup |
| Keep repo public | Free | Pre-cutover demo only; see caveats below |
| Upgrade to Vercel Pro | $20/user/mo | Multi-person deploys; **required for commercial use at cutover** — see [`production-cutover.md`](production-cutover.md) |

## The "keep repo public" workaround (non-permanent)

Vercel allows deploys from any commit author on public repos, regardless
of the Hobby plan's single-user rule. So flipping the repo back to public
unblocks deploys without any transfer or upgrade.

**Caveats of staying public:**

- Anyone can read the code (including customers, competitors).
- Environment variable **values** are never exposed (they live in Render /
  Vercel, not in git), but **variable names** and the shape of the app are.
- Commits and branches are indexable by search engines and code-scraping
  LLMs.
- GHAS-style secret scanning with push protection is free on public repos.
  So you get *more* free security tooling while public — silver lining.

**Before flipping public again, re-run the secret audit:**

```bash
cd ~/Documents/GitHub/titanimaging

git log --all --full-history -- "*.env*" "*.key" "*.pem" ".env.local"

git log --all -p | grep -iE "(RESEND_API_KEY=re_|whsec_|postgres:\/\/postgres\.|sbp_|eyJ[A-Za-z0-9_-]{20,})" | head -20
```

Both should return empty. If either surfaces a real-looking secret,
**rotate that credential** (in Resend / Supabase / Render) before making
the repo public again. Never rely on "nobody noticed" — automated scrapers
hit new public repos within minutes.

**Plan to revisit:**

- Flip repo private the day before domain cutover.
- Simultaneously do the transfer (this doc) OR upgrade to Vercel Pro.

## Transfer prerequisites

### 1. The receiving Vercel account exists

If the new deployer doesn't have a Vercel account yet:

1. Open [vercel.com](https://vercel.com) in an incognito window.
2. **Sign Up → Continue with GitHub**.
3. Authorize with the GitHub account that will be pushing code to the
   titanimaging repo.
4. When prompted, install the Vercel GitHub App on the titanimaging repo.
5. Stay on the free Hobby plan for now — Pro can be added later at
   cutover.

### 2. Note the current external references

The current auto-assigned `*.vercel.app` URL will change after transfer.
Before transferring, list every place that references the old URL so you
know what to update in Part 5 below:

- `PUBLIC_SITE_URL` on Render
- `CORS_ORIGINS` on Render
- Supabase → Auth → URL Configuration (Site URL + Redirect URLs)
- Google Cloud Console → OAuth 2.0 client → Authorized origins + redirect URIs
- Any `NEXT_PUBLIC_SITE_URL` set on Vercel itself

If the project already uses a real custom domain
(`titanimagingservice.com`), that stays attached through the transfer —
only the auto-assigned `*.vercel.app` URL changes.

## What transfers (and what doesn't)

**Transfers automatically:**

- GitHub repo connection
- Environment variables (production, preview, development) with values intact
- Deployment history and logs
- Custom domains attached to the project
- Serverless function configuration

**Does NOT transfer:**

- Vercel-registered domain **ownership** (only relevant if a domain was
  registered through Vercel's registrar; `titanimagingservice.com` is
  externally registered so this does not apply here)
- Team-level analytics data (resets to zero)
- Vercel Marketplace integrations (need re-authorization on the receiving
  side)
- The auto-assigned `*.vercel.app` URL namespace (changes)

## Transfer procedure

### Part 1 — Current owner initiates the transfer

On the **current** Vercel account:

1. Vercel dashboard → select the Titan Imaging project.
2. **Settings** tab (top of project page).
3. Scroll to bottom → **Advanced** section.
4. Click **Transfer Project**.
5. Enter the receiving account's Vercel username or email.
6. Confirm. An email + in-app notification is sent to the receiver.

### Part 2 — Receiver accepts

On the **receiving** Vercel account:

1. Check email or Vercel notification tray.
2. Click **Accept Transfer**.
3. Project appears under the receiver's account within a few seconds.

There is a 30–60 second window where deployments are paused. Existing
production traffic continues to hit the cached build; no visitor-facing
downtime.

### Part 3 — Verify state post-transfer

On the **receiver's** dashboard:

1. **Deployments** tab → confirm build history is visible.
2. **Settings → Environment Variables** → spot-check each variable has
   a value (values don't display by default; click the eye icon on one or
   two to confirm).
3. **Settings → Domains** → confirm custom domains are still attached and
   DNS is resolving.
4. **Settings → Git** → confirm the titanimaging GitHub repo is linked
   and the production branch is correct.

### Part 4 — Trigger a fresh deploy to confirm

Push an empty commit to trigger a build authored by the new owner:

```bash
git checkout prod        # or whichever branch Vercel tracks
git pull
git commit --allow-empty -m "chore: verify vercel deploy post-transfer"
git push
```

Watch the Vercel dashboard. Expect a green deploy within 2–3 minutes. If
it fails with the "not a member of this team" error again, the transfer
didn't complete — check Part 2 for a pending acceptance notification.

### Part 5 — Update external references

Only applies to references to the **auto-assigned** `*.vercel.app` URL,
not to custom domains.

For each location noted in Prerequisites #2, swap the old URL for the new
one (or, better: swap to `https://titanimagingservice.com` if the custom
domain is live, since that never changes):

- **Render** → your backend service → Environment:
  - `PUBLIC_SITE_URL=https://<new-vercel-url-or-custom-domain>`
  - `CORS_ORIGINS=https://<new-vercel-url-or-custom-domain>,http://localhost:3000`
- **Supabase** → Auth → URL Configuration:
  - Site URL: `https://<new-url>`
  - Redirect URLs: add `https://<new-url>/**`; leave the old one in place
    for a day or two in case anyone has stale tabs
- **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 client:
  - Authorized JavaScript origins: add the new URL
  - Authorized redirect URIs: add `https://<supabase-ref>.supabase.co/auth/v1/callback`
    (unchanged from before — the Supabase callback URL doesn't change)

Save each one. Render auto-redeploys; Supabase and Google apply instantly.

### Part 6 — Clean up the old account (optional)

Once everything works on the new account for ~24 hours:

- Old Vercel account: remove the titanimaging project reference from
  recent projects (no-op — it's already moved) and remove the repo from
  the Vercel GitHub App's authorized list if the old owner doesn't need
  it.
- Update any bookmarks pointing at the old `*.vercel.app` URL.

## Rollback

If something breaks during or right after the transfer and you need to
revert:

1. Receiver initiates a transfer **back** (Settings → Advanced → Transfer
   Project → enter original owner's username).
2. Original owner accepts.
3. Update the external references back to the original URL.

No data is lost in either direction.

## Common failure modes

**"User not found" when entering the receiver's username.**
The receiver hasn't created a Vercel account yet, or the username is
mistyped. Have them run through Prerequisites #1 and try again.

**Transfer stalls — no acceptance notification on the receiving side.**
Check spam folder. Check the correct Vercel account (if the receiver has
multiple Vercel accounts from different GitHub identities). The transfer
link in the email works even if the notification tray doesn't show it.

**After accepting, first deploy still fails with the old error.**
Give it 60 seconds and retry. If it persists, check Vercel → project →
Settings → General → confirm the project owner listed matches the
receiving account, not the sender. If it still shows the sender, the
acceptance didn't register.

**Environment variables appear empty after transfer.**
Rare but has happened historically with Vercel. Spot-check by clicking the
eye icon on one variable. If values are truly missing, restore from your
local `.env.local` (or from the pre-transfer export you took — see next
section).

## Precaution — export env vars before transfer

Strictly speaking unnecessary, but cheap insurance:

```bash
npm i -g vercel
vercel login
vercel link                              # link to the project on the current account
vercel env pull .env.vercel-backup       # dumps all env vars to a local file
```

Keep `.env.vercel-backup` out of git (it's already ignored via the
`.env*` patterns in `.gitignore`). Delete it once the transfer is
confirmed successful.

## Relationship to the production cutover

This transfer doc is a **tactical workaround** for Hobby's single-user
limit. It is **not** a substitute for upgrading to Vercel Pro at cutover.

See [`production-cutover.md`](production-cutover.md) for why Pro is
required once Titan Imaging serves real customers:

- Vercel Hobby TOS prohibits commercial use.
- Two-person deploy access is needed for business continuity.
- Password-protected preview URLs require Pro.
- Build time limits (45 min vs 12 min) matter as the codebase grows.

The sequence at cutover is:

1. Upgrade the receiving Vercel account from Hobby → Pro.
2. Invite the second person as a team member.
3. Both people can now deploy regardless of commit authorship.
4. Remove any transfer-related workarounds from notes.
