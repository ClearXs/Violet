from fastapi import APIRouter, Depends, UploadFile, HTTPException
from typing import Optional, List

from violet.server.context import get_server
from violet.server.server import SyncServer
from violet.schemas.scene import Scene as PydanticScene, SceneCreate, SceneUpdate
from violet.schemas.user import User as PydanticUser

router = APIRouter(prefix="/scene", tags=['scene'])


@router.get('/list')
async def list_scenes(
    after: Optional[str] = None,
    limit: Optional[int] = 50,
    server: SyncServer = Depends(get_server)
) -> List[PydanticScene]:
    """List all scenes with optional pagination."""
    return server.scene_manager.list_scenes(after=after, limit=limit)


@router.get('/get_by_id/{scene_id}')
async def get_scene_by_id(
    scene_id: str,
    server: SyncServer = Depends(get_server)
) -> Optional[PydanticScene]:
    """Get a scene by ID."""
    scene = server.scene_manager.get_scene_by_id(scene_id)
    if scene:
        return scene.to_pydantic() if hasattr(scene, 'to_pydantic') else scene
    raise HTTPException(status_code=404, detail="Scene not found")


@router.get('/get_by_name/{scene_name}')
async def get_scene_by_name(
    scene_name: str,
    server: SyncServer = Depends(get_server)
) -> Optional[PydanticScene]:
    """Get a scene by name."""
    # TODO: Get actual user from authentication
    actor = PydanticUser(id="default-user")  # Replace with actual user
    scene = server.scene_manager.get_scene_by_name(scene_name, actor)
    if scene:
        return scene
    raise HTTPException(status_code=404, detail="Scene not found")


@router.post('/create')
async def create_scene(
    scene_create: SceneCreate,
    server: SyncServer = Depends(get_server)
) -> PydanticScene:
    """Create a new scene."""
    # TODO: Get actual user from authentication
    actor = PydanticUser(id="default-user")  # Replace with actual user

    scene = PydanticScene(
        name=scene_create.name,
        description=scene_create.description,
        main_file=scene_create.main_file,
        r_path=scene_create.r_path,
        thumb=scene_create.thumb,
        user_id=actor.id
    )

    return server.scene_manager.create_scene(scene, actor)


@router.post('/upsert')
async def upsert_scene(
    name: str,
    main_file: str,
    r_path: str,
    description: Optional[str] = None,
    thumb: Optional[str] = None,
    server: SyncServer = Depends(get_server)
) -> PydanticScene:
    """Insert or update a scene."""
    # TODO: Get actual user from authentication
    actor = PydanticUser(id="default-user")  # Replace with actual user

    return server.scene_manager.upsert_scene(
        name=name,
        description=description,
        main_file=main_file,
        r_path=r_path,
        thumb=thumb,
        actor=actor
    )


@router.put('/update/{scene_id}')
async def update_scene(
    scene_id: str,
    scene_update: SceneUpdate,
    server: SyncServer = Depends(get_server)
) -> PydanticScene:
    """Update a scene."""
    # TODO: Get actual user from authentication
    actor = PydanticUser(id="default-user")  # Replace with actual user

    return server.scene_manager.update_scene(scene_id, scene_update, actor)


@router.delete('/delete/{scene_id}')
async def delete_scene(
    scene_id: str,
    server: SyncServer = Depends(get_server)
) -> dict:
    """Delete a scene."""
    # TODO: Get actual user from authentication
    actor = PydanticUser(id="default-user")  # Replace with actual user

    server.scene_manager.delete_scene_by_id(scene_id, actor)
    return {"message": "Scene deleted successfully"}


@router.post("/upload_thumbnail")
async def upload_thumbnail(
    file: UploadFile,
    scene_id: str,
    server: SyncServer = Depends(get_server)
) -> dict:
    """Upload a thumbnail for a scene."""
    import os
    import shutil

    scene = server.scene_manager.get_scene_by_id(scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    scene_data = scene.to_pydantic() if hasattr(scene, 'to_pydantic') else scene

    # Save thumbnail
    scene_dir = os.path.dirname(os.path.join(
        scene_data.r_path, scene_data.main_file))
    os.makedirs(scene_dir, exist_ok=True)

    # Generate thumbnail filename
    name, _ = os.path.splitext(file.filename)
    thumbnail_filename = f"{name}_thumb.png"
    thumbnail_path = os.path.join(scene_dir, thumbnail_filename)

    try:
        with open(thumbnail_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Update scene with thumbnail path
        actor = PydanticUser(id="default-user")  # Replace with actual user
        scene_update = SceneUpdate(
            id=scene_id,
            name=scene_data.name,
            description=scene_data.description,
            main_file=scene_data.main_file,
            r_path=scene_data.r_path,
            thumb=thumbnail_path
        )

        updated_scene = server.scene_manager.update_scene(
            scene_id, scene_update, actor)

        return {
            "message": "Thumbnail uploaded successfully",
            "filename": thumbnail_filename,
            "thumbnail_path": thumbnail_path,
            "scene": updated_scene
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error uploading thumbnail: {str(e)}")
