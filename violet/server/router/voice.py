import asyncio
from fastapi.params import Depends
from pydantic import BaseModel
from violet.config import VioletConfig
from violet.log import get_logger
from violet.schemas.tts_config import TTS_Config
from violet.server.context import get_transcription_engine, get_tts_pipeline, get_whisper_handler
from violet.voice.TTS_infer_pack.text_segmentation_method import get_method_names as get_cut_method_names
from violet.voice.TTS_infer_pack.TTS import TTS
from io import BytesIO
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi import APIRouter,  File, Query, Request, Response, UploadFile, WebSocket, WebSocketDisconnect
import soundfile as sf
import numpy as np
import wave
import subprocess
import os
from typing import Generator

from violet.voice.whisper.live.audio_processor import AudioProcessor
from violet.voice.whisper.live.core import TranscriptionEngine
from violet.voice.whisper.whisper import Whisper

logger = get_logger(__name__)

# print(sys.path)
cut_method_names = get_cut_method_names()

router = APIRouter(prefix='/voice', tags=['voice'])


async def shutdown_gracefully():
    global tts_pipeline

    if tts_pipeline:
        tts_pipeline.close()


class TTS_Request(BaseModel):
    text: str = None
    text_lang: str = None
    ref_audio_path: str = None
    aux_ref_audio_paths: list = None
    prompt_lang: str = None
    prompt_text: str = ""
    top_k: int = 5
    top_p: float = 1
    temperature: float = 1
    text_split_method: str = "cut5"
    batch_size: int = 1
    batch_threshold: float = 0.75
    split_bucket: bool = True
    speed_factor: float = 1.0
    fragment_interval: float = 0.3
    seed: int = -1
    media_type: str = "wav"
    streaming_mode: bool = False
    parallel_infer: bool = True
    repetition_penalty: float = 1.35
    sample_steps: int = 32
    super_sampling: bool = False


# modify from https://github.com/RVC-Boss/GPT-SoVITS/pull/894/files
def pack_ogg(io_buffer: BytesIO, data: np.ndarray, rate: int):
    with sf.SoundFile(io_buffer, mode="w", samplerate=rate, channels=1, format="ogg") as audio_file:
        audio_file.write(data)
    return io_buffer


def pack_raw(io_buffer: BytesIO, data: np.ndarray, rate: int):
    io_buffer.write(data.tobytes())
    return io_buffer


def pack_wav(io_buffer: BytesIO, data: np.ndarray, rate: int):
    io_buffer = BytesIO()
    sf.write(io_buffer, data, rate, format="wav")
    return io_buffer


def pack_aac(io_buffer: BytesIO, data: np.ndarray, rate: int):
    process = subprocess.Popen(
        [
            "ffmpeg",
            "-f",
            "s16le",  # 输入16位有符号小端整数PCM
            "-ar",
            str(rate),  # 设置采样率
            "-ac",
            "1",  # 单声道
            "-i",
            "pipe:0",  # 从管道读取输入
            "-c:a",
            "aac",  # 音频编码器为AAC
            "-b:a",
            "192k",  # 比特率
            "-vn",  # 不包含视频
            "-f",
            "adts",  # 输出AAC数据流格式
            "pipe:1",  # 将输出写入管道
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    out, _ = process.communicate(input=data.tobytes())
    io_buffer.write(out)
    return io_buffer


def pack_audio(io_buffer: BytesIO, data: np.ndarray, rate: int, media_type: str):
    if media_type == "ogg":
        io_buffer = pack_ogg(io_buffer, data, rate)
    elif media_type == "aac":
        io_buffer = pack_aac(io_buffer, data, rate)
    elif media_type == "wav":
        io_buffer = pack_wav(io_buffer, data, rate)
    else:
        io_buffer = pack_raw(io_buffer, data, rate)
    io_buffer.seek(0)
    return io_buffer


# from https://huggingface.co/spaces/coqui/voice-chat-with-mistral/blob/main/app.py
def wave_header_chunk(frame_input=b"", channels=1, sample_width=2, sample_rate=32000):
    # This will create a wave header then append the frame input
    # It should be first on a streaming wav file
    # Other frames better should not have it (else you will hear some artifacts each chunk start)
    wav_buf = BytesIO()
    with wave.open(wav_buf, "wb") as vfout:
        vfout.setnchannels(channels)
        vfout.setsampwidth(sample_width)
        vfout.setframerate(sample_rate)
        vfout.writeframes(frame_input)

    wav_buf.seek(0)
    return wav_buf.read()


def check_params(req: dict, tts_config: TTS_Config):
    text: str = req.get("text", "")
    text_lang: str = req.get("text_lang", "")
    ref_audio_path: str = req.get("ref_audio_path", "")
    streaming_mode: bool = req.get("streaming_mode", False)
    media_type: str = req.get("media_type", "wav")
    prompt_lang: str = req.get("prompt_lang", "")
    text_split_method: str = req.get("text_split_method", "cut5")

    if ref_audio_path in [None, ""]:
        return JSONResponse(status_code=400, content={"message": "ref_audio_path is required"})
    if text in [None, ""]:
        return JSONResponse(status_code=400, content={"message": "text is required"})
    if text_lang in [None, ""]:
        return JSONResponse(status_code=400, content={"message": "text_lang is required"})
    elif text_lang.lower() not in tts_config.languages:
        return JSONResponse(
            status_code=400,
            content={
                "message": f"text_lang: {text_lang} is not supported in version {tts_config.version}"},
        )
    if prompt_lang in [None, ""]:
        return JSONResponse(status_code=400, content={"message": "prompt_lang is required"})
    elif prompt_lang.lower() not in tts_config.languages:
        return JSONResponse(
            status_code=400,
            content={
                "message": f"prompt_lang: {prompt_lang} is not supported in version {tts_config.version}"},
        )
    if media_type not in ["wav", "raw", "ogg", "aac"]:
        return JSONResponse(status_code=400, content={"message": f"media_type: {media_type} is not supported"})
    elif media_type == "ogg" and not streaming_mode:
        return JSONResponse(status_code=400, content={"message": "ogg format is not supported in non-streaming mode"})

    if text_split_method not in cut_method_names:
        return JSONResponse(
            status_code=400, content={"message": f"text_split_method:{text_split_method} is not supported"}
        )

    return None


async def tts_handle(req: dict, tts_pipeline: TTS):
    """
    Text to speech handler.

    Args:
        req (dict):
            {
                "text": "",                   # str.(required) text to be synthesized
                "text_lang: "",               # str.(required) language of the text to be synthesized
                "ref_audio_path": "",         # str.(required) reference audio path
                "aux_ref_audio_paths": [],    # list.(optional) auxiliary reference audio paths for multi-speaker synthesis
                "prompt_text": "",            # str.(optional) prompt text for the reference audio
                "prompt_lang": "",            # str.(required) language of the prompt text for the reference audio
                "top_k": 5,                   # int. top k sampling
                "top_p": 1,                   # float. top p sampling
                "temperature": 1,             # float. temperature for sampling
                "text_split_method": "cut5",  # str. text split method, see text_segmentation_method.py for details.
                "batch_size": 1,              # int. batch size for inference
                "batch_threshold": 0.75,      # float. threshold for batch splitting.
                "split_bucket: True,          # bool. whether to split the batch into multiple buckets.
                "speed_factor":1.0,           # float. control the speed of the synthesized audio.
                "fragment_interval":0.3,      # float. to control the interval of the audio fragment.
                "seed": -1,                   # int. random seed for reproducibility.
                "media_type": "wav",          # str. media type of the output audio, support "wav", "raw", "ogg", "aac".
                "streaming_mode": False,      # bool. whether to return a streaming response.
                "parallel_infer": True,       # bool.(optional) whether to use parallel inference.
                "repetition_penalty": 1.35    # float.(optional) repetition penalty for T2S model.
                "sample_steps": 32,           # int. number of sampling steps for VITS model V3.
                "super_sampling": False,       # bool. whether to use super-sampling for audio when using VITS model V3.
            }
    returns:
        StreamingResponse: audio stream response.
    """

    streaming_mode = req.get("streaming_mode", False)
    return_fragment = req.get("return_fragment", False)
    media_type = req.get("media_type", "wav")

    check_res = check_params(req, tts_pipeline.configs)
    if check_res is not None:
        return check_res

    if streaming_mode or return_fragment:
        req["return_fragment"] = True

    try:
        tts_generator = tts_pipeline.run(req)

        if streaming_mode:

            def streaming_generator(tts_generator: Generator, media_type: str):
                if_frist_chunk = True
                for sr, chunk in tts_generator:
                    if if_frist_chunk and media_type == "wav":
                        yield wave_header_chunk(sample_rate=sr)
                        media_type = "raw"
                        if_frist_chunk = False
                    yield pack_audio(BytesIO(), chunk, sr, media_type).getvalue()

            # _media_type = f"audio/{media_type}" if not (streaming_mode and media_type in ["wav", "raw"]) else f"audio/x-{media_type}"
            return StreamingResponse(
                streaming_generator(
                    tts_generator,
                    media_type,
                ),
                media_type=f"audio/{media_type}",
            )

        else:
            sr, audio_data = next(tts_generator)
            audio_data = pack_audio(
                BytesIO(), audio_data, sr, media_type).getvalue()
            return Response(audio_data, media_type=f"audio/{media_type}")
    except Exception as e:
        return JSONResponse(status_code=400, content={"message": "tts failed", "Exception": str(e)})


@router.get("/tts")
async def tts_get_endpoint(
    text: str | None = Query(None, description="Text to be synthesized"),
    text_lang: str | None = Query(
        None, description="Language of the text to be synthesized"),
    ref_audio_path: str | None = Query(
        None, description="Reference audio path"),
    aux_ref_audio_paths: list[str] | None = Query(
        None, description="Auxiliary reference audio paths for multi-speaker synthesis"),
    prompt_lang: str | None = Query(
        None, description="Language of the prompt text for the reference audio"),
    prompt_text: str = Query(
        "", description="Prompt text for the reference audio"),
    top_k: int = Query(5, description="Top k sampling"),
    top_p: float = Query(1.0, description="Top p sampling"),
    temperature: float = Query(1.0, description="Temperature for sampling"),
    text_split_method: str = Query("cut0", description="Text split method"),
    batch_size: int = Query(1, description="Batch size for inference"),
    batch_threshold: float = Query(
        0.75, description="Threshold for batch splitting"),
    split_bucket: bool = Query(
        True, description="Whether to split the batch into multiple buckets"),
    speed_factor: float = Query(
        1.0, description="Control the speed of the synthesized audio"),
    fragment_interval: float = Query(
        0.3, description="Control the interval of the audio fragment"),
    seed: int = Query(-1, description="Random seed for reproducibility"),
    media_type: str = Query(
        "wav", description="Media type of the output audio, support wav, raw, ogg, aac"),
    streaming_mode: bool = Query(
        False, description="Whether to return a streaming response"),
    parallel_infer: bool = Query(
        True, description="Whether to use parallel inference"),
    repetition_penalty: float = Query(
        1.35, description="Repetition penalty for T2S model"),
    sample_steps: int = Query(
        32, description="Number of sampling steps for VITS model V3"),
    super_sampling: bool = Query(
        False, description="Whether to use super-sampling for audio when using VITS model V3"),
    tts_pipeline: TTS = Depends(get_tts_pipeline)
):
    req = {
        "text": text,
        "text_lang": text_lang.lower(),
        "ref_audio_path": ref_audio_path,
        "aux_ref_audio_paths": aux_ref_audio_paths,
        "prompt_text": prompt_text,
        "prompt_lang": prompt_lang.lower(),
        "top_k": top_k,
        "top_p": top_p,
        "temperature": temperature,
        "text_split_method": text_split_method,
        "batch_size": int(batch_size),
        "batch_threshold": float(batch_threshold),
        "speed_factor": float(speed_factor),
        "split_bucket": split_bucket,
        "fragment_interval": fragment_interval,
        "seed": seed,
        "media_type": media_type,
        "streaming_mode": streaming_mode,
        "parallel_infer": parallel_infer,
        "repetition_penalty": float(repetition_penalty),
        "sample_steps": int(sample_steps),
        "super_sampling": super_sampling,
    }
    return await tts_handle(req, tts_pipeline)


@router.post("/tts")
async def tts_post_endpoint(request: TTS_Request,
                            tts_pipeline: TTS = Depends(get_tts_pipeline)):
    req = request.model_dump()
    return await tts_handle(req, tts_pipeline)


@router.post('/asr')
async def asr_endpoint(audio_file: UploadFile = File(...),
                       whisper_handler: Whisper = Depends(get_whisper_handler)):

    config = VioletConfig.get_config()
    file_storage_path = config.file_storage_path

    filename = audio_file.filename
    data = await audio_file.read()
    file_path = os.path.join(file_storage_path, filename)
    with open(file_path, "wb") as f:
        f.write(data)

    try:
        text, language = whisper_handler.rec(file_path)

        return {"text": text, "language": language}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"ASR failed {str(e)}"})


@router.post('/asr/raw')
async def asr_raw_endpoint(request: Request,
                           whisper_handler: Whisper = Depends(get_whisper_handler)):
    """
    ASR endpoint for raw blob data sent as request body

    Args:
        request: FastAPI Request object containing raw audio blob
        whisper_handler: Whisper instance for speech recognition

    Returns:
        JSONResponse with transcribed text and detected language
    """
    config = VioletConfig.get_config()
    file_storage_path = config.file_storage_path

    import uuid
    import time
    temp_filename = f"temp_audio_{int(time.time())}_{uuid.uuid4().hex[:8]}.webm"
    temp_file_path = os.path.join(file_storage_path, temp_filename)

    audio_data = await request.body()
    with open(temp_file_path, "wb") as f:
        f.write(audio_data)

    wav_path = temp_file_path.replace(".webm", ".wav")

    try:
        audio_data = await request.body()

        with open(temp_file_path, "wb") as f:
            f.write(audio_data)

        text, language = whisper_handler.rec(wav_path)

        return {"text": text, "language": language}
    except Exception as e:
        return {"message": "ASR failed", "Exception": str(e)}
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


async def handle_websocket_results(websocket, results_generator):
    """Consumes results from the audio processor and sends them via WebSocket."""
    try:
        async for response in results_generator:
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


@router.websocket("/live")
async def live(websocket: WebSocket,
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
