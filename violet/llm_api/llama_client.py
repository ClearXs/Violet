import base64
import os
from pathlib import Path
from typing import List, Optional

from llama_cpp import Llama
from violet.config import VioletConfig
from violet.llm_api.llm_client_base import LLMClientBase
from violet.log import get_logger
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.openai.chat_completion_response import ChatCompletionResponse
from violet.schemas.openai.chat_completion_request import ChatCompletionRequest, FunctionCall, ToolFunctionChoice
from violet.schemas.openai.chat_completion_request import FunctionSchema
from violet.schemas.openai.chat_completion_request import Tool as OpenAITool
from violet.schemas.openai.chat_completion_request import cast_message_to_subtype
from violet.schemas.openai.chat_completion_response import ChatCompletionResponse
from violet.constants import INNER_THOUGHTS_KWARG, INNER_THOUGHTS_KWARG_DESCRIPTION, INNER_THOUGHTS_KWARG_DESCRIPTION_GO_FIRST
from violet.llm_api.helpers import add_inner_thoughts_to_functions, convert_to_structured_output, unpack_all_inner_thoughts_from_kwargs
from violet.schemas.message import Message as PydanticMessage


logger = get_logger(__name__)


def encode_image(image_path: str) -> str:
    """
    Encode an image file to base64 format with data URL prefix.

    Args:
        image_path: Path to the image file

    Returns:
        Base64 encoded image with data URL prefix (e.g., "data:image/jpeg;base64,...")
    """
    import mimetypes

    # Get the MIME type of the image
    mime_type, _ = mimetypes.guess_type(image_path)
    if mime_type is None or not mime_type.startswith('image/'):
        # Default to jpeg if we can't determine the type
        mime_type = 'image/jpeg'

    with open(image_path, "rb") as img_file:
        base64_string = base64.b64encode(img_file.read()).decode("utf-8")
        return f"data:{mime_type};base64,{base64_string}"


class LlamaClient(LLMClientBase):

    local_llama: Llama = None

    def __init__(self,
                 llm_config,
                 put_inner_thoughts_first=True,
                 use_tool_naming=True):

        super().__init__(llm_config, put_inner_thoughts_first, use_tool_naming)

        config = VioletConfig.get_config()

        from violet.llama.llama import local_foundation_model, load_local_model

        if local_foundation_model is None:
            model = llm_config.model
            if model.endswith('.gguf'):
                model_path = Path(config.model_storage_path) / model
            else:
                model_path = Path(config.model_storage_path) / f"{model}.gguf"

            if model_path.exists() is False:
                logger.error(f"Model file not found: {model_path}")
                raise FileNotFoundError(f"Model file not found: {model_path}")

            model_config = llm_config.model_config
            mmproj_model_path = llm_config.mmproj_model_path
            context_window = llm_config.context_window

            self.local_llama = load_local_model(
                model,
                str(model_path),
                mmproj_model_path,
                context_window,
                **model_config)
        else:
            self.local_llama = local_foundation_model

    def build_request_data(
        self,
        messages: List[PydanticMessage],
        llm_config: LLMConfig,
        # Keep as dict for now as per base class
        tools: Optional[List[dict]] = None,
        force_tool_call: Optional[str] = None,
        existing_file_uris: Optional[List[str]] = None,
    ) -> dict:
        """
        Constructs a request object in the expected data format for the OpenAI API.
        """
        if tools and llm_config.put_inner_thoughts_in_kwargs:
            # Special case for LM Studio backend since it needs extra guidance to force out the thoughts first
            # TODO(fix)
            inner_thoughts_desc = (
                INNER_THOUGHTS_KWARG_DESCRIPTION_GO_FIRST if ":1234" in llm_config.model_endpoint else INNER_THOUGHTS_KWARG_DESCRIPTION
            )
            tools = add_inner_thoughts_to_functions(
                functions=tools,
                inner_thoughts_key=INNER_THOUGHTS_KWARG,
                inner_thoughts_description=inner_thoughts_desc,
                put_inner_thoughts_first=True,
            )

        llama_message_list = [
            cast_message_to_subtype(
                m.to_openai_dict(
                    put_inner_thoughts_in_kwargs=llm_config.put_inner_thoughts_in_kwargs,
                    use_developer_message=False,
                )
            )
            for m in messages
        ]

        # llama_message_list = []
        # for m in messages:
        #     m_dict = m.to_llama_dict(
        #         put_inner_thoughts_in_kwargs=llm_config.put_inner_thoughts_in_kwargs,
        #         use_developer_message=False,
        #     )
        #     if isinstance(m_dict, list):
        #         for part in m_dict:
        #             message = cast_message_to_subtype(part)
        #             llama_message_list.append(message)
        #     else:
        #         message = cast_message_to_subtype(m_dict)
        #         llama_message_list.append(message)

        tool_choice = 'auto'

        # error: supported string values: none, auto, required
        if force_tool_call is not None:
            tool_choice = ToolFunctionChoice(
                type="function", function=FunctionCall(name=force_tool_call))

        if llm_config.model:
            model = llm_config.model
        else:
            logger.warning(
                f"Model type not set in llm_config: {llm_config.model_dump_json(indent=4)}")
            model = None

        data = ChatCompletionRequest(
            model=model,
            messages=self.fill_image_content_in_messages(llama_message_list),
            tools=[OpenAITool(type="function", function=f)
                   for f in tools] if tools else None,
            tool_choice=tool_choice,
            user=str(),
            max_completion_tokens=llm_config.max_tokens,
            temperature=llm_config.temperature,
        )

        if data.tools is not None and len(data.tools) > 0:
            # Convert to structured output style (which has 'strict' and no optionals)
            for tool in data.tools:
                try:
                    structured_output_version = convert_to_structured_output(
                        tool.function.model_dump())
                    tool.function = FunctionSchema(**structured_output_version)
                except ValueError as e:
                    logger.warning(
                        f"Failed to convert tool function to structured output, tool={tool}, error={e}")

        return data.model_dump(exclude_unset=True)

    def request(self, request_data: dict) -> dict:
        """
        Performs underlying request to llm and returns raw response.
        """
        from openai.types.chat import ChatCompletion, ChatCompletionChunk

        response = self.local_llama.create_chat_completion(
            **request_data)

        if request_data.get('stream', False):
            return (ChatCompletionChunk(**chunk) for chunk in response)

        return ChatCompletion(**response).model_dump()

    def convert_response_to_chat_completion(
        self,
        response_data: dict,
        input_messages: List[Message],
    ) -> ChatCompletionResponse:
        """
        Converts raw OpenAI response dict into the ChatCompletionResponse Pydantic model.
        Handles potential extraction of inner thoughts if they were added via kwargs.
        """
        # OpenAI's response structure directly maps to ChatCompletionResponse
        # We just need to instantiate the Pydantic model for validation and type safety.
        chat_completion_response = ChatCompletionResponse(**response_data)

        # Unpack inner thoughts if they were embedded in function arguments
        if self.llm_config.put_inner_thoughts_in_kwargs:
            chat_completion_response = unpack_all_inner_thoughts_from_kwargs(
                response=chat_completion_response, inner_thoughts_key=INNER_THOUGHTS_KWARG
            )

        return chat_completion_response

    def fill_image_content_in_messages(self, openai_message_list):
        """
        Converts image URIs in the message to base64 format.
        """

        from violet.constants import LOAD_IMAGE_CONTENT_FOR_LAST_MESSAGE_ONLY

        global_image_idx = 0
        new_message_list = []

        # it will always be false if `LOAD_IMAGE_CONTENT_FOR_LAST_MESSAGE_ONLY` is False
        image_content_loaded = False

        for message_idx, message in enumerate(openai_message_list[::-1]):

            if message.role != 'user':
                new_message_list.append(message)
                continue

            # It it is not a list, then it is not a message with image.
            # TODO: (yu) Single image as message should be the list, this probably needs to be warned in the beginning.
            if not isinstance(message.content, list):
                new_message_list.append(message)
                continue

            has_image = False

            message_content = []
            for m in message.content:
                if m['type'] == 'image_url':
                    if LOAD_IMAGE_CONTENT_FOR_LAST_MESSAGE_ONLY and image_content_loaded:
                        message_content.append({
                            'type': 'text',
                            'text': "[System Message] There was an image here but now the image has been deleted to save space.",
                        })

                    else:
                        message_content.append({
                            'type': 'text',
                            'text': f"<image {global_image_idx}>",
                        })
                        file = self.file_manager.get_file_metadata_by_id(
                            m['image_id'])
                        if file.source_url is not None:
                            message_content.append({
                                'type': 'image_url',
                                'image_url': {'url': file.source_url, 'detail': m['detail']},
                            })
                        elif file.file_path is not None:
                            message_content.append({
                                'type': 'image_url',
                                'image_url': {'url': encode_image(file.file_path), 'detail': m['detail']},
                            })
                        else:
                            raise ValueError(
                                f"File {file.file_path} has no source_url or file_path")
                        global_image_idx += 1
                        has_image = True
                elif m['type'] == 'google_cloud_file_uri':
                    file = self.file_manager.get_file_metadata_by_id(
                        m['cloud_file_uri'])
                    try:
                        local_path = self.cloud_file_mapping_manager.get_local_file(
                            file.google_cloud_url)
                    except Exception as e:
                        local_path = None

                    if local_path is not None and os.path.exists(local_path):
                        message_content.append({
                            'type': 'image_url',
                            'image_url': {'url': encode_image(local_path)},
                        })
                    else:
                        message_content.append({
                            'type': 'text',
                            'text': f"[System Message] There was an image here but now the image has been deleted to save space.",
                        })

                elif m['type'] == 'file_uri':
                    raise NotImplementedError(
                        "File URI is currently not supported for OpenAI")
                else:
                    message_content.append(m)
            message.content = message_content
            new_message_list.append(message)

            if has_image:
                if LOAD_IMAGE_CONTENT_FOR_LAST_MESSAGE_ONLY:
                    # Load image content for the last message only.
                    image_content_loaded = True

        new_message_list = new_message_list[::-1]

        return new_message_list

    def handle_llm_error(self, e: Exception) -> Exception:
        return super().handle_llm_error(e)
