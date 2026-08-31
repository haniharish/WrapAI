"""
RAGContextBuilder — Phase 10
Formats retrieved embedding chunks into a structured context block
for the LLM, enforcing token budget and deduplicating overlapping chunks.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional

_CHARS_PER_TOKEN = 4


def _format_timecode(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 60:02d}:{s % 60:02d}"


class RAGContextBuilder:
    """
    Takes a list of retrieved vector chunk dicts (from MongoDB) and builds
    a formatted, token-bounded context string for the RAG prompt.
    """

    def __init__(self, max_context_tokens: int = 3000):
        self.max_context_tokens = max_context_tokens
        self._max_chars = max_context_tokens * _CHARS_PER_TOKEN

    def build(self, chunks: List[Dict[str, Any]]) -> str:
        """
        Parameters
        ----------
        chunks : list of dicts each with:
            text, startTime, endTime, speakerDisplayName, speakerLabel, score, chunkIndex, _id

        Returns
        -------
        Formatted context string to inject into the RAG prompt.
        """
        if not chunks:
            return "(No relevant content found in this item.)"

        # Sort by relevance score DESC, then de-duplicate by chunkIndex
        seen_indices = set()
        unique_chunks = []
        for chunk in sorted(chunks, key=lambda c: c.get("score", 0.0), reverse=True):
            idx = chunk.get("chunkIndex", -1)
            if idx not in seen_indices:
                seen_indices.add(idx)
                unique_chunks.append(chunk)

        # Build context lines within token budget
        lines: List[str] = []
        total_chars = 0

        for i, chunk in enumerate(unique_chunks):
            source_num = i + 1
            speaker = chunk.get("speakerDisplayName") or "Speaker"
            start = chunk.get("startTime", 0.0)
            end = chunk.get("endTime", 0.0)
            tc_start = _format_timecode(start)
            tc_end = _format_timecode(end)
            text = (chunk.get("text") or "").strip()
            score = chunk.get("score", 0.0)
            chunk_id = str(chunk.get("_id") or chunk.get("chunkId") or "")

            block = (
                f"--- SOURCE {source_num} ---\n"
                f"Speaker: {speaker} | Time: {tc_start}–{tc_end} | Score: {score:.3f}\n"
                f"ChunkId: {chunk_id}\n"
                f"{text}\n"
            )

            if total_chars + len(block) > self._max_chars:
                break

            lines.append(block)
            total_chars += len(block)

        return "\n".join(lines) if lines else "(No relevant content found.)"

    def extract_sources(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Return structured source list for the RAG API response."""
        sources = []
        seen = set()
        for chunk in chunks:
            idx = chunk.get("chunkIndex", -1)
            if idx in seen:
                continue
            seen.add(idx)
            start = chunk.get("startTime", 0.0)
            end = chunk.get("endTime", 0.0)
            excerpt = (chunk.get("text") or "")[:200]
            # Get just the first line of text for excerpt display
            first_line = excerpt.split("\n")[0][:150]
            sources.append({
                "chunkId": str(chunk.get("_id") or chunk.get("chunkId") or ""),
                "speaker": chunk.get("speakerDisplayName") or "Speaker",
                "speakerLabel": chunk.get("speakerLabel") or "SPEAKER_00",
                "startTime": start,
                "endTime": end,
                "excerpt": first_line,
                "timecode": _format_timecode(start),
                "score": round(chunk.get("score", 0.0), 4),
            })
        return sources
