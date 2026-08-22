"""enable RLS and revoke PostgREST access

Revision ID: 20260822_0001
Revises: 20260418_0001
Create Date: 2026-08-22

Titan Imaging does not use Supabase PostgREST for app data — FastAPI
talks to Postgres via DATABASE_URL (table owner / bypasses RLS).
The frontend only uses Supabase Auth.

Without RLS, the public anon key can read/write every table via
https://<project>.supabase.co/rest/v1/*. Enable RLS with no policies
(deny by default for anon/authenticated) and revoke table privileges
from those roles for defense in depth.

Do NOT FORCE ROW LEVEL SECURITY — that would break the owner connection
used by the API.
"""

from __future__ import annotations

from alembic import op

revision = "20260822_0001"
down_revision = "20260418_0001"
branch_labels = None
depends_on = None

# All public app tables + alembic_version (also flagged by Supabase Advisor).
TABLES = (
    "alembic_version",
    "categories",
    "parts",
    "contact_submissions",
    "sell_submissions",
    "inventory_alert_subscriptions",
    "customers",
    "segments",
    "templates",
    "campaigns",
    "campaign_recipients",
    "unsubscribes",
    "sessions",
    "events",
    "social_posts",
)


def upgrade() -> None:
    for table in TABLES:
        op.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY')
        # No policies → anon/authenticated get zero rows via PostgREST.
        # Revoke privileges so even policy mistakes can't expose data.
        op.execute(f'REVOKE ALL ON TABLE public."{table}" FROM anon, authenticated')


def downgrade() -> None:
    for table in TABLES:
        op.execute(f'GRANT ALL ON TABLE public."{table}" TO anon, authenticated')
        op.execute(f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY')
