import pytest

from violet.agent.agent_wrapper import AgentWrapper
from violet.config import VioletConfig


@pytest.fixture
def llm_config():
    return VioletConfig.load().get_llm_config()


@pytest.mark.asyncio
async def test_initial(llm_config):
    agent_wrapper = AgentWrapper(llm_config)

    agent_wrapper.send_message(
        message="peter likes computer-games",
        memorizing=True,
        force_absorb_content=True)

    assert agent_wrapper is not None


@pytest.mark.asyncio
async def test_query_memory(llm_config):
    agent_wrapper = AgentWrapper(llm_config)

    agent_wrapper.send_message(
        message="peter like what?",
        memorizing=False,
        force_absorb_content=True)

    assert agent_wrapper is not None
