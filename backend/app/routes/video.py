from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response
from app.schemas.video import VideoAnalyzeRequest, VideoAnalyzeResponse, VideoMetadata, VideoTranscribeRequest, VideoTranscribeResponse, VideoTranslateRequest, VideoTranslateResponse, VideoTTSRequest, VideoTTSResponse
from app.services.youtube_service import extract_video_id, is_youtube_url, fetch_video_metadata, download_audio, fetch_youtube_captions
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

def get_cached_translations(video_id: str) -> dict:
    if not video_id:
        return {}
    cache_path = os.path.join(CACHE_DIR, f"{video_id}_translations.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def set_cached_translations(video_id: str, new_translations: dict):
    if not video_id:
        return
    cache_path = os.path.join(CACHE_DIR, f"{video_id}_translations.json")
    try:
        data = get_cached_translations(video_id)
        data.update(new_translations)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
    except Exception:
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
        metadata = await run_in_threadpool(fetch_video_metadata, video_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e) if str(e) else "Unable to access this video. It may be private, unavailable, or restricted."
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

        # Strategy 1: Ultra-fast native/auto-generated YouTube transcript (<0.5s, no audio download, no cloud bot blocking)
        progress_callback("transcribing", 20, "Extracting video transcript...")
        caption_data = await run_in_threadpool(fetch_youtube_captions, video_id)
        if caption_data and caption_data.get("segments"):
            set_cached_transcription(video_id, caption_data)
            progress_callback("completed", 100, "Transcription completed successfully!")
            return VideoTranscribeResponse(
                success=True,
                video_id=video_id,
                language=caption_data.get("language", "unknown"),
                transcript=caption_data.get("transcript", ""),
                segments=caption_data.get("segments", [])
            )

        # Strategy 2: Fallback to audio download + Whisper AI speech recognition
        progress_callback("downloading", 0, "Starting audio download...")
        audio_path = await run_in_threadpool(download_audio, video_id, progress_callback)
        
        try:
            progress_callback("transcribing", 0, "Starting transcription with Whisper AI...")
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

@router.get("/translations/{video_id}")
async def get_video_translations(video_id: str):
    """
    Get all previously cached translations for a video so already translated
    languages load immediately.
    """
    cached = get_cached_translations(video_id)
    return {"success": True, "video_id": video_id, "translations": cached}


@router.post("/translate", response_model=VideoTranslateResponse)
async def translate_video_transcript(request: VideoTranslateRequest):
    """
    Translate the transcript into the selected target languages.
    Uses cached translations if already available for instant response.
    """
    video_id = request.video_id
    cached_translations = get_cached_translations(video_id) if video_id else {}
    
    # Check which languages are already cached and which still need translating
    needed_languages = [
        lang for lang in request.target_languages 
        if lang not in cached_translations or (
            (isinstance(cached_translations[lang], dict) and cached_translations[lang].get("text", "").startswith("Error:")) or
            (isinstance(cached_translations[lang], str) and cached_translations[lang].startswith("Error:"))
        )
    ]
    
    results = {lang: cached_translations[lang] for lang in request.target_languages if lang in cached_translations and lang not in needed_languages}
    
    if needed_languages:
        try:
            new_translations = await run_in_threadpool(
                translate_transcript,
                transcript=request.transcript,
                segments=[s.model_dump() for s in request.segments] if request.segments else [],
                source_language=request.source_language,
                target_languages=needed_languages
            )
            results.update(new_translations)
            if video_id:
                # Cache successful translations
                successful_to_cache = {
                    k: v for k, v in new_translations.items()
                    if not (
                        (isinstance(v, dict) and v.get("text", "").startswith("Error:")) or
                        (isinstance(v, str) and v.startswith("Error:"))
                    )
                }
                if successful_to_cache:
                    set_cached_translations(video_id, successful_to_cache)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Translation failed: {str(e)}"
            )
            
    return VideoTranslateResponse(
        success=True,
        translations=results
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
        return VideoTTSResponse(
            success=False,
            language=request.language,
            message=str(e)
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


@router.get("/debug-captions/{video_id}")
async def debug_captions(video_id: str):
    import urllib.request
    import json
    logs = []
    try:
        player_url = "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
        payload = json.dumps({
            "videoId": video_id,
            "context": {"client": {"clientName": "ANDROID", "clientVersion": "20.10.38"}}
        }).encode("utf-8")
        req = urllib.request.Request(
            player_url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
            }
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            status = data.get("playabilityStatus", {}).get("status")
            captions_data = data.get("captions", {}).get("playerCaptionsTracklistRenderer", {})
            tracks = captions_data.get("captionTracks", [])
            logs.append(f"InnerTube status: {status}, tracks: {len(tracks)}")
            if tracks:
                first_url = tracks[0].get("baseUrl")
                logs.append(f"First track: lang={tracks[0].get('languageCode')}, kind={tracks[0].get('kind')}")
                sub_req = urllib.request.Request(
                    first_url,
                    headers={
                        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
                        "Accept-Language": "en-US,en;q=0.9",
                    }
                )
                try:
                    with urllib.request.urlopen(sub_req, timeout=8) as s_resp:
                        content = s_resp.read().decode("utf-8")
                        logs.append(f"Timedtext XML length: {len(content)}")
                        from app.services.youtube_service import _parse_timedtext_xml
                        segs = _parse_timedtext_xml(content)
                        logs.append(f"Parsed segments: {len(segs)}")
                except Exception as te:
                    logs.append(f"Timedtext error: {type(te).__name__}: {str(te)}")
    except Exception as e:
        logs.append(f"InnerTube error: {type(e).__name__}: {str(e)}")

    from app.services.youtube_service import get_cookie_file, fetch_youtube_captions
    cookie_path = get_cookie_file()
    logs.append(f"Cookie file detected: {cookie_path} (exists={bool(cookie_path)})")

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        import requests
        session = requests.Session()
        if cookie_path:
            import http.cookiejar
            try:
                jar = http.cookiejar.MozillaCookieJar(cookie_path)
                jar.load(ignore_discard=True, ignore_expires=True)
                session.cookies = jar
                logs.append(f"Loaded {len(jar)} cookies into session")
            except Exception as ce:
                logs.append(f"Cookie load error: {ce}")
        api = YouTubeTranscriptApi(http_client=session)
        res = api.fetch(video_id)
        logs.append(f"youtube_transcript_api: {len(res.to_raw_data())} items")
    except Exception as e:
        logs.append(f"youtube_transcript_api error: {type(e).__name__}: {str(e)}")

    try:
        cap = fetch_youtube_captions(video_id)
        logs.append(f"fetch_youtube_captions result: {bool(cap)} (segments={len(cap.get('segments', [])) if cap else 0})")
    except Exception as e:
        logs.append(f"fetch_youtube_captions error: {type(e).__name__}: {str(e)}")

    try:
        import yt_dlp
        ydl_opts = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['web_safari', 'ios', 'mweb']
                }
            }
        }
        if cookie_path:
            ydl_opts['cookiefile'] = cookie_path
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            logs.append(f"yt_dlp success: title='{info.get('title')}', formats={len(info.get('formats', []))}")
    except Exception as ye:
        logs.append(f"yt_dlp error: {type(ye).__name__}: {str(ye)}")

    return {"video_id": video_id, "logs": logs}