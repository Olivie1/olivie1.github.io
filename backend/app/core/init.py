"""Application initialization utilities"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def verify_database_exists(db_path: str) -> bool:
    """Verify that database file exists and is readable"""
    db_file = Path(db_path)
    
    if db_file.exists():
        logger.info(f"Database file found: {db_path}")
        return True
    
    logger.warning(f"Database file not found: {db_path}")
    logger.info("Expected: Database should be created by Go backend migration")
    logger.info("Or: Copy from recovery-app-backend/recovery.db")
    
    return False


def create_tables_if_needed(db):
    """Create tables if they don't exist (for first-time setup)"""
    from app.models import Athlete, Session, Response
    
    try:
        # Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        if "Athletes" in tables and "Sessions" in tables and "Responses" in tables:
            logger.info("All tables exist")
            return True
        
        logger.info("Creating tables...")
        from app.core.database import Base
        Base.metadata.create_all(bind=db.engine)
        logger.info("Tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to verify/create tables: {e}")
        return False


def setup_test_data(db):
    """Load test athletes if database is empty (optional)"""
    try:
        from app.models import Athlete
        
        athlete_count = db.query(Athlete).count()
        if athlete_count > 0:
            logger.info(f"Database has {athlete_count} athletes")
            return True
        
        logger.info("Database is empty, skipping test data load")
        logger.info("(Test athletes should come from Go migration)")
        return True
    except Exception as e:
        logger.warning(f"Failed to check test data: {e}")
        return False
