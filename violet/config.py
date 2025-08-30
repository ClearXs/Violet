import configparser
import os
from dataclasses import dataclass

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

# helper functions for writing to configs


def get_field(config, section, field):
    if section not in config:
        return None
    if config.has_option(section, field):
        return config.get(section, field)
    else:
        return None


def set_field(config, section, field, value):
    if value is None:  # cannot write None
        return
    if section not in config:  # create section
        config.add_section(section)
    config.set(section, field, value)


config = None


@dataclass
class VioletConfig:
    base_path: str = VIOLET_DIR

    violet_config_path = os.path.join(base_path, "config")

    # config path
    config_path = os.path.join(base_path, "config.yaml")
    embedding_config_path = os.path.join(base_path, "embedding_config.yaml")
    tts_config_path = os.path.join(base_path, "tts_infer.yaml")
    whisper_config_path = os.path.join(base_path, 'whisper.yaml')

    # preset
    preset: str = DEFAULT_PRESET  # TODO: rename to system prompt

    # persona parameters
    persona: str = DEFAULT_PERSONA
    human: str = DEFAULT_HUMAN

    # model storage path
    model_storage_path = VIOLET_DIR + "/models"
    # file storage path
    file_storage_path = VIOLET_DIR + "/files"
    # image storage path
    image_storage_path = VIOLET_DIR + '/images'
    # persona assert folder path
    persona_path = VIOLET_DIR + '/personas'
    prompts_path = VIOLET_DIR + '/prompts'
    # tmp dir
    tmp_dir = VIOLET_DIR + '/tmp'

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
        # ensure types
        # self.embedding_chunk_size = int(self.embedding_chunk_size)
        # self.embedding_dim = int(self.embedding_dim)
        # self.context_window = int(self.context_window)
        pass

    @classmethod
    def load(cls) -> "VioletConfig":
        # avoid circular import
        config = configparser.ConfigParser()

        # allow overriding with env variables
        if os.getenv("VIOLET_CONFIG_PATH"):
            violet_config_path = os.getenv("VIOLET_CONFIG_PATH")
        else:
            violet_config_path = VioletConfig.violet_config_path

        # insure all configuration directories exist
        cls.create_config_dir()
        cls.create_model_storage_dir()
        cls.create_file_storage_dir()
        cls.create_personas_dir()
        cls.create_prompts_dir()

        if os.path.exists(violet_config_path):
            # read existing config
            config.read(violet_config_path)

            # Everything else
            config_dict = {
                # Two prepared configs
                # "default_llm_config": llm_config,
                # "default_embedding_config": embedding_config,
                # Agent related
                "preset": get_field(config, "defaults", "preset"),
                "persona": get_field(config, "defaults", "persona"),
                "human": get_field(config, "defaults", "human"),
                "agent": get_field(config, "defaults", "agent"),
                # Storage related
                "archival_storage_type": get_field(config, "archival_storage", "type"),
                "archival_storage_path": get_field(config, "archival_storage", "path"),
                "archival_storage_uri": get_field(config, "archival_storage", "uri"),
                "recall_storage_type": get_field(config, "recall_storage", "type"),
                "recall_storage_path": get_field(config, "recall_storage", "path"),
                "recall_storage_uri": get_field(config, "recall_storage", "uri"),
                "metadata_storage_type": get_field(config, "metadata_storage", "type"),
                "metadata_storage_path": get_field(config, "metadata_storage", "path"),
                "metadata_storage_uri": get_field(config, "metadata_storage", "uri"),
                # Misc
                "violet_config_path": violet_config_path,
                "violet_version": get_field(config, "version", "violet_version"),
            }
            # Don't include null values
            config_dict = {k: v for k, v in config_dict.items()
                           if v is not None}

            return cls()

        # assert embedding_config is not None, "Embedding config must be provided if config does not exist"
        # assert llm_config is not None, "LLM config must be provided if config does not exist"

        # create new config
        config = cls()

        config.create_config_dir()  # create dirs

        return config

    def save(self):
        import violet

        config = configparser.ConfigParser()

        # CLI defaults
        set_field(config, "defaults", "preset", self.preset)
        set_field(config, "defaults", "persona", self.persona)
        set_field(config, "defaults", "human", self.human)

        # archival storage
        set_field(config, "archival_storage",
                  "type", self.archival_storage_type)
        set_field(config, "archival_storage",
                  "path", self.archival_storage_path)
        set_field(config, "archival_storage", "uri", self.archival_storage_uri)

        # recall storage
        set_field(config, "recall_storage", "type", self.recall_storage_type)
        set_field(config, "recall_storage", "path", self.recall_storage_path)
        set_field(config, "recall_storage", "uri", self.recall_storage_uri)

        # metadata storage
        set_field(config, "metadata_storage",
                  "type", self.metadata_storage_type)
        set_field(config, "metadata_storage",
                  "path", self.metadata_storage_path)
        set_field(config, "metadata_storage", "uri", self.metadata_storage_uri)

        # set version
        set_field(config, "version", "violet_version", violet.__version__)

        # always make sure all directories are present
        self.create_config_dir()

        with open(self.violet_config_path, "w", encoding="utf-8") as f:
            config.write(f)
        logger.debug(f"Saved Config:  {self.violet_config_path}")

    @staticmethod
    def create_config_dir():
        if not os.path.exists(VIOLET_DIR):
            os.makedirs(VIOLET_DIR, exist_ok=True)

        # Only create the tmp folder if it doesn't exist (sqlite.db is created by the database)
        tmp_folder = os.path.join(VIOLET_DIR, "tmp")
        if not os.path.exists(tmp_folder):
            os.makedirs(tmp_folder, exist_ok=True)

    @classmethod
    def create_model_storage_dir(cls):
        model_storage_path = cls.model_storage_path
        if os.path.exists(model_storage_path) is False:
            os.makedirs(model_storage_path, exist_ok=True)

    @classmethod
    def create_file_storage_dir(cls):
        file_storage_path = cls.file_storage_path
        if os.path.exists(file_storage_path) is False:
            os.makedirs(file_storage_path, exist_ok=True)

    @classmethod
    def create_personas_dir(cls):
        persona_path = cls.persona_path
        if os.path.exists(persona_path) is False:
            os.makedirs(persona_path, exist_ok=True)

    @classmethod
    def create_prompts_dir(cls):
        prompts_path = cls.prompts_path
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

        if os.path.exists(VioletConfig.config_path) is False:
            llm_config = LLMConfig.default_config('gpt-4')

            with open(VioletConfig.config_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    llm_config.to_dict(),
                    f,
                    allow_unicode=True,
                    indent=2,
                    sort_keys=True)

            return llm_config

        with open(VioletConfig.config_path, "r") as f:
            agent_config = yaml.safe_load(f)

        return LLMConfig.model_validate(agent_config)

    @staticmethod
    def get_embedding_config() -> EmbeddingConfig:
        """
        Get violet path embedding_config.yaml (.violet/embedding_config.yaml) configuration file and convert to "EmbeddingConfig"
        """
        import yaml

        if os.path.exists(VioletConfig.embedding_config_path) is False:
            embedding_config = EmbeddingConfig.default_config(
                'text-embedding-3-small')

            with open(VioletConfig.embedding_config_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    embedding_config.to_dict(),
                    f,
                    allow_unicode=True,
                    indent=2,
                    sort_keys=True)

            return embedding_config

        with open(VioletConfig.embedding_config_path, "r") as f:
            embedding_config = yaml.safe_load(f)

        return EmbeddingConfig.model_validate(embedding_config)

    @staticmethod
    def get_tts_config() -> TTS_Config:
        """
        Get violet path tts_infer.yaml (.violet/tts_infer.yaml) configuration file and convert to "TTS_Config"
        """

        return TTS_Config(VioletConfig.tts_config_path)

    @staticmethod
    def get_whisper_config() -> WhisperConfig:
        """
        Get violet path whisper.yaml (.violet/whisper.yaml) configuration file and convert to "WhisperConfig"
        """
        import yaml

        if os.path.exists(VioletConfig.violet_config_path) is False:
            whisper_config = WhisperConfig.default_config()

            with open(VioletConfig.whisper_config_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    whisper_config.to_dict(),
                    f,
                    allow_unicode=True,
                    indent=2,
                    sort_keys=True)

            return whisper_config

        with open(VioletConfig.whisper_config_path, "r") as f:
            whisper_config = yaml.safe_load(f)

        return WhisperConfig.model_validate(whisper_config)
