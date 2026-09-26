"""Session model"""
from datetime import datetime
from sqlalchemy import String, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Session(Base):
    __tablename__ = "Sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    trainer_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    qr_code_data: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String, default="active", index=True)
    aggregated_response: Mapped[str | None] = mapped_column(String, nullable=True)

    __table_args__ = (
        Index("idx_sessions_trainer_id", "trainer_id"),
        Index("idx_sessions_status", "status"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "trainer_id": self.trainer_id,
            "qr_code_data": self.qr_code_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "status": self.status,
            "aggregated_response": self.aggregated_response,
        }

    def is_active(self) -> bool:
        return self.status == "active"
