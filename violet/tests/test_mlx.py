import os
import pytest

from violet.config import VioletConfig
from violet.mlx.mlx import load_local_model
from mlx_vlm.prompt_utils import apply_chat_template
from mlx_vlm import generate


config = VioletConfig().load()

cwd = os.getcwd()

example_image_path = cwd + '/violet/tests/images/image.png'


@pytest.mark.asyncio
async def test_mlx():
    local_model, local_processor = load_local_model(
        "model_name", config.model_storage_path + "/InternVL3-2B-4bit")
    assert local_model is not None
    assert local_processor is not None

    config = local_model.config
    prompt = "describe the pictures"

    image = [example_image_path]

    formatted_prompt = apply_chat_template(
        processor=local_processor,
        config=config,
        prompt=prompt,
        num_images=len(image)
    )

    # Generate output
    output = generate(local_model, local_processor, prompt=formatted_prompt,
                      image=image,
                      verbose=False)

    print(output)
