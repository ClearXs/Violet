import os
import pytest
from violet.llm_api.llama_client import LlamaClient
from violet.log import get_logger
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.organization import Organization
from violet.schemas.violet_message_content import ImageContent, MessageContentType, TextContent
from violet.services.organization_manager import OrganizationManager


logger = get_logger(__name__)

cwd = os.getcwd()

model_name = "BitCPM4-1B-q4_0.gguf"


@pytest.fixture()
def llama_config():
    return LLMConfig(
        model=model_name,
        context_window=4096
    )


@pytest.mark.asyncio()
async def test_request(llama_config):
    client = LlamaClient(llm_config=llama_config)

    message: Message = Message(role="user", content=[
                               TextContent(type='text', text="who are you?")])
    messages = [message]
    res = client.send_llm_request(messages=messages)
    res = client.send_llm_request(messages=messages)

    assert res is not None


@pytest.mark.asyncio()
async def test_image_request(llama_config):

    org_manager = OrganizationManager()
    default_org = None

    try:
        default_org = org_manager.get_default_organization()
    except Exception as e:
        logger.error("not found default organization.")

    if default_org is None:
        default_org = org_manager.create_organization(
            Organization(id=org_manager.DEFAULT_ORG_ID, name=org_manager.DEFAULT_ORG_ID))

    client = LlamaClient(llm_config=llama_config)

    file_metadata = client.file_manager.create_file_metadata_from_path(
        organization_id=default_org.id, file_path=example_image_path)

    message: Message = Message(role="user", content=[
        TextContent(type='text', text="Describe give you picture."),
        ImageContent(type=MessageContentType.image_url, image_id=file_metadata.id, detail="auto")])

    messages = [message]
    res = client.send_llm_request(messages=messages)

    assert res is not None
