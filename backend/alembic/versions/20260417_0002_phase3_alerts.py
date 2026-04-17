"""phase3 inventory alerts

Revision ID: 20260417_0002
Revises: 20260413_0001
Create Date: 2026-04-17

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260417_0002"
down_revision = "20260413_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "inventory_alert_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("part_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("parts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("query_text", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("unsubscribe_token", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_notified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_inventory_alert_subscriptions_email_part",
        "inventory_alert_subscriptions",
        ["email", "part_id"],
        unique=True,
    )
    op.create_index(
        "ix_inventory_alert_subscriptions_unsubscribe_token",
        "inventory_alert_subscriptions",
        ["unsubscribe_token"],
        unique=True,
    )
    op.create_index(
        "ix_inventory_alert_subscriptions_part_id",
        "inventory_alert_subscriptions",
        ["part_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_inventory_alert_subscriptions_part_id", table_name="inventory_alert_subscriptions")
    op.drop_index(
        "ix_inventory_alert_subscriptions_unsubscribe_token",
        table_name="inventory_alert_subscriptions",
    )
    op.drop_index(
        "ix_inventory_alert_subscriptions_email_part",
        table_name="inventory_alert_subscriptions",
    )
    op.drop_table("inventory_alert_subscriptions")
