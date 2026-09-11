from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health
from app.routes import video

app = FastAPI(title="AI Video Translator API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # React/Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(video.router, prefix="/api/video")

@app.get("/")
async def root():
    return {"message": "Welcome to AI Video Translator API. Use /api/health/ for health check."}
