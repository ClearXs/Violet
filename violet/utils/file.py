from datetime import datetime
import os
import pathlib
from fastapi import UploadFile
from violet.constants import VIOLET_DIR


async def write_file(file: UploadFile, base_dir: str) -> str:
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


def get_relative_path(absolute_path: str) -> str:
    """Get the relative path from the violet directory."""
    return os.path.relpath(absolute_path, VIOLET_DIR)


def get_absolute_path(path: str, *p) -> str:
    """
    Convert a relative file path to an absolute file path.

    Examples:

    relevant_path = models/GPT_SoVITS/chinese-hubert-base

    Return /{username}/.violet/models/GPT_SoVITS/chinese-hubert-base
    """
    file_path = path
    if path.startswith(VIOLET_DIR):
        file_path = path
    else:
        file_path = os.path.join(VIOLET_DIR, file_path)

    return os.path.join(file_path, *p)
