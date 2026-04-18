"""phase4a campaigns, engagement, social

Revision ID: 20260418_0001
Revises: 20260417_0002
Create Date: 2026-04-18

Creates the Phase 4A tables for customer data, email campaigns
(templates, segments, campaigns, campaign_recipients), suppression
list, engagement tracking (sessions, events), and outbound social
posts (LinkedIn via Make).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260418_0001"
down_revision = "20260417_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", postgresql.CITEXT(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=True),
        sa.Column("company", sa.String(length=200), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("role", sa.String(length=120), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("source", sa.String(length=80), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("consent_marketing", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("consent_source", sa.String(length=120), nullable=True),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_customers_email", "customers", ["email"], unique=True)
    op.create_index("ix_customers_company", "customers", ["company"], unique=False)
    op.create_index("ix_customers_source", "customers", ["source"], unique=False)

    op.create_table(
        "segments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "filter_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_segments_slug", "segments", ["slug"], unique=True)

    op.create_table(
        "templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("preheader", sa.String(length=255), nullable=True),
        sa.Column("body_md", sa.Text(), nullable=False, server_default=""),
        sa.Column("body_html", sa.Text(), nullable=True),
        sa.Column("from_name", sa.String(length=120), nullable=True),
        sa.Column("reply_to", sa.String(length=320), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_templates_slug", "templates", ["slug"], unique=True)

    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column(
            "template_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("templates.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "segment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("segments.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="draft"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "stats_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_by", sa.String(length=320), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_campaigns_status", "campaigns", ["status"], unique=False)
    op.create_index("ix_campaigns_scheduled_at", "campaigns", ["scheduled_at"], unique=False)

    op.create_table(
        "campaign_recipients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "campaign_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("customers.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("email", postgresql.CITEXT(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="queued"),
        sa.Column("resend_message_id", sa.String(length=120), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("bounced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("complained_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("unsubscribed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_campaign_recipients_campaign_email",
        "campaign_recipients",
        ["campaign_id", "email"],
        unique=True,
    )
    op.create_index(
        "ix_campaign_recipients_resend_message_id",
        "campaign_recipients",
        ["resend_message_id"],
        unique=False,
    )
    op.create_index(
        "ix_campaign_recipients_customer_id",
        "campaign_recipients",
        ["customer_id"],
        unique=False,
    )

    op.create_table(
        "unsubscribes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", postgresql.CITEXT(), nullable=False),
        sa.Column("reason", sa.String(length=120), nullable=True),
        sa.Column("source", sa.String(length=80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_unsubscribes_email", "unsubscribes", ["email"], unique=True)

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("cookie_id", sa.String(length=64), nullable=False),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("customers.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("referrer", sa.Text(), nullable=True),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_sessions_cookie_id", "sessions", ["cookie_id"], unique=True)
    op.create_index("ix_sessions_customer_id", "sessions", ["customer_id"], unique=False)

    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sessions.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("customers.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("type", sa.String(length=80), nullable=False),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_events_type_occurred_at", "events", ["type", "occurred_at"], unique=False)
    op.create_index("ix_events_customer_id", "events", ["customer_id"], unique=False)
    op.create_index("ix_events_session_id", "events", ["session_id"], unique=False)

    op.create_table(
        "social_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False, server_default="linkedin"),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("link_url", sa.Text(), nullable=True),
        sa.Column("first_comment", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="queued"),
        sa.Column("external_id", sa.String(length=200), nullable=True),
        sa.Column(
            "response_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=320), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_social_posts_status", "social_posts", ["status"], unique=False)
    op.create_index("ix_social_posts_channel", "social_posts", ["channel"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_social_posts_channel", table_name="social_posts")
    op.drop_index("ix_social_posts_status", table_name="social_posts")
    op.drop_table("social_posts")

    op.drop_index("ix_events_session_id", table_name="events")
    op.drop_index("ix_events_customer_id", table_name="events")
    op.drop_index("ix_events_type_occurred_at", table_name="events")
    op.drop_table("events")

    op.drop_index("ix_sessions_customer_id", table_name="sessions")
    op.drop_index("ix_sessions_cookie_id", table_name="sessions")
    op.drop_table("sessions")

    op.drop_index("ix_unsubscribes_email", table_name="unsubscribes")
    op.drop_table("unsubscribes")

    op.drop_index("ix_campaign_recipients_customer_id", table_name="campaign_recipients")
    op.drop_index(
        "ix_campaign_recipients_resend_message_id",
        table_name="campaign_recipients",
    )
    op.drop_index(
        "ix_campaign_recipients_campaign_email",
        table_name="campaign_recipients",
    )
    op.drop_table("campaign_recipients")

    op.drop_index("ix_campaigns_scheduled_at", table_name="campaigns")
    op.drop_index("ix_campaigns_status", table_name="campaigns")
    op.drop_table("campaigns")

    op.drop_index("ix_templates_slug", table_name="templates")
    op.drop_table("templates")

    op.drop_index("ix_segments_slug", table_name="segments")
    op.drop_table("segments")

    op.drop_index("ix_customers_source", table_name="customers")
    op.drop_index("ix_customers_company", table_name="customers")
    op.drop_index("ix_customers_email", table_name="customers")
    op.drop_table("customers")
