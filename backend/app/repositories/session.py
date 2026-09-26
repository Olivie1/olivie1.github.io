"""Session repository"""
import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import Session as SessionModel

logger = logging.getLogger(__name__)


class SessionRepository:
    """Session database operations"""

    @staticmethod
    def create(db: Session, session_id: str, trainer_id: str, qr_code_data: str) -> SessionModel:
        """Create new session"""
        db_session = SessionModel(
            id=session_id,
            trainer_id=trainer_id,
            qr_code_data=qr_code_data,
            status="active",
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        logger.info(f"Session created: {session_id}")
        return db_session

    @staticmethod
    def get_by_id(db: Session, session_id: str) -> Optional[SessionModel]:
        """Get session by ID"""
        return db.query(SessionModel).filter(SessionModel.id == session_id).first()

    @staticmethod
    def list_sessions(
        db: Session, trainer_id: Optional[str] = None, limit: int = 50
    ) -> List[SessionModel]:
        """List sessions"""
        query = db.query(SessionModel)
        if trainer_id:
            query = query.filter(SessionModel.trainer_id == trainer_id)
        return query.order_by(desc(SessionModel.created_at)).limit(limit).all()

    @staticmethod
    def close(db: Session, session_id: str, aggregated_response: str) -> SessionModel:
        """Close session and save aggregated data"""
        db_session = SessionRepository.get_by_id(db, session_id)
        if not db_session:
            raise ValueError(f"Session not found: {session_id}")
        
        db_session.status = "closed"
        db_session.ended_at = datetime.utcnow()
        db_session.aggregated_response = aggregated_response
        
        db.commit()
        db.refresh(db_session)
        logger.info(f"Session closed: {session_id}")
        return db_session
