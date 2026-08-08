"""
LLM client abstraction. Gemini is the primary/default provider; the
interface is provider-agnostic so OpenAI or Claude could be dropped in
later without touching the RAG pipeline code.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from app.config import get_settings

settings = get_settings()


class LLMClient(ABC):
    @abstractmethod
    async def stream_answer(self, system_prompt: str, user_message: str) -> AsyncIterator[str]:
        """Yields the answer text incrementally (token/chunk by chunk)."""
        ...


class GeminiClient(LLMClient):
    def __init__(self, api_key: str, model_name: str) -> None:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(model_name)

    async def stream_answer(self, system_prompt: str, user_message: str) -> AsyncIterator[str]:
        prompt = f"{system_prompt}\n\n{user_message}"
        response = self._model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text


class OpenAIClient(LLMClient):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini") -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key)
        self._model_name = model_name

    async def stream_answer(self, system_prompt: str, user_message: str) -> AsyncIterator[str]:
        stream = self._client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            stream=True,
        )
        for event in stream:
            delta = event.choices[0].delta.content
            if delta:
                yield delta


_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _client
    if _client is not None:
        return _client

    if settings.llm_provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("LLM_PROVIDER=openai requires OPENAI_API_KEY to be set.")
        _client = OpenAIClient(settings.openai_api_key)
    else:
        if not settings.gemini_api_key:
            raise RuntimeError("LLM_PROVIDER=gemini requires GEMINI_API_KEY to be set.")
        _client = GeminiClient(settings.gemini_api_key, settings.gemini_model)
    return _client
