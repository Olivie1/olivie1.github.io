
"""Session routes"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import get_settings
from app.schemas import CreateSessionRequest, CreateSessionResponse
from app.schemas.common import APIResponse
from app.services import SessionService, LLMService
from app.services.telegram import TelegramService

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/api", tags=["sessions"])

# Initialize services
llm_service = LLMService()
telegram_service = TelegramService()
session_service = SessionService(llm_service, telegram_service)


@router.post("/sessions")
async def create_session(
    request: CreateSessionRequest,
    http_request: Request,
    db: Session = Depends(get_db),
) -> APIResponse:
    """Create new session with QR code"""
    try:
        if not request.trainer_id or request.athlete_count <= 0:
            raise ValueError("Invalid trainer_id or athlete_count")
        
        frontend_url = http_request.headers.get("origin") or settings.FRONTEND_URL
        data = session_service.create_session(
            db,
            request.trainer_id,
            request.athlete_count,
            frontend_url.rstrip("/"),
        )
        
        response = CreateSessionResponse(**data)
        return APIResponse(success=True, data=response.model_dump())
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/sessions")
async def list_sessions(
    trainer_id: Optional[str] = Query(None),
    limit: Optional[int] = Query(50),
    db: Session = Depends(get_db),
) -> APIResponse:
    """List sessions"""
    try:
        sessions = session_service.list_sessions(db, trainer_id, limit or 50)
        return APIResponse(success=True, data=sessions)
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> APIResponse:
    """Get session details"""
    try:
        session = session_service.get_session(db, session_id)
        return APIResponse(success=True, data=session)
    except ValueError:
        logger.warning(f"Session not found: {session_id}")
        raise HTTPException(status_code=404, detail="Session not found or closed")
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/sessions/{session_id}/close")
async def close_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> APIResponse:
    """Close session and generate summary"""
    try:
        aggregated_data = session_service.close_session(db, session_id)
        return APIResponse(
            success=True,
            data={
                "aggregated_response": aggregated_data,
                "closed_at": "",  # Match Go version format
            }
        )
    except ValueError as e:
        logger.warning(f"Session error: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to close session: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
