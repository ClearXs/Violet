import pytest
from datetime import datetime

from violet.agent.agent_wrapper import AgentWrapper
from violet.config import VioletConfig


@pytest.fixture
def agent_wrapper():
    llm_config = VioletConfig.load().get_llm_config()
    embedding_config = VioletConfig.load().get_embedding_config()

    agent_wrapper = AgentWrapper(
        llm_config=llm_config, embedding_config=embedding_config)

    yield agent_wrapper

    agent_wrapper.close()


@pytest.mark.asyncio
async def test_initial(agent_wrapper):
    agent_wrapper.add_memory(
        message="peter likes computer-games",
        force_absorb_content=True)

    assert agent_wrapper is not None


@pytest.mark.asyncio
async def test_query_memory(agent_wrapper):

    start_time = datetime.now().timestamp()

    output = agent_wrapper.chat(message="peter like what?")

    end_time = datetime.now().timestamp()
    duration = end_time - start_time
    print(f'elapse time: {duration}')
    print(f'result {output}')
