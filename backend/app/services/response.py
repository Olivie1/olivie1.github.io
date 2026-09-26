"""Response service"""
import logging
from uuid import uuid4
from sqlalchemy.orm import Session

from app.repositories import ResponseRepository, SessionRepository

logger = logging.getLogger(__name__)


class ResponseService:
    """Response (check-in) business logic"""

    @staticmethod
    def submit_pre_check_in(
        db: Session,
        session_id: str,
        device_token: str,
        sleep: int,
        fatigue: int,
        stress: int,
        pain: bool,
    ) -> str:
        """Submit pre-check-in"""
        # Validate session
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session or not db_session.is_active():
            raise ValueError("Session not found")

        # Get response by device token
        existing = ResponseRepository.get_by_device_token(db, session_id, device_token)
        if not existing:
            raise ValueError("Device token invalid")

        # Check for duplicate pre-check-in
        if existing.pre_check_in:
            raise ValueError("Already checked in")

        # Update with pre-check-in data
        pre_data = {
            "sleep": sleep,
            "fatigue": fatigue,
            "stress": stress,
            "pain": pain,
        }
        
        response = ResponseRepository.update_pre_check_in(db, existing.id, pre_data)
        logger.info(f"Pre-check-in submitted: {response.id}")
        return response.id

    @staticmethod
    def submit_post_check_in(
        db: Session,
        session_id: str,
        device_token: str,
        rpe: float,
    ) -> None:
        """Submit post-check-in"""
        # Validate session
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session or not db_session.is_active():
            raise ValueError("Session not found")

        # Get response by device token
        existing = ResponseRepository.get_by_device_token(db, session_id, device_token)
        if not existing:
            raise ValueError("Response not found")

        # Check for pre-check-in
        if not existing.pre_check_in:
            raise ValueError("Pre-checkin not found. Please complete pre-checkin first.")

        if existing.post_check_in:
            raise ValueError("Post-checkin already submitted")

        # Update with post-check-in data
        post_data = {"rpe": rpe}
        ResponseRepository.update_post_check_in(db, session_id, existing.athlete_id, post_data)
        logger.info(f"Post-check-in submitted: {existing.id}")

    @staticmethod
    def get_session_responses(db: Session, session_id: str) -> list:
        """Get all responses for a session"""
        # Validate session
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session or not db_session.is_active():
            raise ValueError("Session not found")

        responses = ResponseRepository.get_by_session(db, session_id)
        
        result = []
        for r in responses:
            result.append(r.to_dict())
        
        return result
