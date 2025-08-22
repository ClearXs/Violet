import sys
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ToolSettings(BaseSettings):
    composio_api_key: str | None = Field(
        default=None, description="API key for Composio")

    # Sandbox Configurations
    e2b_api_key: str | None = Field(
        default=None, description="API key for using E2B as a tool sandbox")
    e2b_sandbox_template_id: str | None = Field(
        default=None, description="Template ID for E2B Sandbox. Updated Manually.")

    modal_token_id: str | None = Field(
        default=None, description="Token id for using Modal as a tool sandbox")
    modal_token_secret: str | None = Field(
        default=None, description="Token secret for using Modal as a tool sandbox")

    # Search Providers
    tavily_api_key: str | None = Field(
        default=None, description="API key for using Tavily as a search provider.")
    firecrawl_api_key: str | None = Field(
        default=None, description="API key for using Firecrawl as a search provider.")

    # Local Sandbox configurations
    tool_exec_dir: Optional[str] = None
    tool_sandbox_timeout: float = 180
    tool_exec_venv_name: Optional[str] = None
    tool_exec_autoreload_venv: bool = True

    # MCP settings
    mcp_connect_to_server_timeout: float = 30.0
    mcp_list_tools_timeout: float = 30.0
    mcp_execute_tool_timeout: float = 60.0
    # if False, will throw if attempting to read/write from file
    mcp_read_from_config: bool = False
    mcp_disable_stdio: bool = False


class SummarizerSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="violet_summarizer_", extra="ignore")

    # Controls if we should evict all messages
    # TODO: Can refactor this into an enum if we have a bunch of different kinds of summarizers
    evict_all_messages: bool = False

    # The maximum number of retries for the summarizer
    # If we reach this cutoff, it probably means that the summarizer is not compressing down the in-context messages any further
    # And we throw a fatal error
    max_summarizer_retries: int = 3

    # When to warn the model that a summarize command will happen soon
    # The amount of tokens before a system warning about upcoming truncation is sent to Violet
    memory_warning_threshold: float = 0.75

    # Whether to send the system memory warning message
    send_memory_warning_message: bool = False

    # The desired memory pressure to summarize down to
    desired_memory_token_pressure: float = 0.1

    # The number of messages at the end to keep
    # Even when summarizing, we may want to keep a handful of recent messages
    # These serve as in-context examples of how to use functions / what user messages look like
    keep_last_n_messages: int = 5


class ModelSettings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # env_prefix='my_prefix_'

    # openai
    openai_api_key: Optional[str] = None
    openai_api_base: str = "https://api.openai.com/v1"

    # groq
    groq_api_key: Optional[str] = None

    # Bedrock
    aws_access_key: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: Optional[str] = None
    bedrock_anthropic_version: Optional[str] = "bedrock-2023-05-31"

    # anthropic
    anthropic_api_key: Optional[str] = None

    # ollama
    ollama_base_url: Optional[str] = None

    # azure
    azure_api_key: Optional[str] = None
    azure_base_url: Optional[str] = None
    # We provide a default here, since usually people will want to be on the latest API version.
    azure_api_version: Optional[str] = (
        # https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
        "2024-09-01-preview"
    )

    # google ai
    gemini_api_key: Optional[str] = None

    # together
    together_api_key: Optional[str] = None

    # vLLM
    vllm_api_base: Optional[str] = None

    # openllm
    openllm_auth_type: Optional[str] = None
    openllm_api_key: Optional[str] = None

    # disable openapi schema generation
    disable_schema_generation: bool = False


cors_origins = [
    "http://violet.localhost",
    "http://localhost:8283",
    "http://localhost:8083",
    "http://localhost:3000",
    "http://localhost:4200",
]

# read pg_uri from ~/.violet/pg_uri or set to none, this is to support Violet Desktop
default_pg_uri = None

# check if --use-file-pg-uri is passed

if "--use-file-pg-uri" in sys.argv:
    try:
        with open(Path.home() / ".violet/pg_uri", "r") as f:
            default_pg_uri = f.read()
            print("Read pg_uri from ~/.violet/pg_uri")
    except FileNotFoundError:
        pass


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="violet_", extra="ignore")

    VIOLET_DIR: Optional[Path] = Field(
        Path.home() / ".violet", env="VIOLET_DIR")
    # Directory where uploaded/processed images are stored
    # Can be overridden with MIRIX_IMAGES_DIR environment variable
    images_dir: Optional[Path] = Field(
        Path.home() / ".violet" / "images", env="MIRIX_IMAGES_DIR")
    debug: Optional[bool] = False
    cors_origins: Optional[list] = cors_origins

    # database configuration
    pg_db: Optional[str] = None
    pg_user: Optional[str] = None
    pg_password: Optional[str] = None
    pg_host: Optional[str] = None
    pg_port: Optional[int] = None
    pg_uri: Optional[str] = default_pg_uri  # option to specify full uri
    pg_pool_size: int = 80  # Concurrent connections
    pg_max_overflow: int = 30  # Overflow limit
    pg_pool_timeout: int = 30  # Seconds to wait for a connection
    pg_pool_recycle: int = 1800  # When to recycle connections
    pg_echo: bool = False  # Logging

    # multi agent settings
    multi_agent_send_message_max_retries: int = 3
    multi_agent_send_message_timeout: int = 20 * 60
    multi_agent_concurrent_sends: int = 50

    # telemetry logging
    verbose_telemetry_logging: bool = True
    # otel default: "http://localhost:4317"
    otel_exporter_otlp_endpoint: Optional[str] = None
    disable_tracing: bool = False

    # uvicorn settings
    uvicorn_workers: int = 1
    uvicorn_reload: bool = False
    uvicorn_timeout_keep_alive: int = 5

    # event loop parallelism
    event_loop_threadpool_max_workers: int = 43

    # experimental toggle
    use_experimental: bool = False

    # LLM provider client settings
    httpx_max_retries: int = 5
    httpx_timeout_connect: float = 10.0
    httpx_timeout_read: float = 60.0
    httpx_timeout_write: float = 30.0
    httpx_timeout_pool: float = 10.0
    httpx_max_connections: int = 500
    httpx_max_keepalive_connections: int = 500
    httpx_keepalive_expiry: float = 120.0

    # cron job parameters
    enable_batch_job_polling: bool = False
    poll_running_llm_batches_interval_seconds: int = 5 * 60

    @property
    def violet_pg_uri(self) -> str:
        if self.pg_uri:
            return self.pg_uri
        elif self.pg_db and self.pg_user and self.pg_password and self.pg_host and self.pg_port:
            return f"postgresql+pg8000://{self.pg_user}:{self.pg_password}@{self.pg_host}:{self.pg_port}/{self.pg_db}"
        else:
            return f"postgresql+pg8000://violet:violet@localhost:5432/violet"

    # add this property to avoid being returned the default
    # reference: https://github.com/violet-ai/violet/issues/1362
    @property
    def violet_pg_uri_no_default(self) -> str:
        if self.pg_uri:
            return self.pg_uri
        elif self.pg_db and self.pg_user and self.pg_password and self.pg_host and self.pg_port:
            return f"postgresql+pg8000://{self.pg_user}:{self.pg_password}@{self.pg_host}:{self.pg_port}/{self.pg_db}"
        else:
            return None


class TestSettings(Settings):
    model_config = SettingsConfigDict(
        env_prefix="violet_test_", extra="ignore")

    VIOLET_DIR: Optional[Path] = Field(
        Path.home() / ".violet/test", env="MIRIX_TEST_DIR")
    images_dir: Optional[Path] = Field(
        Path.home() / ".violet/test" / "images", env="MIRIX_TEST_IMAGES_DIR")


# singleton
settings = Settings(_env_parse_none_str="None")
test_settings = TestSettings()
model_settings = ModelSettings()
tool_settings = ToolSettings()
summarizer_settings = SummarizerSettings()
