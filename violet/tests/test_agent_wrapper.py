import pytest

from violet.agent.agent_wrapper import AgentWrapper


import os

cwd = os.getcwd()

config_path = cwd + "/violet/configs/config.yaml"


@pytest.mark.asyncio
async def test_initial():
    agent_wrapper = AgentWrapper(agent_config_file=config_path)

    agent_wrapper.send_message(
        message="peter likes computer-games",
        memorizing=True,
        force_absorb_content=True)

    assert agent_wrapper is not None


@pytest.mark.asyncio
async def test_query_memory():
    agent_wrapper = AgentWrapper(agent_config_file=config_path)

    agent_wrapper.send_message(
        message="peter like what?",
        memorizing=False,
        force_absorb_content=True)

    assert agent_wrapper is not None
