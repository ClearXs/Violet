import pytest

from violet.agent.agent_wrapper import AgentWrapper


import os

cwd = os.getcwd()

config_path = cwd + "violet/configs/config.yaml"


@pytest.mark.asyncio
async def test_initial():
    agent_wrapper = AgentWrapper(agent_config_file=config_path)

    assert agent_wrapper is not None
