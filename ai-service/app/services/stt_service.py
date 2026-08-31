import os
from typing import Optional, List, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import TranscriptSegmentItem, WordTimestamp, TranscribeResponseData


class SpeechToTextService:
    _model_instance = None
    _loaded_model_size = None

    @classmethod
    def get_model(cls):
        """
        Lazy-load and cache the Faster-Whisper model singleton.
        """
        if cls._model_instance is None or cls._loaded_model_size != settings.WHISPER_MODEL_SIZE:
            try:
                from faster_whisper import WhisperModel

                logger.info(
                    f"Loading Faster-Whisper model '{settings.WHISPER_MODEL_SIZE}' "
                    f"on device='{settings.WHISPER_DEVICE}' with compute_type='{settings.WHISPER_COMPUTE_TYPE}'"
                )

                cls._model_instance = WhisperModel(
                    settings.WHISPER_MODEL_SIZE,
                    device=settings.WHISPER_DEVICE,
                    compute_type=settings.WHISPER_COMPUTE_TYPE,
                    download_root=os.path.join(settings.TEMP_DIR or "", "models") if settings.TEMP_DIR else None
                )
                cls._loaded_model_size = settings.WHISPER_MODEL_SIZE
                logger.info(f"Faster-Whisper model '{settings.WHISPER_MODEL_SIZE}' loaded successfully.")
            except ImportError:
                logger.warning("faster-whisper is not installed. Model inference will be unavailable.")
                cls._model_instance = None
            except Exception as e:
                logger.error(f"Failed to load Faster-Whisper model: {str(e)}")
                raise e

        return cls._model_instance

    @classmethod
    def transcribe(
        cls,
        audio_path: str,
        content_id: str,
        language: Optional[str] = "auto"
    ) -> TranscribeResponseData:
        """
        Transcribes a normalized 16kHz WAV file into timestamped transcript segments.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        model = cls.get_model()
        if model is None:
            raise RuntimeError("Faster-Whisper model is not available in the current environment")

        lang_arg = None if (not language or language == "auto") else language

        logger.info(f"Starting Faster-Whisper transcription for content '{content_id}' (language: {language})")

        segments_iter, info = model.transcribe(
            audio_path,
            language=lang_arg,
            vad_filter=settings.WHISPER_VAD_FILTER,
            word_timestamps=False
        )

        detected_language = info.language or "en"
        duration_seconds = round(float(info.duration), 2) if info.duration else 0.0

        segment_items: List[TranscriptSegmentItem] = []
        total_words = 0
        seq = 1

        for segment in segments_iter:
            text = segment.text.strip()
            if not text:
                continue

            words_in_seg = len(text.split())
            total_words += words_in_seg

            segment_items.append(
                TranscriptSegmentItem(
                    startTime=round(float(segment.start), 2),
                    endTime=round(float(segment.end), 2),
                    text=text,
                    sequence=seq,
                    confidence=round(float(getattr(segment, "avg_logprob", -0.1)), 2),
                    words=[]
                )
            )
            seq += 1

        logger.info(
            f"Transcription complete for content '{content_id}': {len(segment_items)} segments, "
            f"{total_words} words, duration: {duration_seconds}s, detected language: '{detected_language}'"
        )

        return TranscribeResponseData(
            contentId=content_id,
            language=detected_language,
            durationSeconds=duration_seconds,
            wordCount=total_words,
            processingModel=f"faster-whisper-{settings.WHISPER_MODEL_SIZE}",
            segments=segment_items
        )
