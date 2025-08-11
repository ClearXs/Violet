from typing import List
from llama_cpp import ChatCompletionRequestMessage, Llama


class LlamaServer:

    llm: Llama = None

    def __init__(self, model_path: str):
        self.__load_model(model_path)

    def __load_model(self, model_path: str):
        self.llm = Llama(
            model_path=model_path,
            # n_gpu_layers=-1, # Uncomment to use GPU acceleration
            # seed=1337, # Uncomment to set a specific seed
            # n_ctx=2048, # Uncomment to increase the context window
        )

    def chat_completion(self, messages: List[ChatCompletionRequestMessage]):
        response = self.llm.create_chat_completion(
            messages=messages,
            max_tokens=128,
            stop=["\n"],
        )
        return response
