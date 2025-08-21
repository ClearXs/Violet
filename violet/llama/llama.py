from typing import List, Literal, Optional, Tuple
from llama_cpp import ChatCompletionRequestMessage, Llama

from violet.log import get_logger
from llama_cpp.llama_chat_format import MiniCPMv26ChatHandler, Qwen25VLChatHandler, Llava15ChatHandler


from violet.utils import log_telemetry

logger = get_logger(__name__)

local_foundation_model = None
local_embeddings_model = None


def load_local_model(model: str,
                     path: str,
                     mmproj_path: Optional[str],
                     n_ctx: int = 512,
                     **kwargs) -> Llama:
    """
    Load a local model from the specified path.

    Support Multi-Modal model loading.
    """

    log_telemetry(logger=logger, event='load_llama_model',
                  **{"model": model, "path": path})

    global local_foundation_model

    try:
        chat_handler = mmproj_path is not None and _get_chat_handler(
            model=model, mmproj_path=mmproj_path) or None

        llm = Llama(
            use_mmap=True,
            use_mlock=True,
            model_path=path,
            chat_handler=chat_handler,
            chat_format="chatml-function-calling",
            n_ctx=n_ctx,
            verbose=False,
            n_gpu_layers=99,
            **kwargs
        )

        local_foundation_model = llm
        return llm
    except Exception as e:
        logger.error(f"Error loading llm model from path {path}: {e}")
        raise e


def load_local_embeddings_model(model: str, path: str) -> Llama:
    """
    Load Local embeddings model
    """

    log_telemetry(logger=logger, event='load embedding model',
                  **{"model": model, "path": path})

    global local_embeddings_model

    try:

        llm = Llama(
            model_path=path,
            embedding=True
        )
        local_embeddings_model = llm
    except Exception as e:
        logger.error(
            f'Error loading local embedding model from path {path}: {e}')
        raise e

    return local_embeddings_model


def _get_chat_handler(model: str, mmproj_path: str):
    if model.lower().startswith('minicpmv'):
        return MiniCPMv26ChatHandler(
            clip_model_path=mmproj_path)
    elif model.lower().startswith('gemma3'):
        return Gemma3ChatHandler(clip_model_path=mmproj_path)
    elif model.lower().startswith('qwen2.5'):
        return Qwen25VLChatHandler(
            clip_model_path=mmproj_path)
    elif model.lower().startswith("internvl3"):
        return InternVL3ChatHandler(
            clip_model_path=mmproj_path)
    else:
        return None


class InternVL3ChatHandler(Qwen25VLChatHandler):

    def __call__(self, **kwargs):
        llama = kwargs['llama']

        # Clear state for multiple runs
        llama.reset()
        llama._ctx.kv_cache_clear()
        llama.n_tokens = 0

        if hasattr(llama, 'input_ids'):
            llama.input_ids.fill(0)

        # Clear any handler state
        if hasattr(self, '_last_image_embed'):
            self._last_image_embed = None
            self._last_image_hash = None

        if self.verbose:
            messages = kwargs.get('messages', [])
            image_count = len(self.get_image_urls(messages))
            import sys
            print(
                f"Minimal - Cleared state, processing {image_count} images", file=sys.stderr)

        # Use parent implementation
        return super().__call__(**kwargs)


class Gemma3ChatHandler(Llava15ChatHandler):
    # Chat Format:
    # '<bos><start_of_turn>user\n{system_prompt}\n\n{prompt}<end_of_turn>\n<start_of_turn>model\n'

    DEFAULT_SYSTEM_MESSAGE = None

    CHAT_FORMAT = (
        "{{ '<bos>' }}"
        "{%- if messages[0]['role'] == 'system' -%}"
        "{%- if messages[0]['content'] is string -%}"
        "{%- set first_user_prefix = messages[0]['content'] + '\n\n' -%}"
        "{%- else -%}"
        "{%- set first_user_prefix = messages[0]['content'][0]['text'] + '\n\n' -%}"
        "{%- endif -%}"
        "{%- set loop_messages = messages[1:] -%}"
        "{%- else -%}"
        "{%- set first_user_prefix = \"\" -%}"
        "{%- set loop_messages = messages -%}"
        "{%- endif -%}"
        "{%- for message in loop_messages -%}"
        "{%- if (message['role'] == 'user') != (loop.index0 % 2 == 0) -%}"
        "{{ raise_exception(\"Conversation roles must alternate user/assistant/user/assistant/...\") }}"
        "{%- endif -%}"
        "{%- if (message['role'] == 'assistant') -%}"
        "{%- set role = \"model\" -%}"
        "{%- else -%}"
        "{%- set role = message['role'] -%}"
        "{%- endif -%}"
        "{{ '<start_of_turn>' + role + '\n' + (first_user_prefix if loop.first else \"\") }}"
        "{%- if message['content'] is string -%}"
        "{{ message['content'] | trim }}"
        "{%- elif message['content'] is iterable -%}"
        "{%- for item in message['content'] -%}"
        "{%- if item['type'] == 'image' -%}"
        "{{ '<start_of_image>' }}"
        "{%- elif item['type'] == 'text' -%}"
        "{{ item['text'] | trim }}"
        "{%- endif -%}"
        "{%- endfor -%}"
        "{%- else -%}"
        "{{ raise_exception(\"Invalid content type\") }}"
        "{%- endif -%}"
        "{{ '<end_of_turn>\n' }}"
        "{%- endfor -%}"
        "{%- if add_generation_prompt -%}"
        "{{ '<start_of_turn>model\n' }}"
        "{%- endif -%}"
    )

    @staticmethod
    def split_text_on_image_urls(text: str, image_urls: List[str]):
        split_text: List[Tuple[Literal["text", "image_url"], str]] = []
        copied_urls = image_urls[:]
        remaining = text
        image_placeholder = "<start_of_image>"

        while remaining:
            # Find placeholder
            pos = remaining.find(image_placeholder)
            if pos != -1:
                assert len(copied_urls) > 0
                if pos > 0:
                    split_text += [("text", remaining[:pos])]
                split_text += [("text", "\n\n<start_of_image>")]
                split_text += [("image_url", copied_urls.pop(0))]
                split_text += [("text", "<end_of_image>\n\n")]
                remaining = remaining[pos + len(image_placeholder):]
            else:
                assert len(copied_urls) == 0
                split_text.append(("text", remaining))
                remaining = ""
        return split_text

    @staticmethod
    def get_image_urls(messages: List[ChatCompletionRequestMessage]):
        image_urls: List[str] = []
        for message in messages:
            if message["role"] == "user":
                if message.get("content") is None:
                    continue
                for content in message["content"]:
                    if isinstance(content, dict) and content.get("type") == "image":
                        if isinstance(content.get("image"), dict) and isinstance(content["image"].get("url"), str):
                            image_urls.append(content["image"]["url"])
                        elif isinstance(content.get("url"), str):
                            image_urls.append(content["url"])
        return image_urls
