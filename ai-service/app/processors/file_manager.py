import os
import shutil
import tempfile
import httpx
from contextlib import contextmanager
from typing import Generator
from app.core.config import settings
from app.core.logging import logger


class FileManager:
    @staticmethod
    def get_base_temp_dir() -> str:
        base = settings.TEMP_DIR or os.path.join(tempfile.gettempdir(), "wrapai_ai_service")
        os.makedirs(base, exist_ok=True)
        return base

    @staticmethod
    @contextmanager
    def create_temp_context(content_id: str) -> Generator[str, None, None]:
        """
        Creates a temporary isolated directory for a specific content job
        and ensures complete recursive deletion on exit.
        """
        job_dir = tempfile.mkdtemp(prefix=f"wrapai_{content_id}_", dir=FileManager.get_base_temp_dir())
        try:
            yield job_dir
        finally:
            try:
                if os.path.exists(job_dir):
                    shutil.rmtree(job_dir, ignore_errors=True)
                    logger.info(f"Cleaned up temporary workspace: {job_dir}")
            except Exception as e:
                logger.warning(f"Error removing temporary workspace {job_dir}: {str(e)}")

    @staticmethod
    async def download_file_stream(url: str, target_path: str, max_bytes: int = None) -> int:
        """
        Streams a remote file to disk in chunks to prevent memory ballooning.
        """
        max_size = max_bytes or settings.MAX_FILE_SIZE_BYTES
        bytes_downloaded = 0

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    raise ValueError(f"Failed to fetch media from URL. HTTP status code: {response.status_code}")

                with open(target_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=65536):
                        bytes_downloaded += len(chunk)
                        if bytes_downloaded > max_size:
                            raise ValueError(f"Media file exceeds maximum allowed size of {max_size} bytes")
                        f.write(chunk)

        return bytes_downloaded
