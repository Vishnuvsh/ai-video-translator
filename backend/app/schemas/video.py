from pydantic import BaseModel, field_validator
from typing import Optional


class VideoAnalyzeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        return v.strip()


class VideoMetadata(BaseModel):
    video_id: str
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    duration_formatted: Optional[str] = None
    channel: Optional[str] = None


class VideoAnalyzeResponse(BaseModel):
    success: bool
    video: VideoMetadata


class VideoTranscribeRequest(BaseModel):
    url: Optional[str] = None
    video_id: Optional[str] = None


class VideoTranscribeResponse(BaseModel):
    success: bool
    video_id: str
    language: str
    transcript: str
