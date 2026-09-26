"""Common schemas"""
from typing import Optional, Any
from pydantic import BaseModel


class APIResponse(BaseModel):
    """Standard API response format (matches Go version)"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
