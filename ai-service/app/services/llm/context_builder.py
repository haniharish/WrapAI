import math
from typing import List
from app.models.schemas import TranscriptSegmentItem


class TranscriptContextBuilder:
    @staticmethod
    def format_timecode(seconds: float) -> str:
        sec = int(seconds)
        hrs = sec // 3600
        mins = (sec % 3600) // 60
        rem_secs = sec % 60
        if hrs > 0:
            return f"{hrs:02d}:{mins:02d}:{rem_secs:02d}"
        return f"{mins:02d}:{rem_secs:02d}"

    @classmethod
    def build_formatted_transcript(cls, segments: List[TranscriptSegmentItem]) -> str:
        """
        Converts transcript segments into a clean, timestamped speaker-annotated script.
        """
        lines = []
        for seg in segments:
            time_str = cls.format_timecode(seg.startTime)
            speaker_str = seg.speakerDisplayName or seg.speakerLabel or "Speaker"
            lines.append(f"[{time_str}] {speaker_str} ({seg.speakerLabel}): \"{seg.text.strip()}\"")
        return "\n".join(lines)

    @classmethod
    def estimate_token_count(cls, text: str) -> int:
        """
        Fast token estimation for LLM context planning (~4 chars / 0.75 words per token).
        """
        if not text:
            return 0
        word_count = len(text.split())
        char_count = len(text)
        return max(int(word_count * 1.3), int(char_count / 3.8))

    @classmethod
    def chunk_transcript_hierarchically(
        cls,
        segments: List[TranscriptSegmentItem],
        max_tokens_per_chunk: int = 3000
    ) -> List[List[TranscriptSegmentItem]]:
        """
        Splits long transcript segments into logical chunks by turn boundaries
        when total context exceeds max_tokens_per_chunk.
        """
        if not segments:
            return []

        chunks: List[List[TranscriptSegmentItem]] = []
        current_chunk: List[TranscriptSegmentItem] = []
        current_chunk_tokens = 0

        for seg in segments:
            seg_formatted = f"[{cls.format_timecode(seg.startTime)}] {seg.speakerDisplayName}: \"{seg.text}\""
            seg_tokens = cls.estimate_token_count(seg_formatted)

            if current_chunk and (current_chunk_tokens + seg_tokens > max_tokens_per_chunk):
                chunks.append(current_chunk)
                current_chunk = [seg]
                current_chunk_tokens = seg_tokens
            else:
                current_chunk.append(seg)
                current_chunk_tokens += seg_tokens

        if current_chunk:
            chunks.append(current_chunk)

        return chunks
