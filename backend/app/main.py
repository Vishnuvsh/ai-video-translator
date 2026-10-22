from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Automatically provide FFmpeg and FFprobe in PATH without requiring system root/sudo
try:
    import static_ffmpeg
    static_ffmpeg.add_paths(weak=True)
except Exception:
    pass

from app.routes import health
from app.routes import video

app = FastAPI(title="AI Video Translator API")

# Configure CORS for all environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins
    allow_credentials=False, # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(video.router, prefix="/api/video")

# Root-level WebSocket endpoint so both /ws/progress/{client_id} and /api/video/ws/progress/{client_id} work
@app.websocket("/ws/progress/{client_id}")
async def root_websocket_progress(websocket: WebSocket, client_id: str):
    await video.websocket_endpoint(websocket, client_id)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Video Translator API. Use /api/health/ for health check."}