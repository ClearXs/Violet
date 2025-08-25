from datetime import datetime

from sqlalchemy import Boolean, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from violet.orm.mixins import UserMixin
from violet.orm.sqlalchemy_base import SqlalchemyBase
from violet.schemas.personas import Persona as PydanticPersona


class Persona(SqlalchemyBase, UserMixin):
    """Persona ORM class"""

    __tablename__ = "personas"
    __pydantic_model__ = PydanticPersona

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="The name of the persona"
    )

    activated: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        doc="Whether the persona is activated"
    )

    r_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="exist system relative path"
    )

    thumb: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        doc="thumb for persona image."
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=func.now(),
        onupdate=func.now(),
        doc="The last update timestamp of the persona."
    )

    # relationships
    user_id: Mapped["str"] = mapped_column(
        String(500),
        nullable=True,
        doc="The ID of the user associated with the persona."
    )
