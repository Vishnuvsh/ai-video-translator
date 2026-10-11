from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response
from app.schemas.video import VideoAnalyzeRequest, VideoAnalyzeResponse, VideoMetadata, VideoTranscribeRequest, VideoTranscribeResponse, VideoTranslateRequest, VideoTranslateResponse, VideoTTSRequest, VideoTTSResponse
from app.services.youtube_service import extract_video_id, is_youtube_url, fetch_video_metadata, download_audio
from app.services.transcription_service import transcribe_audio
from app.services.translation_service import translate_transcript
from app.services.tts_service import generate_speech, get_audio_path
import os
import json
import shutil
import asyncio
from starlette.concurrency import run_in_threadpool

router = APIRouter()

# WebSocket Connection Manager with multi-client support
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)

    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            if websocket in self.active_connections[client_id]:
                self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]

    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            dead_sockets = []
            for ws in self.active_connections[client_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                if ws in self.active_connections.get(client_id, []):
                    self.active_connections[client_id].remove(ws)

manager = ConnectionManager()

@router.websocket("/ws/progress/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
    except Exception:
        manager.disconnect(websocket, client_id)

def format_srt_time(seconds: float) -> str:
    millis = int(round((seconds - int(seconds)) * 1000))
    total_seconds = int(seconds)
    secs = total_seconds % 60
    mins = (total_seconds // 60) % 60
    hours = total_seconds // 3600
    return f"{hours:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def generate_srt(segments: list[dict]) -> str:
    srt_lines = []
    for idx, seg in enumerate(segments, start=1):
        start_time = format_srt_time(seg.get("start", 0.0))
        end_time = format_srt_time(seg.get("end", 0.0))
        text = seg.get("text", "").strip()
        srt_lines.append(f"{idx}\n{start_time} --> {end_time}\n{text}\n")
    return "\n".join(srt_lines)

CACHE_DIR = ".cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cached_transcription(video_id: str):
    cache_path = os.path.join(CACHE_DIR, f"{video_id}_transcription.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return None
    return None

def set_cached_transcription(video_id: str, data: dict):
    cache_path = os.path.join(CACHE_DIR, f"{video_id}_transcription.json")
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except:
        pass


@router.post("/analyze", response_model=VideoAnalyzeResponse)
async def analyze_video(request: VideoAnalyzeRequest):
    """
    Validate a YouTube URL, extract the video ID, fetch metadata,
    and return structured video information.
    """
    url = request.url

    # Step 1: Check if it's a YouTube URL at all
    if not is_youtube_url(url):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid YouTube URL."
        )

    # Step 2: Extract video ID
    video_id = extract_video_id(url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="This YouTube URL format is not supported."
        )

    # Step 3: Fetch metadata via youtube_service
    try:
        metadata = fetch_video_metadata(video_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail="Unable to access this video. It may be private, unavailable, or restricted."
        )
    except RuntimeError:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while analyzing the video. Please try again."
        )

    return VideoAnalyzeResponse(
        success=True,
        video=VideoMetadata(**metadata)
    )


@router.post("/transcribe", response_model=VideoTranscribeResponse)
async def transcribe_video(request: VideoTranscribeRequest):
    """
    Download audio and transcribe it using OpenAI whisper.
    """
    video_id = request.video_id
    if not video_id and request.url:
        video_id = extract_video_id(request.url)
        
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Must provide a valid video_id or YouTube url."
        )

    # Setup Progress Callback
    loop = asyncio.get_running_loop()
    client_id = video_id
    
    def progress_callback(status: str, progress: float, message: str = ""):
        asyncio.run_coroutine_threadsafe(
            manager.send_message(client_id, {"status": status, "progress": progress, "message": message}),
            loop
        )

    try:
        # Check cache first (unless force_refresh is requested)
        if not request.force_refresh:
            progress_callback("cache_check", 0, "Checking cache...")
            cached_result = get_cached_transcription(video_id)
            if cached_result:
                progress_callback("completed", 100, "Loaded from cache successfully!")
                return VideoTranscribeResponse(
                    success=True,
                    video_id=video_id,
                    language=cached_result.get("language", "unknown"),
                    transcript=cached_result.get("transcript", ""),
                    segments=cached_result.get("segments", [])
                )

        progress_callback("downloading", 0, "Starting audio download...")
        audio_path = await run_in_threadpool(download_audio, video_id, progress_callback)
        
        try:
            progress_callback("transcribing", 0, "Starting transcription...")
            result = await run_in_threadpool(transcribe_audio, audio_path, progress_callback)
        finally:
            # Ensure temporary download directory and files are safely cleaned up
            try:
                if audio_path:
                    parent_dir = os.path.dirname(audio_path)
                    if os.path.exists(parent_dir) and "ytdl_" in os.path.basename(parent_dir):
                        shutil.rmtree(parent_dir, ignore_errors=True)
                    elif os.path.exists(audio_path):
                        os.remove(audio_path)
            except Exception:
                pass
        
        # Save to cache for future requests
        set_cached_transcription(video_id, result)
        
        progress_callback("completed", 100, "Transcription completed successfully!")
        return VideoTranscribeResponse(
            success=True,
            video_id=video_id,
            language=result.get("language", "unknown"),
            transcript=result.get("transcript", ""),
            segments=result.get("segments", [])
        )
    except ValueError as e:
        progress_callback("error", 0, str(e))
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        progress_callback("error", 0, f"Transcription failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )


@router.get("/export/srt/{video_id}")
async def export_srt_subtitles(video_id: str):
    """
    Generate and download an SRT subtitle file from cached transcription.
    """
    cached = get_cached_transcription(video_id)
    if not cached or not cached.get("segments"):
        raise HTTPException(status_code=404, detail="Transcription segments not found for this video.")
    
    srt_content = generate_srt(cached["segments"])
    return Response(
        content=srt_content,
        media_type="application/x-subrip",
        headers={"Content-Disposition": f'attachment; filename="{video_id}.srt"'}
    )

@router.post("/translate", response_model=VideoTranslateResponse)
async def translate_video_transcript(request: VideoTranslateRequest):
    """
    Translate the transcript into the selected target languages.
    """
    try:
        translations = translate_transcript(
            transcript=request.transcript,
            segments=[s.model_dump() for s in request.segments] if request.segments else [],
            source_language=request.source_language,
            target_languages=request.target_languages
        )
        return VideoTranslateResponse(
            success=True,
            translations=translations
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

@router.post("/tts", response_model=VideoTTSResponse)
async def generate_video_tts(request: VideoTTSRequest):
    """
    Generate Text-to-Speech using OpenAI.
    """
    # Simple validation of supported voices
    supported_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    voice = request.voice if request.voice in supported_voices else "alloy"
    
    try:
        filename = generate_speech(
            text=request.text,
            language=request.language,
            voice=voice
        )
        return VideoTTSResponse(
            success=True,
            language=request.language,
            audio_url=f"/api/video/audio/{filename}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice generation failed: {str(e)}"
        )

@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """
    Serve generated audio file safely.
    """
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")
        
    file_path = get_audio_path(filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found.")
        
    return FileResponse(file_path, media_type="audio/mpeg", filename=filename)
