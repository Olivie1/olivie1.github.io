
"""Session service"""
import logging
import base64
from io import BytesIO
from uuid import uuid4
from typing import Optional

import qrcode
import qrcode.constants # type: ignore
from sqlalchemy.orm import Session

from app.repositories import SessionRepository, ResponseRepository
from app.services.llm import LLMService
from app.services.telegram import TelegramService
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SessionService:
    """Session business logic"""

    def __init__(self, llm_service: LLMService, telegram_service: TelegramService):
        self.llm_service = llm_service
        self.telegram_service = telegram_service

    def create_session(
        self, db: Session, trainer_id: str, athlete_count: int, frontend_url: str
    ) -> dict:
        """Create new session with QR code"""
        session_id = str(uuid4())
        
        # Build deep link
        session_url = f"{frontend_url}/register-athlete?session_id={session_id}"
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4) # type: ignore
        qr.add_data(session_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to PNG and base64
        img_bytes = BytesIO()
        img.save(img_bytes, format="PNG") # type: ignore
        img_bytes.seek(0)
        
        qr_base64 = base64.b64encode(img_bytes.getvalue()).decode()
        qr_data_url = f"data:image/png;base64,{qr_base64}"
        
        # Save to database
        db_session = SessionRepository.create(db, session_id, trainer_id, qr_data_url)
        
        logger.info(f"Session created: {session_id} by {trainer_id}")
        
        return {
            "id": db_session.id,
            "trainer_id": db_session.trainer_id,
            "qr_code_data": db_session.qr_code_data,
            "created_at": db_session.created_at.isoformat() if db_session.created_at else None,
            "status": db_session.status,
        }

    def get_session(self, db: Session, session_id: str) -> dict:
        """Get session details"""
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session:
            raise ValueError("Session not found")
        
        import json
        agg_response = None
        if db_session.aggregated_response:
            agg_response = json.loads(db_session.aggregated_response)
        
        return {
            "id": db_session.id,
            "trainer_id": db_session.trainer_id,
            "qr_code_data": db_session.qr_code_data,
            "created_at": db_session.created_at.isoformat() if db_session.created_at else None,
            "started_at": db_session.started_at.isoformat() if db_session.started_at else None,
            "ended_at": db_session.ended_at.isoformat() if db_session.ended_at else None,
            "status": db_session.status,
            "aggregated_response": agg_response,
        }

    def list_sessions(
        self, db: Session, trainer_id: Optional[str] = None, limit: int = 50
    ) -> list:
        """List sessions"""
        if limit <= 0 or limit > 100:
            limit = 50
        
        sessions = SessionRepository.list_sessions(db, trainer_id, limit)
        
        import json
        result = []
        for s in sessions:
            agg_response = None
            if s.aggregated_response:
                agg_response = json.loads(s.aggregated_response)
            
            result.append({
                "id": s.id,
                "trainer_id": s.trainer_id,
                "qr_code_data": s.qr_code_data,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "status": s.status,
                "aggregated_response": agg_response,
            })
        
        return result

    def close_session(self, db: Session, session_id: str) -> dict:
        """Close session, aggregate data, send to LLM and Telegram"""
        # Get session
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session or not db_session.is_active():
            raise ValueError("Session not found or already closed")
        
        # Get aggregated data
        agg_data = ResponseRepository.get_aggregated_data(db, session_id)
        
        # Generate AI note (with graceful fallback)
        ai_note = None
        try:
            ai_note = self.llm_service.generate_summary(agg_data)
        except Exception as e:
            logger.warning(f"LLM failed, using graceful fallback: {e}")
            ai_note = self._generate_fallback_note(agg_data)
        
        if ai_note:
            agg_data["ai_note"] = ai_note
        
        # Save to DB
        import json
        SessionRepository.close(db, session_id, json.dumps(agg_data))
        
        # Send Telegram notification (fire and forget)
        try:
            self.telegram_service.send_summary(session_id, agg_data)
        except Exception as e:
            logger.warning(f"Telegram send failed: {e}")
        
        return agg_data

    @staticmethod
    def _generate_fallback_note(data: dict) -> str:
        """Generate fallback AI note without LLM"""
        if data["total_athletes"] == 0:
            return ""
        
        notes = []
        
        if data["pre_fill_rate"] >= 90:
            notes.append("Great pre-checkin participation!")
        elif data["pre_fill_rate"] >= 70:
            notes.append("Good pre-checkin compliance.")
        else:
            notes.append("Need to improve pre-checkin participation.")
        
        if data["high_fatigue_count"] > 0:
            notes.append(f"{data['high_fatigue_count']} athletes reported high fatigue.")
        
        if data["high_stress_count"] > 0:
            notes.append(f"{data['high_stress_count']} athletes reported high stress.")
        
        if data["pain_count"] > 0:
            notes.append(f"{data['pain_count']} athletes reported pain.")
        
        if data.get("avg_rpe"):
            notes.append(f"Average RPE: {data['avg_rpe']:.1f}")
        
        return " ".join(notes)

