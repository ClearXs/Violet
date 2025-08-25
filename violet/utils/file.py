from datetime import datetime
import os
import pathlib
from typing import List
from fastapi import UploadFile
from violet.config import VioletConfig

config = VioletConfig.get_config()


async def write_files(files: List[UploadFile] = None) -> List[str]:
    if len(files) == 0:
        return []

    paths = []
    for file in files:
        path = await _write_file(file, config.file_storage_path)
        paths.append(path)

    return paths


async def write_images(images: List[UploadFile] = None) -> List[str]:
    if len(images) == 0:
        return []

    paths = []
    for image in images:
        path = await _write_file(image, config.image_storage_path)
        paths.append(path)

    return paths


async def _write_file(file: UploadFile, base_dir: str) -> str:
    """
    Write FastApi file type to local files dir.
    Return:
    relative local path. like /files/{today}/filename 
    """
    today = datetime.now()
    format_today = today.strftime("%Y-%m-%d")

    base_upload_dir = pathlib.Path(base_dir).joinpath(format_today)

    if base_upload_dir.exists() is False:
        base_upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = base_upload_dir.joinpath(file.filename)

    data = await file.read()

    with open(file_path, "wb") as f:
        f.write(data)

    return file_path.absolute()


async def to_absolute_path(file_path: str) -> str:
    """
    Convert a relative file path to an absolute file path.
    """
    return os.path.join(config.base_path, file_path)
