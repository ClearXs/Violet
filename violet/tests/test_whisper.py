import os

from violet.voice.whisper.whisper import Whisper


cwd = os.getcwd()

example_audio_path = cwd + '/violet/tests/audios/hotwords.mp3'


def test_whisper():

    whisper = Whisper()

    text = whisper.rec(example_audio_path)

    assert text is not None
