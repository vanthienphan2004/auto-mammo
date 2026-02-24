import uuid
from datetime import datetime

from sqlalchemy import NUMERIC, TIMESTAMP, UUID, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.enums import QueueStatus, UrgencyLevel


class QueueItem(Base):
    __tablename__ = "queue_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID, default=uuid.uuid4, primary_key=True)
    scan_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("scans.id"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("patients.id"), nullable=False)
    urgency_score: Mapped[int] = mapped_column(NUMERIC(4, 2))
    urgency_level: Mapped[UrgencyLevel] = mapped_column(Enum(UrgencyLevel), nullable=False)
    status: Mapped[QueueStatus] = mapped_column(Enum(QueueStatus), nullable=False)
    assigned_to: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("profiles.id"))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default_factory=datetime.now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default_factory=datetime.now, nullable=False, onupdate=datetime.now
    )
