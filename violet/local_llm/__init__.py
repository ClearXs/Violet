from violet.log import get_logger
from violet.schemas.embedding_config import EmbeddingConfig
from violet.schemas.llm_config import LLMConfig
"""
Aggregation unify local llm local and uninstall api
"""

logger = get_logger(__name__)


def load_model(llm_config: LLMConfig, enforce_load: bool = False):
    model_endpoint_type = llm_config.model_endpoint_type

    if model_endpoint_type == 'llama':
        from violet.local_llm.llama import load_model

        load_model(llm_config, enforce_load)

    elif model_endpoint_type == 'mlx-vlm':
        from violet.local_llm.mlx import load_model

        load_model(llm_config)
    else:
        logger.warning(
            f"Unknown support local model type: {model_endpoint_type}")


def load_embedding_model(embedding_config: EmbeddingConfig, enforce_load: bool = False):
    embedding_endpoint_type = embedding_config.embedding_endpoint_type

    if embedding_endpoint_type == 'llama':
        from violet.local_llm.llama import load_embedding_model

        load_embedding_model(embedding_config, enforce_load)
    else:
        logger.warning(
            f"Unknown support local embedding model type: {embedding_endpoint_type}")


def uninstall_model(llm_config: LLMConfig):
    model_endpoint_type = llm_config.model_endpoint_type

    if model_endpoint_type == 'llama':

        from violet.local_llm.llama import uninstall_model

        uninstall_model()
    elif model_endpoint_type == 'mlx-vlm':
        from violet.local_llm.mlx import uninstall_model

        uninstall_model()
    else:
        logger.warning(
            f"Unknown support local model type: {model_endpoint_type}")


def uninstall_embedding_model(embedding_config: EmbeddingConfig):
    embedding_endpoint_type = embedding_config.embedding_endpoint_type

    if embedding_endpoint_type == 'llama':
        from violet.local_llm.llama import uninstall_embedding_model

        uninstall_embedding_model()
    else:
        logger.warning(
            f"Unknown support local embedding model type: {embedding_endpoint_type}")
