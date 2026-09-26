"""Trainer authentication route used by the pilot frontend."""
from datetime import datetime, timedelta, timezone
from secrets import compare_digest

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

from app.core.config import get_settings
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


class LoginRequest(BaseModel):
    secret: str


@router.post("/login")
async def login(request: LoginRequest) -> APIResponse:
    if not compare_digest(request.secret, settings.TRAINER_SECRET):
        raise HTTPException(status_code=401, detail="Invalid trainer secret")

    expires_at = datetime.now(timezone.utc) + timedelta(hours=12)
    token = jwt.encode(
        {"sub": "trainer-main", "exp": expires_at},
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    return APIResponse(
        success=True,
        data={"token": token, "expires_at": expires_at.isoformat()},
    )
