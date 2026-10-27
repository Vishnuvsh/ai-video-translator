from fastapi import APIRouter

router = APIRouter()

@router.get("/health/")
async def health_check():
    return {
        "status": "ok",
        "message": "AI Video Translator API is running"
    }
