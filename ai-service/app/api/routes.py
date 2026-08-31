import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import (
    TranscribeRequest,
    TranscribeResponse,
    TranscribeResponseData,
    DiarizeRequest,
    DiarizeResponse,
    DiarizeResponseData,
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse
)
from app.api.deps import verify_internal_api_key
from app.processors.file_manager import FileManager
from app.processors.media_processor import MediaProcessor
from app.services.stt_service import SpeechToTextService
from app.services.diarization_service import SpeakerDiarizationService
from app.services.alignment_service import TranscriptSpeakerAlignmentService
from app.services.analysis_service import ContentAnalysisService

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Public health check endpoint exposing service state, active Whisper, Diarization, and LLM configurations.
    """
    return HealthResponse(
        status="ok",
        service="wrapai-ai-service",
        environment=settings.NODE_ENV,
        whisperModel=settings.WHISPER_MODEL_SIZE,
        diarizationModel=settings.DIARIZATION_MODEL,
        llmProvider=settings.LLM_PROVIDER,
        llmModel=settings.LLM_MODEL,
        device=settings.WHISPER_DEVICE,
        computeType=settings.WHISPER_COMPUTE_TYPE
    )


@router.post(
    "/internal/v1/transcribe",
    response_model=TranscribeResponse,
    dependencies=[Depends(verify_internal_api_key)],
    tags=["Transcription & Diarization"]
)
async def transcribe_and_diarize_media(request: TranscribeRequest):
    """
    Protected internal endpoint executing end-to-end media preprocessing,
    Faster-Whisper speech-to-text transcription, pyannote speaker diarization,
    and temporal alignment.
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

        # Step 4: Run Speaker Diarization and Alignment
        speakers_manifest = []
        aligned_segments = transcript_data.segments
        diarization_model_name = settings.DIARIZATION_MODEL

        if request.enableDiarization and transcript_data.segments:
            try:
                speaker_turns = SpeakerDiarizationService.diarize_audio(
                    wav_path=normalized_wav_path,
                    content_id=request.contentId,
                    min_speakers=request.minSpeakers,
                    max_speakers=request.maxSpeakers
                )

                aligned_segments, speakers_manifest = TranscriptSpeakerAlignmentService.align_transcript_with_speakers(
                    segments=transcript_data.segments,
                    turns=speaker_turns,
                    total_duration=transcript_data.durationSeconds
                )
            except Exception as diarize_err:
                logger.warning(f"Speaker diarization failed: {str(diarize_err)}. Falling back to single speaker.")

        # Fallback speaker if none generated
        if not speakers_manifest:
            from app.models.schemas import SpeakerItem
            speakers_manifest = [
                SpeakerItem(
                    speakerLabel="SPEAKER_00",
                    displayName="Speaker 1",
                    totalSpeakingTime=transcript_data.durationSeconds,
                    segmentCount=len(aligned_segments),
                    speakingPercentage=100.0,
                    color="#1B365D",
                    confidence=1.0
                )
            ]

        response_data = TranscribeResponseData(
            contentId=request.contentId,
            language=transcript_data.language,
            durationSeconds=transcript_data.durationSeconds,
            wordCount=transcript_data.wordCount,
            speakersCount=len(speakers_manifest),
            processingModel=transcript_data.processingModel,
            diarizationModel=diarization_model_name if request.enableDiarization else None,
            speakers=speakers_manifest,
            segments=aligned_segments
        )

        return TranscribeResponse(
            success=True,
            message="Media transcribed and diarized successfully",
            data=response_data
        )


@router.post(
    "/internal/v1/diarize",
    response_model=DiarizeResponse,
    dependencies=[Depends(verify_internal_api_key)],
    tags=["Diarization Only"]
)
async def diarize_media_standalone(request: DiarizeRequest):
    """
    Standalone speaker diarization endpoint returning speaker turns and manifest without transcription.
    """
    if not request.contentId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_REQUEST", "message": "contentId is required"}
        )

    with FileManager.create_temp_context(request.contentId) as temp_dir:
        input_media_path = os.path.join(temp_dir, "input_media")
        normalized_wav_path = os.path.join(temp_dir, "normalized_audio.wav")

        if request.localPath and os.path.exists(request.localPath):
            shutil.copy2(request.localPath, input_media_path)
        elif request.mediaUrl:
            await FileManager.download_file_stream(url=request.mediaUrl, target_path=input_media_path)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "CONTENT_NOT_FOUND", "message": "Media source not accessible"}
            )

        MediaProcessor.extract_and_normalize_audio(input_media_path, normalized_wav_path)
        speaker_turns = SpeakerDiarizationService.diarize_audio(
            wav_path=normalized_wav_path,
            content_id=request.contentId,
            min_speakers=request.minSpeakers,
            max_speakers=request.maxSpeakers
        )

        from app.models.schemas import TranscriptSegmentItem
        dummy_segments = [
            TranscriptSegmentItem(
                startTime=t.startTime,
                endTime=t.endTime,
                text="...",
                sequence=idx + 1
            )
            for idx, t in enumerate(speaker_turns)
        ]
        _, speaker_items = TranscriptSpeakerAlignmentService.align_transcript_with_speakers(dummy_segments, speaker_turns)

        return DiarizeResponse(
            success=True,
            message="Speaker diarization completed successfully",
            data=DiarizeResponseData(
                contentId=request.contentId,
                durationSeconds=speaker_turns[-1].endTime if speaker_turns else 0.0,
                speakersCount=len(speaker_items),
                diarizationModel=settings.DIARIZATION_MODEL,
                turns=speaker_turns,
                speakers=speaker_items
            )
        )


@router.post(
    "/internal/v1/analyze",
    response_model=AnalyzeResponse,
    dependencies=[Depends(verify_internal_api_key)],
    tags=["LLM Content Intelligence"]
)
async def analyze_transcript_content(request: AnalyzeRequest):
    """
    Protected internal endpoint generating structured LLM intelligence
    (Summary, Topics, Key Points, Decisions, Action Items, Questions, Highlights)
    from speaker-aware transcripts.
    """
    if not request.contentId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_REQUEST", "message": "contentId is required"}
        )

    if not request.segments or len(request.segments) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_TRANSCRIPT", "message": "Transcript segments cannot be empty"}
        )

    try:
        analysis_data = await ContentAnalysisService.analyze_transcript(request)
        return AnalyzeResponse(
            success=True,
            message="Content intelligence analysis generated successfully",
            data=analysis_data
        )
    except Exception as err:
        logger.error(f"LLM content analysis failed for {request.contentId}: {str(err)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "ANALYSIS_FAILED", "message": str(err)}
        )
