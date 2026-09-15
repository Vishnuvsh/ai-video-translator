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

class VideoTranslateRequest(BaseModel):
    transcript: str
    source_language: str
    target_languages: list[str]

    @field_validator("transcript")
    @classmethod
    def transcript_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Transcript cannot be empty")
        return v.strip()

    @field_validator("target_languages")
    @classmethod
    def target_languages_must_not_be_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("Must select at least one target language")
        return v

class VideoTranslateResponse(BaseModel):
    success: bool
    translations: dict[str, str]

class VideoTTSRequest(BaseModel):
    text: str
    language: str
    voice: Optional[str] = "alloy"
    
    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Text cannot be empty")
        return v.strip()

class VideoTTSResponse(BaseModel):
    success: bool
    language: str
    audio_url: str
