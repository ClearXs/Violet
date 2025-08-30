"""
Real-Time router
"""
import asyncio
from fastapi import APIRouter, Depends, Query, WebSocketDisconnect
from websocket import WebSocket
from violet.agent.agent_wrapper import AgentWrapper
from violet.log import get_logger
from violet.server.context import get_agent, get_server, get_transcription_engine, get_tts_pipeline
from violet.server.server import SyncServer
from violet.voice.TTS_infer_pack.TTS import TTS
from violet.voice.whisper.live.audio_processor import AudioProcessor
from violet.voice.whisper.live.core import TranscriptionEngine

logger = get_logger(__name__)

router = APIRouter(prefix='/live', tags=['live'])


async def handle_websocket_results(websocket: WebSocket, results_generator):
    """Consumes results from the audio processor and sends them via WebSocket."""
    try:
        async for response in results_generator:
            text_chunk = ""

            await websocket.send_json(response)
        # when the results_generator finishes it means all audio has been processed
        logger.info(
            "Results generator finished. Sending 'ready_to_stop' to client.")
        await websocket.send_json({"type": "ready_to_stop"})
    except WebSocketDisconnect:
        logger.info(
            "WebSocket disconnected while handling results (client likely closed connection).")
    except Exception as e:
        logger.exception(f"Error in WebSocket results handler: {e}")


@router.websocket("/")
async def live(websocket: WebSocket,
               streaming_mode: bool = Query(True),
               media_type: str = Query("wav"),
               agent: AgentWrapper = Depends(get_agent),
               server: SyncServer = Depends(get_server),
               tts_pipeline: TTS = Depends(get_tts_pipeline),
               transcription_engine: TranscriptionEngine = Depends(get_transcription_engine)):
    """
    Real-time Speech-To-Speech websocket endpoint.
    """
    audio_processor = AudioProcessor(
        transcription_engine=transcription_engine,
    )
    await websocket.accept()

    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(
        handle_websocket_results(websocket, results_generator))

    try:
        while True:
            message = await websocket.receive_bytes()
            await audio_processor.process_audio(message)
    except KeyError as e:
        if 'bytes' in str(e):
            logger.warning(f"Client has closed the connection.")
        else:
            logger.error(
                f"Unexpected KeyError in websocket_endpoint: {e}", exc_info=True)
    except WebSocketDisconnect:
        logger.info(
            "WebSocket disconnected by client during message receiving loop.")
    except Exception as e:
        logger.error(
            f"Unexpected error in websocket_endpoint main loop: {e}", exc_info=True)
    finally:
        logger.info("Cleaning up WebSocket endpoint...")
        if not websocket_task.done():
            websocket_task.cancel()
        try:
            await websocket_task
        except asyncio.CancelledError:
            logger.info("WebSocket results handler task was cancelled.")
        except Exception as e:
            logger.warning(
                f"Exception while awaiting websocket_task completion: {e}")

        await audio_processor.cleanup()
        logger.info("WebSocket endpoint cleaned up successfully.")
