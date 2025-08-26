import os
from typing import Any, Dict
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import yaml

from violet.config import VioletConfig
from violet.schemas.embedding_config import EmbeddingConfig
from violet.schemas.llm_config import LLMConfig

router = APIRouter(prefix="/config", tags=['config'])

config = VioletConfig.get_config()


@router.get('/llm')
async def get_llm_config():
    llm_config = config.get_llm_config()
    return JSONResponse(status_code=200, content={"data": llm_config, "code": 200})


@router.put('/llm')
async def update_llm_config(llm_config: LLMConfig):

    config_path = config.config_path

    with open(config_path, 'w') as f:
        yaml.safe_dump(
            llm_config.to_dict(),
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    # TODO reload llm model

    return JSONResponse(status_code=200, content={"code": 200, "data": True})


@router.get('/embedding')
async def get_embedding_config():
    embedding_config = config.get_embedding_config()

    return JSONResponse(status_code=200, content={"data": embedding_config, "code": 200})


@router.put('/embedding')
async def update_embedding_config(embedding_config: EmbeddingConfig):
    embedding_config_path = config.embedding_config_path

    with open(embedding_config_path, 'w') as f:
        yaml.safe_dump(
            embedding_config.to_dict(),
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    # TODO reload embedding model

    return JSONResponse(status_code=200, content={"code": 200, "data": True})


@router.get("/tts")
async def get_tts_config():
    tts_config_path = config.tts_config_path

    with open(tts_config_path, 'r') as f:
        tts_config = yaml.safe_load(f)

    return JSONResponse(status_code=200, content={"data": tts_config, "code": 200})


@router.put("/tts")
async def update_tts_config(tts_config: Dict[str, Any]):
    tts_config_path = config.tts_config_path

    with open(tts_config_path, 'w') as f:
        yaml.safe_dump(
            tts_config,
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    # TODO reload tts model

    return JSONResponse(status_code=200, content={"code": 200, "data": True})
