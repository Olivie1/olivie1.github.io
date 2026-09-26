"""Application entry point"""
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings, setup_logging
from app.core.database import init_db
from app.routes import auth, athlete, health, session, response

# Setup logging
settings = get_settings()
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Recovery App Backend",
    description="QR Check-in system for athlete recovery tracking",
    version="0.1.0",
)

# CORS middleware (matches Go version)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(athlete.router)
app.include_router(session.router)
app.include_router(response.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    """Keep error responses compatible with the frontend API contract."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "error": str(exc.detail)},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Return validation failures in the standard API envelope."""
    return JSONResponse(
        status_code=422,
        content={"success": False, "data": None, "error": str(exc.errors())},
    )


@app.on_event("startup")
async def startup_event():
    """Startup event"""
    logger.info(f"Starting Recovery App Backend on port {settings.PORT}")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"Database: {settings.DB_PATH}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    logger.info("Shutting down Recovery App Backend")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENV == "development",
        log_level=settings.LOG_LEVEL.lower(),
    )
