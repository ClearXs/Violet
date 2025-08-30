from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import pytest
from tqdm import tqdm
from violet.llm_api.llama_client import LlamaClient
from violet.log import get_logger
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.organization import Organization
from violet.schemas.violet_message_content import ImageContent, MessageContentType, TextContent
from violet.services.organization_manager import OrganizationManager

logger = get_logger(__name__)

cwd = os.getcwd()

example_image_path = cwd + '/violet/tests/images/image.png'

# model_name = "gemma-3-270m-it-Q8_0.gguf"
# mmproj_name = None

# qwen
# model_name = "Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf"
# mmproj_name = "mmproj-qwen2.5-vl-model-f16.gguf"

# minicpm4-vl
# model_name = "minicpm4-vl-Q8_0.gguf"
# mmproj_name = "mmproj-minicpm4-vl-model-f16.gguf"

# InternVL3
# model_name = "InternVL3-2B-UD-Q4_K_XL.gguf"
# mmproj_name = "mmproj-InternVL3-BF16.gguf"

# LFM2-VL
# model_name = "LFM2-VL-1.6B-Q8_0.gguf"
# mmproj_name = "mmproj-LFM2-VL-1.6B-Q8_0.gguf"

# gemma3
# model_name = "gemma-3-4b-it-UD-Q4_K_XL.gguf"
# mmproj_name = "mmproj-gemma3-F16.gguf"


# minicpm4
model_name = "MiniCPM4-0.5B.Q8_0.gguf"
mmproj_name = None


@pytest.fixture()
def llama_config():
    yield LLMConfig(
        model=model_name,
        mmproj_model=mmproj_name,
        model_endpoint_type="llama",
        context_window=32768
    )

    from violet.local_llm.llama import uninstall_all

    uninstall_all()


@pytest.mark.asyncio()
async def test_request(llama_config):
    client = LlamaClient(llm_config=llama_config)

    message1: Message = Message(role="user", content=[
        TextContent(type='text', text="who are you?")])

    from datetime import datetime

    start_time = datetime.now().timestamp()
    res = client.send_llm_request(messages=[message1])

    end_time = datetime.now().timestamp()
    print(f"duration: {end_time - start_time}")
    print(f"result: {res}")

    message2: Message = Message(role="user", content=[
        TextContent(type='text', text="can you tell me your name?")])

    start_time = datetime.now().timestamp()
    res = client.send_llm_request(messages=[message1, message2])
    end_time = datetime.now().timestamp()
    print(f"duration: {end_time - start_time}")
    print(f"result: {res}")


@pytest.mark.asyncio()
async def test_image_request(llama_config):

    from datetime import datetime

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

    start_time = datetime.now().timestamp()

    res = client.send_llm_request(messages=[message])

    end_time = datetime.now().timestamp()
    duration = end_time - start_time
    print(f'elapse time: {duration}')
    print(f'result {res}')

    message2: Message = Message(role="user", content=[
        TextContent(type='text', text="what's topic of Math")])
    start_time = datetime.now().timestamp()
    res = client.send_llm_request(messages=[message2])

    end_time = datetime.now().timestamp()
    duration = end_time - start_time
    print(f'elapse time: {duration}')
    print(f'result {res}')


@pytest.mark.asyncio
async def test_multi_message_send(llama_config):
    def create_client():
        return LlamaClient(llm_config=llama_config)

    message: Message = Message(role="user", content=[
                               TextContent(type='text', text="who are you?")])

    futures = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        for i in range(100):
            future = executor.submit(
                lambda: create_client().send_llm_request([message])
            )
            futures.append(future)

        for future in tqdm(as_completed(futures), total=len(futures)):
            result = future.result()
            print(f"result: {result}")


@pytest.mark.asyncio
async def test_stream_message(llama_config):

    llama_client = LlamaClient(llm_config=llama_config)

    message: Message = Message(role="user", content=[
        TextContent(type='text', text="who are you?")])

    generator = llama_client.send_llm_request(messages=[message], stream=True)

    for chunk in generator:
        print(chunk.choices[0].delta.content)
