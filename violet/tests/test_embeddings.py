import pytest

from violet.llm_api.embeddings import embedding_model
from violet.schemas.embedding_config import EmbeddingConfig


@pytest.fixture
def embeddings_config():
    return EmbeddingConfig(
        embedding_model="bge-m3-q8_0.gguf",
        embedding_endpoint_type='llama',
        embedding_dim=1024
    )


@pytest.mark.asyncio
async def test_embed(embeddings_config):
    # Test embedding generation
    text = "Hello, world!"

    model = embedding_model(embeddings_config)

    embedding = model.get_text_embedding(text)
    assert embedding is not None
    assert len(embedding) > 0
