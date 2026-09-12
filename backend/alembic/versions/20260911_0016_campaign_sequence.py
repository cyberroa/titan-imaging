"""Mail-only sending domains and campaign sequence columns

Revision ID: 20260911_0016
Revises: 20260907_0015
Create Date: 2026-09-11
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "20260911_0016"
down_revision = "20260907_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mail_domains",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("hostname", sa.String(255), nullable=False, unique=True),
        sa.Column("from_email", sa.String(320), nullable=False),
        sa.Column("resend_domain_id", sa.String(120), nullable=True),
        sa.Column("daily_cap", sa.Integer(), nullable=False, server_default="80"),
        sa.Column("warmup_stage", sa.String(24), nullable=False, server_default="new"),
        sa.Column("sent_today", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_sent_date", sa.Date(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.add_column("campaigns", sa.Column("mail_domain_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_campaigns_mail_domain_id",
        "campaigns",
        "mail_domains",
        ["mail_domain_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.add_column("campaigns", sa.Column("previewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("campaigns", sa.Column("sequence_started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("campaigns", sa.Column("sequence_ends_on", sa.Date(), nullable=True))
    op.add_column("campaigns", sa.Column("daily_quota", sa.Integer(), nullable=True))
    op.add_column(
        "campaign_recipients",
        sa.Column("scheduled_for", sa.Date(), nullable=True),
    )
    op.create_index("ix_campaign_recipients_scheduled_for", "campaign_recipients", ["scheduled_for"])


def downgrade() -> None:
    op.drop_index("ix_campaign_recipients_scheduled_for", table_name="campaign_recipients")
    op.drop_column("campaign_recipients", "scheduled_for")
    op.drop_column("campaigns", "daily_quota")
    op.drop_column("campaigns", "sequence_ends_on")
    op.drop_column("campaigns", "sequence_started_at")
    op.drop_column("campaigns", "previewed_at")
    op.drop_constraint("fk_campaigns_mail_domain_id", "campaigns", type_="foreignkey")
    op.drop_column("campaigns", "mail_domain_id")
    op.drop_table("mail_domains")
