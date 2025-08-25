import json
from violet.agent import Agent
from violet.utils.utils import parse_json


class ResourceMemoryAgent(Agent):
    def __init__(
        self,
        **kwargs
    ):
        # load parent class init
        super().__init__(**kwargs)
