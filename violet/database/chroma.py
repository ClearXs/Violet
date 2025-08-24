import chromadb
import os
from violet.config import VioletConfig


config = VioletConfig.get_config()
base_path = config.base_path

chroma = chromadb.PersistentClient(os.path.join(base_path, "chroma"))
