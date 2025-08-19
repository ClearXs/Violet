import os
import pytest

from violet.llm_api.mlx_client import MlxClient
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.violet_message_content import ImageContent, MessageContentType, TextContent
from violet.services.organization_manager import OrganizationManager
from violet.tests import setup

model_name = "InternVL3-2B-4bit"

cwd = os.getcwd()

example_image_path = cwd + '/violet/tests/images/image.png'


@pytest.fixture
def llm_config():
    return LLMConfig(
        model=model_name,
        context_window=4096
    )


@pytest.fixture
def mlx_client(llm_config):
    return MlxClient(
        llm_config=llm_config,
        put_inner_thoughts_first=False
    )


@pytest.mark.asyncio
async def test_request_data(llm_config):
    client = MlxClient(
        llm_config=llm_config,
        put_inner_thoughts_first=False
    )
    setup()

    file_metadata = client.file_manager.create_file_metadata_from_path(
        organization_id=OrganizationManager.DEFAULT_ORG_ID, file_path=example_image_path)

    message: Message = Message(role="user", content=[
        TextContent(type='text', text="Describe give you picture."),
        ImageContent(type=MessageContentType.image_url, image_id=file_metadata.id, detail="auto")])

    request_data = client.build_request_data(
        messages=[message], llm_config=llm_config)

    assert request_data['chat_messages'] is not None

    assert request_data['images'] is not None


@pytest.mark.asyncio
async def test_request(llm_config):
    client = MlxClient(
        llm_config=llm_config,
        put_inner_thoughts_first=False
    )
    setup()

    file_metadata = client.file_manager.create_file_metadata_from_path(
        organization_id=OrganizationManager.DEFAULT_ORG_ID, file_path=example_image_path)

    message: Message = Message(role="user", content=[
        TextContent(type='text', text="Describe give you picture."),
        ImageContent(type=MessageContentType.image_url, image_id=file_metadata.id, detail="auto")])
    from datetime import datetime

    start_time = datetime.now().timestamp()

    res = client.send_llm_request(messages=[message])

    end_time = datetime.now().timestamp()
    duration = end_time - start_time
    print(f'elapse time: {duration}')
    print(f'result {res}')

    message2: Message = Message(role="user", content=[
        TextContent(type='text', text="what's topic of Math")])

    start_time = datetime.now().timestamp()

    res = client.send_llm_request(messages=[message, message2])

    end_time = datetime.now().timestamp()
    duration = end_time - start_time
    print(f'elapse time: {duration}')
    print(f'result {res}')
