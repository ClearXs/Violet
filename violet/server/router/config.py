from typing import Any, Dict
from fastapi import APIRouter, Depends
import yaml

from violet.config import VioletConfig
from violet.schemas.embedding_config import EmbeddingConfig
from violet.schemas.llm_config import LLMConfig
from violet.server.context import get_tts_pipeline, get_whisper_handler
from violet.voice.TTS_infer_pack.TTS import TTS
from violet.voice.whisper.whisper import Whisper
from violet.schemas.whisper_config import WhisperConfig

router = APIRouter(prefix="/config", tags=['config'])

config = VioletConfig.get_config()


@router.get('/llm')
async def get_llm_config():
    llm_config = config.get_llm_config()
    return llm_config


@router.put('/llm')
async def update_llm_config(llm_config: LLMConfig):
    previous_llm_config = VioletConfig.get_llm_config()
    config_path = config.config_path

    with open(config_path, 'w') as f:
        yaml.safe_dump(
            llm_config.model_dump(),
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    if previous_llm_config.model != llm_config.model:
        from violet.local_llm import uninstall_model, load_model

        uninstall_model(previous_llm_config)

        load_model(llm_config)

    return True


@router.get('/embedding')
async def get_embedding_config():
    embedding_config = config.get_embedding_config()

    return embedding_config


@router.put('/embedding')
async def update_embedding_config(embedding_config: EmbeddingConfig):
    previous_emb_config = VioletConfig.get_embedding_config()
    embedding_config_path = config.embedding_config_path

    with open(embedding_config_path, 'w') as f:
        yaml.safe_dump(
            embedding_config.model_dump(),
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    if previous_emb_config.embedding_model != embedding_config.embedding_model:
        from violet.local_llm import uninstall_embedding_model, load_embedding_model

        uninstall_embedding_model(previous_emb_config)

        # load embedding model if model type is llama etc..
        load_embedding_model(embedding_config)

    return True


@router.get("/tts")
async def get_tts_config():
    tts_config_path = config.tts_config_path

    with open(tts_config_path, 'r') as f:
        tts_config = yaml.safe_load(f)

    return tts_config


@router.put("/tts")
async def update_tts_config(tts_config: Dict[str, Any],
                            tts_pipeline: TTS = Depends(get_tts_pipeline)):
    previous_tts_config = VioletConfig.get_tts_config()

    tts_config_path = config.tts_config_path

    with open(tts_config_path, 'w') as f:
        yaml.safe_dump(
            tts_config,
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    new_tts_config = VioletConfig.get_tts_config()

    if previous_tts_config.t2s_weights_path != new_tts_config.t2s_weights_path:
        tts_pipeline.init_t2s_weights(new_tts_config.t2s_weights_path)

    if previous_tts_config.vits_weights_path != new_tts_config.vits_weights_path:
        tts_pipeline.init_vits_weights(new_tts_config.vits_weights_path)

    return True


@router.get('/whisper')
async def get_whisper_config():
    whisper_config = VioletConfig.get_whisper_config()

    return whisper_config


@router.put('/whisper')
async def update_whisper_config(whisper_config: WhisperConfig,
                                whisper_handler: Whisper = Depends(get_whisper_handler)):
    previous_whisper_config = VioletConfig.get_whisper_config()
    whisper_config_path = config.whisper_config_path

    with open(whisper_config_path, 'w') as f:
        yaml.safe_dump(
            whisper_config.model_dump(),
            f,
            allow_unicode=True,
            indent=2,
            sort_keys=True
        )

    if previous_whisper_config.model != whisper_config.model:
        whisper_handler.set_whisper_model(whisper_config)

    return True
