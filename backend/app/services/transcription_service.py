import os
import math
from pydub import AudioSegment
from openai import OpenAI

def transcribe_audio(file_path: str) -> dict:
    """
    Validates file size and chunks the audio if it exceeds 25MB using pydub.
    Calls OpenAI's audio.transcriptions.create API.
    Concatenates results for chunked files.
    Cleans up any temporary files (original and chunks) regardless of success or failure.
    """
    MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25MB
    
    try:
        if not os.path.exists(file_path):
            raise ValueError("Audio file not found.")

        file_size = os.path.getsize(file_path)
        client = OpenAI()
        
        def _extract_segments(transcription_obj, time_offset=0.0):
            extracted = []
            segments_raw = []
            if hasattr(transcription_obj, 'segments') and transcription_obj.segments:
                segments_raw = transcription_obj.segments
            elif isinstance(transcription_obj, dict) and 'segments' in transcription_obj:
                segments_raw = transcription_obj['segments']
                
            for seg in segments_raw:
                if isinstance(seg, dict):
                    extracted.append({
                        "start": seg.get("start", 0.0) + time_offset,
                        "end": seg.get("end", 0.0) + time_offset,
                        "text": seg.get("text", "").strip()
                    })
                else:
                    extracted.append({
                        "start": getattr(seg, "start", 0.0) + time_offset,
                        "end": getattr(seg, "end", 0.0) + time_offset,
                        "text": getattr(seg, "text", "").strip()
                    })
            return extracted
        
        full_transcript = ""
        detected_language = "unknown"
        all_segments = []

        if file_size <= MAX_SIZE_BYTES:
            # Process directly
            with open(file_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=audio_file,
                    response_format="verbose_json"
                )
                full_transcript = transcription.text
                all_segments.extend(_extract_segments(transcription))
                if hasattr(transcription, 'language'):
                    detected_language = transcription.language
                elif isinstance(transcription, dict) and 'language' in transcription:
                    detected_language = transcription['language']
        else:
            # Chunking logic
            audio = AudioSegment.from_file(file_path)
            duration_ms = len(audio)
            
            # Approximate chunk duration based on size (target 20MB chunks)
            chunk_target_size = 20 * 1024 * 1024
            num_chunks = math.ceil(file_size / chunk_target_size)
            chunk_length_ms = duration_ms // num_chunks
            
            chunk_files = []
            try:
                for i in range(num_chunks):
                    start_ms = i * chunk_length_ms
                    end_ms = min((i + 1) * chunk_length_ms, duration_ms)
                    chunk = audio[start_ms:end_ms]
                    
                    chunk_path = f"{file_path}_chunk_{i}.mp3"
                    chunk.export(chunk_path, format="mp3")
                    chunk_files.append(chunk_path)
                    
                    with open(chunk_path, "rb") as chunk_file:
                        transcription = client.audio.transcriptions.create(
                            model="whisper-large-v3",
                            file=chunk_file,
                            response_format="verbose_json"
                        )
                        full_transcript += transcription.text + " "
                        all_segments.extend(_extract_segments(transcription, time_offset=start_ms / 1000.0))
                        
                        if i == 0:
                            if hasattr(transcription, 'language'):
                                detected_language = transcription.language
                            elif isinstance(transcription, dict) and 'language' in transcription:
                                detected_language = transcription['language']
            finally:
                for chunk_path in chunk_files:
                    if os.path.exists(chunk_path):
                        os.remove(chunk_path)

        return {
            "transcript": full_transcript.strip(),
            "language": detected_language,
            "segments": all_segments
        }
    except Exception as e:
        raise RuntimeError(f"Transcription failed: {str(e)}")
    finally:
        # Always clean up the original audio file
        if os.path.exists(file_path):
            os.remove(file_path)
