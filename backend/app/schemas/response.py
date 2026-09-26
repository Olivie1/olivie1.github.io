"""Response (check-in) schemas"""
from typing import Optional
from pydantic import BaseModel, Field


class PreCheckInRequest(BaseModel):
    """Pre-check-in request"""
    session_id: str
    device_token: str
    sleep: int = Field(ge=1, le=24)
    fatigue: int = Field(ge=1, le=5)
    stress: int = Field(ge=1, le=5)
    pain: bool

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "uuid-here",
                "device_token": "device-uuid",
                "sleep": 7,
                "fatigue": 3,
                "stress": 2,
                "pain": False,
            }
        }


class PostCheckInRequest(BaseModel):
    """Post-check-in request"""
    session_id: str
    device_token: str
    rpe: float = Field(ge=1, le=10)

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "uuid-here",
                "device_token": "device-uuid",
                "rpe": 7.5,
            }
        }


class PreCheckInResponse(BaseModel):
    """Pre-check-in response"""
    response_id: str
    next_step: str


class PostCheckInResponse(BaseModel):
    """Post-check-in response"""
    session_closed: bool


class CheckInResponseDTO(BaseModel):
    """Check-in response data transfer object"""
    id: str
    session_id: str
    athlete_id: str
    pre_check_in: Optional[dict] = None
    post_check_in: Optional[dict] = None
    pre_timestamp: Optional[str] = None
    post_timestamp: Optional[str] = None
    created_at: str
