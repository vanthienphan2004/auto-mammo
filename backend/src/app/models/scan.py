import uuid
from datetime import datetime

from sqlalchemy import BIGINT, TIMESTAMP, UUID, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[uuid.UUID] = mapped_column(UUID, default=uuid.uuid4, primary_key=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("patients.id"), nullable=False)
    image_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BIGINT)
    file_type: Mapped[str] = mapped_column(Text)
    clinical_notes: Mapped[str] = mapped_column(Text)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("profiles.id"))
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default_factory=datetime.now, nullable=False
    )
