"""Telegram service"""
import logging
import requests

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TelegramService:
    """Telegram bot for sending summaries"""

    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID

    def send_summary(self, session_id: str, data: dict) -> bool:
        """Send session summary to Telegram"""
        if not self.bot_token or not self.chat_id:
            logger.warning("Telegram not configured, skipping message")
            return False

        try:
            message = self._format_message(session_id, data)
            self._send_message(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return False

    @staticmethod
    def _format_message(session_id: str, data: dict) -> str:
        """Format aggregated data as Telegram message"""
        lines = [
            "📊 Тренировка завершена",
            "",
            f"Группа: {session_id}",
            f"Всего спортсменов: {data['total_athletes']}",
            f"Заполнили до: {data['filled_pre']}/{data['total_athletes']} ({data['pre_fill_rate']}%)",
            f"Заполнили после: {data['filled_post']}/{data['total_athletes']} ({data['post_fill_rate']}%)",
            "",
            f"⚠️ Высокая усталость: {data['high_fatigue_count']}",
            f"⚠️ Высокий стресс: {data['high_stress_count']}",
            f"🩹 Боль/дискомфорт: {data['pain_count']}",
            "",
        ]
        
        if data.get("avg_rpe"):
            lines.append(f"Средняя нагрузка (RPE): {data['avg_rpe']:.1f}/10")
            lines.append("")
        
        if data.get("ai_note"):
            lines.append(f"💡 {data['ai_note']}")
            lines.append("")
        
        lines.extend([
            "---",
            f"Сессия: {session_id}",
        ])
        
        return "\n".join(lines)

    def _send_message(self, message: str) -> None:
        """Send message via Telegram API"""
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "HTML",
        }
        
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        logger.info("Telegram message sent successfully")
