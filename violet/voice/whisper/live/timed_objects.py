from dataclasses import dataclass
from typing import Optional


@dataclass
class TimedText:
    start: Optional[float]
    end: Optional[float]
    text: Optional[str] = ''
    speaker: Optional[int] = -1
    probability: Optional[float] = None
    is_dummy: Optional[bool] = False


@dataclass
class ASRToken(TimedText):
    def with_offset(self, offset: float) -> "ASRToken":
        """Return a new token with the time offset added."""
        return ASRToken(self.start + offset, self.end + offset, self.text, self.speaker, self.probability)


@dataclass
class Sentence(TimedText):
    pass


@dataclass
class Transcript(TimedText):
    pass


@dataclass
class SpeakerSegment(TimedText):
    """Represents a segment of audio attributed to a specific speaker.
    No text nor probability is associated with this segment.
    """
    pass


@dataclass
class Silence():
    duration: float
