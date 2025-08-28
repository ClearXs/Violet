from fastapi import APIRouter, Depends, Query
from violet.log import get_logger
from violet.schemas.agent import AgentState
from violet.server.context import get_server
from violet.server.server import SyncServer

# These can be forward refs, but because Fastapi needs them at runtime the must be imported normally

router = APIRouter(prefix="/agents", tags=["agents"])

logger = get_logger(__name__)


@router.get("/", response_model=list[AgentState], operation_id="list_agents")
async def list_agents(
    tags: list[str] | None = Query(
        None, description="List of tags to filter agents by"),
    match_all_tags: bool = Query(
        False,
        description="If True, only returns agents that match ALL given tags. Otherwise, return agents that have ANY of the passed-in tags.",
    ),
    server: SyncServer = Depends(get_server),
    limit: int | None = Query(50, description="Limit for pagination"),
    query_text: str | None = Query(None, description="Search agents by name"),
):
    """
    List all agents associated with a given user.

    This endpoint retrieves a list of all agents and their configurations
    associated with the specified user ID.
    """

    # Retrieve the actor (user) details
    actor = server.user_manager.get_default_user()

    # Call list_agents directly without unnecessary dict handling
    return server.agent_manager.list_agents(
        actor=actor,
        limit=limit,
        query_text=query_text,
        tags=tags,
        match_all_tags=match_all_tags,
    )
