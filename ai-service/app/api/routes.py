import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import (
    TranscribeRequest,
    TranscribeResponse,
    HealthResponse
)
from app.api.deps import verify_internal_api_key
from app.processors.file_manager import FileManager
from app.processors.media_processor import MediaProcessor
from app.services.stt_service import SpeechToTextService

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Public health check endpoint exposing service state and active model configuration.
    """
    return HealthResponse(
        status="ok",
        service="wrapai-ai-service",
        environment=settings.NODE_ENV,
        whisperModel=settings.WHISPER_MODEL_SIZE,
        device=settings.WHISPER_DEVICE,
        computeType=settings.WHISPER_COMPUTE_TYPE
    )


@router.post(
    "/internal/v1/transcribe",
    response_model=TranscribeResponse,
    dependencies=[Depends(verify_internal_api_key)],
    tags=["Transcription"]
)
async def transcribe_media(request: TranscribeRequest):
    """
    Protected internal transcription endpoint for Node.js worker orchestration.
    Extracts audio via FFmpeg, normalizes to 16kHz WAV, and transcribes using Faster-Whisper.
    """
    if not request.contentId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_REQUEST", "message": "contentId is required"}
        )

    if not request.mediaUrl and not request.localPath:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SOURCE_UNAVAILABLE", "message": "Either mediaUrl or localPath must be provided"}
        )

    with FileManager.create_temp_context(request.contentId) as temp_dir:
        input_media_path = os.path.join(temp_dir, "input_media")
        normalized_wav_path = os.path.join(temp_dir, "normalized_audio.wav")

        # Step 1: Obtain source media
        if request.localPath and os.path.exists(request.localPath):
            logger.info(f"Using direct local file for content {request.contentId}: {request.localPath}")
            # If local file is already on disk, copy or symlink into temp workspace
            shutil.copy2(request.localPath, input_media_path)
        elif request.mediaUrl:
            logger.info(f"Streaming remote media from URL for content {request.contentId}")
            try:
                await FileManager.download_file_stream(
                    url=request.mediaUrl,
                    target_path=input_media_path,
                    max_bytes=settings.MAX_FILE_SIZE_BYTES
                )
            except Exception as dl_err:
                logger.error(f"Media download failed for {request.contentId}: {str(dl_err)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"code": "SOURCE_UNAVAILABLE", "message": f"Failed to download media: {str(dl_err)}"}
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CONTENT_NOT_FOUND", "message": "Specified local media file does not exist on disk"}
            )

        # Step 2: Extract and normalize audio to 16kHz mono WAV
        try:
            MediaProcessor.extract_and_normalize_audio(
                input_media_path=input_media_path,
                output_wav_path=normalized_wav_path
            )
        except Exception as ffmpeg_err:
            logger.error(f"Audio extraction failed for {request.contentId}: {str(ffmpeg_err)}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "AUDIO_EXTRACTION_FAILED", "message": str(ffmpeg_err)}
            )

        # Step 3: Run Faster-Whisper Speech-to-Text inference
        try:
            transcript_data = SpeechToTextService.transcribe(
                audio_path=normalized_wav_path,
                content_id=request.contentId,
                language=request.language
            )
        except Exception as stt_err:
            logger.error(f"Whisper transcription failed for {request.contentId}: {str(stt_err)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": "TRANSCRIPTION_FAILED", "message": str(stt_err)}
            )

        return TranscribeResponse(
            success=True,
            message="Media transcribed successfully",
            data=transcript_data
        )
