from datetime import datetime
from typing import List, Optional

from pydantic import Field

from violet.constants import LLM_MAX_TOKENS
from violet.schemas.embedding_config import EmbeddingConfig
from violet.schemas.violet_base import VioletBase
from violet.schemas.llm_config import LLMConfig


class ProviderBase(VioletBase):
    __id_prefix__ = "provider"


class Provider(ProviderBase):
    id: Optional[str] = Field(
        None, description="The id of the provider, lazily created by the database manager.")
    name: str = Field(..., description="The name of the provider")
    api_key: Optional[str] = Field(
        None, description="API key used for requests to the provider.")
    organization_id: Optional[str] = Field(
        None, description="The organization id of the user")
    updated_at: Optional[datetime] = Field(
        None, description="The last update timestamp of the provider.")

    def resolve_identifier(self):
        if not self.id:
            self.id = ProviderBase._generate_id(
                prefix=ProviderBase.__id_prefix__)

    def list_llm_models(self) -> List[LLMConfig]:
        return []

    def list_embedding_models(self) -> List[EmbeddingConfig]:
        return []

    def get_model_context_window(self, model_name: str) -> Optional[int]:
        raise NotImplementedError

    def provider_tag(self) -> str:
        """String representation of the provider for display purposes"""
        raise NotImplementedError

    def get_handle(self, model_name: str) -> str:
        return f"{self.name}/{model_name}"


class ProviderCreate(ProviderBase):
    name: str = Field(..., description="The name of the provider.")
    api_key: str = Field(...,
                         description="API key used for requests to the provider.")


class ProviderUpdate(ProviderBase):
    id: str = Field(..., description="The id of the provider to update.")
    api_key: str = Field(...,
                         description="API key used for requests to the provider.")


class OpenAIProvider(Provider):
    name: str = "openai"
    api_key: str = Field(..., description="API key for the OpenAI API.")
    base_url: str = Field(..., description="Base URL for the OpenAI API.")

    def list_llm_models(self) -> List[LLMConfig]:
        from violet.llm_api.openai import openai_get_model_list

        # Some hardcoded support for OpenRouter (so that we only get models with tool calling support)...
        # See: https://openrouter.ai/docs/requests
        extra_params = {
            "supported_parameters": "tools"} if "openrouter.ai" in self.base_url else None
        response = openai_get_model_list(
            self.base_url, api_key=self.api_key, extra_params=extra_params)

        # TogetherAI's response is missing the 'data' field
        # assert "data" in response, f"OpenAI model query response missing 'data' field: {response}"
        if "data" in response:
            data = response["data"]
        else:
            data = response

        configs = []
        for model in data:
            assert "id" in model, f"OpenAI model missing 'id' field: {model}"
            model_name = model["id"]

            if "context_length" in model:
                # Context length is returned in OpenRouter as "context_length"
                context_window_size = model["context_length"]
            else:
                context_window_size = self.get_model_context_window_size(
                    model_name)

            if not context_window_size:
                continue

            # TogetherAI includes the type, which we can use to filter out embedding models
            if self.base_url == "https://api.together.ai/v1":
                if "type" in model and model["type"] != "chat":
                    continue

                # for TogetherAI, we need to skip the models that don't support JSON mode / function calling
                # requests.exceptions.HTTPError: HTTP error occurred: 400 Client Error: Bad Request for url: https://api.together.ai/v1/chat/completions | Status code: 400, Message: {
                #   "error": {
                #     "message": "mistralai/Mixtral-8x7B-v0.1 is not supported for JSON mode/function calling",
                #     "type": "invalid_request_error",
                #     "param": null,
                #     "code": "constraints_model"
                #   }
                # }
                if "config" not in model:
                    continue
                if "chat_template" not in model["config"]:
                    continue
                if model["config"]["chat_template"] is None:
                    continue
                if "tools" not in model["config"]["chat_template"]:
                    continue
                # if "config" in data and "chat_template" in data["config"] and "tools" not in data["config"]["chat_template"]:
                # continue

            configs.append(
                LLMConfig(
                    model=model_name,
                    model_endpoint_type="openai",
                    model_endpoint=self.base_url,
                    context_window=context_window_size,
                    handle=self.get_handle(model_name),
                )
            )

        # for OpenAI, sort in reverse order
        if self.base_url == "https://api.openai.com/v1":
            # alphnumeric sort
            configs.sort(key=lambda x: x.model, reverse=True)

        return configs

    def list_embedding_models(self) -> List[EmbeddingConfig]:

        # TODO: actually automatically list models
        return [
            EmbeddingConfig(
                embedding_model="text-embedding-3-small",
                embedding_endpoint_type="openai",
                embedding_endpoint="https://api.openai.com/v1",
                embedding_dim=1536,
                embedding_chunk_size=300,
                handle=self.get_handle("text-embedding-3-small"),
            ),
            EmbeddingConfig(
                embedding_model="text-embedding-3-small",
                embedding_endpoint_type="openai",
                embedding_endpoint="https://api.openai.com/v1",
                embedding_dim=2000,
                embedding_chunk_size=300,
                handle=self.get_handle("text-embedding-3-small"),
            ),
            EmbeddingConfig(
                embedding_model="text-embedding-3-large",
                embedding_endpoint_type="openai",
                embedding_endpoint="https://api.openai.com/v1",
                embedding_dim=2000,
                embedding_chunk_size=300,
                handle=self.get_handle("text-embedding-3-large"),
            ),
        ]

    def get_model_context_window_size(self, model_name: str):
        if model_name in LLM_MAX_TOKENS:
            return LLM_MAX_TOKENS[model_name]
        else:
            return None


class OllamaProvider(OpenAIProvider):
    """Ollama provider that uses the native /api/generate endpoint

    See: https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-completion
    """

    name: str = "ollama"
    base_url: str = Field(..., description="Base URL for the Ollama API.")
    api_key: Optional[str] = Field(
        None, description="API key for the Ollama API (default: `None`).")
    default_prompt_formatter: str = Field(
        ..., description="Default prompt formatter (aka model wrapper) to use on a /completions style API."
    )

    def list_llm_models(self) -> List[LLMConfig]:
        # https://github.com/ollama/ollama/blob/main/docs/api.md#list-local-models
        import requests

        response = requests.get(f"{self.base_url}/api/tags")
        if response.status_code != 200:
            raise Exception(f"Failed to list Ollama models: {response.text}")
        response_json = response.json()

        configs = []
        for model in response_json["models"]:
            context_window = self.get_model_context_window(model["name"])
            if context_window is None:
                print(f"Ollama model {model['name']} has no context window")
                continue
            configs.append(
                LLMConfig(
                    model=model["name"],
                    model_endpoint_type="ollama",
                    model_endpoint=self.base_url,
                    model_wrapper=self.default_prompt_formatter,
                    context_window=context_window,
                    handle=self.get_handle(model["name"]),
                )
            )
        return configs

    def get_model_context_window(self, model_name: str) -> Optional[int]:

        import requests

        response = requests.post(
            f"{self.base_url}/api/show", json={"name": model_name, "verbose": True})
        response_json = response.json()

        # thank you vLLM: https://github.com/vllm-project/vllm/blob/main/vllm/config.py#L1675
        # possible_keys = [
        #    # OPT
        #    "max_position_embeddings",
        #    # GPT-2
        #    "n_positions",
        #    # MPT
        #    "max_seq_len",
        #    # ChatGLM2
        #    "seq_length",
        #    # Command-R
        #    "model_max_length",
        #    # Others
        #    "max_sequence_length",
        #    "max_seq_length",
        #    "seq_len",
        # ]
        # max_position_embeddings
        # parse model cards: nous, dolphon, llama
        if "model_info" not in response_json:
            if "error" in response_json:
                print(
                    f"Ollama fetch model info error for {model_name}: {response_json['error']}")
            return None
        for key, value in response_json["model_info"].items():
            if "context_length" in key:
                return value
        return None

    def get_model_embedding_dim(self, model_name: str):
        import requests

        response = requests.post(
            f"{self.base_url}/api/show", json={"name": model_name, "verbose": True})
        response_json = response.json()
        if "model_info" not in response_json:
            if "error" in response_json:
                print(
                    f"Ollama fetch model info error for {model_name}: {response_json['error']}")
            return None
        for key, value in response_json["model_info"].items():
            if "embedding_length" in key:
                return value
        return None

    def list_embedding_models(self) -> List[EmbeddingConfig]:
        # https://github.com/ollama/ollama/blob/main/docs/api.md#list-local-models
        import requests

        response = requests.get(f"{self.base_url}/api/tags")
        if response.status_code != 200:
            raise Exception(f"Failed to list Ollama models: {response.text}")
        response_json = response.json()

        configs = []
        for model in response_json["models"]:
            embedding_dim = self.get_model_embedding_dim(model["name"])
            if not embedding_dim:
                print(
                    f"Ollama model {model['name']} has no embedding dimension")
                continue
            configs.append(
                EmbeddingConfig(
                    embedding_model=model["name"],
                    embedding_endpoint_type="ollama",
                    embedding_endpoint=self.base_url,
                    embedding_dim=embedding_dim,
                    embedding_chunk_size=300,
                    handle=self.get_handle(model["name"]),
                )
            )
        return configs
