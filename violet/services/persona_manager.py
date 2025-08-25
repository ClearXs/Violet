from typing import List, Optional
from violet.config import VioletConfig
from violet.orm.errors import NoResultFound
from violet.schemas.personas import Persona as PydanticPersona, PersonaUpdate
from violet.services.helpers.persona_manager_helper import Personas
from violet.utils.utils import enforce_types
from violet.schemas.user import User as PydanticUser
from violet.orm.personas import Persona as PersonaModel


class PersonaManager:

    personas: Optional[Personas] = None

    DEFAULT_PERSONA_ID = "persona-00000000-0000-4000-8000-000000000000"
    DEFAULT_PERSONA_NAME = "default"

    config: VioletConfig

    def __init__(self):
        from violet.server.server import db_context

        self.session_maker = db_context
        self.config = VioletConfig.get_config()

        self._retrieval_set_local_persona()

    @enforce_types
    def insert_persona(self,
                       name: str,
                       activated: bool,
                       r_path: str,
                       thumb: Optional[str],
                       actor: PydanticUser) -> PydanticPersona:
        """Insert a new persona into the database."""
        self.create_persona(
            PydanticPersona(
                name=name,
                activated=activated,
                r_path=r_path,
                thumb=thumb,
                user_id=actor.id
            ),
            actor=actor,
        )
        self._retrieval_set_local_persona()

    @enforce_types
    def upsert_persona(self,
                       name: str,
                       activated: bool,
                       r_path: str,
                       thumb: Optional[str],
                       actor: PydanticUser) -> PydanticPersona:
        """Insert or update a persona in the database. Updates if exists, creates if not."""
        response = None
        with self.session_maker() as session:
            # Check if persona already exists for this organization
            existing_personas = [p for p in self.list_personas(
                actor=actor) if p.name == name]

            if existing_personas:
                # Update existing persona
                existing_persona = existing_personas[0]
                persona_update = PersonaUpdate(
                    id=existing_persona.id, activated=activated, r_path=r_path, thumb=thumb)
                response = self.update_persona(
                    existing_persona.id, persona_update, actor)
            else:
                # Create new persona
                response = self.create_persona(
                    PydanticPersona(
                        name=name,
                        activated=activated,
                        r_path=r_path,
                        thumb=thumb
                    ),
                    actor=actor,
                )

        self._retrieval_set_local_persona()
        return response

    @enforce_types
    def create_persona(self, persona: PydanticPersona, actor: PydanticUser) -> PydanticPersona:
        """Create a new persona if it doesn't already exist."""
        response = None
        with self.session_maker() as session:

            exist_persona = self.get_persona_by_id(persona.id)
            if exist_persona:
                response = exist_persona
            else:
                persona.user_id = actor.id

                new_persona = PersonaModel(
                    **persona.model_dump(exclude_unset=True))

                new_persona.create(session, actor=actor)
                response = new_persona.to_pydantic()

        self._retrieval_set_local_persona()
        return response

    @enforce_types
    def update_persona(self, persona_id: str, persona_update: PersonaUpdate, actor: PydanticUser) -> PydanticPersona:
        """Update persona details."""
        response = None
        with self.session_maker() as session:
            # Retrieve the existing persona by ID
            existing_persona = PersonaModel.read(
                db_session=session, identifier=persona_id, actor=actor)

            # Update only the fields that are provided in PersonaUpdate
            update_data = persona_update.model_dump(
                exclude_unset=True, exclude_none=True)
            for key, value in update_data.items():
                setattr(existing_persona, key, value)

            # Commit the updated persona
            existing_persona.update(session, actor=actor)
            response = existing_persona.to_pydantic()

        self._retrieval_set_local_persona()
        return response

    @enforce_types
    def delete_persona_by_id(self, persona_id: str, actor: PydanticUser):
        """Delete a persona."""
        with self.session_maker() as session:
            existing_persona = PersonaModel.read(
                db_session=session, identifier=persona_id, actor=actor)

            # clean activated persona
            if self.personas and self.personas.id == existing_persona.id:
                self.personas = None

            # Soft delete in persona table
            existing_persona.delete(session, actor=actor)

            session.commit()

    @enforce_types
    def list_personas(self,
                      after: Optional[str] = None,
                      limit: Optional[int] = 50,
                      actor: PydanticUser = None) -> List[PydanticPersona]:
        """List all personas with optional pagination."""
        with self.session_maker() as session:
            personas = PersonaModel.list(
                db_session=session,
                cursor=after,
                limit=limit,
                actor=actor,
            )
            return [persona.to_pydantic() for persona in personas]

    @enforce_types
    def get_persona_by_id(self, persona_id: str) -> Optional[PydanticPersona]:
        with self.session_maker() as session:
            try:
                persona = PersonaModel.read(
                    db_session=session, identifier=persona_id)
                return persona.to_pydantic() if persona else None
            except NoResultFound:
                return None

    @enforce_types
    def create_default_persona(self, actor: PydanticUser):
        import os
        persona_path = self.config.persona_path
        r_path = os.path.join(
            persona_path, PersonaManager.DEFAULT_PERSONA_NAME)

        persona = PydanticPersona(id=PersonaManager.DEFAULT_PERSONA_ID,
                                  name=PersonaManager.DEFAULT_PERSONA_NAME,
                                  activated=True,
                                  r_path=r_path)

        return self.create_persona(persona=persona, actor=actor)

    def get_activated_persona(self) -> Optional[PydanticPersona]:
        with self.session_maker() as session:
            try:
                personas = PersonaModel.list(
                    db_session=session,
                    activated=True,
                    limit=1,
                )
                if personas:
                    return personas[0].to_pydantic()
                return None
            except NoResultFound:
                return None

    def _retrieval_set_local_persona(self):
        """
        When upsert persona then retrieval local persona whether exist activated persona
        """
        persona = self.get_activated_persona()

        self.personas = Personas.from_persona(
            persona) if persona is not None else None
