from Mind.Brain.llama_serve import LlamaServer


def test_chat_completion():
    server = LlamaServer(
        model_path="/Users/jiangwei/Python/AI/models/OpenBMB/BitCPM4-1B-GGUF/BitCPM4-1B-q4_0.gguf")
    response = server.chat_completion([
        {"role": "user", "content": "翻译文本:'你的名字' 成英语"}
    ])

    response = server.chat_completion([
        {"role": "user", "content": "翻译文本:'你的名字' 成英语"}
    ])

    response = server.chat_completion([
        {"role": "user", "content": "翻译文本:'你的名字' 成英语"}
    ])

    assert response is not None
    assert "choices" in response
    assert len(response["choices"]) > 0
