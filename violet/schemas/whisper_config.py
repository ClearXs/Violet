from typing import Literal, Optional
from pydantic import BaseModel

from violet.utils.file import get_absolute_path


class WhisperConfig(BaseModel):
    # like model/whisper or other api server model
    model: str
    engine: Literal['whisper']

    # api server endpoint
    endpoint: Optional[str] = None
    # api key
    api_key: Optional[str] = None

    def get_model_path(self):
        return get_absolute_path(self.model)

    @classmethod
    def default_config(cls):
        return cls(
            model="model/whisper",
            engine="whisper",
            endpoint=None,
            api_key=None
        )
