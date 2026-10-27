import os
import json
from openai import OpenAI
from app.config.language_config import is_language_supported, get_language_name

def translate_transcript(transcript: str, segments: list[dict], source_language: str, target_languages: list[str]) -> dict[str, dict]:
    """
    Translate the transcript and its segments into the specified target languages.
    """
    # Deduplicate target languages
    target_languages = list(set(target_languages))
    
    # Initialize OpenAI client (relies on env variables)
    client = OpenAI()
    
    translations = {}
    
    for target_lang_code in target_languages:
        if not is_language_supported(target_lang_code):
            translations[target_lang_code] = {"text": f"Error: Language code '{target_lang_code}' is not supported.", "segments": []}
            continue
            
        if source_language == target_lang_code:
            translations[target_lang_code] = {"text": transcript, "segments": segments}
            continue
            
        target_lang_name = get_language_name(target_lang_code)
        
        if segments:
            translated_segments = []
            segment_batches = chunk_segments(segments, max_length=2000)
            error_occurred = False
            
            for batch in segment_batches:
                texts_to_translate = [s.get("text", "") for s in batch]
                prompt = (
                    f"Translate the following subtitle segments into {target_lang_name}.\n"
                    "Requirements:\n"
                    "- Preserve meaning exactly.\n"
                    "- Output MUST be a valid JSON array of strings.\n"
                    "- Each string in the output array MUST correspond to the exact translation of the segment at that index in the input array.\n"
                    "- Do NOT output any Markdown blocks, just raw JSON (start with [ and end with ]).\n\n"
                    f"Input JSON Array:\n{json.dumps(texts_to_translate)}"
                )
                
                max_retries = 3
                chunk_success = False
                last_error = None
                
                for attempt in range(max_retries):
                    try:
                        response = client.chat.completions.create(
                            model="openai/gpt-oss-120b",
                            messages=[
                                {"role": "system", "content": "You are a professional video transcript translator. You only output valid JSON arrays."},
                                {"role": "user", "content": prompt}
                            ],
                            temperature=0.3
                        )
                        
                        content = response.choices[0].message.content.strip()
                        
                        # Robust JSON array extraction
                        start_idx = content.find('[')
                        end_idx = content.rfind(']')
                        
                        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                            content = content[start_idx:end_idx+1]
                        else:
                            raise ValueError(f"No JSON array found in LLM response. Raw response: {content}")
                        
                        try:
                            translated_texts = json.loads(content)
                        except json.JSONDecodeError:
                            raise ValueError(f"Failed to parse JSON array from LLM response: {content}")
                        
                        if not isinstance(translated_texts, list) or len(translated_texts) != len(batch):
                            raise ValueError("Mismatch in number of translated segments or invalid format.")
                            
                        for i, seg in enumerate(batch):
                            translated_segments.append({
                                "start": seg["start"],
                                "end": seg["end"],
                                "text": translated_texts[i]
                            })
                        
                        chunk_success = True
                        break # Success, break out of retry loop
                    except Exception as e:
                        last_error = e
                        # If it fails, the loop will continue to the next attempt
                        
                if not chunk_success:
                    error_occurred = True
                    translations[target_lang_code] = {"text": f"Error: Translation failed after {max_retries} attempts - {str(last_error)}", "segments": []}
                    break
                    
            if not error_occurred:
                full_translated_text = " ".join([s["text"] for s in translated_segments])
                translations[target_lang_code] = {"text": full_translated_text, "segments": translated_segments}
        else:
            # Fallback to pure text translation
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
                        "- Preserve technical terms in English or their recognized form.\n"
                        "- Output MUST be natural and fluent.\n"
                        "- Only output the translated text, with no introductory remarks.\n\n"
                        f"Original Text:\n{chunk}"
                    )
                    
                    response = client.chat.completions.create(
                        model="openai/gpt-oss-120b",
                        messages=[
                            {"role": "system", "content": "You are a professional video transcript translator."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3
                    )
                    translated_chunks.append(response.choices[0].message.content.strip())
                    
                translations[target_lang_code] = {"text": "\n\n".join(translated_chunks), "segments": []}
            except Exception as e:
                translations[target_lang_code] = {"text": f"Error: Translation failed - {str(e)}", "segments": []}
                
    return translations

def chunk_segments(segments: list[dict], max_length: int = 2000) -> list[list[dict]]:
    """Group segments into batches based on total text length."""
    batches = []
    current_batch = []
    current_length = 0
    
    for seg in segments:
        text_len = len(seg.get("text", ""))
        if current_length + text_len > max_length and current_batch:
            batches.append(current_batch)
            current_batch = []
            current_length = 0
            
        current_batch.append(seg)
        current_length += text_len
        
    if current_batch:
        batches.append(current_batch)
        
    return batches

def chunk_text(text: str, max_length: int = 3000) -> list[str]:
    """Split text into chunks by double newline, single newline, or brute force."""
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
            
            if len(paragraph) > max_length:
                lines = paragraph.split('\n')
                for line in lines:
                    if len(current_chunk) + len(line) + 1 <= max_length:
                        current_chunk += line + "\n"
                    else:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                        
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
