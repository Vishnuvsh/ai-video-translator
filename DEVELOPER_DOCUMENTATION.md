# AI Video Translator — Developer Documentation

## 1. Technologies & Tools Used (and their Purpose)

### Frontend
- **React 19**: Builds the component-based Single Page Application (SPA), handling interactive UI state (video details, progress bars, language selection, subtitles).
- **Vite**: Modern development server and bundler that provides fast Hot Module Replacement (HMR) and optimized production builds.
- **Tailwind CSS**: Utility-first CSS framework used for clean styling, responsive layouts, and glassmorphism UI elements.
- **Framer Motion**: Delivers smooth transitions, animated view switching (Home/About), and loading indicators.
- **Axios**: Handles HTTP communication between the React frontend and FastAPI backend.

---

### Backend & API
- **Python 3.12**: Core programming language powering the backend logic and data pipelines.
- **FastAPI**: High-performance asynchronous REST API framework chosen for its speed, native async support, and automatic OpenAPI documentation.
- **Uvicorn**: ASGI web server running FastAPI to handle concurrent HTTP requests and WebSocket connections.
- **WebSockets**: Provides real-time bi-directional streaming of progress percentage and status messages (e.g., download % and transcription progress) from server to client.
- **Pydantic v2**: Validates incoming request payloads (URLs, transcripts, language lists) and structures API response schemas.

---

### Video & Audio Processing
- **YouTube InnerTube API & yt-dlp**: 
  - *InnerTube API*: Directly queries YouTube's internal endpoints to fetch video metadata (title, thumbnail, duration) in ~0.2s without being blocked by cloud datacenter IP limits.
  - *yt-dlp*: Acts as a robust fallback for downloading YouTube audio streams using mobile client simulation.
- **youtube-transcript-api**: Fetches existing native or auto-generated YouTube subtitles directly. When available, it skips downloading audio completely, finishing transcription in under 0.5s.
- **FFmpeg (via static-ffmpeg)**: Converts raw audio to 128kbps MP3 format and splits large audio files (>25MB) into chunks so they can be processed within Whisper's file size limits.

---

### Artificial Intelligence & Speech
- **OpenAI Whisper Large v3 (via Groq LPU)**: Converts spoken speech from video audio into written text with millisecond-accurate timestamped segments (`start`, `end`, `text`). Groq's LPU provides near-instant inference speed.
- **LLM Translation (Qwen 3.8 / GPT OSS via Groq)**: Translates subtitle segments while strictly preserving timestamps, sentence meaning, and context across 14 languages.
- **Microsoft Edge Neural TTS (`edge-tts`)**: Generates studio-quality, natural-sounding voiceovers in regional languages (Malayalam, Hindi, Tamil, etc.) for free without rate limits or API fees.
- **OpenAI TTS**: Acts as a backup fallback for text-to-speech generation.

---

## 2. How the Project Works (Step-by-Step)

```
[1. User Pastes URL] ──> [2. Instant Metadata Fetch]
                                   │
                                   ▼
                       [3. Transcription Phase]
                        ├── A. Native Captions Found? (Instant)
                        └── B. No Captions? (Download Audio ──> Whisper AI)
                                   │
                                   ▼
                       [4. AI Translation Phase]
                        └── Batched Segments ──> LLM ──> Target Language
                                   │
                                   ▼
                       [5. Synchronized Playback & Voiceover]
                        ├── Video Player with Live Subtitle Overlay
                        ├── Export Subtitles (.srt / .txt)
                        └── AI Regional Voiceover Generation (.mp3)
```

### Step 1: Video Analysis
1. The user inputs a YouTube URL (standard, Shorts, or youtu.be link).
2. The backend validates the link and queries the YouTube **InnerTube API**.
3. Within **~0.2 seconds**, video details (title, thumbnail, channel, duration, views) are returned and displayed on the UI.

### Step 2: Transcription with Timestamping
1. The user clicks **"Transcribe Video"**, establishing a **WebSocket** connection for live progress.
2. The server checks the local cache (`.cache/`) to see if this video was processed earlier. If cached, it returns instantly.
3. If not cached, the server first attempts to pull native YouTube captions via InnerTube/XML parsing.
4. If captions do not exist, the server downloads the audio stream, converts it via FFmpeg, and sends it to **Whisper Large v3**.
5. Whisper transcribes the speech into text broken down into precise timestamped segments:
   ```json
   { "start": 0.0, "end": 3.5, "text": "Welcome to this tutorial" }
   ```
6. The user can view the transcript, copy it, or download it as a standard `.srt` subtitle file.

### Step 3: Multi-Language Translation
1. The user selects one or more target languages (e.g., Malayalam, Hindi, Spanish) and clicks **"Translate"**.
2. If already translated earlier, the cached result loads immediately.
3. For new translations, subtitle segments are grouped into batches with JSON indexing (`{"0": "...", "1": "..."}`) to guarantee each segment's timing stays aligned.
4. The LLM translates the segments in parallel across selected languages. If an API rate limit occurs, it automatically falls back to secondary models.
5. Translated text and synchronized segments are returned to the frontend and saved to cache.

### Step 4: Synchronized Subtitle Playback
1. When the user clicks **"Play Subtitles"** for any translated language, an embedded YouTube player appears.
2. As the video plays, a 100ms tracking loop monitors the current playback time (`getCurrentTime()`).
3. The subtitle matching the current video timestamp is displayed directly over the video as a live subtitle overlay.
4. Users can click any subtitle line in the list to automatically jump (seek) the video to that exact point in time.

### Step 5: Regional AI Voiceover (Optional)
1. The user clicks **"Voiceover"** on a translated language.
2. The backend maps the language code to a matching neural voice (e.g., `ml-IN-SobhanaNeural` for Malayalam).
3. **Edge Neural TTS** generates an audio voiceover file (.mp3) stored in `generated_audio/`.
4. An embedded audio player appears on the frontend allowing the user to listen to or download the translated voiceover.
