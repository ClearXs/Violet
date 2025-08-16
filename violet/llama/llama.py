from pathlib import Path
from typing import Optional
from llama_cpp import Llama

from violet.config import VioletConfig
from violet.log import get_logger
from llama_cpp.llama_chat_format import MiniCPMv26ChatHandler, Qwen25VLChatHandler

from violet.utils import log_telemetry

logger = get_logger(__name__)

config = VioletConfig.load()

model_storage_path = Path(config.recall_storage_path) / 'models'

if model_storage_path.exists() is False:
    model_storage_path.mkdir(parents=True, exist_ok=True)

local_foundation_model = None
local_embeddings_model = None


def load_local_model(model: str,
                     path: str,
                     mmproj_path: Optional[str],
                     n_ctx: int = 512,
                     **kwargs) -> Llama:
    """
    Load a local model from the specified path.

    Support Multi-Modal model loading.
    """

    log_telemetry(logger=logger, event='load_model',
                  **{"model": model, "path": path})

    global local_foundation_model

    try:
        chat_handler = mmproj_path is not None and _get_chat_handler(
            model=model, mmproj_path=mmproj_path) or None

        llm = Llama(
            use_mmap=True,
            use_mlock=True,
            model_path=path,
            chat_handler=chat_handler,
            chat_format="chatml-function-calling",
            n_ctx=n_ctx,
            verbose=False,
            **kwargs
        )

        local_foundation_model = llm
        return llm
    except Exception as e:
        logger.error(f"Error loading llm model from path {path}: {e}")
        raise e


def load_local_embeddings_model(model: str, path: str) -> Llama:
    """
    Load Local embeddings model
    """

    log_telemetry(logger=logger, event='load embedding model',
                  **{"model": model, "path": path})

    global local_embeddings_model

    try:

        llm = Llama(
            model_path=path,
            embedding=True
        )
        local_embeddings_model = llm
    except Exception as e:
        logger.error(
            f'Error loading local embedding model from path {path}: {e}')
        raise e

    return local_embeddings_model


def _get_chat_handler(model: str, mmproj_path: str):
    if model.lower().startswith('minicpmv'):
        return MiniCPMv26ChatHandler(
            clip_model_path=mmproj_path)
    if model.lower().startswith('qwen2.5'):
        return Qwen25VLChatHandler(
            clip_model_path=mmproj_path)
