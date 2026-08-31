from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_transcribe_unauthorized_without_key():
    response = client.post(
        "/internal/v1/transcribe",
        json={"contentId": "cnt_test_123", "localPath": "dummy.mp3"}
    )
    assert response.status_code == 401


def test_transcribe_unauthorized_with_wrong_key():
    response = client.post(
        "/internal/v1/transcribe",
        headers={"X-Internal-API-Key": "wrong_key"},
        json={"contentId": "cnt_test_123", "localPath": "dummy.mp3"}
    )
    assert response.status_code == 401


def test_transcribe_authorized_with_valid_key():
    # Will fail with 404/400 because file doesn't exist, but NOT 401 Unauthorized!
    response = client.post(
        "/internal/v1/transcribe",
        headers={"X-Internal-API-Key": settings.AI_SERVICE_API_KEY},
        json={"contentId": "cnt_test_123", "localPath": "non_existent_file.mp3"}
    )
    assert response.status_code != 401
