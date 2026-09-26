"""Athlete registration route used before pre-check-in."""
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Athlete
from app.repositories import ResponseRepository, SessionRepository
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/athletes", tags=["athletes"])


class AthleteRegistrationRequest(BaseModel):
    athlete_code: str = Field(min_length=1, max_length=64)
    session_id: str = Field(min_length=1)


@router.post("/register")
async def register_athlete(
    request: AthleteRegistrationRequest,
    db: Session = Depends(get_db),
) -> APIResponse:
    db_session = SessionRepository.get_by_id(db, request.session_id)
    if not db_session or not db_session.is_active():
        raise HTTPException(status_code=404, detail="Session not found or closed")

    athlete_code = request.athlete_code.strip().upper()
    athlete = db.query(Athlete).filter(Athlete.id == athlete_code).first()
    if not athlete:
        athlete = Athlete(id=athlete_code)
        db.add(athlete)
        db.commit()

    existing = ResponseRepository.get_by_session_and_athlete(
        db, request.session_id, athlete_code
    )
    if existing:
        return APIResponse(
            success=True,
            data={"device_token": existing.device_token, "athlete_id": athlete_code},
        )

    device_token = str(uuid4())
    ResponseRepository.create_or_update(
        db,
        str(uuid4()),
        request.session_id,
        athlete_code,
        device_token,
    )
    return APIResponse(
        success=True,
        data={"device_token": device_token, "athlete_id": athlete_code},
    )
