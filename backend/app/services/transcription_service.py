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
            # Chunking logic using ffmpeg (avoiding pydub/audioop which crashes on Python 3.14)
            import subprocess
            
            # Get duration using ffprobe
            try:
                cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path]
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
                duration_sec = float(result.stdout.strip())
            except Exception as e:
                raise RuntimeError(f"Failed to get audio duration: {str(e)}")
            
            # Approximate chunk duration based on size (target 20MB chunks)
            chunk_target_size = 20 * 1024 * 1024
            num_chunks = math.ceil(file_size / chunk_target_size)
            chunk_length_sec = duration_sec / num_chunks
            
            chunk_files = []
            try:
                for i in range(num_chunks):
                    start_sec = i * chunk_length_sec
                    
                    chunk_path = f"{file_path}_chunk_{i}.mp3"
                    
                    # Extract chunk using ffmpeg copy
                    try:
                        ext_cmd = ["ffmpeg", "-y", "-i", file_path, "-ss", str(start_sec), "-t", str(chunk_length_sec), "-c", "copy", chunk_path]
                        subprocess.run(ext_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                    except subprocess.CalledProcessError as e:
                        try:
                            err_msg = e.stderr.decode()
                        except:
                            err_msg = str(e)
                        raise RuntimeError(f"Failed to extract chunk {i}: {err_msg}")
                        
                    chunk_files.append(chunk_path)
                    
                    with open(chunk_path, "rb") as chunk_file:
                        transcription = client.audio.transcriptions.create(
                            model="whisper-large-v3",
                            file=chunk_file,
                            response_format="verbose_json"
                        )
                        full_transcript += transcription.text + " "
                        all_segments.extend(_extract_segments(transcription, time_offset=start_sec))
                        
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
