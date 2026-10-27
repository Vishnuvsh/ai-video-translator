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

def normalize_lang_code(lang: str) -> str:
    """Normalize language code or name to standard 2-letter code (e.g. 'English' -> 'en', 'EN' -> 'en')."""
    if not lang:
        return ""
    clean = lang.strip().lower()
    if clean in SUPPORTED_LANGUAGES:
        return clean
    for code, name in SUPPORTED_LANGUAGES.items():
        if name.lower() == clean:
            return code
    return clean

def is_language_supported(lang_code: str) -> bool:
    """Check if a language code is supported."""
    return normalize_lang_code(lang_code) in SUPPORTED_LANGUAGES

def get_language_name(lang_code: str) -> str:
    """Get the full name of a language from its code."""
    code = normalize_lang_code(lang_code)
    return SUPPORTED_LANGUAGES.get(code, "Unknown")
