"""Workbench staff notification inbox

Revision ID: 20260912_0018
Revises: 20260911_0017
Create Date: 2026-09-12
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20260912_0018"
down_revision = "20260911_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "workbench_notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "staff_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workbench_staff.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("body", sa.Text(), nullable=False, server_default=""),
        sa.Column("href", sa.String(500), nullable=False, server_default="/workbench/analytics"),
        sa.Column("dedup_key", sa.String(200), nullable=False),
        sa.Column("payload", JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_workbench_notifications_staff_id", "workbench_notifications", ["staff_id"])
    op.create_index("ix_workbench_notifications_kind", "workbench_notifications", ["kind"])
    op.create_unique_constraint(
        "uq_workbench_notifications_staff_dedup",
        "workbench_notifications",
        ["staff_id", "dedup_key"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_workbench_notifications_staff_dedup", "workbench_notifications", type_="unique")
    op.drop_index("ix_workbench_notifications_kind", table_name="workbench_notifications")
    op.drop_index("ix_workbench_notifications_staff_id", table_name="workbench_notifications")
    op.drop_table("workbench_notifications")
