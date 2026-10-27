import re
import time
import os
import json
from openai import OpenAI
from app.config import get_openai_client
from app.config.language_config import is_language_supported, get_language_name, normalize_lang_code

import concurrent.futures

# Models ordered by quality with automatic rate-limit fallback
FALLBACK_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
]

def _call_llm_with_retry(client: OpenAI, messages: list[dict], max_tokens: int = 2500, temperature: float = 0.3) -> str:
    """
    Executes a chat completion with automatic model fallback and rate-limit backoff.
    If a 429 rate limit is encountered on one model, it automatically fails over
    to alternate models (which have separate TPM quotas) or backs off safely.
    """
    last_error = None

    for model in FALLBACK_MODELS:
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                last_error = e
                err_msg = str(e)

                # Check if it's a 429 rate limit error
                if "429" in err_msg or "rate_limit" in err_msg.lower():
                    match = re.search(r'try again in ([0-9\.]+)s', err_msg, re.IGNORECASE)
                    wait_seconds = float(match.group(1)) if match else 2.0

                    if wait_seconds <= 3.0 and attempt == 0:
                        time.sleep(wait_seconds + 0.5)
                        continue

                    # Fall back to next model in list
                    break
                else:
                    time.sleep(0.5)

    raise RuntimeError(f"Translation failed on all candidate models. Last error: {str(last_error)}")


def _translate_single_segment_text(client: OpenAI, text: str, target_lang_name: str) -> str:
    """Translates a single text segment safely."""
    if not text.strip():
        return text
    prompt = (
        f"Translate the following subtitle text into {target_lang_name}.\n"
        "Requirements:\n"
        "- Preserve meaning accurately.\n"
        "- Output ONLY the translated text without quotes or explanations.\n\n"
        f"Text:\n{text}"
    )
    messages = [
        {"role": "system", "content": "You are a professional subtitle translator."},
        {"role": "user", "content": prompt}
    ]
    try:
        translated = _call_llm_with_retry(client, messages, max_tokens=300, temperature=0.3).strip()
        if (translated.startswith('"') and translated.endswith('"')) or (translated.startswith("'") and translated.endswith("'")):
            translated = translated[1:-1].strip()
        return translated
    except Exception:
        return text


def _translate_single_segment_batch(client: OpenAI, batch: list[dict], target_lang_name: str) -> list[dict]:
    """
    Translates a batch of subtitle segments with 100% segment preservation guarantee.
    Uses indexed JSON mapping, recursive divide-and-conquer on count/format mismatch,
    and single-segment translation base cases.
    """
    if not batch:
        return []

    if len(batch) == 1:
        seg = batch[0]
        translated = _translate_single_segment_text(client, seg.get("text", ""), target_lang_name)
        return [{
            "start": seg["start"],
            "end": seg["end"],
            "text": translated
        }]

    texts_dict = {str(i): s.get("text", "") for i, s in enumerate(batch)}
    prompt = (
        f"Translate the following {len(batch)} subtitle segments into {target_lang_name}.\n"
        "Requirements:\n"
        f"1. Exactly {len(batch)} numbered segments are provided (keys \"0\" to \"{len(batch)-1}\").\n"
        "2. Output MUST be a valid JSON object mapping each key string (\"0\", \"1\", ...) to its translated text.\n"
        f"3. You MUST provide every key from \"0\" to \"{len(batch)-1}\". Do not merge, skip, or renumber keys.\n"
        "4. Return ONLY the raw JSON object, without markdown formatting or code blocks.\n\n"
        f"Input:\n{json.dumps(texts_dict, ensure_ascii=False, indent=2)}"
    )

    messages = [
        {"role": "system", "content": "You are a professional subtitle translator. You always output valid raw JSON objects matching the input keys."},
        {"role": "user", "content": prompt}
    ]

    try:
        content = _call_llm_with_retry(client, messages, max_tokens=2500, temperature=0.3)
        clean_content = content.strip()
        if clean_content.startswith("```"):
            clean_content = re.sub(r"^```[a-zA-Z]*\n?", "", clean_content)
            clean_content = re.sub(r"\n?```$", "", clean_content).strip()

        start_brace = clean_content.find('{')
        end_brace = clean_content.rfind('}')
        start_bracket = clean_content.find('[')
        end_bracket = clean_content.rfind(']')

        # Case 1: JSON Object matching {"0": "...", "1": "..."}
        if start_brace != -1 and end_brace > start_brace and (start_bracket == -1 or start_brace < start_bracket):
            json_str = clean_content[start_brace:end_brace+1]
            try:
                parsed_data = json.loads(json_str)
            except Exception:
                fixed_str = re.sub(r',\s*\}', '}', json_str)
                parsed_data = json.loads(fixed_str)

            if isinstance(parsed_data, dict):
                results = []
                missing_any = False
                for i, seg in enumerate(batch):
                    key = str(i)
                    if key in parsed_data and isinstance(parsed_data[key], str):
                        results.append({
                            "start": seg["start"],
                            "end": seg["end"],
                            "text": parsed_data[key].strip()
                        })
                    else:
                        missing_any = True
                        break
                if not missing_any and len(results) == len(batch):
                    return results

        # Case 2: JSON Array matching ["...", "..."]
        if start_bracket != -1 and end_bracket > start_bracket:
            json_str = clean_content[start_bracket:end_bracket+1]
            try:
                parsed_list = json.loads(json_str)
            except Exception:
                fixed_str = re.sub(r',\s*\]', ']', json_str)
                parsed_list = json.loads(fixed_str)

            if isinstance(parsed_list, list) and len(parsed_list) == len(batch):
                return [{
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": str(parsed_list[i]).strip()
                } for i, seg in enumerate(batch)]

    except Exception:
        pass

    # Divide-and-conquer fallback if anything went wrong or keys were missing:
    mid = len(batch) // 2
    left = _translate_single_segment_batch(client, batch[:mid], target_lang_name)
    right = _translate_single_segment_batch(client, batch[mid:], target_lang_name)
    return left + right


def _translate_language(client, target_lang_code: str, transcript: str, segments: list[dict], source_language: str) -> dict:
    if not is_language_supported(target_lang_code):
        return {"text": f"Error: Language code '{target_lang_code}' is not supported.", "segments": []}

    # Normalize both codes so "English" and "en" match!
    norm_source = normalize_lang_code(source_language)
    norm_target = normalize_lang_code(target_lang_code)

    if norm_source == norm_target:
        return {"text": transcript, "segments": segments}

    target_lang_name = get_language_name(target_lang_code)

    if segments:
        segment_batches = chunk_segments(segments, max_length=500, max_segments=8)
        translated_segments = []

        for batch in segment_batches:
            try:
                batch_res = _translate_single_segment_batch(client, batch, target_lang_name)
                translated_segments.extend(batch_res)
                if len(segment_batches) > 1:
                    time.sleep(0.2)
            except Exception as e:
                return {"text": f"Error: Translation failed - {str(e)}", "segments": []}

        full_translated_text = " ".join([s["text"] for s in translated_segments])
        return {"text": full_translated_text, "segments": translated_segments}
    else:
        # Fallback to pure text translation
        chunks = chunk_text(transcript, max_length=2000)
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

                messages = [
                    {"role": "system", "content": "You are a professional video transcript translator."},
                    {"role": "user", "content": prompt}
                ]
                total_chars = len(chunk)
                max_tokens = min(2000, max(350, int((total_chars // 2) * 2)))

                translated = _call_llm_with_retry(client, messages, max_tokens=max_tokens, temperature=0.3)
                translated_chunks.append(translated)
                time.sleep(0.3)

            return {"text": "\n\n".join(translated_chunks), "segments": []}
        except Exception as e:
            return {"text": f"Error: Translation failed - {str(e)}", "segments": []}


def translate_transcript(transcript: str, segments: list[dict], source_language: str, target_languages: list[str]) -> dict[str, dict]:
    """
    Translate the transcript and its segments into the specified target languages in parallel.
    """
    target_languages = list(set(target_languages))
    client = get_openai_client()
    translations = {}
    
    if len(target_languages) == 1:
        lang = target_languages[0]
        translations[lang] = _translate_language(client, lang, transcript, segments, source_language)
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(target_languages), 4)) as executor:
            future_to_lang = {
                executor.submit(_translate_language, client, lang, transcript, segments, source_language): lang
                for lang in target_languages
            }
            for future in concurrent.futures.as_completed(future_to_lang):
                lang = future_to_lang[future]
                try:
                    translations[lang] = future.result()
                except Exception as e:
                    translations[lang] = {"text": f"Error: Translation failed - {str(e)}", "segments": []}
                    
    return translations

def chunk_segments(segments: list[dict], max_length: int = 500, max_segments: int = 8) -> list[list[dict]]:
    """Group segments into batches based on total text length and segment count."""
    batches = []
    current_batch = []
    current_length = 0
    
    for seg in segments:
        text_len = len(seg.get("text", ""))
        if (current_length + text_len > max_length or len(current_batch) >= max_segments) and current_batch:
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
