import violet
from violet.agent.agent_wrapper import AgentWrapper
from violet.config import VioletConfig
from violet.interface import QueuingInterface
from violet.log import get_logger
from violet.server.server import SyncServer
from violet.utils.utils import log_telemetry
from violet.voice.TTS_infer_pack.TTS import TTS
from violet.voice.whisper.whisper import Whisper
from violet.settings import model_settings

"""
Violet System context. provider global instances (such as tts_pipeline whisper etc...) initialization, retrieval, destroy...
"""

logger = get_logger(__name__)

agent: AgentWrapper = None
interface = QueuingInterface(debug=violet.utils.utils.DEBUG)
server = SyncServer(default_interface_factory=lambda: interface)
tts_pipeline: TTS = None
whisper_handler: Whisper = None


def setup_agent():
    """
    initialize agent wrapper
    """
    global agent

    llm_config = VioletConfig.get_llm_config()
    embedding_config = VioletConfig.get_embedding_config()
    agent = AgentWrapper(llm_config=llm_config,
                         embedding_config=embedding_config)

    log_telemetry(
        logger=logger,
        event="initialize",
        **{"module": "agent", "status": "successful"})


def setup_model():
    """
    Setup the basic model and embedding model.
    """

    if model_settings.lazy_load == False:
        set_model()
        set_embedding_model()

        log_telemetry(
            logger=logger,
            event="initialize",
            **{"module": "model", "status": "successful"})


def setup_tts():
    """
    Setup the text-to-speech
    """
    if model_settings.lazy_load == False:
        set_tts_pipeline()

        log_telemetry(
            logger=logger,
            event="initialize",
            **{"module": "tts", "status": "successful"})


def setup_whisper():
    """
    Setup the whisper model.
    """
    if model_settings.lazy_load == False:
        set_whisper_handler()

        log_telemetry(
            logger=logger,
            event="initialize",
            **{"module": "whisper", "status": "successful"})


def setup():
    """
    Unify setup system context method
    """
    setup_agent()
    setup_model()
    setup_tts()
    setup_whisper()


def get_agent():
    """
    Get the global agent instance.
    """
    global agent

    return agent


def get_server():
    """
    Get the global server instance.
    """
    global server

    return server


def get_tts_pipeline():
    """
    Get the global TTS pipeline instance. When tts is None
    Then once again initialize the TTS pipeline.
    """

    global tts_pipeline

    if tts_pipeline is None:
        set_tts_pipeline()

    return tts_pipeline


def get_whisper_handler():
    """
    Get the global Whisper handler instance. When whisper_handler is None
    Then once again initialize the Whisper handler.
    """

    global whisper_handler

    if whisper_handler is None:
        set_whisper_handler()

    return whisper_handler


def close():
    close_model()
    close_embedding_model()
    close_tts_pipeline()
    close_whisper_handler()


def close_model():
    from violet.local_llm import uninstall_model

    llm_config = VioletConfig.get_llm_config()
    uninstall_model(llm_config)

    log_telemetry(
        logger=logger,
        event="close",
        **{"module": "model", "status": "successful"})


def close_embedding_model():
    from violet.local_llm import uninstall_embedding_model

    embedding_config = VioletConfig.get_embedding_config()
    uninstall_embedding_model(embedding_config)

    log_telemetry(
        logger=logger,
        event="close",
        **{"module": "embedding model", "status": "successful"})


def close_tts_pipeline():
    global tts_pipeline

    if tts_pipeline is not None:
        tts_pipeline.close()
        del tts_pipeline

    log_telemetry(
        logger=logger,
        event="close",
        **{"module": "tts", "status": "successful"})


def close_whisper_handler():
    global whisper_handler

    if whisper_handler is not None:
        whisper_handler.close()
        del whisper_handler

    log_telemetry(
        logger=logger,
        event="close",
        **{"module": "whisper model", "status": "successful"})


def set_tts_pipeline():
    global tts_pipeline

    tts_pipeline = TTS(VioletConfig.get_tts_config())

    log_telemetry(
        logger=logger,
        event="initialize",
        **{"module": "tts", "status": "successful"})


def set_whisper_handler():
    global whisper_handler

    whisper_handler = Whisper(VioletConfig.get_whisper_config())

    log_telemetry(
        logger=logger,
        event="initialize",
        **{"module": "whisper", "status": "successful"})


def set_model():
    """
    Set the model and load local model (if type is llama, mlx) if force is True for the agent.
    """
    llm_config = VioletConfig.get_llm_config()

    from violet.local_llm import load_model
    load_model(llm_config)


def set_embedding_model():
    """
    Set the embedding model, if force whether True will be load model
    """
    embedding_config = VioletConfig.get_embedding_config()

    from violet.local_llm import load_embedding_model

    load_embedding_model(embedding_config)
