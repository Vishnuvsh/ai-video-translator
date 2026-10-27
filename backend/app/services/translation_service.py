import re
import time
import os
import json
from openai import OpenAI
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


def _translate_single_segment_batch(client, batch, target_lang_name):
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

    messages = [
        {"role": "system", "content": "You are a professional video transcript translator. You only output valid JSON arrays."},
        {"role": "user", "content": prompt}
    ]

    content = _call_llm_with_retry(client, messages, max_tokens=2500, temperature=0.3)

    # Clean markdown formatting if model wrapped in ```json
    clean_content = content.strip()
    if clean_content.startswith("```"):
        clean_content = re.sub(r"^```[a-zA-Z]*\n?", "", clean_content)
        clean_content = re.sub(r"\n?```$", "", clean_content).strip()

    # Robust JSON array extraction
    start_idx = clean_content.find('[')
    end_idx = clean_content.rfind(']')

    # Auto-repair if closing bracket was missed
    if start_idx != -1 and end_idx <= start_idx:
        last_quote = clean_content.rfind('"')
        if last_quote > start_idx:
            clean_content = clean_content[:last_quote+1] + ']'
            end_idx = len(clean_content) - 1

    if start_idx != -1 and end_idx > start_idx:
        json_str = clean_content[start_idx:end_idx+1]
        try:
            translated_texts = json.loads(json_str)
        except json.JSONDecodeError:
            # Try to fix unescaped characters or trailing commas
            fixed_str = re.sub(r',\s*\]', ']', json_str)
            translated_texts = json.loads(fixed_str)
    else:
        raise ValueError(f"No JSON array found in LLM response. Raw response: {content[:200]}")

    if not isinstance(translated_texts, list) or len(translated_texts) != len(batch):
        raise ValueError(f"Expected {len(batch)} segments but received {len(translated_texts) if isinstance(translated_texts, list) else 'invalid format'}.")

    batch_result = []
    for i, seg in enumerate(batch):
        batch_result.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": translated_texts[i]
        })
    return batch_result


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
        segment_batches = chunk_segments(segments, max_length=800)
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
    client = OpenAI()
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

def chunk_segments(segments: list[dict], max_length: int = 800) -> list[list[dict]]:
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
