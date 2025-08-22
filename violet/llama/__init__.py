import gc
import threading
from violet.config import VioletConfig
from violet.log import get_logger
from violet.schemas.embedding_config import EmbeddingConfig
from violet.schemas.llm_config import LLMConfig
from .llama import load_local_model, load_local_embedding_model

logger = get_logger(__name__)

model_lock = threading.Lock()

# temporal system llama model
local_foundation_model = None
local_embedding_model = None


def load_model(llm_config: LLMConfig):
    global model_lock
    global local_foundation_model

    import os
    config = VioletConfig.get_config()

    with model_lock:

        if local_foundation_model is None:
            model = llm_config.model

            # modulate model and build model path
            if model.endswith('.gguf'):
                model_path = os.path.join(config.model_storage_path, model)
            else:
                model_path = os.path.join(
                    config.model_storage_path, f"{model}.gguf")

            if not os.path.exists(model_path):
                logger.error(f"Model file not found: {model_path}")
                raise FileNotFoundError(f"Model file not found: {model_path}")

            # modulate vision model and build vision model extra path.
            mmproj_model_path = None
            mmproj_model = llm_config.mmproj_model

            if mmproj_model is not None:
                if mmproj_model.endswith('.gguf'):
                    mmproj_model_path = os.path.join(
                        config.model_storage_path, mmproj_model)
                else:
                    mmproj_model_path = os.path.join(
                        config.model_storage_path, f"{mmproj_model}.gguf")

            model_config = llm_config.model_config
            context_window = llm_config.context_window

            local_foundation_model = load_local_model(
                model,
                model_path,
                mmproj_model_path,
                context_window,
                **model_config)

        return local_foundation_model


def load_embedding_model(embedding_config: EmbeddingConfig):
    import os
    global model_lock
    global local_embedding_model

    config = VioletConfig.get_config()
    embedding_model = embedding_config.embedding_model

    with model_lock:

        if local_embedding_model is None:
            embedding_model_path = None

            if embedding_model.endswith(".gguf"):
                embedding_model_path = os.path.join(
                    config.model_storage_path, embedding_model)
            else:
                embedding_model_path = os.path.join(
                    config.model_storage_path, f"{embedding_model}.gguf")

            if os.path.exists(embedding_model_path) is False:
                raise FileNotFoundError(
                    f"Embedding model not found at {embedding_model_path}")

            # through llama load local embedding model
            local_embedding_model = load_local_embedding_model(
                model=embedding_model,
                path=str(embedding_model_path))

        return local_embedding_model


def uninstall_model():
    global local_foundation_model

    if local_foundation_model is not None:
        del local_foundation_model

    gc.collect()


def uninstall_embedding_model():
    global local_embedding_model

    if local_embedding_model is not None:
        del local_embedding_model

    gc.collect()


def uninstall_all():
    uninstall_model()
    uninstall_embedding_model()
