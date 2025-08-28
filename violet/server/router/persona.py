from fastapi import APIRouter, Depends

from violet.server.context import get_server
from violet.server.server import SyncServer

router = APIRouter(prefix="/persona", tags=['persona'])


@router.get('/activate')
async def get_activate_persona(server: SyncServer = Depends(get_server)):
    personas = server.persona_manager.get_activated_persona()

    return personas


@router.get('/list')
async def list_personas(server: SyncServer = Depends(get_server)):
    return server.persona_manager.list_personas()


@router.get('/get_by_id/{id}')
async def get_persona_by_id(id: str, server: SyncServer = Depends(get_server)):
    persona = server.persona_manager.get_persona_by_id(id)
    return persona
