"""Health check endpoint"""
from datetime import datetime
from fastapi import APIRouter
from app.schemas.common import APIResponse

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "recovery-app-backend-py",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
