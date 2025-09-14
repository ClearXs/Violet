from typing import List, Optional
from violet.config import VioletConfig
from violet.orm.errors import NoResultFound
from violet.schemas.scene import Scene as PydanticScene, SceneUpdate
from violet.utils.file import get_relative_path
from violet.utils.utils import enforce_types
from violet.schemas.user import User as PydanticUser
from violet.orm.scenes import Scene as SceneModel


class SceneManager:

    DEFAULT_SCENE_ID = "scene-00000000-0000-4000-8000-000000000000"
    DEFAULT_SCENE_NAME = "default"

    config: VioletConfig

    def __init__(self):
        from violet.server.server import db_context

        self.session_maker = db_context
        self.config = VioletConfig.get_config()

    @enforce_types
    def insert_scene(self,
                     name: str,
                     description: Optional[str],
                     main_file: str,
                     r_path: str,
                     thumb: Optional[str],
                     actor: PydanticUser) -> PydanticScene:
        """Insert a new scene into the database."""
        self.create_scene(
            PydanticScene(
                name=name,
                description=description,
                main_file=main_file,
                r_path=r_path,
                thumb=thumb,
                user_id=actor.id
            ),
            actor=actor,
        )

    @enforce_types
    def upsert_scene(self,
                     name: str,
                     description: Optional[str],
                     main_file: str,
                     r_path: str,
                     thumb: Optional[str],
                     actor: PydanticUser) -> PydanticScene:
        """Insert or update a scene in the database. Updates if exists, creates if not."""
        response = None
        with self.session_maker() as session:
            # Check if scene already exists for this organization
            existing_scenes = [s for s in self.list_scenes(
                actor=actor) if s.name == name]

            if existing_scenes:
                # Update existing scene
                existing_scene = existing_scenes[0]
                scene_update = SceneUpdate(
                    id=existing_scene.id,
                    name=name,
                    description=description,
                    main_file=main_file,
                    r_path=r_path,
                    thumb=thumb
                )
                response = self.update_scene(
                    existing_scene.id, scene_update, actor)
            else:
                # Create new scene
                response = self.create_scene(
                    PydanticScene(
                        name=name,
                        description=description,
                        main_file=main_file,
                        r_path=r_path,
                        thumb=thumb
                    ),
                    actor=actor,
                )

        return response

    @enforce_types
    def create_scene(self, scene: PydanticScene, actor: PydanticUser) -> PydanticScene:
        """Create a new scene if it doesn't already exist."""
        response = None
        with self.session_maker() as session:

            exist_scene = self.get_scene_by_id(scene.id)
            if exist_scene:
                response = exist_scene.to_pydantic() if hasattr(
                    exist_scene, 'to_pydantic') else exist_scene
            else:
                scene.user_id = actor.id

                new_scene = SceneModel(
                    **scene.model_dump(exclude_unset=True))

                new_scene.create(session, actor=actor)
                response = new_scene.to_pydantic()

        return response

    @enforce_types
    def update_scene(self, scene_id: str, scene_update: SceneUpdate, actor: PydanticUser) -> PydanticScene:
        """Update scene details."""
        response = None
        with self.session_maker() as session:
            # Retrieve the existing scene by ID
            existing_scene = SceneModel.read(
                db_session=session, identifier=scene_id, actor=actor)

            # Update only the fields that are provided in SceneUpdate
            update_data = scene_update.model_dump(
                exclude_unset=True, exclude_none=True)
            for key, value in update_data.items():
                setattr(existing_scene, key, value)

            # Commit the updated scene
            existing_scene.update(session, actor=actor)
            response = existing_scene.to_pydantic()

        return response

    @enforce_types
    def delete_scene_by_id(self, scene_id: str, actor: PydanticUser):
        """Delete a scene."""
        with self.session_maker() as session:
            existing_scene = SceneModel.read(
                db_session=session, identifier=scene_id, actor=actor)

            # clean activated scene
            if self.scenes and self.scenes.id == existing_scene.id:
                self.scenes = None

            # Soft delete in scene table
            existing_scene.delete(session, actor=actor)

            session.commit()

    @enforce_types
    def list_scenes(self,
                    after: Optional[str] = None,
                    limit: Optional[int] = 50,
                    actor: PydanticUser = None) -> List[PydanticScene]:
        """List all scenes with optional pagination."""
        with self.session_maker() as session:
            scenes = SceneModel.list(
                db_session=session,
                cursor=after,
                limit=limit,
                actor=actor,
            )
            return [scene.to_pydantic() for scene in scenes]

    @enforce_types
    def get_scene_by_id(self, scene_id: str) -> Optional[SceneModel]:
        with self.session_maker() as session:
            try:
                scene = SceneModel.read(
                    db_session=session, identifier=scene_id)
                return scene
            except NoResultFound:
                return None

    @enforce_types
    def get_scene_by_name(self, scene_name: str, actor: PydanticUser) -> Optional[PydanticScene]:
        """Get a scene by name."""
        scenes = self.list_scenes(actor=actor)
        for scene in scenes:
            if scene.name == scene_name:
                return scene
        return None

    @enforce_types
    def create_default_scene(self, actor: PydanticUser):
        import os
        scene_path = self.config.scene_path

        r_path = os.path.join(
            scene_path, SceneManager.DEFAULT_SCENE_NAME)
        thumb = os.path.join(r_path, "thumb.png")
        main_file = "scene.pmx"  # Default MMD scene file

        scene = PydanticScene(
            id=SceneManager.DEFAULT_SCENE_ID,
            name=SceneManager.DEFAULT_SCENE_NAME,
            description="Default MMD scene\n Thanks for SteelDoLLS link by https://www.deviantart.com/steeldolls/art/Interactive-McDonalds-Stage-1-01-MMD-DL-861014005",
            main_file=main_file,
            r_path=get_relative_path(r_path),
            thumb=get_relative_path(thumb)
        )

        return self.create_scene(scene=scene, actor=actor)

    @enforce_types
    def get_scene_file_path(self, scene_id: str) -> Optional[str]:
        """Get the full file path for a scene's main file."""
        scene = self.get_scene_by_id(scene_id)
        if scene:
            import os
            scene_data = scene.to_pydantic() if hasattr(scene, 'to_pydantic') else scene
            return os.path.join(scene_data.r_path, scene_data.main_file)
        return None

    @enforce_types
    def validate_scene_files(self, scene_id: str) -> bool:
        """Validate that a scene's files exist."""
        import os
        scene = self.get_scene_by_id(scene_id)
        if not scene:
            return False

        scene_data = scene.to_pydantic() if hasattr(scene, 'to_pydantic') else scene
        main_file_path = os.path.join(scene_data.r_path, scene_data.main_file)

        # Check if main file exists
        if not os.path.exists(main_file_path):
            return False

        # Check if thumbnail exists (optional)
        if scene_data.thumb and not os.path.exists(scene_data.thumb):
            return False

        return True
