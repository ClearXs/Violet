from typing import List
from violet.voice.whisper.live.timed_objects import ASRToken
from violet.voice.whisper.whisper import Whisper


class LiveWhisper(Whisper):
    sep = " "

    def __init__(self, config):
        super().__init__(config)

        self.transcribe_kargs = {}

    def transcribe(self, audio, init_prompt=""):
        segments, info = self.model.transcribe(
            audio,
            initial_prompt=init_prompt,
            beam_size=5,
            word_timestamps=True,
            condition_on_previous_text=True,
            **self.transcribe_kargs,
        )
        return list(segments)

    def ts_words(self, r) -> List[ASRToken]:
        """
        Converts the whisper_timestamped result to a list of ASRToken objects.
        """
        tokens = []
        for segment in r:
            for word in segment.words:
                token = ASRToken(word.start, word.end, word.word)
                tokens.append(token)
        return tokens

    def segments_end_ts(self, res) -> List[float]:
        return [segment.end for segment in res]

    def use_vad(self):
        self.transcribe_kargs["vad"] = True

    def set_translate_task(self):
        self.transcribe_kargs["task"] = "translate"
