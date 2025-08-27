import base64
from pathlib import Path
import pathlib
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from violet.config import VioletConfig
from violet.utils.file import write_files

router = APIRouter(prefix="/file", tags=["file"])


@router.post("/upload")
async def upload(files: list[UploadFile]):
    file_paths = await write_files(files)
    return JSONResponse(status_code=200, content={"data": file_paths})


@router.get("/download")
def download(path: str):
    file_path = pathlib.Path(VioletConfig.get_absolute_path(path))

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=500, detail="File not found")
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )


@router.get("/download_image")
def download_image(path: str):
    file_path = pathlib.Path(VioletConfig.get_absolute_path(path))

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=500, detail="File not found")

    mime_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.bmp': 'image/bmp',
        '.ico': 'image/x-icon',
    }

    file_extension = file_path.suffix.lower()
    media_type = mime_type_map.get(file_extension, 'image/jpeg')

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={
            "Content-Disposition": "inline"
        }
    )


@router.get("/download_image_base64")
def download_image_base64(path: str):
    file_path = pathlib.Path(VioletConfig.get_absolute_path(path))
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=500, detail="File not found")

    with open(file_path, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode("utf-8")

    return f"data:image/{file_path.suffix[1:]};base64,{encoded_string}"
