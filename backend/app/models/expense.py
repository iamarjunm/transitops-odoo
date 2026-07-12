import enum
from datetime import datetime, date

from sqlalchemy import String, Integer, Numeric, Float, Date, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ExpenseType(str, enum.Enum):
    FUEL = "Fuel"
    TOLL = "Toll"
    MAINTENANCE = "Maintenance"
    OTHER = "Other"


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    vehicle_id: Mapped[int | None] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=True, index=True
    )
    trip_id: Mapped[int | None] = mapped_column(
        ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True
    )
    type: Mapped[ExpenseType] = mapped_column(
        SAEnum(
            ExpenseType,
            name="expense_type",
            native_enum=False,
            length=20,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    details: Mapped[str | None] = mapped_column(String(255), nullable=True)
    liters: Mapped[float | None] = mapped_column(Float, nullable=True)  # set for fuel logs

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
