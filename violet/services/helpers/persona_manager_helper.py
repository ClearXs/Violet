import os
from typing import Optional

import yaml
from violet.config import VioletConfig
from violet.schemas.personas import Config, Persona


class Personas(Persona):
    """
    Aggravate persona config and extract persona information. like prompt text, ref_audio_path etc..
    """

    # persona prompt
    character_setting: Optional[str] = None
    config: Optional[Config] = None

    @classmethod
    def from_persona(cls, persona: Persona):
        """
        From specify persona build more persona information.
        """
        current = cls(**persona.model_dump())

        # check path whether existing.

        if os.path.exists(VioletConfig.get_absolute_path(current.r_path)) is False:
            raise FileNotFoundError(
                f"Persona Resource path {current.r_path} does not exist.")

        current._extract_prompt_config()

        return current

    def _extract_prompt_config(self):
        persona_dir_path = VioletConfig.get_absolute_path(self.r_path)
        config_path = os.path.join(persona_dir_path, 'config.yaml')

        if os.path.exists(config_path):

            with open(config_path, 'r') as f:
                configs = yaml.safe_load(f)
                self.config = Config.model_validate(configs)

            cs_path = os.path.join(
                persona_dir_path, self.config.character_setting)

            with open(cs_path, 'r') as f:
                self.character_setting = f.read()

    def get_absolute_for(self, name: str) -> str:

        return os.path.join(self.r_path, name)
