"""
Real-Time router
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import re
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from violet.agent.agent_wrapper import AgentWrapper
from violet.log import get_logger
from violet.server.context import get_agent, get_executor, get_server, get_transcription_engine, get_tts_pipeline
from violet.server.router.voice import TTS_Request
from violet.server.server import SyncServer
from violet.voice.TTS_infer_pack.TTS import TTS
from violet.voice.utils import pack_audio, wave_header_chunk
from violet.voice.whisper.live.audio_processor import AudioProcessor, AudioResponseChunk
from violet.voice.whisper.live.core import TranscriptionEngine

logger = get_logger(__name__)

router = APIRouter(prefix='/live', tags=['live'])
separator = r'[.!?。！？]+["\']?\s*$|\.{3,}\s*$|…+\s*$'


async def send_audio_chunk(websocket: WebSocket,
                           tts_request: TTS_Request,
                           tts_pipeline: TTS):
    """
    Sends an audio chunk to the WebSocket client.
    """

    try:
        tts_generator = tts_pipeline.run(tts_request)

        if_first_chunk = True
        for sr, chunk in tts_generator:
            try:
                audio_buffer = BytesIO()

                if if_first_chunk and media_type == "wav":
                    # Get audio sampling channel bit depth...
                    header_data = wave_header_chunk(sample_rate=sr)
                    await websocket.send_json({
                        "type": "header",
                        "sample_rate": sr,
                    })
                    await websocket.send_bytes(header_data)
                    media_type = "raw"
                    if_first_chunk = False

                audio_data = pack_audio(
                    audio_buffer, chunk, sr, media_type).getvalue()

                await websocket.send_json({
                    "type": "chunk",
                    "sample_rate": sr,
                    "chunk_size": len(audio_data),
                    "media_type": media_type
                })
                await websocket.send_bytes(audio_data)

            except WebSocketDisconnect:
                logger.info("WebSocket disconnected during TTS streaming")
                break
            except Exception as e:
                logger.error(f"Error sending audio chunk: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Error sending audio chunk: {str(e)}"
                })
                break

        await websocket.send_json({"type": "tts_complete"})

    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        await websocket.send_json({
            "type": "error",
            "message": f"TTS failed: {str(e)}"
        })


async def speech_to_speech(
        audio_chunk: AudioResponseChunk,
        websocket: WebSocket,
        streaming_mode: bool,
        media_type: str,
        agent: AgentWrapper,
        server: SyncServer,
        tts_pipeline: TTS):
    lines = audio_chunk['lines']
    voice_chunk = "".join(line['text'] for line in lines)

    chat_generator = agent.chat(voice_chunk, stream=True)
    separate_text_chunk = []
    text_chunk = ""

    for chunk in chat_generator:
        text_chunk += chunk.choices[0].delta.content

        if re.search(separator, text_chunk):
            separate_text_chunk.append(text_chunk.strip())
            text_chunk = ""

    if len(separate_text_chunk) == 0:
        separate_text_chunk.append(text_chunk.strip())

    for chunk in separate_text_chunk:

        tts_request = TTS_Request()
        tts_request.text = chunk
        tts_request.text_lang = 'ja'

        personas = server.persona_manager.personas
        ref_audio_path = personas.get_absolute_for(
            personas.config.ref_audio)
        tts_request.ref_audio_path = ref_audio_path
        tts_request.prompt_lang = personas.config.prompt_lang
        tts_request.streaming_mode = streaming_mode
        tts_request.media_type = media_type

        await send_audio_chunk(websocket, tts_request, tts_pipeline)


async def handle_websocket_results(websocket: WebSocket,
                                   results_generator: AsyncGenerator[AudioResponseChunk, None],
                                   streaming_mode: bool,
                                   media_type: str,
                                   agent: AgentWrapper,
                                   server: SyncServer,
                                   tts_pipeline: TTS,
                                   executor: ThreadPoolExecutor):
    """Consumes results from the audio processor and sends them via WebSocket."""
    try:

        merely_future = None

        async for response in results_generator:

            if merely_future is not None and not merely_future.done():
                merely_future.cancelled()

            merely_future = executor.submit(speech_to_speech,
                                            response,
                                            websocket,
                                            streaming_mode,
                                            media_type,
                                            agent,
                                            server,
                                            tts_pipeline)

        # when the results_generator finishes it means all audio has been processed
        logger.info(
            "Results generator finished. Sending 'ready_to_stop' to client.")
        await websocket.send_json({"type": "ready_to_stop"})
    except WebSocketDisconnect:
        logger.info(
            "WebSocket disconnected while handling results (client likely closed connection).")
    except Exception as e:
        logger.exception(f"Error in WebSocket results handler: {e}")


@router.websocket("/ws")
async def live(websocket: WebSocket,
               streaming_mode: bool = Query(True),
               media_type: str = Query("wav"),
               agent: AgentWrapper = Depends(get_agent),
               server: SyncServer = Depends(get_server),
               tts_pipeline: TTS = Depends(get_tts_pipeline),
               transcription_engine: TranscriptionEngine = Depends(
                   get_transcription_engine),
               executor: ThreadPoolExecutor = Depends(get_executor)):
    """
    Real-time Speech-To-Speech websocket endpoint.
    """
    audio_processor = AudioProcessor(
        transcription_engine=transcription_engine,
    )
    await websocket.accept()

    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(
        handle_websocket_results(websocket, results_generator,
                                 streaming_mode, media_type, agent, server, tts_pipeline, executor)
    )

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
