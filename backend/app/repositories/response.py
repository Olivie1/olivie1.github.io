"""Response repository"""
import logging
import json
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.models import Response as ResponseModel

logger = logging.getLogger(__name__)


class ResponseRepository:
    """Response (check-in) database operations"""

    @staticmethod
    def create_or_update(
        db: Session,
        response_id: str,
        session_id: str,
        athlete_id: str,
        device_token: str,
    ) -> ResponseModel:
        """Create or update response"""
        existing = (
            db.query(ResponseModel)
            .filter(
                and_(
                    ResponseModel.session_id == session_id,
                    ResponseModel.athlete_id == athlete_id,
                )
            )
            .first()
        )

        if existing:
            logger.debug(f"Response already exists for {athlete_id} in {session_id}")
            return existing

        db_response = ResponseModel(
            id=response_id,
            session_id=session_id,
            athlete_id=athlete_id,
            device_token=device_token,
        )
        db.add(db_response)
        db.commit()
        db.refresh(db_response)
        logger.info(f"Response created: {response_id}")
        return db_response

    @staticmethod
    def get_by_device_token(
        db: Session, session_id: str, device_token: str
    ) -> Optional[ResponseModel]:
        """Get response by session and device token"""
        return (
            db.query(ResponseModel)
            .filter(
                and_(
                    ResponseModel.session_id == session_id,
                    ResponseModel.device_token == device_token,
                )
            )
            .first()
        )

    @staticmethod
    def get_by_session_and_athlete(
        db: Session, session_id: str, athlete_id: str
    ) -> Optional[ResponseModel]:
        """Get response by session and athlete"""
        return (
            db.query(ResponseModel)
            .filter(
                and_(
                    ResponseModel.session_id == session_id,
                    ResponseModel.athlete_id == athlete_id,
                )
            )
            .first()
        )

    @staticmethod
    def update_pre_check_in(
        db: Session, response_id: str, pre_check_in: dict
    ) -> ResponseModel:
        """Update pre-check-in data"""
        db_response = db.query(ResponseModel).filter(ResponseModel.id == response_id).first()
        if not db_response:
            raise ValueError(f"Response not found: {response_id}")

        db_response.pre_check_in = json.dumps(pre_check_in)
        db_response.pre_timestamp = datetime.utcnow()
        
        db.commit()
        db.refresh(db_response)
        logger.debug(f"Pre-check-in updated: {response_id}")
        return db_response

    @staticmethod
    def update_post_check_in(
        db: Session, session_id: str, athlete_id: str, post_check_in: dict
    ) -> ResponseModel:
        """Update post-check-in data"""
        db_response = ResponseRepository.get_by_session_and_athlete(db, session_id, athlete_id)
        if not db_response:
            raise ValueError(f"Response not found for {athlete_id} in {session_id}")

        db_response.post_check_in = json.dumps(post_check_in)
        db_response.post_timestamp = datetime.utcnow()
        
        db.commit()
        db.refresh(db_response)
        logger.debug(f"Post-check-in updated: {db_response.id}")
        return db_response

    @staticmethod
    def get_by_session(db: Session, session_id: str) -> List[ResponseModel]:
        """Get all responses for a session"""
        return (
            db.query(ResponseModel)
            .filter(ResponseModel.session_id == session_id)
            .order_by(desc(ResponseModel.created_at))
            .all()
        )

    @staticmethod
    def get_aggregated_data(db: Session, session_id: str) -> dict:
        """Calculate aggregated data for session (matches Go logic exactly)"""
        responses = ResponseRepository.get_by_session(db, session_id)

        if not responses:
            return {
                "total_athletes": 0,
                "filled_pre": 0,
                "filled_post": 0,
                "pre_fill_rate": 0,
                "post_fill_rate": 0,
                "high_fatigue_count": 0,
                "high_stress_count": 0,
                "pain_count": 0,
                "avg_rpe": None,
            }

        total = len(set(r.athlete_id for r in responses))
        filled_pre = len([r for r in responses if r.pre_check_in])
        filled_post = len([r for r in responses if r.post_check_in])

        pre_fill_rate = (filled_pre * 100) // total if total > 0 else 0
        post_fill_rate = (filled_post * 100) // total if total > 0 else 0

        high_fatigue_count = 0
        high_stress_count = 0
        pain_count = 0
        rpe_values = []

        for r in responses:
            if r.pre_check_in:
                pre_data = json.loads(r.pre_check_in)
                if pre_data.get("fatigue", 0) >= 4:
                    high_fatigue_count += 1
                if pre_data.get("stress", 0) >= 4:
                    high_stress_count += 1
                if pre_data.get("pain"):
                    pain_count += 1

            if r.post_check_in:
                post_data = json.loads(r.post_check_in)
                rpe_values.append(post_data.get("rpe", 0))

        avg_rpe = sum(rpe_values) / len(rpe_values) if rpe_values else None

        return {
            "total_athletes": total,
            "filled_pre": filled_pre,
            "filled_post": filled_post,
            "pre_fill_rate": pre_fill_rate,
            "post_fill_rate": post_fill_rate,
            "high_fatigue_count": high_fatigue_count,
            "high_stress_count": high_stress_count,
            "pain_count": pain_count,
            "avg_rpe": avg_rpe,
        }
