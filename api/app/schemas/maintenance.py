import datetime

from pydantic import BaseModel, Field, ConfigDict

from app.models.maintenance import MaintenanceStatus


class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service: str = Field(min_length=1, max_length=255)
    cost: float = Field(default=0, ge=0)
    date: datetime.date | None = None  # defaults to today when omitted


class MaintenanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    service: str
    cost: float
    date: datetime.date
    status: MaintenanceStatus
    created_at: datetime.datetime
