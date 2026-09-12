"""Studio gold eval cases

Revision ID: 20260911_0017
Revises: 20260911_0016
Create Date: 2026-09-11
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "20260911_0017"
down_revision = "20260911_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_eval_cases",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("run_id", UUID(as_uuid=True), sa.ForeignKey("ai_studio_runs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("task", sa.String(24), nullable=False, server_default="email"),
        sa.Column("eval_split", sa.String(16), nullable=False, server_default="dev"),
        sa.Column("system_prompt", sa.Text(), nullable=False, server_default=""),
        sa.Column("user_prompt", sa.Text(), nullable=False, server_default=""),
        sa.Column("context_json", JSONB(), nullable=False, server_default="{}"),
        sa.Column("gold_output", sa.Text(), nullable=False),
        sa.Column("created_by", sa.String(320), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ai_eval_cases_split", "ai_eval_cases", ["eval_split"])


def downgrade() -> None:
    op.drop_index("ix_ai_eval_cases_split", table_name="ai_eval_cases")
    op.drop_table("ai_eval_cases")
