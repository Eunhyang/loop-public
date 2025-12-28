"""
LLM Service

LLM 호출 추상화 (OpenAI/Claude 공통 인터페이스)
n8n, API, 스킬에서 동일한 프롬프트로 LLM 호출 가능

Usage:
    from api.services.llm_service import LLMService

    llm = LLMService()
    result = await llm.call_llm(prompt, provider="openai")
"""

import os
import json
import re
from typing import Dict, Any, Optional, List
from pathlib import Path

# OpenAI 클라이언트
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Anthropic 클라이언트
try:
    from anthropic import AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class LLMService:
    """LLM 호출 서비스"""

    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self._init_clients()

    def _init_clients(self):
        """LLM 클라이언트 초기화"""
        # OpenAI
        if OPENAI_AVAILABLE:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.openai_client = AsyncOpenAI(api_key=api_key)

        # Anthropic
        if ANTHROPIC_AVAILABLE:
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if api_key:
                self.anthropic_client = AsyncAnthropic(api_key=api_key)

    async def call_llm(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        provider: str = "openai",
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: str = "json"
    ) -> Dict[str, Any]:
        """
        LLM 호출 및 JSON 파싱

        Args:
            prompt: 사용자 프롬프트
            system_prompt: 시스템 프롬프트
            provider: "openai" | "anthropic"
            model: 모델 ID (없으면 기본값 사용)
            temperature: 생성 온도
            max_tokens: 최대 토큰 수
            response_format: "json" | "text"

        Returns:
            {
                "success": bool,
                "content": Dict | str,  # 파싱된 JSON 또는 텍스트
                "raw": str,  # 원본 응답
                "model": str,  # 사용된 모델
                "provider": str,
                "error": Optional[str]
            }
        """
        if provider == "openai":
            return await self._call_openai(
                prompt, system_prompt, model, temperature, max_tokens, response_format
            )
        elif provider == "anthropic":
            return await self._call_anthropic(
                prompt, system_prompt, model, temperature, max_tokens, response_format
            )
        else:
            return {
                "success": False,
                "content": None,
                "raw": "",
                "model": "",
                "provider": provider,
                "error": f"Unknown provider: {provider}"
            }

    async def _call_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        response_format: str
    ) -> Dict[str, Any]:
        """OpenAI API 호출"""
        if not self.openai_client:
            return {
                "success": False,
                "content": None,
                "raw": "",
                "model": "",
                "provider": "openai",
                "error": "OpenAI client not initialized. Check OPENAI_API_KEY."
            }

        # 기본 모델
        model = model or "gpt-4o-mini"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            # JSON mode (gpt-4o, gpt-4o-mini 지원)
            if response_format == "json" and model in ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]:
                kwargs["response_format"] = {"type": "json_object"}

            response = await self.openai_client.chat.completions.create(**kwargs)
            raw_content = response.choices[0].message.content

            # JSON 파싱
            content = raw_content
            if response_format == "json":
                content = self._parse_json_response(raw_content)

            return {
                "success": True,
                "content": content,
                "raw": raw_content,
                "model": model,
                "provider": "openai",
                "error": None
            }

        except Exception as e:
            return {
                "success": False,
                "content": None,
                "raw": "",
                "model": model,
                "provider": "openai",
                "error": str(e)
            }

    async def _call_anthropic(
        self,
        prompt: str,
        system_prompt: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        response_format: str
    ) -> Dict[str, Any]:
        """Anthropic API 호출"""
        if not self.anthropic_client:
            return {
                "success": False,
                "content": None,
                "raw": "",
                "model": "",
                "provider": "anthropic",
                "error": "Anthropic client not initialized. Check ANTHROPIC_API_KEY."
            }

        # 기본 모델
        model = model or "claude-sonnet-4-20250514"

        try:
            kwargs = {
                "model": model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}],
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            response = await self.anthropic_client.messages.create(**kwargs)
            raw_content = response.content[0].text

            # JSON 파싱
            content = raw_content
            if response_format == "json":
                content = self._parse_json_response(raw_content)

            return {
                "success": True,
                "content": content,
                "raw": raw_content,
                "model": model,
                "provider": "anthropic",
                "error": None
            }

        except Exception as e:
            return {
                "success": False,
                "content": None,
                "raw": "",
                "model": model,
                "provider": "anthropic",
                "error": str(e)
            }

    def _parse_json_response(self, raw: str) -> Dict[str, Any]:
        """
        LLM 응답에서 JSON 추출 및 파싱

        - Markdown 코드블록 제거
        - JSON 객체 추출
        """
        # Markdown 코드블록 제거
        raw = re.sub(r'^```(?:json)?\s*\n?', '', raw.strip())
        raw = re.sub(r'\n?```\s*$', '', raw)

        # JSON 객체 찾기
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # { } 사이의 내용 추출 시도
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass

            # 파싱 실패시 원본 반환
            return {"raw_text": raw, "parse_error": True}

    def get_available_providers(self) -> List[str]:
        """사용 가능한 provider 목록"""
        providers = []
        if self.openai_client:
            providers.append("openai")
        if self.anthropic_client:
            providers.append("anthropic")
        return providers


# 싱글톤 인스턴스
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """LLM Service 싱글톤"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
