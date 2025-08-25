import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from violet.utils.file import to_absolute_path, write_files

router = APIRouter(prefix="/file", tags=["file"])


@router.post("/upload")
async def upload(files: list[UploadFile]):
    file_paths = await write_files(files)
    return JSONResponse(status_code=200, content={"data": file_paths})


@router.get("/download")
def download(path: str):
    file_path = Path(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=500, detail="File not found")
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )


@router.get("/download_image")
def download_image(path: str):
    file_path = to_absolute_path(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=500, detail="File not found")

    # 读取文件并转换为 Base64
    with open(file_path, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode("utf-8")

    return JSONResponse(status_code=200, content={"data": f"data:image/{file_path.suffix[1:]};base64,{encoded_string}"})
