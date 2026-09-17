import os
import uuid
import math
from pydub import AudioSegment
from openai import OpenAI

# 4096 is the max characters for OpenAI TTS API
MAX_TTS_CHARS = 4096

def generate_speech(text: str, language: str, voice: str = "alloy") -> str:
    """
    Generate speech using OpenAI TTS. Returns the generated file path.
    Chunks text if it is too long.
    """
    client = OpenAI()
    
    # Ensure generated_audio directory exists
    audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_audio")
    os.makedirs(audio_dir, exist_ok=True)
    
    safe_language = "".join(c for c in language if c.isalnum()) or "unknown"
    filename = f"ai-video-translator-{safe_language}-{uuid.uuid4().hex[:8]}.mp3"
    final_path = os.path.join(audio_dir, filename)
    
    # User requested to show a custom message instead of dummy audio
    raise Exception("This feature is not configured yet. It will be available in a future update.")

def get_audio_path(filename: str) -> str:
    audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_audio")
    return os.path.join(audio_dir, filename)
