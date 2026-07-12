import enum
from datetime import datetime, date

from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"


class Maintenance(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service: Mapped[str] = mapped_column(String(255), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[MaintenanceStatus] = mapped_column(
        SAEnum(
            MaintenanceStatus,
            name="maintenance_status",
            native_enum=False,
            length=20,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=MaintenanceStatus.ACTIVE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
