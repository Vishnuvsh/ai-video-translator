import os
import re
import tempfile
from typing import Optional
import yt_dlp


# Regex patterns for supported YouTube URL formats
YOUTUBE_URL_PATTERNS = [
    # Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    r"(?:https?://)?(?:www\.)?youtube\.com/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})",
    # Short URL: https://youtu.be/VIDEO_ID
    r"(?:https?://)?youtu\.be/([a-zA-Z0-9_-]{11})",
    # Shorts URL: https://www.youtube.com/shorts/VIDEO_ID
    r"(?:https?://)?(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})",
    # Embed URL: https://www.youtube.com/embed/VIDEO_ID
    r"(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})",
]


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract the YouTube video ID from a URL.
    Returns the video ID string if found, otherwise None.
    """
    for pattern in YOUTUBE_URL_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def is_youtube_url(url: str) -> bool:
    """Check if the URL is a recognised YouTube URL."""
    return extract_video_id(url) is not None


def _format_duration(seconds: Optional[int]) -> Optional[str]:
    """Convert duration in seconds to MM:SS or HH:MM:SS string."""
    if seconds is None:
        return None
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def fetch_video_metadata(video_id: str) -> dict:
    """
    Fetch public metadata for a YouTube video using yt-dlp in metadata-only mode.
    Raises:
        ValueError: if the video is unavailable/private.
        RuntimeError: for unexpected errors.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        # Do NOT download anything
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        # Avoid writing any files
        "noplaylist": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if any(word in error_msg for word in ["private", "unavailable", "removed", "does not exist", "not available"]):
            raise ValueError("Video is unavailable, private, or has been removed.")
        raise ValueError(f"Unable to access this video: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error while fetching metadata: {str(e)}")

    duration_seconds = info.get("duration")

    # Best thumbnail: prefer hqdefault, fall back to whatever yt-dlp provides
    thumbnail = info.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

    return {
        "video_id": video_id,
        "title": info.get("title", "Unknown Title"),
        "thumbnail": thumbnail,
        "duration": duration_seconds,
        "duration_formatted": _format_duration(duration_seconds),
        "channel": info.get("uploader") or info.get("channel"),
    }


def download_audio(video_id: str) -> str:
    """
    Download the audio for a YouTube video to a temporary file.
    Returns the absolute path to the downloaded audio file.
    The caller is responsible for deleting the file after use.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Create a temporary directory that won't be deleted automatically
    # so we can return the file path and let the caller clean it up.
    temp_dir = tempfile.mkdtemp(prefix="ytdl_")
    output_template = os.path.join(temp_dir, f"{video_id}.%(ext)s")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # The file will be named {video_id}.mp3 because of the postprocessor
        expected_file = os.path.join(temp_dir, f"{video_id}.mp3")
        if not os.path.exists(expected_file):
            raise RuntimeError("Audio file was not created successfully.")
            
        return expected_file
        
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if any(word in error_msg for word in ["private", "unavailable", "removed", "does not exist", "not available"]):
            raise ValueError("Audio unavailable: Video is private or has been removed.")
        raise ValueError(f"Unable to access video audio: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error while downloading audio: {str(e)}")
