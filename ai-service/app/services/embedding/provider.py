"""
Embedding Provider Abstraction — Phase 10 RAG
Supports: HeuristicEmbeddingProvider (offline/test), GoogleGeminiEmbeddingProvider, OpenAIEmbeddingProvider
"""
from __future__ import annotations
import hashlib
import math
from abc import ABC, abstractmethod
from typing import List, Optional

from app.core.config import settings
from app.core.logging import logger


class BaseEmbeddingProvider(ABC):
    """Abstract base for all embedding providers."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        ...

    @property
    @abstractmethod
    def dimensions(self) -> int:
        ...

    @abstractmethod
    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Return a list of embedding vectors (one per text)."""
        ...

    def estimate_token_usage(self, texts: List[str]) -> int:
        return sum(max(1, len(t) // 4) for t in texts)


# ─────────────────────────────────────────────────────────────────────────────
# Heuristic (Offline / CI) Provider
# ─────────────────────────────────────────────────────────────────────────────

class HeuristicEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic embedding generator for offline testing & CI.
    Produces stable 768-dim unit-normalized dense vectors from text
    using character n-gram hashing — zero API calls, zero cost.
    """

    _DIM = 768

    @property
    def model_name(self) -> str:
        return "heuristic-embedding-v1"

    @property
    def dimensions(self) -> int:
        return self._DIM

    def _text_to_vector(self, text: str) -> List[float]:
        vec = [0.0] * self._DIM
        # Build from overlapping 1-to-4-grams seeded via SHA-256
        tokens = text.lower().split()
        for word in tokens:
            for n in range(1, min(5, len(word) + 1)):
                ngrams = [word[j:j+n] for j in range(len(word) - n + 1)]
                for gram in ngrams:
                    h = hashlib.sha256(gram.encode()).digest()
                    for k in range(min(4, len(h) // 2)):
                        idx = int.from_bytes(h[k*2:k*2+2], "little") % self._DIM
                        vec[idx] += 1.0
        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

    async def embed(self, texts: List[str]) -> List[List[float]]:
        return [self._text_to_vector(t) for t in texts]


# ─────────────────────────────────────────────────────────────────────────────
# Google Gemini Embedding Provider
# ─────────────────────────────────────────────────────────────────────────────

class GoogleGeminiEmbeddingProvider(BaseEmbeddingProvider):
    """Google Gemini text-embedding-004 (768 dimensions)."""

    _MODEL = "text-embedding-004"
    _DIM = 768

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or settings.EMBEDDING_API_KEY or settings.LLM_API_KEY

    @property
    def model_name(self) -> str:
        return self._MODEL

    @property
    def dimensions(self) -> int:
        return self._DIM

    async def embed(self, texts: List[str]) -> List[List[float]]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self._api_key)
            results = []
            for text in texts:
                response = genai.embed_content(
                    model=f"models/{self._MODEL}",
                    content=text,
                    task_type="retrieval_document"
                )
                results.append(response["embedding"])
            return results
        except Exception as exc:
            logger.error(f"[GoogleGeminiEmbeddingProvider] embed failed: {exc}")
            # Fallback to heuristic silently so worker doesn't crash
            return await HeuristicEmbeddingProvider().embed(texts)


# ─────────────────────────────────────────────────────────────────────────────
# OpenAI Embedding Provider
# ─────────────────────────────────────────────────────────────────────────────

class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    """OpenAI text-embedding-3-small (1536 dimensions)."""

    _MODEL = "text-embedding-3-small"
    _DIM = 1536

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or settings.EMBEDDING_API_KEY or settings.LLM_API_KEY

    @property
    def model_name(self) -> str:
        return self._MODEL

    @property
    def dimensions(self) -> int:
        return self._DIM

    async def embed(self, texts: List[str]) -> List[List[float]]:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self._api_key)
            response = await client.embeddings.create(
                model=self._MODEL,
                input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as exc:
            logger.error(f"[OpenAIEmbeddingProvider] embed failed: {exc}")
            return await HeuristicEmbeddingProvider().embed(texts)


# ─────────────────────────────────────────────────────────────────────────────
# Factory
# ─────────────────────────────────────────────────────────────────────────────

def get_embedding_provider() -> BaseEmbeddingProvider:
    provider = settings.EMBEDDING_PROVIDER.lower()
    if provider == "gemini":
        return GoogleGeminiEmbeddingProvider()
    elif provider == "openai":
        return OpenAIEmbeddingProvider()
    else:
        return HeuristicEmbeddingProvider()
