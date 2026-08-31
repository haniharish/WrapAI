import json
import re
from abc import ABC, abstractmethod
from typing import List, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import (
    StructuredAnalysisData,
    SummaryData,
    TopicItem,
    KeyPointItem,
    DecisionItem,
    ActionItemData,
    QuestionItem,
    HighlightItem,
    SpeakerItem,
    TranscriptSegmentItem,
    TokenUsage
)
from app.prompts.analysis_prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT_TEMPLATE
)


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_structured_analysis(
        self,
        content_id: str,
        title: str,
        transcript_context: str,
        duration_seconds: float,
        speakers: List[SpeakerItem],
        segments: List[TranscriptSegmentItem]
    ) -> StructuredAnalysisData:
        """
        Transforms formatted transcript context into structured business intelligence.
        """
        pass


class HeuristicAnalysisProvider(BaseLLMProvider):
    """
    Zero-token offline analysis engine for testing and local development without external API costs.
    Extracts deterministic intelligence using linguistic pattern recognition and transcript structures.
    """
    async def generate_structured_analysis(
        self,
        content_id: str,
        title: str,
        transcript_context: str,
        duration_seconds: float,
        speakers: List[SpeakerItem],
        segments: List[TranscriptSegmentItem]
    ) -> StructuredAnalysisData:
        logger.info(f"Generating structured analysis via HeuristicAnalysisProvider for content '{content_id}'")

        full_text = " ".join(seg.text for seg in segments)
        speaker_names = [s.displayName for s in speakers] or ["Speaker 1"]

        # 1. Summary Generation
        first_few = " ".join(seg.text for seg in segments[:3])
        last_few = " ".join(seg.text for seg in segments[-2:]) if len(segments) > 3 else ""
        short_summary = f"Discussion on {title}. The team aligned on key project requirements, architecture strategies, and operational next steps."
        executive_summary = (
            f"The session covered comprehensive reviews for {title}. "
            f"Participants {', '.join(speaker_names)} discussed core deliverables, "
            f"system architecture considerations, and finalized execution milestones. "
            f"{first_few} {last_few}"
        ).strip()
        key_takeaway = "Core architecture and implementation roadmap were agreed upon with clear milestone owners."

        # 2. Topic Extraction
        topics: List[TopicItem] = []
        if len(segments) > 0:
            chunk_size = max(1, len(segments) // 3)
            for t_idx in range(min(3, math_ceil(len(segments) / chunk_size))):
                sub_segs = segments[t_idx * chunk_size : (t_idx + 1) * chunk_size]
                if sub_segs:
                    topics.append(
                        TopicItem(
                            title=f"Discussion Part {t_idx + 1}: {sub_segs[0].text[:35]}...",
                            summary=" ".join(s.text for s in sub_segs[:2]),
                            startTime=sub_segs[0].startTime,
                            endTime=sub_segs[-1].endTime,
                            sequence=t_idx + 1,
                            keyTakeaway=f"Key consensus reached during part {t_idx + 1}."
                        )
                    )

        # 3. Action Items Extraction (Linguistic patterns: "prepare", "deploy", "verify", "implement", "review", "send")
        action_items: List[ActionItemData] = []
        action_keywords = ["prepare", "verify", "implement", "deploy", "build", "review", "send", "update", "create", "test"]
        for seg in segments:
            text_lower = seg.text.lower()
            if any(kw in text_lower for kw in action_keywords):
                assignee = seg.speakerDisplayName if seg.speakerDisplayName else "Unassigned"
                action_items.append(
                    ActionItemData(
                        task=seg.text.strip(),
                        ownerName=assignee,
                        deadlineRaw="Next Sprint",
                        status="PENDING",
                        timestamp=seg.startTime
                    )
                )

        if not action_items and segments:
            action_items.append(
                ActionItemData(
                    task=f"Review final deliverables for {title}",
                    ownerName=speaker_names[0] if speaker_names else "Unassigned",
                    deadlineRaw="Next Sprint",
                    status="PENDING",
                    timestamp=segments[0].startTime
                )
            )

        # 4. Decisions Extraction (Consensus markers: "decided", "agreed", "finalized", "approved", "will", "launch")
        decisions: List[DecisionItem] = []
        decision_keywords = ["decided", "agreed", "finalized", "approved", "chosen", "will", "confirmed"]
        for seg in segments:
            text_lower = seg.text.lower()
            if any(dk in text_lower for dk in decision_keywords):
                decisions.append(
                    DecisionItem(
                        title=f"Decision: {seg.text[:50]}...",
                        description=seg.text.strip(),
                        timestamp=seg.startTime,
                        category="Strategy",
                        agreedByNames=speaker_names
                    )
                )

        if not decisions and segments:
            decisions.append(
                DecisionItem(
                    title="Project Architecture Consensus",
                    description=f"The team approved the execution plan for {title}.",
                    timestamp=segments[-1].startTime if segments else 0.0,
                    category="Architecture",
                    agreedByNames=speaker_names
                )
            )

        # 5. Key Points
        key_points: List[KeyPointItem] = []
        for idx, seg in enumerate(segments[:5]):
            key_points.append(
                KeyPointItem(
                    text=seg.text.strip(),
                    importance="HIGH" if idx == 0 else "MEDIUM",
                    timestamp=seg.startTime,
                    speakerName=seg.speakerDisplayName or "Speaker 1",
                    category="Discussion"
                )
            )

        # 6. Questions
        questions: List[QuestionItem] = []
        for seg in segments:
            if "?" in seg.text:
                questions.append(
                    QuestionItem(
                        question=seg.text.strip(),
                        askedBy=seg.speakerDisplayName or "Speaker",
                        timestamp=seg.startTime,
                        answered=True
                    )
                )

        # 7. Highlights
        highlights: List[HighlightItem] = []
        if segments:
            highlights.append(
                HighlightItem(
                    title="Opening Remarks & Context Alignment",
                    description=segments[0].text[:80],
                    timestamp=segments[0].startTime,
                    importance="HIGH"
                )
            )
            if len(segments) > 1:
                highlights.append(
                    HighlightItem(
                        title="Core Milestone Finalization",
                        description=segments[-1].text[:80],
                        timestamp=segments[-1].startTime,
                        importance="HIGH"
                    )
                )

        # Usage simulation
        input_tokens = len(transcript_context.split()) * 2
        output_tokens = 600
        total_tokens = input_tokens + output_tokens

        return StructuredAnalysisData(
            contentId=content_id,
            contentCategory="MEETING",
            summary=SummaryData(
                short=short_summary,
                executive=executive_summary,
                overview=f"Meeting concerning {title}.",
                keyTakeaway=key_takeaway
            ),
            topics=topics,
            keyPoints=key_points,
            decisions=decisions,
            actionItems=action_items,
            questions=questions,
            highlights=highlights,
            llmProvider="heuristic",
            llmModel="wrapai-heuristic-engine",
            promptVersion="v1.0",
            tokenUsage=TokenUsage(
                inputTokens=input_tokens,
                outputTokens=output_tokens,
                totalTokens=total_tokens,
                estimatedCostUsd=0.0
            )
        )


class GoogleGeminiProvider(BaseLLMProvider):
    """
    Google Gemini Provider implementing structured JSON output mode via Gemini API.
    """
    async def generate_structured_analysis(
        self,
        content_id: str,
        title: str,
        transcript_context: str,
        duration_seconds: float,
        speakers: List[SpeakerItem],
        segments: List[TranscriptSegmentItem]
    ) -> StructuredAnalysisData:
        if not settings.LLM_API_KEY:
            logger.warning("No LLM_API_KEY set for Google Gemini. Falling back to HeuristicAnalysisProvider.")
            return await HeuristicAnalysisProvider().generate_structured_analysis(
                content_id, title, transcript_context, duration_seconds, speakers, segments
            )

        prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(
            title=title,
            duration_str=f"{int(duration_seconds)}s",
            speakers_count=len(speakers) or 1,
            transcript_context=transcript_context
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
        payload = {
            "system_instruction": {
                "parts": [{"text": ANALYSIS_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": settings.LLM_TEMPERATURE,
                "maxOutputTokens": settings.LLM_MAX_OUTPUT_TOKENS
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code != 200:
                logger.error(f"Gemini API error ({res.status_code}): {res.text}")
                raise RuntimeError(f"Gemini API error: {res.text}")

            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed_json = json.loads(raw_text)

            usage = data.get("usageMetadata", {})
            token_usage = TokenUsage(
                inputTokens=usage.get("promptTokenCount", 0),
                outputTokens=usage.get("candidatesTokenCount", 0),
                totalTokens=usage.get("totalTokenCount", 0),
                estimatedCostUsd=round(usage.get("totalTokenCount", 0) * 0.0000005, 5)
            )

            parsed_json["contentId"] = content_id
            parsed_json["llmProvider"] = "gemini"
            parsed_json["llmModel"] = settings.LLM_MODEL
            parsed_json["promptVersion"] = "v1.0"
            parsed_json["tokenUsage"] = token_usage

            return StructuredAnalysisData(**parsed_json)


class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI Provider implementing structured JSON output mode via Chat Completions API.
    """
    async def generate_structured_analysis(
        self,
        content_id: str,
        title: str,
        transcript_context: str,
        duration_seconds: float,
        speakers: List[SpeakerItem],
        segments: List[TranscriptSegmentItem]
    ) -> StructuredAnalysisData:
        if not settings.LLM_API_KEY:
            logger.warning("No LLM_API_KEY set for OpenAI. Falling back to HeuristicAnalysisProvider.")
            return await HeuristicAnalysisProvider().generate_structured_analysis(
                content_id, title, transcript_context, duration_seconds, speakers, segments
            )

        prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(
            title=title,
            duration_str=f"{int(duration_seconds)}s",
            speakers_count=len(speakers) or 1,
            transcript_context=transcript_context
        )

        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_OUTPUT_TOKENS
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if res.status_code != 200:
                logger.error(f"OpenAI API error ({res.status_code}): {res.text}")
                raise RuntimeError(f"OpenAI API error: {res.text}")

            data = res.json()
            raw_text = data["choices"][0]["message"]["content"]
            parsed_json = json.loads(raw_text)

            usage = data.get("usage", {})
            token_usage = TokenUsage(
                inputTokens=usage.get("prompt_tokens", 0),
                outputTokens=usage.get("completion_tokens", 0),
                totalTokens=usage.get("total_tokens", 0),
                estimatedCostUsd=round(usage.get("total_tokens", 0) * 0.000002, 5)
            )

            parsed_json["contentId"] = content_id
            parsed_json["llmProvider"] = "openai"
            parsed_json["llmModel"] = settings.LLM_MODEL
            parsed_json["promptVersion"] = "v1.0"
            parsed_json["tokenUsage"] = token_usage

            return StructuredAnalysisData(**parsed_json)


def math_ceil(val: float) -> int:
    import math
    return math.ceil(val)


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory function returning the configured LLM provider singleton.
    """
    provider_name = settings.LLM_PROVIDER.lower().strip()
    if provider_name == "gemini":
        return GoogleGeminiProvider()
    elif provider_name in ["openai", "chatgpt"]:
        return OpenAIProvider()
    return HeuristicAnalysisProvider()
