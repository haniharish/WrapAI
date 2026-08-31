"""
TranscriptChunker — Phase 10 RAG
Splits speaker-annotated transcript segments into semantically coherent,
overlapping chunks preserving timestamps and speaker identity.

Chunking strategy:
  - Group consecutive segments from the same speaker turn.
  - When a turn exceeds TARGET_CHUNK_TOKENS, flush the current chunk.
  - Add OVERLAP_TOKENS worth of the previous chunk's tail to the next chunk.
  - Each chunk retains: startTime, endTime, speakerLabel, speakerDisplayName,
    segmentIds, chunkIndex.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


# Approx token estimate: 4 chars ≈ 1 token
_CHARS_PER_TOKEN = 4

TARGET_CHUNK_TOKENS = 500  # ~2000 chars
OVERLAP_TOKENS = 80        # ~320 chars


@dataclass
class TranscriptChunk:
    contentId: str
    transcriptId: Optional[str]
    chunkIndex: int
    text: str
    startTime: float
    endTime: float
    speakerId: Optional[str]
    speakerLabel: str
    speakerDisplayName: str
    segmentIds: List[str] = field(default_factory=list)


def _est_tokens(text: str) -> int:
    return max(1, len(text) // _CHARS_PER_TOKEN)


def chunk_segments(
    segments: List[Dict[str, Any]],
    content_id: str,
    transcript_id: Optional[str] = None,
    target_tokens: int = TARGET_CHUNK_TOKENS,
    overlap_tokens: int = OVERLAP_TOKENS,
) -> List[TranscriptChunk]:
    """
    Parameters
    ----------
    segments : list of TranscriptSegment-like dicts.
        Each dict must contain: id/segmentId, text, startTime, endTime,
        speakerLabel, speakerDisplayName, speakerId (optional).

    Returns
    -------
    List of TranscriptChunk objects ordered by startTime.
    """
    if not segments:
        return []

    chunks: List[TranscriptChunk] = []
    chunk_index = 0

    current_lines: List[str] = []
    current_token_count = 0
    current_start = segments[0].get("startTime", 0.0)
    current_end = segments[0].get("endTime", 0.0)
    current_speaker_label = segments[0].get("speakerLabel", "SPEAKER_00")
    current_speaker_name = segments[0].get("speakerDisplayName", "Speaker 1")
    current_speaker_id = segments[0].get("speakerId")
    current_segment_ids: List[str] = []

    overlap_tail: str = ""  # tail of previous chunk for overlap

    def _flush(lines: List[str], seg_ids: List[str],
               t_start: float, t_end: float,
               sp_id: Optional[str], sp_label: str, sp_name: str) -> None:
        nonlocal chunk_index, overlap_tail
        body = "\n".join(lines).strip()
        if not body:
            return
        full_text = (overlap_tail + "\n" + body).strip() if overlap_tail else body
        chunks.append(TranscriptChunk(
            contentId=content_id,
            transcriptId=transcript_id,
            chunkIndex=chunk_index,
            text=full_text,
            startTime=t_start,
            endTime=t_end,
            speakerId=sp_id,
            speakerLabel=sp_label,
            speakerDisplayName=sp_name,
            segmentIds=list(seg_ids),
        ))
        chunk_index += 1
        # Compute overlap tail from last N tokens of this chunk
        overlap_chars = overlap_tokens * _CHARS_PER_TOKEN
        overlap_tail = full_text[-overlap_chars:] if len(full_text) > overlap_chars else ""

    for seg in segments:
        seg_id = str(seg.get("id") or seg.get("segmentId") or seg.get("_id") or "")
        text = (seg.get("text") or "").strip()
        if not text:
            continue

        st = seg.get("startTime", 0.0)
        et = seg.get("endTime", st)
        sp_label = seg.get("speakerLabel", "SPEAKER_00")
        sp_name = seg.get("speakerDisplayName", "Speaker 1")
        sp_id = seg.get("speakerId")

        # Formatted line with timecode and speaker
        mins = int(st) // 60
        secs = int(st) % 60
        line = f"[{mins:02d}:{secs:02d}] {sp_name}: \"{text}\""
        line_tokens = _est_tokens(line)

        # Flush if adding this line would exceed target AND we have content
        if current_token_count + line_tokens > target_tokens and current_lines:
            _flush(current_lines, current_segment_ids,
                   current_start, current_end,
                   current_speaker_id, current_speaker_label, current_speaker_name)
            current_lines = []
            current_token_count = 0
            current_start = st
            current_speaker_label = sp_label
            current_speaker_name = sp_name
            current_speaker_id = sp_id
            current_segment_ids = []

        current_lines.append(line)
        current_token_count += line_tokens
        current_end = et
        if seg_id:
            current_segment_ids.append(seg_id)

        # Update dominant speaker if changed mid-chunk
        if sp_label != current_speaker_label:
            current_speaker_label = sp_label
            current_speaker_name = sp_name
            current_speaker_id = sp_id

    # Flush remaining
    if current_lines:
        _flush(current_lines, current_segment_ids,
               current_start, current_end,
               current_speaker_id, current_speaker_label, current_speaker_name)

    return chunks
