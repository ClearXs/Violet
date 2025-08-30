import os
import pytest

from violet.schemas.whisper_config import WhisperConfig
from violet.voice.whisper.whisper import Whisper


cwd = os.getcwd()

example_audio_path = cwd + '/violet/tests/audios/hotwords.mp3'


@pytest.fixture
def config():
    return WhisperConfig(model="models/whisper", engine='whisper')


def test_whisper(config):

    whisper = Whisper(config)

    text = whisper.rec(example_audio_path)

    assert text is not None
