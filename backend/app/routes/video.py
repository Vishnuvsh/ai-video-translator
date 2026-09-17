from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.schemas.video import VideoAnalyzeRequest, VideoAnalyzeResponse, VideoMetadata, VideoTranscribeRequest, VideoTranscribeResponse, VideoTranslateRequest, VideoTranslateResponse, VideoTTSRequest, VideoTTSResponse
from app.services.youtube_service import extract_video_id, is_youtube_url, fetch_video_metadata, download_audio
from app.services.transcription_service import transcribe_audio
from app.services.translation_service import translate_transcript
from app.services.tts_service import generate_speech, get_audio_path
import os

router = APIRouter()


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

    try:
        audio_path = download_audio(video_id)
        result = transcribe_audio(audio_path)
        return VideoTranscribeResponse(
            success=True,
            video_id=video_id,
            language=result.get("language", "unknown"),
            transcript=result.get("transcript", ""),
            segments=result.get("segments", [])
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
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
