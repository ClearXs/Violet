import gc
import os
import threading
from typing import Tuple
from faster_whisper import WhisperModel
from violet.config import VioletConfig
from violet.log import get_logger
from violet.utils.utils import log_telemetry
from violet.schemas.whisper_config import WhisperConfig

logger = get_logger(__name__)

model_lock = threading.Lock()
local_whisper_model = None


def _load_whisper_model(model_path):
    global local_whisper_model

    with model_lock:
        local_whisper_model = WhisperModel(str(model_path),
                                           device="cpu", compute_type="int8")

        return local_whisper_model


class Whisper:

    model: WhisperModel = None
    config: WhisperConfig = None

    def __init__(self, config: WhisperConfig):
        engine = config.engine

        if engine != 'whisper':
            raise ValueError(f"Unsupported engine: {engine}")

        if local_whisper_model is not None:
            self.model = local_whisper_model
        else:
            self.set_whisper_model(config)

    def set_whisper_model(self, config: WhisperConfig):
        whisper_model_path = config.get_model_path()

        if not os.path.exists(whisper_model_path):
            # download whisper model from huggingface
            log_telemetry(logger=logger, event='download_model',
                          **{"model": "whisper tiny model", "path": whisper_model_path})

            import faster_whisper

            faster_whisper.download("tiny", whisper_model_path)

        self.model = _load_whisper_model(whisper_model_path)
        self.config = config

        import threading
        threading.Thread(target=self.warmup, daemon=True).start()

        # load whisper model
        log_telemetry(logger=logger, event='load_model',
                      **{"model": "whisper tiny model", "path": whisper_model_path})

    def rec(self, audio_path: str) -> Tuple[str, str]:
        """
        Specify audio path use whisper model proceed ASR (Automatic Speech Recognition)

        Args:
            audio_path: audio local path

        Returns:
            Combination of all transcribed texts
        """

        logger.debug(f"transcribe audio {audio_path}")

        import os

        if os.path.exists(audio_path) is False:
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        segments, info = self.model.transcribe(audio_path, beam_size=5)

        logger.debug(
            f"Detected language '{info.language}' with probability {info.language_probability}")

        texts = []
        for segment in segments:
            texts.append(segment.text)

        return "".join(texts), info.language

    def close(self):
        global local_whisper_model

        if local_whisper_model is not None:
            del local_whisper_model
            gc.collect()

    def warmup(self):
        # load prepare warm up whisper model
        if self.model is not None:
            tmp_audio_path = os.path.join(VioletConfig.tmp_dir, "hotwords.mp3")
            self.rec(tmp_audio_path)
