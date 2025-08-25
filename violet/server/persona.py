from fastapi import APIRouter
from fastapi.responses import JSONResponse

from violet.services.persona_manager import PersonaManager

router = APIRouter(prefix="/persona", tags=['persona'])

persona_manager = PersonaManager()


@router.get('/activate')
async def get_activate_persona():
    personas = persona_manager.personas

    return JSONResponse(status_code=200, content={"data": personas.model_dump_json() if personas is not None else None})
