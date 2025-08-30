from datetime import datetime
import os
import pytest

from violet.voice.TTS_infer_pack.TTS import TTS, TTS_Config
from violet.voice.text.english import g2p
from violet.constants import VIOLET_DIR

config_path = VIOLET_DIR + "/tts_infer.yaml"

cwd = os.getcwd()

ref_audio_path = cwd + \
    '/violet/tests/audios/【默认】あの時、汝を目にしたんじゃ。当時は確か人の姿はなく、ただ意識を持っていただけじゃったがの。.wav'

output_path = cwd + \
    '/violet/tests/output/output.wav'


output_en_path = cwd + \
    '/violet/tests/output/output_en.wav'

if os.path.exists(output_path):
    import pathlib
    pathlib.Path(output_path).parent.mkdir(parents=True, exist_ok=True)

if os.path.exists(output_en_path):
    import pathlib
    pathlib.Path(output_en_path).parent.mkdir(parents=True, exist_ok=True)


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
    generator = tts_pipeline.run(tts_request)

    start_time = datetime.now().timestamp()
    sampling_rate, audio_data = next(generator)

    end_time = datetime.now().timestamp()

    print(f"elapse time {end_time - start_time}")

    import soundfile as sf
    sf.write(output_path, audio_data, sampling_rate)


@pytest.mark.asyncio
async def test_en_tts(tts_request, tts_pipeline):
    tts_request["text"] = "Who are you?"
    tts_request['prompt_test'] = None

    generator = tts_pipeline.run(tts_request)

    start_time = datetime.now().timestamp()
    sampling_rate, audio_data = next(generator)

    end_time = datetime.now().timestamp()

    print(f"elapse time {end_time - start_time}")

    import soundfile as sf
    sf.write(output_en_path, audio_data, sampling_rate)


@pytest.mark.asyncio
async def test_en_word():
    output = g2p("hello")

    print(output)
