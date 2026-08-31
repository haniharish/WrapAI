import pytest
from app.models.schemas import TranscriptSegmentItem, SpeakerTurnItem
from app.services.alignment_service import TranscriptSpeakerAlignmentService


def test_alignment_exact_overlap():
    segments = [
        TranscriptSegmentItem(
            startTime=0.0,
            endTime=5.0,
            text="Hello from Speaker 1.",
            sequence=1
        ),
        TranscriptSegmentItem(
            startTime=5.0,
            endTime=10.0,
            text="Hello from Speaker 2.",
            sequence=2
        )
    ]

    turns = [
        SpeakerTurnItem(speaker="SPEAKER_00", startTime=0.0, endTime=5.0, confidence=0.95),
        SpeakerTurnItem(speaker="SPEAKER_01", startTime=5.0, endTime=10.0, confidence=0.95)
    ]

    aligned_segs, speakers = TranscriptSpeakerAlignmentService.align_transcript_with_speakers(segments, turns, total_duration=10.0)

    assert len(aligned_segs) == 2
    assert aligned_segs[0].speakerLabel == "SPEAKER_00"
    assert aligned_segs[0].speakerDisplayName == "Speaker 1"
    assert aligned_segs[1].speakerLabel == "SPEAKER_01"
    assert aligned_segs[1].speakerDisplayName == "Speaker 2"

    assert len(speakers) == 2
    assert speakers[0].speakerLabel == "SPEAKER_00"
    assert speakers[0].segmentCount == 1
    assert speakers[0].speakingPercentage == 50.0
    assert speakers[1].speakerLabel == "SPEAKER_01"
    assert speakers[1].speakingPercentage == 50.0


def test_alignment_partial_overlap_and_gap():
    segments = [
        # Overlaps mostly with SPEAKER_00 (10.0 to 14.0 = 4s overlap vs 1s overlap with SPEAKER_01)
        TranscriptSegmentItem(
            startTime=10.0,
            endTime=15.0,
            text="Segment overlapping two speaker turns.",
            sequence=1
        ),
        # In a gap: closest to SPEAKER_01 (starts at 18.0)
        TranscriptSegmentItem(
            startTime=22.0,
            endTime=25.0,
            text="Segment in silence gap.",
            sequence=2
        )
    ]

    turns = [
        SpeakerTurnItem(speaker="SPEAKER_00", startTime=8.0, endTime=14.0, confidence=0.95),
        SpeakerTurnItem(speaker="SPEAKER_01", startTime=14.0, endTime=20.0, confidence=0.95)
    ]

    aligned_segs, speakers = TranscriptSpeakerAlignmentService.align_transcript_with_speakers(segments, turns, total_duration=25.0)

    assert aligned_segs[0].speakerLabel == "SPEAKER_00"
    assert aligned_segs[1].speakerLabel == "SPEAKER_01"
    assert len(speakers) == 2


def test_alignment_empty_turns_fallback():
    segments = [
        TranscriptSegmentItem(startTime=0.0, endTime=4.0, text="Single speaker speech.", sequence=1)
    ]
    aligned_segs, speakers = TranscriptSpeakerAlignmentService.align_transcript_with_speakers(segments, [], total_duration=4.0)

    assert len(aligned_segs) == 1
    assert aligned_segs[0].speakerLabel == "SPEAKER_00"
    assert len(speakers) == 1
    assert speakers[0].speakingPercentage == 100.0
