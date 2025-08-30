from argparse import Namespace

from violet.utils.file import get_absolute_path
from violet.voice.whisper.whisper import Whisper


class TranscriptionEngine:
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, whisper: Whisper, **kwargs):
        if TranscriptionEngine._initialized:
            return

        defaults = {
            "vac": True,
            "vac_chunk_size": 0.04,
            "vad": True,
        }

        config_dict = {**defaults, **kwargs}
        self.args = Namespace(**config_dict)

        self.asr = None
        self.tokenizer = None
        self.diarization = None
        self.vac_model = None

        if self.args.vac:
            import torch
            vad = whisper.config.vad
            self.vac_model, _ = torch.hub.load(
                repo_or_dir=get_absolute_path(vad), source="local", model="silero_vad")

        # reference whisper model for fast whisper
        self.asr = whisper.model

        TranscriptionEngine._initialized = True
