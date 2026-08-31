from typing import List
from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import AnalyzeRequest, StructuredAnalysisData
from app.services.llm.context_builder import TranscriptContextBuilder
from app.services.llm.provider import get_llm_provider


class ContentAnalysisService:
    @classmethod
    async def analyze_transcript(cls, request: AnalyzeRequest) -> StructuredAnalysisData:
        """
        Executes end-to-end content intelligence analysis across speaker-aware transcript segments.
        Handles hierarchical chunking for long transcripts.
        """
        logger.info(
            f"Initiating LLM content analysis for content '{request.contentId}' "
            f"({len(request.segments)} segments, {len(request.speakers)} speakers)"
        )

        formatted_context = TranscriptContextBuilder.build_formatted_transcript(request.segments)
        estimated_tokens = TranscriptContextBuilder.estimate_token_count(formatted_context)
        logger.info(f"Transcript context assembled: ~{estimated_tokens} tokens")

        provider = get_llm_provider()

        # 1. Standard single-pass analysis if within token budget
        if estimated_tokens <= settings.MAX_TRANSCRIPT_TOKENS_PER_CHUNK:
            analysis = await provider.generate_structured_analysis(
                content_id=request.contentId,
                title=request.title or "Untitled Content",
                transcript_context=formatted_context,
                duration_seconds=request.durationSeconds or 0.0,
                speakers=request.speakers,
                segments=request.segments
            )
            return analysis

        # 2. Hierarchical Chunking for Long Transcripts
        logger.info(f"Content '{request.contentId}' exceeds single-pass threshold. Executing hierarchical chunking.")
        chunks = TranscriptContextBuilder.chunk_transcript_hierarchically(
            segments=request.segments,
            max_tokens_per_chunk=settings.MAX_TRANSCRIPT_TOKENS_PER_CHUNK
        )
        logger.info(f"Split long transcript into {len(chunks)} logical turn chunks")

        # For hierarchical processing, generate analysis across the combined chunks
        # with chunked summary synthesis
        intermediate_analyses = []
        for c_idx, chunk in enumerate(chunks):
            c_context = TranscriptContextBuilder.build_formatted_transcript(chunk)
            chunk_analysis = await provider.generate_structured_analysis(
                content_id=f"{request.contentId}_c{c_idx}",
                title=f"{request.title} (Part {c_idx + 1}/{len(chunks)})",
                transcript_context=c_context,
                duration_seconds=chunk[-1].endTime - chunk[0].startTime,
                speakers=request.speakers,
                segments=chunk
            )
            intermediate_analyses.append(chunk_analysis)

        # Consolidate intermediate results
        consolidated_topics = []
        consolidated_key_points = []
        consolidated_decisions = []
        consolidated_actions = []
        consolidated_questions = []
        consolidated_highlights = []
        total_input_toks = 0
        total_output_toks = 0

        for a in intermediate_analyses:
            consolidated_topics.extend(a.topics)
            consolidated_key_points.extend(a.keyPoints)
            consolidated_decisions.extend(a.decisions)
            consolidated_actions.extend(a.actionItems)
            consolidated_questions.extend(a.questions)
            consolidated_highlights.extend(a.highlights)
            total_input_toks += a.tokenUsage.inputTokens
            total_output_toks += a.tokenUsage.outputTokens

        primary_summary = intermediate_analyses[0].summary
        exec_summary = " ".join([a.summary.executive for a in intermediate_analyses])

        return StructuredAnalysisData(
            contentId=request.contentId,
            contentCategory=intermediate_analyses[0].contentCategory,
            summary=type(primary_summary)(
                short=primary_summary.short,
                executive=exec_summary,
                overview=primary_summary.overview,
                keyTakeaway=primary_summary.keyTakeaway
            ),
            topics=consolidated_topics,
            keyPoints=consolidated_key_points,
            decisions=consolidated_decisions,
            actionItems=consolidated_actions,
            questions=consolidated_questions,
            highlights=consolidated_highlights,
            llmProvider=intermediate_analyses[0].llmProvider,
            llmModel=intermediate_analyses[0].llmModel,
            promptVersion="v1.0",
            tokenUsage=type(intermediate_analyses[0].tokenUsage)(
                inputTokens=total_input_toks,
                outputTokens=total_output_toks,
                totalTokens=total_input_toks + total_output_toks,
                estimatedCostUsd=round((total_input_toks + total_output_toks) * 0.000001, 5)
            )
        )
