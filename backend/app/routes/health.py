from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
@router.get("/health/")
async def health_check():
    return {
        "status": "ok",
        "message": "AI Video Translator API is running",
        "version": "2.1.0"
    }
