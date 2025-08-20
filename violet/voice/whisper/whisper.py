from faster_whisper import WhisperModel
from violet.config import VioletConfig
from violet.log import get_logger
from violet.utils import log_telemetry

import pathlib


logger = get_logger(__name__)


local_whisper_model = None


class Whisper:

    model: WhisperModel = None

    def __init__(self):
        global local_whisper_model

        if local_whisper_model is not None:
            self.model = local_whisper_model
        else:
            # load local model
            config = VioletConfig.get_config()
            model_storage_path = config.model_storage_path

            whisper_model_path = pathlib.Path(model_storage_path) / 'whisper'

            if whisper_model_path.exists() is False:
                # download whisper model from huggingface
                log_telemetry(logger=logger, event='download_model',
                              **{"model": "whisper tiny model", "path": str(whisper_model_path)})

                import faster_whisper

                faster_whisper.download("tiny", str(whisper_model_path))

            # load whisper model
            log_telemetry(logger=logger, event='load_model',
                          **{"model": "whisper tiny model", "path": str(whisper_model_path)})

            self.model = WhisperModel(str(whisper_model_path),
                                      device="cpu", compute_type="int8")

            local_whisper_model = self.model

    def rec(self, audio_path: str) -> str:
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

        return "".join(texts)
