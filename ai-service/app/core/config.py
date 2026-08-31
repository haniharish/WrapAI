from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PORT: int = 8000
    HOST: str = "0.0.0.0"
    NODE_ENV: str = "development"

    # Internal API Key for Node.js <-> Python authentication
    AI_SERVICE_API_KEY: str = "wrapai_internal_ai_service_secret_key_minimum_32_chars_2026"

    # Faster-Whisper Settings
    WHISPER_MODEL_SIZE: str = "small"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    WHISPER_VAD_FILTER: bool = True

    # Speaker Diarization Settings (pyannote.audio)
    HF_TOKEN: Optional[str] = None
    DIARIZATION_MODEL: str = "pyannote/speaker-diarization-3.1"
    DIARIZATION_DEVICE: str = "cpu"
    DIARIZATION_MIN_SPEAKERS: Optional[int] = None
    DIARIZATION_MAX_SPEAKERS: Optional[int] = None

    # LLM Content Intelligence Settings
    LLM_PROVIDER: str = "heuristic"  # 'gemini', 'openai', or 'heuristic'
    LLM_MODEL: str = "gemini-2.5-flash"
    LLM_API_KEY: Optional[str] = None
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_OUTPUT_TOKENS: int = 4096
    MAX_TRANSCRIPT_TOKENS_PER_CHUNK: int = 3000

    # Resource Limits
    MAX_FILE_SIZE_BYTES: int = 524288000  # 500 MB
    MAX_AUDIO_DURATION_SECONDS: int = 14400  # 4 Hours
    TRANSCRIPTION_TIMEOUT_SECONDS: int = 600  # 10 Minutes

    # Temp file storage directory
    TEMP_DIR: Optional[str] = None


settings = Settings()
