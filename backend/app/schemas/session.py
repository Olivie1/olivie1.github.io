"""Session schemas"""
from typing import Optional
from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    """Create session request"""
    trainer_id: str
    athlete_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "trainer_id": "trainer-main",
                "athlete_count": 15,
            }
        }


class CreateSessionResponse(BaseModel):
    """Create session response"""
    id: str
    trainer_id: str
    qr_code_data: str
    created_at: str
    status: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-here",
                "trainer_id": "trainer-main",
                "qr_code_data": "data:image/png;base64,iVBORw0K...",
                "created_at": "2024-09-25T10:00:00Z",
                "status": "active",
            }
        }


class SessionDTO(BaseModel):
    """Session data transfer object"""
    id: str
    trainer_id: str
    qr_code_data: str
    created_at: str
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    status: str
    aggregated_response: Optional[dict] = None
