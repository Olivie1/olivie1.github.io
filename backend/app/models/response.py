"""Response model (check-in data)"""
from datetime import datetime
from sqlalchemy import String, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Response(Base):
    __tablename__ = "Responses"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("Sessions.id"), nullable=False, index=True)
    athlete_id: Mapped[str] = mapped_column(String, ForeignKey("Athletes.id"), nullable=False, index=True)
    device_token: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    pre_check_in: Mapped[str | None] = mapped_column(String, nullable=True)
    post_check_in: Mapped[str | None] = mapped_column(String, nullable=True)
    pre_timestamp: Mapped[datetime | None] = mapped_column(nullable=True)
    post_timestamp: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_responses_session_id", "session_id"),
        Index("idx_responses_athlete_id", "athlete_id"),
        Index("idx_responses_device_token", "device_token"),
        Index("idx_responses_created_at", "created_at"),
    )

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "session_id": self.session_id,
            "athlete_id": self.athlete_id,
            "pre_check_in": json.loads(self.pre_check_in) if self.pre_check_in else None,
            "post_check_in": json.loads(self.post_check_in) if self.post_check_in else None,
            "pre_timestamp": self.pre_timestamp.isoformat() if self.pre_timestamp else None,
            "post_timestamp": self.post_timestamp.isoformat() if self.post_timestamp else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
