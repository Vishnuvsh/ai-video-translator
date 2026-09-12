import os
from openai import OpenAI
from app.config.language_config import is_language_supported, get_language_name

def translate_transcript(transcript: str, source_language: str, target_languages: list[str]) -> dict[str, str]:
    """
    Translate the transcript into the specified target languages.
    """
    # Deduplicate target languages
    target_languages = list(set(target_languages))
    
    # Initialize OpenAI client (relies on env variables)
    client = OpenAI()
    
    translations = {}
    
    for target_lang_code in target_languages:
        if not is_language_supported(target_lang_code):
            translations[target_lang_code] = f"Error: Language code '{target_lang_code}' is not supported."
            continue
            
        if source_language == target_lang_code:
            translations[target_lang_code] = transcript
            continue
            
        target_lang_name = get_language_name(target_lang_code)
        
        # Simple chunking by paragraphs (newlines) to respect token limits
        # Using a conservative chunk size of 3000 chars per chunk
        chunks = chunk_text(transcript, max_length=3000)
        translated_chunks = []
        
        try:
            for chunk in chunks:
                if not chunk.strip():
                    continue
                    
                prompt = (
                    f"Translate the following transcript text into {target_lang_name}.\n"
                    "Requirements:\n"
                    "- Preserve meaning exactly. Do not summarize or remove information.\n"
                    "- Preserve technical terms (e.g., programming languages, libraries, names) in English or their recognized form.\n"
                    "- Output MUST be natural and fluent.\n"
                    "- Preserve paragraph structure.\n"
                    "- Only output the translated text, with no introductory or concluding remarks.\n\n"
                    f"Original Text:\n{chunk}"
                )
                
                response = client.chat.completions.create(
                    model="llama3-70b-8192",  # Default Groq model for general NLP tasks
                    messages=[
                        {"role": "system", "content": "You are a professional video transcript translator."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                translated_text = response.choices[0].message.content.strip()
                translated_chunks.append(translated_text)
                
            translations[target_lang_code] = "\n\n".join(translated_chunks)
            
        except Exception as e:
            translations[target_lang_code] = f"Error: Translation failed - {str(e)}"
            
    return translations

def chunk_text(text: str, max_length: int = 3000) -> list[str]:
    """
    Split text into chunks by double newline, single newline, or brute force,
    ensuring no chunk exceeds max_length.
    """
    if len(text) <= max_length:
        return [text]
        
    chunks = []
    paragraphs = text.split('\n\n')
    
    current_chunk = ""
    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) + 2 <= max_length:
            current_chunk += paragraph + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""
            
            # If a single paragraph is longer than max_length, split by newline
            if len(paragraph) > max_length:
                lines = paragraph.split('\n')
                for line in lines:
                    if len(current_chunk) + len(line) + 1 <= max_length:
                        current_chunk += line + "\n"
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        
                        # If a single line is too long, just brute force split
                        if len(line) > max_length:
                            for i in range(0, len(line), max_length):
                                chunks.append(line[i:i+max_length])
                            current_chunk = ""
                        else:
                            current_chunk = line + "\n"
            else:
                current_chunk = paragraph + "\n\n"
                
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    return chunks
