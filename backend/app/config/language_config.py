SUPPORTED_LANGUAGES = {
    "en": "English",
    "ml": "Malayalam",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ar": "Arabic"
}

def is_language_supported(lang_code: str) -> bool:
    """Check if a language code is supported."""
    return lang_code in SUPPORTED_LANGUAGES

def get_language_name(lang_code: str) -> str:
    """Get the full name of a language from its code."""
    return SUPPORTED_LANGUAGES.get(lang_code, "Unknown")
