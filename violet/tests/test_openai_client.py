import pytest

from violet.llm_api.openai_client import OpenAIClient
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.violet_message_content import TextContent


@pytest.fixture()
def openai_config():
    return LLMConfig(
        model="minicpm4-0.5b",
        model_endpoint="http://localhost:1234/v1",
        api_key="minicpm",
        context_window=4096
    )


@pytest.mark.asyncio
async def test_request(openai_config):
    client = OpenAIClient(llm_config=openai_config)

    message: Message = Message(role="user", content=[
                               TextContent(type='text', text="who are you?")])
    messages = [message]
    res = client.send_llm_request(messages=messages)

    assert res is not None
