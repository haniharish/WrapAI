import pytest
from app.processors.media_processor import MediaProcessor


def test_media_processor_missing_file():
    with pytest.raises(FileNotFoundError):
        MediaProcessor.extract_and_normalize_audio("non_existent_file.mp4", "out.wav")
