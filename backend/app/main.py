from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

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

@app.get("/")
async def root():
    return {"message": "Welcome to AI Video Translator API. Use /api/health/ for health check."}
