from datetime import datetime

from sqlalchemy import Boolean, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from violet.orm.mixins import UserMixin
from violet.orm.sqlalchemy_base import SqlalchemyBase
from violet.schemas.scene import Scene as PydanticScene


class Scene(SqlalchemyBase, UserMixin):
    """Scene ORM class"""

    __tablename__ = "scenes"
    __pydantic_model__ = PydanticScene

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="The name of the scene"
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        doc="Description of the scene"
    )

    r_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Scene assets relative path"
    )

    main_file: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Scene main file"
    )

    thumb: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        doc="Thumbnail for scene preview"
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=func.now(),
        onupdate=func.now(),
        doc="The last update timestamp of the scene"
    )

    # relationships
    user_id: Mapped["str"] = mapped_column(
        String(500),
        nullable=True,
        doc="The ID of the user associated with the scene"
    )
