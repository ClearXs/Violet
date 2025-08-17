

import pytest

from violet.mlx.mlx import load_local_model


@pytest.mark.asyncio
async def test_mlx():
    local_model, local_processor = load_local_model(
        "model_name", "/Users/jiangwei/Development/LLM/models/mlx-community/LFM2-VL-1.6B-8bit")
    assert local_model is not None
    assert local_processor is not None
