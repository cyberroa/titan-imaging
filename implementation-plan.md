# Titan Imaging Website — Implementation Plan

> **Repo:** `cyberroa/titan-imaging` (GitHub). **Vercel:** set **Root Directory** to `frontend` for deploys.  
> **Branch workflow:** Use feature branches for new work; merge to `main` (production on Vercel).  
> **Stack:** Vercel (frontend) · Supabase (DB + Auth + Storage) · Render (FastAPI backend) · **Calendly** (bookings today) · **Cal.com** (optional later; see Phase 3)

**Status:** **Phase 1 complete** — Next.js public site on Vercel. **Phase 2 complete** — FastAPI on Render, Postgres (Supabase), public API, inventory + forms wired; `NEXT_PUBLIC_API_URL` on Vercel. **Phase 3 not started** — admin auth, CRM, bookings, Cal.com.

---
## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Phase 1: Foundation & Frontend](#phase-1-foundation--frontend)
4. [Phase 2: Backend & Core Features](#phase-2-backend--core-features)
5. [Phase 3: Admin & Advanced](#phase-3-admin--advanced)
6. [Database Schema](#database-schema)
7. [Deployment Architecture](#deployment-architecture)
8. [Pre-Implementation Checklist](#pre-implementation-checklist)
---
## Technology Stack
| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | Next.js 15 (App Router) | TypeScript, Tailwind CSS; deploy to Vercel |
| **Backend** | FastAPI (Python) | Deploy to Render; JWT validation for admin routes |
| **Database** | Supabase (PostgreSQL) | Includes Auth + Storage; migrations via Alembic |
| **Auth** | Supabase Auth + FastAPI | Supabase issues JWTs; FastAPI validates with PyJWT |
| **Storage** | Supabase Storage | Part images; optional S3 migration later |
| **Bookings** | Calendly (now) · Cal.com (planned) | Inline iframe on `/book` and Contact; Phase 3: webhooks + DB sync |
| **Hosting** | Vercel (frontend), Render (API) | No static export needed; full Next.js features |
---
## Project Structure (current)
```
titan-imaging/
├── frontend/                    # Next.js 15 — Vercel root directory
│   ├── app/
│   │   ├── (public)/             # Home, About, Services, Contact, Sell, Book, Inventory, Insights, Testimonials
│   │   └── layout.tsx
│   ├── components/              # Header, Footer, CalendlyEmbed, InventoryBrowser, HomeSearch, seo/, …
│   ├── lib/
│   │   ├── site.ts             # Site URL / canonical helpers
│   │   ├── images.ts           # Central image paths
│   │   ├── calendly.ts         # Calendly embed URL + iframe src helper
│   │   ├── nav.ts              # Nav links
│   │   ├── api.ts              # API client; base URL from NEXT_PUBLIC_API_URL
│   │   ├── inventory-mock.ts   # Legacy mock (optional); inventory page uses API
│   │   └── services-data.ts
│   ├── public/images/          # Static assets (logo, banners, etc.)
│   └── package.json
├── backend/                     # FastAPI — Render (rootDir backend); Alembic, app/, scripts/
├── render.yaml                  # Render Blueprint (Web Service + env placeholders)
├── legacy/static-site/         # Previous static HTML (reference)
└── implementation-plan.md
```
---
## Phase 1: Foundation & Frontend — **complete**
**Goal:** Next.js app with design system and all public pages. No backend yet.  
**Duration:** 1–2 weeks (shipped)

### 1.1 Project Setup
- [x] Create Next.js 15 project with App Router, TypeScript, Tailwind CSS
- [x] Configure `next.config` for Vercel (no `output: 'export'`)
- [x] ESLint (Next.js defaults) + **Prettier** (`npm run format` / `format:check`; `eslint-config-prettier` avoids rule clashes)
- [x] Logo and banners under `frontend/public/images/`

### 1.2 Design System
- [x] Tailwind tokens in `tailwind.config.ts` + CSS variables in `globals.css` (dark theme; background `#000000` base, raised/card/muted grays, accent + titanium, text primary/secondary/muted)
- [x] Typography: **Orbitron** (display / logo), **Inter** (body) via `next/font/google`

### 1.3 Layout Components
- [x] **Header:** Logo → home; nav includes Inventory, Contact, Book, Sell to Us, Services, About, Industry Insight, Testimonials
- [x] **Footer:** Copyright line (e.g. © 2026 TITAN IMAGING)
- [x] **Responsive nav:** Mobile menu (`md:hidden` toggle)
- [x] Logo: white on dark

### 1.4 Public Pages
| Page | Route | Notes |
|------|-------|--------|
| Home | `/` | Hero, tagline; search navigates to `/inventory` with `?q=` (API-backed inventory) |
| About | `/about` | Company content |
| Services | `/services` | Services content |
| Contact | `/contact` | Contact content + Calendly embed |
| Sell | `/sell` | Sell flow content |
| Testimonials | `/testimonials` | Testimonials |
| Book | `/book` | Hero + fade + **Calendly** iframe embed |
| Inventory | `/inventory` | Inventory browser via `GET /api/v1/parts` (see `InventoryBrowser`) |
| Industry Insight | `/insights` | Insights content |
| System | `/robots.txt`, `/sitemap.xml` | SEO helpers |

### 1.5 Enhancements (Optional)
- [ ] Service catalog with pricing placeholders (partial — Services page exists)
- [ ] Testimonials carousel (page exists; carousel optional)
- [x] Hover / transition polish on nav and controls (baseline in place)

### 1.6 Deliverables
- [x] Fully navigable Next.js site
- [x] Dark theme + branded assets
- [x] Logo in header
- [x] Public routes above + SEO metadata / JSON-LD baseline
- [x] **Deployed to Vercel** (Git integration on `main`; root directory `frontend`)
---
## Phase 2: Backend & Core Features — **complete** (shipped)
**Goal:** FastAPI backend, Supabase database, working parts search and contact form.
**Duration:** 2–3 weeks
### 2.1 Backend Setup
- [x] Create FastAPI project in `backend/`
- [x] Add `requirements.txt` (FastAPI, Uvicorn, SQLAlchemy, Alembic, `psycopg2-binary`, Pydantic, `email-validator`, `python-dotenv`, `httpx`). *JWT/admin auth deps (e.g. PyJWT) deferred to Phase 3.*
- [x] Configure CORS via `CORS_ORIGINS` (comma-separated origins; see Render env)
- [x] Health check: `GET /health`
- [x] Environment variables: **`DATABASE_URL`** (Postgres connection string to Supabase); optional **Resend** keys; **`SUPABASE_JWT_SECRET`** reserved for Phase 3 admin JWT validation (not required for public Phase 2 routes)
### 2.2 Database (Supabase)
- [x] Supabase project with Postgres; connection string used by SQLAlchemy (`DATABASE_URL`)
- [x] Alembic initialized; migration `backend/alembic/versions/20260413_0001_init.py`
- [x] **Shipped tables:** `categories`, `parts`, `contact_submissions`, `sell_submissions`
- [ ] **Deferred to Phase 3 / later:** `part_images`, `services`, `customers`, `sales` / `sale_items`, `bookings` (see [Database Schema](#database-schema))
- [x] `parts.search_vector` (`tsvector`) + GIN index in migration (search behavior in API may use ILIKE and/or vector later)
- [x] Seed script: `python -m app.scripts.seed` (also invoked from `backend/scripts/render_start.sh` on Render)
### 2.3 API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `GET /api/v1/parts` | GET | No | List parts; query params: `search`, `category`, `limit` |
| `GET /api/v1/parts/{id}` | GET | No | Part detail by ID |
| `GET /api/v1/categories` | GET | No | List categories |
| `POST /api/v1/contact` | POST | No | Submit contact form |
| `POST /api/v1/sell` | POST | No | Submit Sell To Us form |
### 2.4 Contact & Sell Forms (Backend)
- [x] `contact_submissions` table: name, email, subject, message, created_at
- [x] `sell_submissions` table: name, email, company, part_details, message, created_at
- [x] Validation with Pydantic
- [ ] **Resend** email to admin on new submissions — *optional; code path exists; enable when sending domain is verified in Resend*
### 2.5 Frontend Integration
- [x] API client in `frontend/lib/api.ts` (`NEXT_PUBLIC_API_URL`; defaults to `http://localhost:8000` in dev)
- [x] Home search navigates to `/inventory?q=…`; inventory loads parts via API
- [x] Inventory: part name, stock / status display
- [x] Contact form → `POST /api/v1/contact`
- [x] Sell To Us form → `POST /api/v1/sell`
- [x] Loading, error, and success UX on inventory and forms
### 2.6 Deploy Backend
- [x] FastAPI on Render (Blueprint `render.yaml`, `rootDir: backend`; free tier uses `scripts/render_start.sh` instead of `preDeployCommand`)
- [x] Vercel: `NEXT_PUBLIC_API_URL` set to Render service URL
### 2.7 Deliverables
- [x] FastAPI running on Render
- [x] Supabase Postgres with Phase 2 schema + seed data
- [x] Parts search end-to-end (Vercel → Render API → DB)
- [x] Contact and Sell To Us forms persist to DB
- [x] OpenAPI / docs: `https://<your-service>.onrender.com/docs`
---
## Phase 3: Admin & Advanced
**Goal:** Admin panel with auth, inventory management, sales, customers, bookings, calendar.
**Duration:** 3–4 weeks
### 3.1 Authentication
- [ ] Set up Supabase Auth: email/password for admin users
- [ ] Create admin user(s) in Supabase Auth
- [ ] Frontend: Supabase Auth client; login page at `/admin/login`
- [ ] FastAPI: JWT validation dependency using `SUPABASE_JWT_SECRET`
- [ ] Protected routes: require `Authorization: Bearer <token>`
### 3.2 Admin Layout & Guard
- [ ] Create `/admin` route group with layout
- [ ] Auth guard: redirect to `/admin/login` if not authenticated
- [ ] Admin nav: Dashboard, Parts, Categories, Customers, Sales, Bookings
### 3.3 Inventory Management
- [ ] **Parts List:** Table with search, filter by category, pagination
- [ ] **Add/Edit Part:** Form (part_number, name, description, category, stock, price, status)
- [ ] **Part Images:** Upload to Supabase Storage; display in form and list
- [ ] **Categories CRUD:** List, add, edit, delete categories
### 3.4 Customers & Sales
- [ ] **Customers:** CRUD in admin; fields: name, email, phone, address, company
- [ ] **Sales:** Create sale, add line items (parts/services), quantity, unit price; calculate total
- [ ] **Sales List:** Table with customer, total, status, date
### 3.5 Bookings (Cal.com — migrate from Calendly when ready)
- [ ] Create Cal.com account (optional if staying on Calendly + manual processes)
- [ ] Configure event types: "Installation Consultation", "Repair Estimate"
- [ ] Replace or supplement Calendly embed on `/book` (and Contact if desired)
- [ ] Webhook handler in FastAPI: `POST /api/v1/webhooks/calcom` to store bookings in DB
- [ ] `bookings` table: customer_id, cal_com_booking_id, scheduled_at, type, status
### 3.6 Admin Bookings & Calendar
- [ ] Bookings list in admin (from DB, synced via webhook)
- [ ] Interactive calendar (e.g. FullCalendar) showing bookings
### 3.7 Services Management
- [ ] Admin CRUD for services (name, description, base_price, duration_minutes)
- [ ] Public Services page: display services from API
### 3.8 Polish & SEO
- [ ] Testimonials admin (optional `testimonials` table)
- [ ] Micro-animations, improved form UX
- [ ] Meta tags, sitemap, structured data
- [ ] Accessibility: focus states, ARIA where needed
### 3.9 Optional Enhancements
- [ ] Role-based admin (admin vs staff)
- [ ] Audit log for admin actions
- [ ] CSV export for sales/customers
### 3.10 Deliverables
- Full admin panel with auth
- Parts and categories management with image upload
- Customers and sales management
- Cal.com integration with webhook sync
- Admin calendar view
- Production-ready site
---
## Database Schema
**Phase 2 (implemented in migrations):** `categories`, `parts`, `contact_submissions`, `sell_submissions`.  
**Phase 3+ (planned):** remaining tables below.
### Core Tables
| Table | Key Fields |
|-------|------------|
| `categories` | id, name, slug, created_at |
| `parts` | id, part_number, name, description, category_id, stock_quantity, price, status, search_vector (tsvector), created_at, updated_at |
| `part_images` | id, part_id, url, sort_order |
| `services` | id, name, description, base_price, duration_minutes, created_at |
| `customers` | id, name, email, phone, address, company, created_at |
| `contact_submissions` | id, name, email, subject, message, created_at |
| `sell_submissions` | id, name, email, company, part_details, message, created_at |
| `sales` | id, customer_id, status, total, created_at |
| `sale_items` | id, sale_id, part_id, service_id, quantity, unit_price |
| `bookings` | id, customer_id, cal_com_booking_id, scheduled_at, type, status, created_at |
| `testimonials` | id, author, company, quote, created_at (optional) |
### Auth
- Use Supabase Auth for `admin_users`; no separate `admin_users` table unless linking to custom roles.
- Store Supabase user ID in session; FastAPI validates JWT.
---
## Deployment Architecture
```
User
  │
  ├─► Vercel (Next.js) ─► Static + Server Components
  │
  └─► Render (FastAPI) ─► Supabase (PostgreSQL + Auth + Storage)
                         Cal.com webhooks (Phase 3); Calendly live today
```
### Environment Variables
**Frontend (Vercel):**
- *(optional)* `NEXT_PUBLIC_SITE_URL` — canonical site URL when using a custom domain (falls back to `VERCEL_URL` in code)
- *(Phase 2 — set in production)* **`NEXT_PUBLIC_API_URL`** — Render API base URL (no trailing slash)
- *(Phase 3+)* `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- *(Phase 3+)* `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public)
**Backend (Render) — Phase 2 as shipped:**
- **`DATABASE_URL`** — Postgres connection string (Supabase)
- **`CORS_ORIGINS`** — Allowed browser origins for the Next.js site
- *(optional)* **`RESEND_API_KEY`**, **`ADMIN_NOTIFY_EMAIL`**, **`EMAIL_FROM`** — outbound email
- **`APP_ENV`** — e.g. `production`
**Backend — Phase 3+ (admin / webhooks):**
- `SUPABASE_JWT_SECRET` (or JWKS) — validate Supabase-issued JWTs for `/admin` API routes
- `CALCOM_WEBHOOK_SECRET` — verify Cal.com webhooks
---
## Pre-Implementation Checklist
- [x] Repo / branches — work merged to `main`
- [x] Vercel project linked to GitHub; **Root Directory = `frontend`**; production deploys from `main`
- [x] Supabase project created; **`DATABASE_URL`** used by Render; JWT secret noted when starting Phase 3 admin auth
- [x] Render account; FastAPI Web Service deployed from repo (`render.yaml` / manual)
- [ ] Cal.com account *(optional; Phase 3 — Calendly in use for now)*
- [x] Logo and image assets in `frontend/public/images/`
---
## Summary Timeline
| Phase | Duration | Key Output |
|-------|----------|------------|
| **1. Foundation & Frontend** | 1–2 weeks | **Done** — Next.js site, design system, public pages, Vercel |
| **2. Backend & Core Features** | 2–3 weeks | **Done** — FastAPI on Render, Postgres, parts API, contact/sell, Vercel `NEXT_PUBLIC_API_URL` |
| **3. Admin & Advanced** | 3–4 weeks | Auth, admin CRUD, sales, customers, Cal.com, calendar *(not started)* |
**Total estimate:** 6–9 weeks for a single developer.