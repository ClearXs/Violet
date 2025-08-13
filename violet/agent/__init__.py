# Agent module for Violet
# This module contains all agent-related functionality

from .agent_wrapper import AgentWrapper
from .agent_states import AgentStates
from .agent_configs import AGENT_CONFIGS
from .message_queue import MessageQueue
from .temporary_message_accumulator import TemporaryMessageAccumulator
from .upload_manager import UploadManager
from . import app_constants
from . import app_utils

__all__ = [
    'AgentWrapper',
    'AgentStates',
    'AGENT_CONFIGS',
    'MessageQueue',
    'TemporaryMessageAccumulator',
    'UploadManager',
    'app_constants',
    'app_utils'
]

from violet.agent.agent import save_agent, Agent, AgentState
from violet.agent.episodic_memory_agent import EpisodicMemoryAgent
from violet.agent.procedural_memory_agent import ProceduralMemoryAgent
from violet.agent.resource_memory_agent import ResourceMemoryAgent
from violet.agent.knowledge_vault_agent import KnowledgeVaultAgent
from violet.agent.meta_memory_agent import MetaMemoryAgent
from violet.agent.semantic_memory_agent import SemanticMemoryAgent
from violet.agent.core_memory_agent import CoreMemoryAgent
from violet.agent.reflexion_agent import ReflexionAgent
from violet.agent.background_agent import BackgroundAgent
