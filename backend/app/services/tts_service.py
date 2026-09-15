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
    
    # Safe chunking by length
    if len(text) <= MAX_TTS_CHARS:
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text
        )
        response.stream_to_file(final_path)
    else:
        # Text is too long, we need to chunk it safely
        chunks = []
        current_chunk = ""
        words = text.split(" ")
        for word in words:
            if len(current_chunk) + len(word) + 1 <= MAX_TTS_CHARS:
                current_chunk += (word + " ")
            else:
                chunks.append(current_chunk.strip())
                current_chunk = word + " "
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        chunk_files = []
        try:
            for i, chunk_text in enumerate(chunks):
                if not chunk_text:
                    continue
                chunk_filename = os.path.join(audio_dir, f"temp_{uuid.uuid4().hex}_{i}.mp3")
                response = client.audio.speech.create(
                    model="tts-1",
                    voice=voice,
                    input=chunk_text
                )
                response.stream_to_file(chunk_filename)
                chunk_files.append(chunk_filename)
            
            # Combine them using pydub
            if not chunk_files:
                raise ValueError("No text to generate")
                
            combined = AudioSegment.from_mp3(chunk_files[0])
            for chunk_file in chunk_files[1:]:
                next_part = AudioSegment.from_mp3(chunk_file)
                combined += next_part
                
            combined.export(final_path, format="mp3")
        finally:
            # Clean up temp files
            for cf in chunk_files:
                if os.path.exists(cf):
                    os.remove(cf)
                    
    return filename

def get_audio_path(filename: str) -> str:
    audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_audio")
    return os.path.join(audio_dir, filename)
