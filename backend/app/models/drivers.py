import enum
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DriverStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    full_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    license_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    license_category: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    license_expiry_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    contact_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    safety_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0,
    )

    status: Mapped[DriverStatus] = mapped_column(
        SAEnum(
            DriverStatus,
            name="driver_status",
            native_enum=False,
            length=32,
        ),
        nullable=False,
        default=DriverStatus.AVAILABLE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    trips = relationship("Trip", back_populates="driver")