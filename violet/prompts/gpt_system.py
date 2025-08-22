import os

from violet.config import VioletConfig


def get_system_text(key):
    filename = f"{key}.txt"
    prompts_path = VioletConfig.prompts_path
    file_path = os.path.join(prompts_path, "system", filename)

    # first look in prompts/system/*.txt
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read().strip()
    else:
        raise FileNotFoundError(
            f"No file found for key {key}, path={file_path}")
