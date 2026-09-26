"""LLM service"""
import logging
from typing import Optional
from openai import OpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMService:
    """OpenAI LLM service with graceful fallback"""

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.timeout = settings.LLM_TIMEOUT_SECONDS
        self.client: Optional[OpenAI] = None
        
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except ImportError:
                logger.warning("OpenAI client not installed")

    def generate_summary(self, data: dict) -> Optional[str]:
        """Generate AI summary from aggregated data (with graceful fallback)"""
        if not self.client:
            logger.warning("OpenAI client not configured, skipping AI generation")
            return None

        try:
            prompt = self._build_prompt(data)
            
            return self._call_openai(prompt)
        except Exception as e:
            logger.error(f"LLM error: {e}")
            return None

    def _build_prompt(self, data: dict) -> str:
        """Build prompt from aggregated data (facts only)"""
        lines = [
            "Проанализируй данные команды спортсменов по итогам тренировки.",
            "Правила: Только факты, без медицинских диагнозов. Очень коротко (1-3 предложения).",
            "",
            f"Всего спортсменов в группе: {data['total_athletes']}",
            f"Заполнили опрос до тренировки: {data['filled_pre']} ({data['pre_fill_rate']}%)",
            f"Заполнили опрос после тренировки: {data['filled_post']} ({data['post_fill_rate']}%)",
            f"Количество спортсменов с высокой усталостью (>=4/5): {data['high_fatigue_count']}",
            f"Количество спортсменов с высоким стрессом (>=4/5): {data['high_stress_count']}",
            f"Жалобы на боль: {data['pain_count']}",
        ]
        
        if data.get("avg_rpe"):
            lines.append(f"Средний показатель нагрузки (RPE): {data['avg_rpe']:.1f}/10")
        
        return "\n".join(lines)

    def _call_openai(self, prompt: str) -> Optional[str]:
        """Call the synchronous OpenAI client with its configured timeout."""
        client = self.client
        if client is None:
            return None

        try:
            response = client.with_options(timeout=self.timeout).chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "Ты - спортивный аналитик. Твоя задача давать краткую выжимку по состоянию команды."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=150,
                temperature=0.3,
            )
            
            if response.choices:
                content = response.choices[0].message.content
                return content.strip() if content else None
            
            return None
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
