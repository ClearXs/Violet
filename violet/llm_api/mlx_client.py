import datetime
import gc
from typing import List, Optional, Union
import uuid

from llama_cpp import ChatCompletion, ChatCompletionResponseChoice, CompletionUsage
from violet.constants import INNER_THOUGHTS_KWARG
from violet.llm_api.helpers import unpack_all_inner_thoughts_from_kwargs
from violet.llm_api.llm_client_base import LLMClientBase
from violet.local_llm import load_model
from violet.log import get_logger
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.openai.chat_completion_response import ChatCompletionResponse
from violet.schemas.violet_message_content import FileContent, ImageContent, TextContent, VioletMessageContentUnion
import mlx.core as mx

from mlx_vlm.prompt_utils import apply_chat_template
from mlx_vlm import generate

logger = get_logger(__name__)


class MlxClient(LLMClientBase):

    model = None
    processor = None

    def __init__(self, llm_config, put_inner_thoughts_first=True, use_tool_naming=True):
        super().__init__(llm_config, put_inner_thoughts_first, use_tool_naming)

        self.model, self.processor = load_model(llm_config=llm_config)

    def build_request_data(
        self,
        messages: List[Message],
        llm_config: LLMConfig,
        tools: Optional[List[dict]] = None,
        force_tool_call: Optional[str] = None,
        existing_file_uris: Optional[List[str]] = None,
    ) -> dict:
        """
        Build request data for the MLX model.
        MLX non-existing tools use.
        """
        chat_messages = []
        images = []

        img_idx = -1

        for message in messages:
            content = message.content

            if content is None:
                continue

            mlx_message = {
                "role": message.role.value,
                "content": []
            }

            for content_part in content:
                chat, image_path, _ = self._to_convert_content(
                    content_part)

                if chat:
                    # adjust chat content should with image is same index
                    # otherwise proceed newly chat with newly image.
                    # chat_idx = img_idx
                    # if chat_idx == -1:
                    #     chat_idx = 0

                    # if len(chat_messages) <= chat_idx or chat_messages[chat_idx] == None:
                    #     mlx_message = {
                    #         "role": message.role.value,
                    #         "content": []
                    #     }
                    #     chat_messages.append(mlx_message)

                    # chat_messages[chat_idx]['content'].append(chat)
                    mlx_message["content"].append(chat)

                if image_path:
                    images.append(image_path)
                    img_idx += 1

                chat_messages.append(mlx_message)

        # exclude audio
        return {"chat_messages": chat_messages, "images": images, "audios": []}

    def request(self, request_data: dict) -> dict:

        chat_messages = request_data.get('chat_messages', [])
        images = request_data.get('images', [])
        audios = request_data.get('audios', [])

        config = self.model.config

        formatted_prompt = apply_chat_template(
            self.processor, config, chat_messages, num_images=len(images), num_audios=len(audios)
        )

        generated_at = datetime.datetime.now().timestamp()
        response_id = f"resp_{uuid.uuid4().hex}"

        if request_data.get('stream', False):
            # async def stream_generator():
            #     token_iterator = None
            #     try:
            #         # Create base response object (to match the openai pipeline)
            #         base_response = OpenAIResponse(
            #             id=response_id,
            #             object="response",
            #             created_at=int(generated_at),
            #             status="in_progress",
            #             instructions=instructions,
            #             max_output_tokens=openai_request.max_output_tokens,
            #             model=openai_request.model,
            #             output=[],
            #             output_text="",
            #             temperature=openai_request.temperature,
            #             top_p=openai_request.top_p,
            #             usage={
            #                 "input_tokens": 0,  # get prompt tokens
            #                 "output_tokens": 0,
            #                 "total_tokens": 0,
            #             },
            #         )

            #         message_item = MessageItem(
            #             id=message_id,
            #             type="message",
            #             status="in_progress",
            #             role="assistant",
            #             content=[],
            #         )

            #         # Send response.content_part.added event
            #         content_part = ContentPartOutputText(
            #             type="output_text", text="", annotations=[]
            #         )

            #         # Stream text deltas
            #         token_iterator = stream_generate(
            #             model=model,
            #             processor=processor,
            #             prompt=formatted_prompt,
            #             image=images,
            #             temperature=openai_request.temperature,
            #             max_tokens=openai_request.max_output_tokens,
            #             top_p=openai_request.top_p,
            #             **kwargs,
            #         )

            #         full_text = ""
            #         for chunk in token_iterator:
            #             if chunk is None or not hasattr(chunk, "text"):
            #                 continue

            #             delta = chunk.text
            #             full_text += delta

            #             usage_stats = {
            #                 "input_tokens": chunk.prompt_tokens,
            #                 "output_tokens": chunk.generation_tokens,
            #             }

            #             # Send response.output_text.delta event
            #             yield f"event: response.output_text.delta\ndata: {ResponseOutputTextDeltaEvent(type='response.output_text.delta', item_id=message_id, output_index=0, content_index=0, delta=delta).model_dump_json()}\n\n"
            #             await asyncio.sleep(0.01)

            #         # Send response.content_part.done event (to match the openai pipeline)
            #         final_content_part = ContentPartOutputText(
            #             type="output_text", text=full_text, annotations=[]
            #         )

            #         # Send response.output_item.done event (to match the openai pipeline)
            #         final_message_item = MessageItem(
            #             id=message_id,
            #             type="message",
            #             status="completed",
            #             role="assistant",
            #             content=[final_content_part],
            #         )

            #         # Send response.completed event (to match the openai pipeline)
            #         completed_response = base_response.model_copy(
            #             update={
            #                 "status": "completed",
            #                 "output": [final_message_item],
            #                 "usage": {
            #                     "input_tokens": usage_stats["input_tokens"],
            #                     "output_tokens": usage_stats["output_tokens"],
            #                     "total_tokens": usage_stats["input_tokens"]
            #                     + usage_stats["output_tokens"],
            #                 },
            #             }
            #         )
            #     except Exception as e:
            #         traceback.print_exc()
            #         error_data = json.dumps({"error": str(e)})
            #         logger.error(error_data)
            #         raise e

            #     finally:
            #         mx.clear_cache()
            #         gc.collect()

            pass

        try:
            result = generate(
                model=self.model,
                processor=self.processor,
                prompt=formatted_prompt,
                image=images,
                audio=audios,
                # temperature=request_data.get('temperature', None),
                # max_tokens=request_data.get('max_output_tokens', None),
                # top_p=request_data.get('top_p', None),
                verbose=False,  # stats are passed in the response
            )

            response = ChatCompletion(
                id=response_id,
                object="chat.completion",
                created=int(generated_at),
                model=self.llm_config.model,
                choices=[ChatCompletionResponseChoice(
                    index=0,
                    message={
                        "role": "assistant",
                        "content": result.text
                    },
                    finish_reason="stop"
                )],
                usage=CompletionUsage(
                    input_tokens=result.prompt_tokens,
                    output_tokens=result.generation_tokens,
                    total_tokens=result.total_tokens),
            )

            return response
        except Exception as e:
            logger.error(f"Error occurred: {e}")
            raise e
        finally:
            mx.clear_cache()
            gc.collect()

    def convert_response_to_chat_completion(
        self,
        response_data: dict,
        input_messages: List[Message],
    ) -> ChatCompletionResponse:
        chat_completion_response = ChatCompletionResponse(**response_data)

        if self.llm_config.put_inner_thoughts_in_kwargs:
            chat_completion_response = unpack_all_inner_thoughts_from_kwargs(
                response=chat_completion_response, inner_thoughts_key=INNER_THOUGHTS_KWARG
            )

        return chat_completion_response

    def handle_llm_error(self, e: Exception) -> Exception:
        return super().handle_llm_error(e)

    def _to_convert_content(self, content_part: VioletMessageContentUnion) -> Union[dict, str, str]:
        """
            Convert content to mlx_vlm recognition data
            return text = {} or None, file_path or None, audio_path or None
        """

        if isinstance(content_part, TextContent):
            return {"type": "input_text", "text": content_part.text}, None, None

        elif isinstance(content_part, ImageContent):
            image_id = content_part.image_id
            _file = self.file_manager.get_file_metadata_by_id(image_id)
            file_path = _file.file_path
            return None, file_path, None

        elif isinstance(content_part, FileContent):
            file_id = content_part.file_id
            _file = self.file_manager.get_file_metadata_by_id(image_id)
            file_path = _file.file_path

            return None, None, file_path

        return None, None, None
