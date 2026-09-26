"""Check-in response routes"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import PreCheckInRequest, PostCheckInRequest
from app.schemas.response import PreCheckInResponse, PostCheckInResponse
from app.schemas.common import APIResponse
from app.services import ResponseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/checkin", tags=["checkin"])


@router.post("/pre")
async def submit_pre_check_in(
    request: PreCheckInRequest,
    db: Session = Depends(get_db),
) -> APIResponse:
    """Submit pre-check-in (before workout)"""
    try:
        response_id = ResponseService.submit_pre_check_in(
            db,
            request.session_id,
            request.device_token,
            request.sleep,
            request.fatigue,
            request.stress,
            request.pain,
        )
        
        data = PreCheckInResponse(
            response_id=response_id,
            next_step="wait_for_post",
        )
        return APIResponse(success=True, data=data.model_dump())
    except ValueError as e:
        error_msg = str(e)
        if "already checked in" in error_msg.lower():
            logger.warning(f"Duplicate check-in: {e}")
            raise HTTPException(status_code=409, detail=error_msg)
        elif "invalid" in error_msg.lower() or "not found" in error_msg.lower():
            logger.warning(f"Invalid request: {e}")
            raise HTTPException(status_code=400, detail=error_msg)
        else:
            logger.warning(f"Pre-check-in error: {e}")
            raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to submit pre-check-in: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/post")
async def submit_post_check_in(
    request: PostCheckInRequest,
    db: Session = Depends(get_db),
) -> APIResponse:
    """Submit post-check-in (after workout)"""
    try:
        ResponseService.submit_post_check_in(
            db,
            request.session_id,
            request.device_token,
            request.rpe,
        )
        
        data = PostCheckInResponse(session_closed=False)
        return APIResponse(success=True, data=data.model_dump())
    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Post-check-in error: {e}")
        status_code = 409 if "already submitted" in error_msg.lower() else 400
        raise HTTPException(status_code=status_code, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to submit post-check-in: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/sessions/{session_id}")
async def get_session_responses(
    session_id: str,
    db: Session = Depends(get_db),
) -> APIResponse:
    """Get all responses for a session"""
    try:
        responses = ResponseService.get_session_responses(db, session_id)
        return APIResponse(success=True, data=responses)
    except ValueError as e:
        logger.warning(f"Session not found: {e}")
        raise HTTPException(status_code=404, detail="Session not found or closed")
    except Exception as e:
        logger.error(f"Failed to get session responses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
