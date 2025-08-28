from typing import Tuple, Union
from mlx_vlm import load
import mlx.nn as nn
from transformers import PreTrainedTokenizer, PreTrainedTokenizerFast

from violet.log import get_logger
from violet.utils.utils import log_telemetry

local_foundation_model = None
local_processor = None

logger = get_logger(__name__)


def load_local_model(model: str, path: str) -> Tuple[nn.Module, Union[PreTrainedTokenizer, PreTrainedTokenizerFast]]:

    log_telemetry(logger=logger, event='load_mlx_model',
                  **{"model": model, "path": path})

    global local_foundation_model
    global local_processor

    try:
        local_model, processor = load(path, trust_remote_code=True)

        local_foundation_model = local_model
        local_processor = processor

        return local_model, processor
    except Exception as e:
        logger.error(f"Error loading llm model from path {path}: {e}")
        raise e
