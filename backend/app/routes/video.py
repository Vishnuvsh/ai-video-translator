from fastapi import APIRouter, HTTPException
from app.schemas.video import VideoAnalyzeRequest, VideoAnalyzeResponse, VideoMetadata, VideoTranscribeRequest, VideoTranscribeResponse
from app.services.youtube_service import extract_video_id, is_youtube_url, fetch_video_metadata, download_audio
from app.services.transcription_service import transcribe_audio

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
            transcript=result.get("transcript", "")
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
