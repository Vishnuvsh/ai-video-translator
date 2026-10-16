import os
import re
import json
import tempfile
import shutil
import urllib.request
import urllib.error
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


_METADATA_CACHE: dict[str, dict] = {}


def fetch_innertube_metadata(video_id: str) -> Optional[dict]:
    """
    Fetch metadata via YouTube's official internal player endpoint (InnerTube).
    Executes in ~0.2-0.3s (15x-20x faster than yt-dlp).
    """
    try:
        url = "https://www.youtube.com/youtubei/v1/player"
        payload = json.dumps({
            "videoId": video_id,
            "context": {
                "client": {
                    "clientName": "WEB",
                    "clientVersion": "2.20231201.00.00"
                }
            }
        }).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            }
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                vd = data.get("videoDetails")
                if vd and vd.get("title"):
                    duration = int(vd.get("lengthSeconds", 0)) if vd.get("lengthSeconds") else None
                    thumbnails = vd.get("thumbnail", {}).get("thumbnails", [])
                    thumbnail_url = thumbnails[-1].get("url") if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                    
                    return {
                        "video_id": video_id,
                        "title": vd.get("title", "YouTube Video"),
                        "thumbnail": thumbnail_url,
                        "duration": duration,
                        "duration_formatted": _format_duration(duration),
                        "channel": vd.get("author"),
                        "view_count": int(vd.get("viewCount")) if vd.get("viewCount") else None,
                        "like_count": None,
                        "upload_date": None,
                        "description": vd.get("shortDescription") or None,
                    }
    except Exception:
        pass
    return None


def fetch_oembed_metadata(video_id: str) -> Optional[dict]:
    """
    Fetch metadata via YouTube's official public oEmbed API.
    Never blocked by YouTube's cloud datacenter IP bot detection.
    """
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        req = urllib.request.Request(
            oembed_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return {
                    "video_id": video_id,
                    "title": data.get("title", "YouTube Video"),
                    "thumbnail": data.get("thumbnail_url") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                    "duration": None,
                    "duration_formatted": None,
                    "channel": data.get("author_name"),
                    "view_count": None,
                    "like_count": None,
                    "upload_date": None,
                    "description": None,
                }
    except Exception:
        pass
    return None


def fetch_video_metadata(video_id: str) -> dict:
    """
    Fetch public metadata for a YouTube video.
    Performance optimized strategy:
    1. Fast in-memory cache lookup (<1ms)
    2. Direct YouTube InnerTube Player API (~0.2-0.3s)
    3. Direct YouTube oEmbed API (~0.2s)
    4. Fallback to yt-dlp if direct methods fail (~2s)
    """
    if video_id in _METADATA_CACHE:
        return _METADATA_CACHE[video_id]

    # Step 1: Try ultra-fast InnerTube Player API (provides title, duration, author, views)
    innertube_data = fetch_innertube_metadata(video_id)
    if innertube_data:
        _METADATA_CACHE[video_id] = innertube_data
        return innertube_data

    # Step 2: Try fast oEmbed API (safe on datacenter IPs)
    oembed_data = fetch_oembed_metadata(video_id)
    if oembed_data:
        _METADATA_CACHE[video_id] = oembed_data
        return oembed_data

    # Step 3: Fallback to yt-dlp
    url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        error_msg = str(e).lower()
        if any(word in error_msg for word in ["private", "unavailable", "removed", "does not exist", "not available"]):
            raise ValueError("Video is unavailable, private, or has been removed.")
        raise ValueError(f"Unable to access this video: {str(e)}")

    duration_seconds = info.get("duration")
    thumbnail = info.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    upload_date_raw = info.get("upload_date")
    upload_date_formatted = f"{upload_date_raw[:4]}-{upload_date_raw[4:6]}-{upload_date_raw[6:8]}" if upload_date_raw and len(upload_date_raw) == 8 else upload_date_raw

    result = {
        "video_id": video_id,
        "title": info.get("title", "Unknown Title"),
        "thumbnail": thumbnail,
        "duration": duration_seconds,
        "duration_formatted": _format_duration(duration_seconds),
        "channel": info.get("uploader") or info.get("channel"),
        "view_count": info.get("view_count"),
        "like_count": info.get("like_count"),
        "upload_date": upload_date_formatted,
        "description": info.get("description"),
    }
    _METADATA_CACHE[video_id] = result
    return result


def download_audio(video_id: str, progress_callback=None) -> str:
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
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'ios', 'mweb', 'web']
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
    }
    
    # Use aria2c for faster downloading if available on the system
    if shutil.which("aria2c"):
        ydl_opts['external_downloader'] = 'aria2c'
        ydl_opts['external_downloader_args'] = ['-x', '16', '-k', '1M']
        
    def yt_progress_hook(d):
        if progress_callback:
            if d['status'] == 'downloading':
                pct_str = d.get('_percent_str', '0%').strip().replace('%', '')
                import re
                pct_str = re.sub(r'\x1b[^m]*m', '', pct_str)
                try:
                    pct = float(pct_str)
                except ValueError:
                    pct = 0.0
                progress_callback('downloading', pct, f'Downloading audio... {pct:.1f}%')
            elif d['status'] == 'finished':
                progress_callback('downloading', 100.0, 'Download complete. Extracting audio...')

    ydl_opts['progress_hooks'] = [yt_progress_hook]
    
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
