"""
RAG Service — Phase 10
Coordinates context building, LLM generation, and structured response
validation for grounded question-answering over transcript content.
"""
from __future__ import annotations
import json
import re
from typing import List, Dict, Any, Optional

import httpx

from app.core.config import settings
from app.models.schemas import RAGResponseData, RAGSource
from app.prompts.rag_prompts import build_rag_prompt, NO_ANSWER_TEXT
from app.services.rag.context_builder import RAGContextBuilder
from app.core.logging import logger


class RAGService:
    """
    High-level coordinator:
      1. Build formatted context from retrieved chunks
      2. Call LLM with grounded RAG prompt
      3. Parse & validate structured JSON output
      4. Return RAGResponseData with answer + sources
    """

    def __init__(self):
        self._context_builder = RAGContextBuilder(
            max_context_tokens=settings.MAX_RAG_CONTEXT_TOKENS
        )

    async def answer(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        content_id: str = "",
    ) -> RAGResponseData:
        """
        Parameters
        ----------
        query : User's natural language question.
        chunks : Retrieved & scored vector chunks from MongoDB.
        conversation_history : Prior messages for follow-up context.
        content_id : For logging only.
        """
        if not chunks:
            return RAGResponseData(
                answer=NO_ANSWER_TEXT,
                sources=[],
                grounded=False,
                tokensUsed=0,
            )

        # 1. Build context string and structured sources
        context_block = self._context_builder.build(chunks)
        structured_sources = self._context_builder.extract_sources(chunks)

        # 2. Build prompt messages
        messages = build_rag_prompt(
            query=query,
            context_block=context_block,
            conversation_history=conversation_history or [],
        )

        # 3. Call LLM
        raw_response = ""
        tokens_used = 0
        provider = settings.LLM_PROVIDER.lower()

        try:
            if provider == "gemini" and settings.LLM_API_KEY:
                raw_response, tokens_used = await self._call_gemini(messages)
            elif provider == "openai" and settings.LLM_API_KEY:
                raw_response, tokens_used = await self._call_openai(messages)
            else:
                # Heuristic offline RAG: build deterministic answer from chunk text
                raw_response, tokens_used = self._heuristic_rag(query, chunks)
        except Exception as exc:
            logger.error(f"[RAGService] LLM call failed: {exc}")
            raw_response, tokens_used = self._heuristic_rag(query, chunks)

        # 4. Parse JSON output
        return self._parse_response(raw_response, structured_sources, tokens_used)

    # ─────────────────────────────────────────────────────────────────────
    # LLM Backends
    # ─────────────────────────────────────────────────────────────────────

    async def _call_gemini(self, messages: List[Dict]) -> tuple:
        """Call Google Gemini for RAG answer."""
        # Combine into single prompt
        system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

        payload = {
            "system_instruction": {"parts": [{"text": system_msg}]},
            "contents": [{"role": "user", "parts": [{"text": user_msg}]}],
            "generationConfig": {
                "temperature": settings.LLM_TEMPERATURE,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json",
            },
        }
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.LLM_MODEL}:generateContent?key={settings.LLM_API_KEY}"
        )
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        usage = data.get("usageMetadata", {})
        tokens = usage.get("totalTokenCount", 0)
        return text, tokens

    async def _call_openai(self, messages: List[Dict]) -> tuple:
        """Call OpenAI for RAG answer."""
        payload = {
            "model": settings.LLM_MODEL or "gpt-4o-mini",
            "messages": messages,
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": 2048,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            res.raise_for_status()
            data = res.json()

        text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        tokens = usage.get("total_tokens", 0)
        return text, tokens

    def _heuristic_rag(self, query: str, chunks: List[Dict[str, Any]]) -> tuple:
        """
        Deterministic offline RAG for testing / no-API-key environments.
        Finds the best chunk by keyword overlap and returns its text as the answer.
        """
        if not chunks:
            return NO_ANSWER_TEXT, 0

        q_words = set(query.lower().split())
        best_chunk = None
        best_score = -1

        for chunk in chunks:
            text = (chunk.get("text") or "").lower()
            overlap = sum(1 for w in q_words if w in text)
            score = overlap + chunk.get("score", 0.0)
            if score > best_score:
                best_score = score
                best_chunk = chunk

        if best_chunk is None:
            return NO_ANSWER_TEXT, 0

        text = (best_chunk.get("text") or "").strip()
        speaker = best_chunk.get("speakerDisplayName", "Speaker")
        start = best_chunk.get("startTime", 0.0)
        tc = f"{int(start) // 60:02d}:{int(start) % 60:02d}"
        chunk_id = str(best_chunk.get("_id") or best_chunk.get("chunkId") or "")

        answer = f"Based on the recorded content: {text[:300]}"
        sources = [{
            "chunkId": chunk_id,
            "speaker": speaker,
            "speakerLabel": best_chunk.get("speakerLabel", "SPEAKER_00"),
            "startTime": start,
            "endTime": best_chunk.get("endTime", start),
            "excerpt": text[:120],
            "timecode": tc,
            "score": round(best_chunk.get("score", 0.0), 4),
        }]
        resp_json = json.dumps({
            "answer": answer,
            "sources": sources,
            "grounded": True,
        })
        return resp_json, len(text.split()) * 2

    # ─────────────────────────────────────────────────────────────────────
    # Response Parsing
    # ─────────────────────────────────────────────────────────────────────

    def _parse_response(
        self,
        raw: str,
        fallback_sources: List[Dict[str, Any]],
        tokens_used: int,
    ) -> RAGResponseData:
        if not raw:
            return RAGResponseData(
                answer=NO_ANSWER_TEXT,
                sources=[],
                grounded=False,
                tokensUsed=tokens_used,
            )

        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                answer = (parsed.get("answer") or "").strip()
                grounded = bool(parsed.get("grounded", True))

                if not answer or answer == NO_ANSWER_TEXT:
                    return RAGResponseData(
                        answer=NO_ANSWER_TEXT,
                        sources=[],
                        grounded=False,
                        tokensUsed=tokens_used,
                    )

                raw_sources = parsed.get("sources", [])
                if raw_sources:
                    sources = [
                        RAGSource(
                            chunkId=s.get("chunkId"),
                            speaker=s.get("speaker", "Speaker"),
                            speakerLabel=s.get("speakerLabel", "SPEAKER_00"),
                            startTime=float(s.get("startTime", 0.0)),
                            endTime=float(s.get("endTime", 0.0)),
                            excerpt=s.get("excerpt", ""),
                            timecode=s.get("timecode"),
                            score=s.get("score"),
                        )
                        for s in raw_sources
                    ]
                else:
                    sources = [RAGSource(**s) for s in fallback_sources[:5]]

                return RAGResponseData(
                    answer=answer,
                    sources=sources,
                    grounded=grounded,
                    tokensUsed=tokens_used,
                )
            except Exception as exc:
                logger.warning(f"[RAGService] JSON parse failed: {exc}")

        clean_answer = raw.strip()
        if not clean_answer or len(clean_answer) < 5:
            clean_answer = NO_ANSWER_TEXT

        sources = [RAGSource(**s) for s in fallback_sources[:5]]
        grounded = clean_answer != NO_ANSWER_TEXT

        return RAGResponseData(
            answer=clean_answer,
            sources=sources if grounded else [],
            grounded=grounded,
            tokensUsed=tokens_used,
        )


rag_service = RAGService()
