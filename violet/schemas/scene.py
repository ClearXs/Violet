from logging import getLogger
from typing import Optional
from datetime import datetime

from pydantic import Field
from violet.schemas.violet_base import VioletBase

logger = getLogger(__name__)


class SceneBase(VioletBase):
    __id_prefix__ = "scene"


class Scene(SceneBase):
    id: Optional[str] = Field(
        None, description="The id of the scene, lazily created by the database manager.")
    name: str = Field(..., description="The name of the scene")
    description: Optional[str] = Field(
        None, description="Description of the scene")
    r_path: str = Field(..., description="Scene assets relative path.")
    main_file: str = Field(..., description="Scene main file"),
    thumb: Optional[str] = Field(
        None, description="Thumbnail for scene preview.")
    user_id: Optional[str] = Field(None, description="The user id")
    updated_at: Optional[datetime] = Field(
        None, description="The last update timestamp of the scene.")


class SceneCreate(SceneBase):
    name: str = Field(..., description="The name of the scene.")
    description: Optional[str] = Field(
        None, description="Description of the scene")
    main_file: str = Field(..., description="Scene main file"),
    r_path: str = Field(..., description="Scene assets relative path")
    thumb: Optional[str] = Field(
        None, description="Thumbnail for scene preview.")


class SceneUpdate(SceneBase):
    id: str = Field(..., description="The id of the scene to update.")
    name: str = Field(..., description="The name of the scene.")
    description: Optional[str] = Field(
        None, description="Description of the scene")
    main_file: str = Field(..., description="Scene main file"),
    r_path: str = Field(..., description="Scene assets relative path")
    thumb: Optional[str] = Field(
        None, description="Thumbnail for scene preview.")
