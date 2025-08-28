import gc
import threading
from typing import Tuple, Union
from transformers import PreTrainedTokenizer, PreTrainedTokenizerFast
from violet.config import VioletConfig
from violet.schemas.llm_config import LLMConfig
from .mlx import load_local_model, local_foundation_model, local_processor
import mlx.nn as nn
import os

model_lock = threading.Lock()

local_foundation_model = None
local_processor = None


def load_model(llm_config: LLMConfig) -> Tuple[nn.Module, Union[PreTrainedTokenizer, PreTrainedTokenizerFast]]:
    global model_lock
    global local_foundation_model
    global local_processor

    config = VioletConfig.load()

    with model_lock:

        if local_foundation_model is None:

            # check path whether is existing.
            should_model_path = llm_config.model
            model_path = os.path.join(
                config.model_storage_path, should_model_path)

            if model_path.exists() is False:
                raise FileNotFoundError(f"Model file not found: {model_path}")

            local_foundation_model, local_processor = load_local_model(
                should_model_path, str(model_path))

        return local_foundation_model, local_processor


def uninstall_model():
    global local_foundation_model
    global local_processor
    global model_lock

    with model_lock:
        if local_foundation_model is not None:
            del local_foundation_model
            del local_processor
            gc.collect()
