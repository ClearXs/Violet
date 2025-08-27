from logging import getLogger
from typing import Any, Dict,  Optional
from datetime import datetime

from pydantic import BaseModel, Field
from violet.schemas.violet_base import VioletBase

logger = getLogger(__name__)


class PersonaBase(VioletBase):
    __id_prefix__ = "persona"


class Persona(PersonaBase):
    id: Optional[str] = Field(
        None, description="The id of the provider, lazily created by the database manager.")
    name: str = Field(..., description="The name of the persona")
    activated: bool = Field(...,
                            description="Whether the persona is activated.")
    r_path: str = Field(..., description="exist system relative path.")
    thumb: Optional[str] = Field(None, description="thumb for persona image.")
    user_id: Optional[str] = Field(None, description="The user id")
    updated_at: Optional[datetime] = Field(
        None, description="The last update timestamp of the persona.")


class PersonaCreate(PersonaBase):
    name: str = Field(..., description="The name of the provider.")
    activated: bool = Field(...,
                            description="Whether the persona is activated")
    r_path: str = Field(..., description="exist system relative path")
    thumb: Optional[str] = Field(None, description="thumb for persona image.")


class PersonaUpdate(PersonaBase):
    id: str = Field(..., description="The id of the persona to update.")
    name: str = Field(..., description="The name of the persona.")
    activated: bool = Field(...,
                            description="Whether the persona is activated")
    r_path: str = Field(..., description="exist system relative path")
    thumb: Optional[str] = Field(None, description="thumb for persona image.")


class PersonaMotion(BaseModel):
    idle_loop: str = Field(..., description="Idle loop motion name")


class Config(BaseModel):
    """
    Every persona directory configuration.
    Convention:
        1. following config existence dir structure. like ref_audio
        2. all paths are relative to the persona directory

    Attributes:
        prompt_path (str): prompt path
        ref_audio_path (str): Reference audio path
        prompt_lang (str): Prompt language
        vrm (str): 3D avatar vrm name
        motions (Dict[str, Any]): List of motion names for the avatar.
    """
    character_setting: str = Field(..., description="record")

    # audio
    ref_audio: str = Field(..., description="Reference audio name")
    prompt_lang: str = Field(..., description="Prompt language")

    # avatar
    vrm: str = Field(...,
                     description="3D avatar vrm name, existing current dir")

    # motion
    motion: PersonaMotion = Field(...,
                                  description="List of motion names for the avatar.")
