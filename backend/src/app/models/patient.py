import uuid
from datetime import date, datetime

from sqlalchemy import TIMESTAMP, UUID, Date, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.enums import SexType


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID, default=uuid.uuid4, primary_key=True)
    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    sex: Mapped[SexType] = mapped_column(Enum(SexType), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("profiles.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default_factory=datetime.now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default_factory=datetime.now, nullable=False, onupdate=datetime.now
    )
