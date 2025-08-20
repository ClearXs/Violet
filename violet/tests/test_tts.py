import os
import pytest

from violet.voice.TTS_infer_pack.TTS import TTS, TTS_Config

cwd = os.getcwd()

ref_audio_path = cwd + \
    '/violet/tests/audios/【默认】あの時、汝を目にしたんじゃ。当時は確か人の姿はなく、ただ意識を持っていただけじゃったがの。.wav'

config_path = "violet/voice/configs/tts_infer.yaml"

output_path = cwd + \
    '/violet/tests/output/output.wav'

if os.path.exists(output_path):
    import pathlib
    pathlib.Path(output_path).parent.mkdir(parents=True, exist_ok=True)


@pytest.fixture
def tts_request():
    return {
        "text": 'あなたは誰ですか',
        "text_lang": "ja",
        "ref_audio_path": ref_audio_path,
        "aux_ref_audio_paths": None,
        "prompt_text": 'あの時、汝を目にしたんじゃ。当時は確か人の姿はなく、ただ意識を持っていただけじゃったがの。',
        "prompt_lang": 'ja',
        "top_k": 5,
        "top_p": 1,
        "temperature": 1,
        "text_split_method": 'cut0',
        "batch_size": 1,
        "batch_threshold": 0.75,
        "speed_factor": 1.0,
        "split_bucket": True,
        "fragment_interval": 0.3,
        "seed": -1,
        "media_type": 'wav',
        "streaming_mode": False,
        "parallel_infer": True,
        "repetition_penalty": 1.35,
        "sample_steps": 32,
        "super_sampling": False,
    }


@pytest.fixture
def tts_pipeline():
    tts_config = TTS_Config(config_path)
    return TTS(tts_config)


@pytest.mark.asyncio
async def test_tts(tts_request, tts_pipeline):
    from datetime import datetime

    generator = tts_pipeline.run(tts_request)

    start_time = datetime.now().timestamp()
    sampling_rate, audio_data = next(generator)

    end_time = datetime.now().timestamp()

    print(f"elapse time {end_time - start_time}")

    import soundfile as sf
    sf.write(output_path, audio_data, sampling_rate)
