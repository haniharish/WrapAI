from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.schemas import TranscribeResponseData, TranscriptSegmentItem

client = TestClient(app)


def test_transcribe_missing_content_id():
    response = client.post(
        "/internal/v1/transcribe",
        headers={"X-Internal-API-Key": settings.AI_SERVICE_API_KEY},
        json={"contentId": "", "localPath": "sample.mp3"}
    )
    assert response.status_code == 400


def test_transcribe_missing_source():
    response = client.post(
        "/internal/v1/transcribe",
        headers={"X-Internal-API-Key": settings.AI_SERVICE_API_KEY},
        json={"contentId": "cnt_123"}
    )
    assert response.status_code == 400


@patch("app.processors.media_processor.MediaProcessor.extract_and_normalize_audio")
@patch("app.services.stt_service.SpeechToTextService.transcribe")
def test_transcribe_success_mock(mock_stt, mock_ffmpeg, tmp_path):
    # Create dummy local file
    dummy_audio = tmp_path / "sample.mp3"
    dummy_audio.write_bytes(b"dummy audio content")

    mock_ffmpeg.return_value = str(tmp_path / "normalized.wav")
    mock_stt.return_value = TranscribeResponseData(
        contentId="cnt_mock_01",
        language="en",
        durationSeconds=12.5,
        wordCount=14,
        processingModel="faster-whisper-small",
        segments=[
            TranscriptSegmentItem(
                startTime=0.0,
                endTime=5.2,
                text="Welcome to the WrapAI platform sync.",
                sequence=1,
                confidence=0.98
            ),
            TranscriptSegmentItem(
                startTime=5.2,
                endTime=12.5,
                text="Today we are building Phase 7 speech to text.",
                sequence=2,
                confidence=0.96
            )
        ]
    )

    response = client.post(
        "/internal/v1/transcribe",
        headers={"X-Internal-API-Key": settings.AI_SERVICE_API_KEY},
        json={
            "contentId": "cnt_mock_01",
            "localPath": str(dummy_audio),
            "language": "en"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["contentId"] == "cnt_mock_01"
    assert data["data"]["language"] == "en"
    assert len(data["data"]["segments"]) == 2
    assert data["data"]["segments"][0]["startTime"] == 0.0
    assert data["data"]["segments"][0]["endTime"] == 5.2
