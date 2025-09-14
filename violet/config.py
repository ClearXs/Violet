import os
from dataclasses import dataclass
from typing import Dict

import violet
from violet.constants import (
    CORE_MEMORY_HUMAN_CHAR_LIMIT,
    CORE_MEMORY_PERSONA_CHAR_LIMIT,
    DEFAULT_HUMAN,
    DEFAULT_PERSONA,
    DEFAULT_PRESET,
    VIOLET_DIR,
)
from violet.log import get_logger
from violet.schemas.embedding_config import EmbeddingConfig
from violet.schemas.llm_config import LLMConfig
from violet.schemas.tts_config import TTS_Config
from violet.schemas.whisper_config import WhisperConfig

logger = get_logger(__name__)

config = None


@dataclass
class VioletConfig(Dict):
    base_path: str = VIOLET_DIR

    # config path
    violet_config_path: str = None
    config_path: str = None
    embedding_config_path: str = None
    tts_config_path: str = None
    whisper_config_path: str = None

    # preset
    preset: str = DEFAULT_PRESET  # TODO: rename to system prompt

    # persona parameters
    persona: str = DEFAULT_PERSONA
    human: str = DEFAULT_HUMAN

    # ==== resources path ====
    # model storage path
    model_storage_path: str = None
    # file storage path
    file_storage_path: str = None
    # image storage path
    image_storage_path: str = None
    # persona asset folder
    persona_path: str = None
    # scene asset folder
    scene_path: str = None
    # save prompts
    prompts_path: str = None
    # tmp dir
    tmp_dir: str = None

    # database configs: archival
    archival_storage_type: str = "sqlite"  # local, db
    archival_storage_path: str = VIOLET_DIR
    archival_storage_uri: str = None  # TODO: eventually allow external vector DB

    # database configs: recall
    recall_storage_type: str = "sqlite"  # local, db
    recall_storage_path: str = VIOLET_DIR
    recall_storage_uri: str = None  # TODO: eventually allow external vector DB

    # database configs: metadata storage (sources, agents, data sources)
    metadata_storage_type: str = "sqlite"
    metadata_storage_path: str = VIOLET_DIR
    metadata_storage_uri: str = None

    # database configs: agent state
    persistence_manager_type: str = None  # in-memory, db
    persistence_manager_save_file: str = None  # local file
    persistence_manager_uri: str = None  # db URI

    # version (for backcompat)
    violet_version: str = violet.__version__

    # user info
    policies_accepted: bool = False

    # Default memory limits
    core_memory_persona_char_limit: int = CORE_MEMORY_PERSONA_CHAR_LIMIT
    core_memory_human_char_limit: int = CORE_MEMORY_HUMAN_CHAR_LIMIT

    def __post_init__(self):
        self.violet_config_path = os.path.join(self.base_path, "config")
        self.config_path = os.path.join(self.base_path, "config.yaml")
        self.embedding_config_path = os.path.join(
            self.base_path, "embedding_config.yaml")
        self.tts_config_path = os.path.join(
            self.base_path, "tts_infer.yaml")
        self.whisper_config_path = os.path.join(
            self.base_path, "whisper.yaml")
        self.model_storage_path = os.path.join(self.base_path, "models")
        self.file_storage_path = os.path.join(self.base_path, "files")
        self.image_storage_path = os.path.join(self.base_path, "images")
        self.persona_path = os.path.join(self.base_path, "personas")
        self.scene_path = os.path.join(self.base_path, 'scenes')
        self.prompts_path = os.path.join(self.base_path, "prompts")
        self.tmp_dir = os.path.join(self.base_path, "tmp")

        # ensure all configuration directories exist
        self.create_config_dir()
        self.create_model_storage_dir()
        self.create_file_storage_dir()
        self.create_personas_dir()
        self.create_scene_dir()
        self.create_prompts_dir()
        self.create_config_dir()  # create dirs

    @classmethod
    def load(cls) -> "VioletConfig":

        config = cls()

        return config

    def create_config_dir(self):
        if not os.path.exists(VIOLET_DIR):
            os.makedirs(VIOLET_DIR, exist_ok=True)

        # Only create the tmp folder if it doesn't exist (sqlite.db is created by the database)
        tmp_folder = os.path.join(VIOLET_DIR, "tmp")
        if not os.path.exists(tmp_folder):
            os.makedirs(tmp_folder, exist_ok=True)

    def create_model_storage_dir(self):
        model_storage_path = self.model_storage_path
        if os.path.exists(model_storage_path) is False:
            os.makedirs(model_storage_path, exist_ok=True)

    def create_file_storage_dir(self):
        file_storage_path = self.file_storage_path
        if os.path.exists(file_storage_path) is False:
            os.makedirs(file_storage_path, exist_ok=True)

    def create_personas_dir(self):
        persona_path = self.persona_path
        if os.path.exists(persona_path) is False:
            os.makedirs(persona_path, exist_ok=True)

    def create_scene_dir(self):
        scene_path = self.scene_path
        if os.path.exists(scene_path) is False:
            os.makedirs(scene_path, exist_ok=True)

    def create_prompts_dir(self):
        prompts_path = self.prompts_path
        if os.path.exists(prompts_path) is False:
            os.makedirs(prompts_path, exist_ok=True)

    @staticmethod
    def setup():
        global config

        config = VioletConfig.load()

    @staticmethod
    def get_config():
        global config

        if config is None:
            config = VioletConfig.load()

        return config

    @staticmethod
    def get_llm_config() -> LLMConfig:
        """
        Get violet path config.yaml (.violet/config.yaml) configuration file and convert to "LLMConfig"
        """
        import yaml

        config = VioletConfig.get_config()

        if os.path.exists(config.config_path) is False:
            llm_config = LLMConfig.default_config('gpt-4')

            with open(config.config_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    llm_config.to_dict(),
                    f,
                    allow_unicode=True,
                    indent=2,
                    sort_keys=True)

            return llm_config

        with open(config.config_path, "r") as f:
            agent_config = yaml.safe_load(f)

        return LLMConfig.model_validate(agent_config)

    @staticmethod
    def get_embedding_config() -> EmbeddingConfig:
        """
        Get violet path embedding_config.yaml (.violet/embedding_config.yaml) configuration file and convert to "EmbeddingConfig"
        """
        import yaml

        config = VioletConfig.get_config()

        if os.path.exists(config.embedding_config_path) is False:
            embedding_config = EmbeddingConfig.default_config(
                'text-embedding-3-small')

            with open(config.embedding_config_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    embedding_config.to_dict(),
                    f,
                    allow_unicode=True,
                    indent=2,
                    sort_keys=True)

            return embedding_config

        with open(config.embedding_config_path, "r") as f:
            embedding_config = yaml.safe_load(f)

        return EmbeddingConfig.model_validate(embedding_config)

    @staticmethod
    def get_tts_config() -> TTS_Config:
        """
        Get violet path tts_infer.yaml (.violet/tts_infer.yaml) configuration file and convert to "TTS_Config"
        """

        config = VioletConfig.get_config()

        return TTS_Config(config.tts_config_path)

    @staticmethod
    def get_whisper_config() -> WhisperConfig:
        """
        Get violet path whisper.yaml (.violet/whisper.yaml) configuration file and convert to "WhisperConfig"
        """
        import yaml

        config = VioletConfig.get_config()

        if os.path.exists(config.violet_config_path) is False:
            whisper_config = WhisperConfig.default_config()

            with open(config.whisper_config_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    whisper_config.to_dict(),
                    f,
                    allow_unicode=True,
                    indent=2,
                    sort_keys=True)

            return whisper_config

        with open(config.whisper_config_path, "r") as f:
            whisper_config = yaml.safe_load(f)

        return WhisperConfig.model_validate(whisper_config)
