from typing import List, Tuple, Dict
from app.models.schemas import TranscriptSegmentItem, SpeakerTurnItem, SpeakerItem
from app.core.logging import logger

SPEAKER_PALETTE = [
    "#1B365D",  # Navy
    "#5C768D",  # Steel Blue
    "#9F8D9B",  # Muted Taupe
    "#486581",  # Slate
    "#334E68",  # Dark Cyan
    "#627D98"   # Sage Tint
]


class TranscriptSpeakerAlignmentService:
    @staticmethod
    def align_transcript_with_speakers(
        segments: List[TranscriptSegmentItem],
        turns: List[SpeakerTurnItem],
        total_duration: float = 0.0
    ) -> Tuple[List[TranscriptSegmentItem], List[SpeakerItem]]:
        """
        Aligns Whisper transcript segments with speaker diarization turns using
        maximal temporal intersection.
        """
        if not segments:
            return [], []

        if not turns:
            turns = [
                SpeakerTurnItem(
                    speaker="SPEAKER_00",
                    startTime=segments[0].startTime,
                    endTime=segments[-1].endTime,
                    confidence=1.0
                )
            ]

        aligned_segments: List[TranscriptSegmentItem] = []
        speaker_stats: Dict[str, Dict] = {}

        for seg in segments:
            seg_start = seg.startTime
            seg_end = seg.endTime
            seg_duration = max(0.1, seg_end - seg_start)

            best_speaker = None
            max_overlap = 0.0

            for turn in turns:
                # Calculate temporal intersection
                overlap_start = max(seg_start, turn.startTime)
                overlap_end = min(seg_end, turn.endTime)
                overlap = max(0.0, overlap_end - overlap_start)

                if overlap > max_overlap:
                    max_overlap = overlap
                    best_speaker = turn.speaker

            # Fallback if segment falls inside a gap between turns
            if not best_speaker or max_overlap <= 0:
                seg_mid = (seg_start + seg_end) / 2.0
                closest_turn = min(
                    turns,
                    key=lambda t: abs(((t.startTime + t.endTime) / 2.0) - seg_mid)
                )
                best_speaker = closest_turn.speaker

            # Parse speaker index for default display name (e.g. SPEAKER_00 -> Speaker 1)
            try:
                spk_idx = int(best_speaker.replace("SPEAKER_", "")) + 1
            except Exception:
                spk_idx = len(speaker_stats) + 1
            display_name = f"Speaker {spk_idx}"

            # Update segment with speaker information
            aligned_seg = TranscriptSegmentItem(
                startTime=seg.startTime,
                endTime=seg.endTime,
                text=seg.text,
                sequence=seg.sequence,
                speakerLabel=best_speaker,
                speakerDisplayName=display_name,
                confidence=seg.confidence,
                words=seg.words
            )
            aligned_segments.append(aligned_seg)

            # Accumulate speaker statistics
            if best_speaker not in speaker_stats:
                speaker_stats[best_speaker] = {
                    "label": best_speaker,
                    "displayName": display_name,
                    "speakingTime": 0.0,
                    "segmentCount": 0,
                    "color": SPEAKER_PALETTE[len(speaker_stats) % len(SPEAKER_PALETTE)]
                }

            speaker_stats[best_speaker]["speakingTime"] += seg_duration
            speaker_stats[best_speaker]["segmentCount"] += 1

        # Calculate overall speaking percentages
        total_speaking_time = sum(s["speakingTime"] for s in speaker_stats.values()) or total_duration or 1.0

        speaker_manifest: List[SpeakerItem] = []
        for spk_key, data in sorted(speaker_stats.items(), key=lambda x: x[0]):
            speaking_pct = round((data["speakingTime"] / total_speaking_time) * 100.0, 1)
            speaker_manifest.append(
                SpeakerItem(
                    speakerLabel=data["label"],
                    displayName=data["displayName"],
                    totalSpeakingTime=round(data["speakingTime"], 2),
                    segmentCount=data["segmentCount"],
                    speakingPercentage=min(100.0, speaking_pct),
                    color=data["color"],
                    confidence=0.92
                )
            )

        logger.info(
            f"Transcript alignment complete: {len(aligned_segments)} segments mapped "
            f"across {len(speaker_manifest)} speakers"
        )

        return aligned_segments, speaker_manifest
