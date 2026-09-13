from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter

from app.auth import WorkbenchUser, get_current_workbench_user
from app.db import get_db
from app.graphql_schema import schema


async def get_context(
    db: Session = Depends(get_db),
    user: WorkbenchUser = Depends(get_current_workbench_user),
):
    return {"db": db, "user": user}


router = GraphQLRouter(
    schema,
    path="/graphql",
    context_getter=get_context,
    graphql_ide=None,
)
