import os
import uuid
import asyncio
import concurrent.futures
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

# Microsoft Edge Neural Voices mapping for high-quality multi-lingual speech
VOICE_MAP = {
    # Indian Languages
    "ml": "ml-IN-SobhanaNeural",
    "malayalam": "ml-IN-SobhanaNeural",
    "hi": "hi-IN-SwaraNeural",
    "hindi": "hi-IN-SwaraNeural",
    "ta": "ta-IN-PallaviNeural",
    "tamil": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "telugu": "te-IN-ShrutiNeural",
    "kn": "kn-IN-SapnaNeural",
    "kannada": "kn-IN-SapnaNeural",
    "bn": "bn-IN-TanishaaNeural",
    "bengali": "bn-IN-TanishaaNeural",
    "mr": "mr-IN-AarohiNeural",
    "marathi": "mr-IN-AarohiNeural",
    "gu": "gu-IN-DhwaniNeural",
    "gujarati": "gu-IN-DhwaniNeural",
    "ur": "ur-IN-GulNeural",
    "urdu": "ur-IN-GulNeural",

    # Global Languages
    "en": "en-US-JennyNeural",
    "english": "en-US-JennyNeural",
    "es": "es-ES-ElviraNeural",
    "spanish": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "french": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "german": "de-DE-KatjaNeural",
    "ar": "ar-SA-ZariyahNeural",
    "arabic": "ar-SA-ZariyahNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "chinese": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "japanese": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "korean": "ko-KR-SunHiNeural",
    "pt": "pt-BR-FranciscaNeural",
    "portuguese": "pt-BR-FranciscaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "russian": "ru-RU-SvetlanaNeural",
    "it": "it-IT-ElsaNeural",
    "italian": "it-IT-ElsaNeural",
    "tr": "tr-TR-EmelNeural",
    "turkish": "tr-TR-EmelNeural",
}

def get_voice_for_language(language: str, preferred_voice: str = None) -> str:
    """Select the best matching neural voice for the specified language."""
    clean_lang = language.lower().strip()
    
    # Check if exact voice name was supplied
    if preferred_voice and "Neural" in preferred_voice:
        return preferred_voice
        
    # Check mapping by code or full name
    if clean_lang in VOICE_MAP:
        return VOICE_MAP[clean_lang]
        
    # Prefix check (e.g. 'en-US' -> 'en')
    short_code = clean_lang.split("-")[0].split("_")[0]
    if short_code in VOICE_MAP:
        return VOICE_MAP[short_code]
        
    return "en-US-JennyNeural"


async def _generate_speech_edge(text: str, voice: str, output_path: str):
    """Generates audio file using edge-tts async API."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


def generate_speech(text: str, language: str, voice: str = "alloy") -> str:
    """
    Generate speech using Microsoft Edge Neural TTS (supporting 100+ languages including Malayalam).
    Returns the generated filename.
    """
    if not text or not text.strip():
        raise ValueError("Cannot generate speech for empty text.")

    # Ensure generated_audio directory exists
    audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_audio")
    os.makedirs(audio_dir, exist_ok=True)

    safe_language = "".join(c for c in language if c.isalnum()) or "unknown"
    filename = f"ai-video-translator-{safe_language}-{uuid.uuid4().hex[:8]}.mp3"
    final_path = os.path.join(audio_dir, filename)

    edge_voice = get_voice_for_language(language, voice)

    # Strategy 1: High-fidelity Edge Neural TTS (Free, natural studio voice, covers Malayalam, Hindi, etc.)
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(asyncio.run, _generate_speech_edge(text, edge_voice, final_path))
            future.result(timeout=60)
        
        if os.path.exists(final_path) and os.path.getsize(final_path) > 0:
            return filename
    except Exception as edge_err:
        logger.warning(f"Edge TTS generation failed: {edge_err}. Attempting OpenAI TTS fallback...")

    # Strategy 2: OpenAI TTS fallback (if OpenAI API is configured with speech capability)
    try:
        client = OpenAI()
        openai_voice = voice if voice in ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] else "alloy"
        response = client.audio.speech.create(
            model="tts-1",
            voice=openai_voice,
            input=text[:4096]
        )
        response.stream_to_file(final_path)
        if os.path.exists(final_path) and os.path.getsize(final_path) > 0:
            return filename
    except Exception as openai_err:
        logger.error(f"OpenAI TTS fallback also failed: {openai_err}")

    raise RuntimeError(f"Speech synthesis failed for language '{language}'. Please try again.")


def get_audio_path(filename: str) -> str:
    audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "generated_audio")
    return os.path.join(audio_dir, filename)
