from enum import Enum


class ToolType(str, Enum):
    CUSTOM = "custom"
    MIRIX_CORE = "violet_core"
    MIRIX_CODER_CORE = "violet_coder_core"
    MIRIX_MEMORY_CORE = "violet_memory_core"
    MIRIX_MULTI_AGENT_CORE = "violet_multi_agent_core"


class JobType(str, Enum):
    JOB = "job"
    RUN = "run"


class ToolSourceType(str, Enum):
    """Defines what a tool was derived from"""

    python = "python"
    json = "json"
