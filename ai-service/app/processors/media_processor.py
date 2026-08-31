import os
import shutil
import subprocess
from app.core.logging import logger

try:
    import imageio_ffmpeg
    IMAGEIO_FFMPEG_AVAILABLE = True
except ImportError:
    IMAGEIO_FFMPEG_AVAILABLE = False


class MediaProcessor:
    @staticmethod
    def get_ffmpeg_binary() -> str:
        """
        Locates the FFmpeg executable from system PATH or bundled imageio_ffmpeg.
        """
        system_ffmpeg = shutil.which("ffmpeg")
        if system_ffmpeg:
            return system_ffmpeg

        if IMAGEIO_FFMPEG_AVAILABLE:
            try:
                exe = imageio_ffmpeg.get_ffmpeg_exe()
                if exe and os.path.exists(exe):
                    return exe
            except Exception as e:
                logger.warning(f"imageio_ffmpeg lookup failed: {str(e)}")

        raise RuntimeError(
            "FFmpeg executable not found. Please install FFmpeg on your system or install imageio-ffmpeg."
        )

    @staticmethod
    def extract_and_normalize_audio(input_media_path: str, output_wav_path: str) -> str:
        """
        Extracts audio from video/audio container and normalizes to:
        - Format: 16-bit PCM WAV (pcm_s16le)
        - Sample Rate: 16,000 Hz (Optimal for Whisper)
        - Channels: 1 (Mono)
        """
        if not os.path.exists(input_media_path):
            raise FileNotFoundError(f"Input media file not found: {input_media_path}")

        ffmpeg_bin = MediaProcessor.get_ffmpeg_binary()

        command = [
            ffmpeg_bin,
            "-y",  # Overwrite output
            "-i", input_media_path,
            "-vn",  # Disable video track
            "-acodec", "pcm_s16le",  # PCM 16-bit
            "-ar", "16000",  # 16kHz sample rate
            "-ac", "1",  # Mono channel
            "-loglevel", "error",  # Suppress banner
            output_wav_path
        ]

        logger.info(f"Executing FFmpeg audio normalization: {' '.join(command)}")

        try:
            result = subprocess.run(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300,
                check=True
            )
        except subprocess.TimeoutExpired:
            raise TimeoutError("FFmpeg audio extraction timed out after 300 seconds")
        except subprocess.CalledProcessError as e:
            err_msg = e.stderr.decode("utf-8", errors="replace") if e.stderr else "Unknown FFmpeg error"
            logger.error(f"FFmpeg processing failed: {err_msg}")
            raise RuntimeError(f"FFmpeg audio extraction failed: {err_msg}")

        if not os.path.exists(output_wav_path) or os.path.getsize(output_wav_path) == 0:
            raise RuntimeError("FFmpeg generated an empty or missing audio file")

        logger.info(f"Successfully extracted audio: {output_wav_path} ({os.path.getsize(output_wav_path)} bytes)")
        return output_wav_path
