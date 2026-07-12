from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict

from app.models.vehicle import VehicleStatus


class VehicleCreate(BaseModel):
    registration_number: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=50)
    region: str | None = Field(default=None, max_length=80)
    capacity: int = Field(gt=0)
    odometer: int = Field(default=0, ge=0)
    cost: float = Field(default=0, ge=0)
    status: VehicleStatus = VehicleStatus.AVAILABLE


class VehicleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: str | None = Field(default=None, min_length=1, max_length=50)
    region: str | None = Field(default=None, max_length=80)
    capacity: int | None = Field(default=None, gt=0)
    odometer: int | None = Field(default=None, ge=0)
    cost: float | None = Field(default=None, ge=0)
    status: VehicleStatus | None = None


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration_number: str
    name: str
    type: str
    region: str | None
    capacity: int
    odometer: int
    cost: float
    status: VehicleStatus
    created_at: datetime
