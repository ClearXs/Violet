import random
import time
from typing import List, Optional

import requests

from violet.constants import CLI_WARNING_PREFIX
from violet.errors import VioletConfigurationError, RateLimitExceededError
from violet.llm_api.helpers import unpack_all_inner_thoughts_from_kwargs
from violet.llm_api.openai import (
    build_openai_chat_completions_request,
    openai_chat_completions_request,
)
from violet.constants import INNER_THOUGHTS_KWARG
from violet.utils import num_tokens_from_functions, num_tokens_from_messages
from violet.schemas.llm_config import LLMConfig
from violet.schemas.message import Message
from violet.schemas.openai.chat_completion_response import ChatCompletionResponse
from violet.settings import ModelSettings

LLM_API_PROVIDER_OPTIONS = ["openai", "azure",
                            "anthropic", "google_ai", "cohere", "local", "groq"]


def retry_with_exponential_backoff(
    func,
    initial_delay: float = 1,
    exponential_base: float = 2,
    jitter: bool = True,
    max_retries: int = 20,
    # List of OpenAI error codes: https://github.com/openai/openai-python/blob/17ac6779958b2b74999c634c4ea4c7b74906027a/src/openai/_client.py#L227-L250
    # 429 = rate limit
    error_codes: tuple = (429,),
):
    """Retry a function with exponential backoff."""

    def wrapper(*args, **kwargs):
        pass

        # Initialize variables
        num_retries = 0
        delay = initial_delay

        # Loop until a successful response or max_retries is hit or an exception is raised
        while True:
            try:
                return func(*args, **kwargs)

            except requests.exceptions.HTTPError as http_err:

                if not hasattr(http_err, "response") or not http_err.response:
                    raise

                # Retry on specified errors
                if http_err.response.status_code in error_codes:
                    # Increment retries
                    num_retries += 1

                    # Check if max retries has been reached
                    if num_retries > max_retries:
                        raise RateLimitExceededError(
                            "Maximum number of retries exceeded", max_retries=max_retries)

                    # Increment the delay
                    delay *= exponential_base * (1 + jitter * random.random())

                    # Sleep for the delay
                    # printd(f"Got a rate limit error ('{http_err}') on LLM backend request, waiting {int(delay)}s then retrying...")
                    print(
                        f"{CLI_WARNING_PREFIX}Got a rate limit error ('{http_err}') on LLM backend request, waiting {int(delay)}s then retrying..."
                    )
                    time.sleep(delay)
                else:
                    # For other HTTP errors, re-raise the exception
                    raise

            # Raise exceptions for any errors not specified
            except Exception as e:
                raise e

    return wrapper


@retry_with_exponential_backoff
def create(
    # agent_state: AgentState,
    llm_config: LLMConfig,
    messages: List[Message],
    functions: Optional[list] = None,
    functions_python: Optional[dict] = None,
    # see: https://platform.openai.com/docs/api-reference/chat/create#chat-create-tool_choice
    function_call: Optional[str] = None,
    # hint
    first_message: bool = False,
    # Force a specific tool to be called
    force_tool_call: Optional[str] = None,
    # use tool naming?
    # if false, will use deprecated 'functions' style
    use_tool_naming: bool = True,
    # streaming?
    stream: bool = False,
    stream_interface=None,
    max_tokens: Optional[int] = None,
    summarizing: bool = False,
    model_settings: Optional[dict] = None,  # TODO: eventually pass from server
    image_uris: Optional[List[str]] = None,  # TODO: inside messages
    extra_messages: Optional[List[Message]] = None,
    get_input_data_for_debugging: bool = False,
) -> ChatCompletionResponse:
    """Return response to chat completion with backoff"""
    from violet.utils import printd

    # Count the tokens first, if there's an overflow exit early by throwing an error up the stack
    # NOTE: we want to include a specific substring in the error message to trigger summarization
    messages_oai_format = [m.to_openai_dict() for m in messages]
    prompt_tokens = num_tokens_from_messages(
        messages=messages_oai_format, model=llm_config.model)
    function_tokens = num_tokens_from_functions(
        functions=functions, model=llm_config.model) if functions else 0
    if prompt_tokens + function_tokens > llm_config.context_window:
        raise Exception(
            f"Request exceeds maximum context length ({prompt_tokens + function_tokens} > {llm_config.context_window} tokens)")

    if not model_settings:
        from violet.settings import model_settings

        model_settings = model_settings
        assert isinstance(model_settings, ModelSettings)

    printd(
        f"Using model {llm_config.model_endpoint_type}, endpoint: {llm_config.model_endpoint}")

    if function_call and not functions:
        printd("unsetting function_call because functions is None")
        function_call = None

    # openai
    if llm_config.model_endpoint_type == "openai":

        # Check for database-stored API key first, fall back to model_settings
        from violet.services.provider_manager import ProviderManager
        openai_override_key = ProviderManager().get_openai_override_key()
        has_openai_key = openai_override_key or model_settings.openai_api_key

        if has_openai_key is None and llm_config.model_endpoint == "https://api.openai.com/v1":
            # only is a problem if we are *not* using an openai proxy
            raise VioletConfigurationError(
                message="OpenAI key is missing from violet config file", missing_fields=["openai_api_key"])

        if function_call is None and functions is not None and len(functions) > 0:
            # force function calling for reliability, see https://platform.openai.com/docs/api-reference/chat/create#chat-create-tool_choice
            # TODO(matt) move into LLMConfig
            if llm_config.model_endpoint == "https://inference.memgpt.ai":
                function_call = "auto"  # TODO change to "required" once proxy supports it
            else:
                function_call = "required"

        data = build_openai_chat_completions_request(
            llm_config, messages, functions, function_call, use_tool_naming, max_tokens)
        # if stream:  # Client requested token streaming
        #     data.stream = True
        #     assert isinstance(stream_interface, AgentChunkStreamingInterface) or isinstance(
        #         stream_interface, AgentRefreshStreamingInterface
        #     ), type(stream_interface)
        #     response = openai_chat_completions_process_stream(
        #         url=llm_config.model_endpoint,  # https://api.openai.com/v1 -> https://api.openai.com/v1/chat/completions
        #         api_key=model_settings.openai_api_key,
        #         chat_completion_request=data,
        #         stream_interface=stream_interface,
        #     )
        # else:  # Client did not request token streaming (expect a blocking backend response)
        response = openai_chat_completions_request(
            # https://api.openai.com/v1 -> https://api.openai.com/v1/chat/completions
            url=llm_config.model_endpoint,
            api_key=has_openai_key,
            chat_completion_request=data,
            get_input_data_for_debugging=get_input_data_for_debugging,
        )

        if get_input_data_for_debugging:
            return response

        if llm_config.put_inner_thoughts_in_kwargs:
            response = unpack_all_inner_thoughts_from_kwargs(
                response=response, inner_thoughts_key=INNER_THOUGHTS_KWARG)

        return response

    # local model
    else:
        if stream:
            raise NotImplementedError(
                f"Streaming not yet implemented for {llm_config.model_endpoint_type}")
        return get_chat_completion(
            model=llm_config.model,
            messages=messages,
            functions=functions,
            functions_python=functions_python,
            function_call=function_call,
            context_window=llm_config.context_window,
            endpoint=llm_config.model_endpoint,
            endpoint_type=llm_config.model_endpoint_type,
            wrapper=llm_config.model_wrapper,
            user=str(user_id),
            # hint
            first_message=first_message,
            # auth-related
            auth_type=model_settings.openllm_auth_type,
            auth_key=model_settings.openllm_api_key,
        )
