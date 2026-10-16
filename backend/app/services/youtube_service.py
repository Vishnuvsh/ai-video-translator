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


def get_cookie_file() -> Optional[str]:
    """
    Find or generate a path to cookies.txt if provided.
    Supports:
    1. Render secret file path: /etc/secrets/cookies.txt
    2. Explicit env var path: YOUTUBE_COOKIES_FILE
    3. Env var content: YOUTUBE_COOKIES (written to temp file)
    4. Local file: ./cookies.txt or ../cookies.txt
    """
    candidates = [
        "/etc/secrets/cookies.txt",
        os.getenv("YOUTUBE_COOKIES_FILE"),
        os.path.join(os.getcwd(), "cookies.txt"),
        os.path.join(os.getcwd(), "backend", "cookies.txt"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "cookies.txt"),
    ]
    for path in candidates:
        if path and os.path.isfile(path) and os.path.getsize(path) > 0:
            return os.path.abspath(path)

    raw_content = os.getenv("YOUTUBE_COOKIES") or os.getenv("YOUTUBE_COOKIES_CONTENT")
    if raw_content:
        temp_dir = tempfile.gettempdir()
        temp_cookie_path = os.path.join(temp_dir, "yt_cookies.txt")
        try:
            with open(temp_cookie_path, "w", encoding="utf-8") as f:
                f.write(raw_content)
            return temp_cookie_path
        except Exception:
            pass

    return None


_METADATA_CACHE: dict[str, dict] = {}


def fetch_innertube_metadata(video_id: str) -> Optional[dict]:
    """
    Fetch metadata via YouTube's official internal player endpoint (InnerTube).
    Executes in ~0.2-0.3s (15x-20x faster than yt-dlp).
    """
    try:
        url = "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
        payload = json.dumps({
            "videoId": video_id,
            "context": {
                "client": {
                    "clientName": "ANDROID",
                    "clientVersion": "20.10.38"
                }
            }
        }).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
            }
        )
        with urllib.request.urlopen(req, timeout=6) as response:
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

    cookie_file = get_cookie_file()
    if cookie_file:
        ydl_opts["cookiefile"] = cookie_file
    proxy = os.getenv("YOUTUBE_PROXY")
    if proxy:
        ydl_opts["proxy"] = proxy

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


def _parse_timedtext_xml(xml_content: str) -> list[dict]:
    """Parse timedtext XML (supports format 3 <p> and format 1 <text>)."""
    import xml.etree.ElementTree as ET
    import html as html_module

    root = ET.fromstring(xml_content)
    segments = []

    p_nodes = root.findall(".//p")
    if p_nodes:
        for p in p_nodes:
            t_ms = p.attrib.get("t")
            d_ms = p.attrib.get("d", "0")
            if t_ms is None:
                continue
            start_sec = round(int(t_ms) / 1000.0, 2)
            dur_sec = round(int(d_ms) / 1000.0, 2)
            end_sec = round(start_sec + dur_sec, 2)

            text_nodes = p.findall(".//s")
            if text_nodes:
                line_text = "".join(node.text or "" for node in text_nodes)
            else:
                line_text = "".join(p.itertext())

            line_text = html_module.unescape(line_text).strip()
            line_text = " ".join(line_text.split())
            if line_text:
                segments.append({
                    "start": start_sec,
                    "end": end_sec,
                    "text": line_text
                })
    else:
        for t in root.findall(".//text"):
            start = float(t.attrib.get("start", 0.0))
            dur = float(t.attrib.get("dur", 0.0))
            line_text = html_module.unescape("".join(t.itertext())).strip()
            line_text = " ".join(line_text.split())
            if line_text:
                segments.append({
                    "start": round(start, 2),
                    "end": round(start + dur, 2),
                    "text": line_text
                })

    return segments


def fetch_youtube_captions(video_id: str) -> Optional[dict]:
    """
    Fetch native or auto-generated YouTube captions directly.
    Multi-layered strategy:
    1. Direct Android InnerTube Player API + timedtext XML (bypasses cloud datacenter IP blocks, ~0.3s)
    2. youtube_transcript_api modern .fetch()
    3. youtube_transcript_api legacy .get_transcript()
    """
    # Strategy 1: Direct InnerTube Android player API (never blocked on cloud/datacenter IPs)
    try:
        player_url = "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
        payload = json.dumps({
            "videoId": video_id,
            "context": {
                "client": {
                    "clientName": "ANDROID",
                    "clientVersion": "20.10.38"
                }
            }
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
            captions_data = data.get("captions", {}).get("playerCaptionsTracklistRenderer", {})
            tracks = captions_data.get("captionTracks", [])

            if tracks:
                # Select best track: manual English > auto English > any manual > first track
                chosen_track = None
                for t in tracks:
                    lang = t.get("languageCode", "")
                    kind = t.get("kind", "")
                    if lang.startswith("en") and kind != "asr":
                        chosen_track = t
                        break
                if not chosen_track:
                    for t in tracks:
                        if t.get("languageCode", "").startswith("en"):
                            chosen_track = t
                            break
                if not chosen_track:
                    for t in tracks:
                        if t.get("kind") != "asr":
                            chosen_track = t
                            break
                if not chosen_track:
                    chosen_track = tracks[0]

                raw_url = chosen_track.get("baseUrl")
                if raw_url:
                    sub_req = urllib.request.Request(
                        raw_url,
                        headers={
                            "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
                            "Accept-Language": "en-US,en;q=0.9",
                        }
                    )
                    with urllib.request.urlopen(sub_req, timeout=8) as s_resp:
                        xml_content = s_resp.read().decode("utf-8")
                        segments = _parse_timedtext_xml(xml_content)
                        if segments:
                            full_text = " ".join(s["text"] for s in segments)
                            lang_code = chosen_track.get("languageCode", "en")
                            if "-" in lang_code:
                                lang_code = lang_code.split("-")[0]
                            return {
                                "transcript": full_text,
                                "language": lang_code,
                                "segments": segments
                            }
    except Exception:
        pass

    # Strategy 2: youtube_transcript_api modern .fetch()
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        import requests
        session = requests.Session()
        cookie_file = get_cookie_file()
        if cookie_file:
            import http.cookiejar
            try:
                jar = http.cookiejar.MozillaCookieJar(cookie_file)
                jar.load(ignore_discard=True, ignore_expires=True)
                session.cookies = jar
            except Exception:
                pass
        proxy = os.getenv("YOUTUBE_PROXY")
        if proxy:
            session.proxies = {"http": proxy, "https": proxy}

        api = YouTubeTranscriptApi(http_client=session)
        res = api.fetch(video_id)
        raw = res.to_raw_data() if hasattr(res, "to_raw_data") else None
        if raw:
            segments = []
            full_text_parts = []
            for s in raw:
                text = s.get("text", "").strip()
                if not text:
                    continue
                start = float(s.get("start", 0.0))
                duration = float(s.get("duration", 0.0))
                segments.append({
                    "start": round(start, 2),
                    "end": round(start + duration, 2),
                    "text": text
                })
                full_text_parts.append(text)

            if segments:
                lang_code = getattr(res, "language_code", "en") or "en"
                if "-" in lang_code:
                    lang_code = lang_code.split("-")[0]
                return {
                    "transcript": " ".join(full_text_parts),
                    "language": lang_code,
                    "segments": segments
                }
    except Exception:
        pass

    # Strategy 3: youtube_transcript_api legacy .get_transcript()
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        if hasattr(YouTubeTranscriptApi, "get_transcript"):
            raw = YouTubeTranscriptApi.get_transcript(video_id)
            if raw:
                segments = []
                full_text_parts = []
                for s in raw:
                    text = s.get("text", "").strip()
                    if not text:
                        continue
                    start = float(s.get("start", 0.0))
                    duration = float(s.get("duration", 0.0))
                    segments.append({
                        "start": round(start, 2),
                        "end": round(start + duration, 2),
                        "text": text
                    })
                    full_text_parts.append(text)

                if segments:
                    return {
                        "transcript": " ".join(full_text_parts),
                        "language": "en",
                        "segments": segments
                    }
    except Exception:
        pass

    return None



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
                'player_client': ['android', 'android_creator', 'tv_embedded']
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

    cookie_file = get_cookie_file()
    if cookie_file:
        ydl_opts['cookiefile'] = cookie_file
    proxy = os.getenv("YOUTUBE_PROXY")
    if proxy:
        ydl_opts['proxy'] = proxy
    
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
        if "sign in to confirm you're not a bot" in error_msg or "bot" in error_msg:
            raise ValueError("YouTube has rate-limited automated audio streaming on this cloud server. Please try a video with captions enabled.")
        raise ValueError(f"Unable to access video audio: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error while downloading audio: {str(e)}")
