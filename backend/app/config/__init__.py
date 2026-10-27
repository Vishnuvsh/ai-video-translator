import os
from openai import OpenAI

def get_openai_client() -> OpenAI:
    """
    Returns an OpenAI client instance.
    If the key is a Groq key (starts with 'gsk_') and OPENAI_BASE_URL is not set,
    it automatically configures Groq's base URL to avoid 401/400 errors.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    
    if not base_url and api_key and api_key.startswith("gsk_"):
        base_url = "https://api.groq.com/openai/v1"
        
    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    return OpenAI(api_key=api_key)

