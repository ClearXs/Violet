from typing import Optional
from llama_cpp import Llama

from violet.log import get_logger
from llama_cpp.llama_chat_format import MiniCPMv26ChatHandler, Qwen25VLChatHandler

logger = get_logger(__name__)

local_foundation_model = None

local_embedding_model = None


def load_local_model_from_path(model: str,
                               path: str,
                               mmproj_path: Optional[str],
                               n_ctx: int = 512,
                               **kwargs):
    """
    Load a local model from the specified path.

    Support Multi-Modal model loading.
    """
    global local_foundation_model

    try:
        llm = None
        if mmproj_path:
            chat_handler = _get_chat_handler(
                model=model, mmproj_path=mmproj_path)
            if chat_handler:
                llm = Llama(
                    model_path=path,
                    chat_handler=chat_handler,
                    n_ctx=n_ctx,
                    **kwargs
                )

        if llm is None:
            llm = Llama(
                model_path=path,
                n_ctx=n_ctx,
                **kwargs
            )

        local_foundation_model = llm
        return llm
    except Exception as e:
        logger.error(f"Error loading llm model from path {path}: {e}")
        raise e


def load_local_embedding_model(model,
                               path: str):

    pass


def _get_chat_handler(model: str, mmproj_path: str):
    if model.lower().startswith('minicpmv'):
        return MiniCPMv26ChatHandler(
            clip_model_path=mmproj_path)
    if model.lower().startswith('qwen'):
        return Qwen25VLChatHandler(
            clip_model_path=mmproj_path)
