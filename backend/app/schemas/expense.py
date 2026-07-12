import datetime

from pydantic import BaseModel, Field, ConfigDict

from app.models.expense import ExpenseType


class ExpenseCreate(BaseModel):
    type: ExpenseType
    amount: float = Field(ge=0)
    vehicle_id: int | None = None
    trip_id: int | None = None
    date: datetime.date | None = None  # defaults to today
    details: str | None = Field(default=None, max_length=255)
    liters: float | None = Field(default=None, ge=0)  # for fuel logs


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: ExpenseType
    amount: float
    vehicle_id: int | None
    trip_id: int | None
    date: datetime.date
    details: str | None
    liters: float | None
    created_at: datetime.datetime


class OperationalCost(BaseModel):
    vehicle_id: int
    fuel_cost: float
    maintenance_cost: float
    other_expenses: float
    total_operational_cost: float  # fuel + maintenance
