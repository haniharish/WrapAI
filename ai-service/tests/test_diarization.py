from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.schemas import SpeakerTurnItem

client = TestClient(app)


def test_diarize_unauthorized():
    response = client.post(
        "/internal/v1/diarize",
        json={"contentId": "cnt_test_diarize", "localPath": "dummy.wav"}
    )
    assert response.status_code == 401


@patch("app.processors.media_processor.MediaProcessor.extract_and_normalize_audio")
@patch("app.services.diarization_service.SpeakerDiarizationService.diarize_audio")
def test_diarize_endpoint_success(mock_diarize, mock_ffmpeg, tmp_path):
    dummy_wav = tmp_path / "meeting.wav"
    dummy_wav.write_bytes(b"dummy wav data")

    mock_ffmpeg.return_value = str(dummy_wav)
    mock_diarize.return_value = [
        SpeakerTurnItem(speaker="SPEAKER_00", startTime=0.0, endTime=15.2, confidence=0.96),
        SpeakerTurnItem(speaker="SPEAKER_01", startTime=15.2, endTime=30.0, confidence=0.94)
    ]

    response = client.post(
        "/internal/v1/diarize",
        headers={"X-Internal-API-Key": settings.AI_SERVICE_API_KEY},
        json={
            "contentId": "cnt_diarize_123",
            "localPath": str(dummy_wav)
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["contentId"] == "cnt_diarize_123"
    assert data["data"]["speakersCount"] == 2
    assert len(data["data"]["turns"]) == 2
    assert data["data"]["turns"][0]["speaker"] == "SPEAKER_00"
    assert data["data"]["turns"][1]["speaker"] == "SPEAKER_01"
