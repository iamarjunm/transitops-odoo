from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.user import UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

manage_vehicles = require_role(UserRole.FLEET_MANAGER)


def get_vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
    status: VehicleStatus | None = None,
    type: str | None = None,
    search: str | None = Query(default=None, description="match registration number or name"),
):
    stmt = select(Vehicle)
    if status:
        stmt = stmt.where(Vehicle.status == status)
    if type:
        stmt = stmt.where(Vehicle.type == type)
    if search:
        term = f"%{search}%"
        stmt = stmt.where(or_(Vehicle.registration_number.ilike(term), Vehicle.name.ilike(term)))
    stmt = stmt.order_by(Vehicle.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db), _=Depends(manage_vehicles)):
    reg = payload.registration_number.strip()
    existing = db.execute(
        select(Vehicle).where(Vehicle.registration_number == reg)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Registration number already exists")

    vehicle = Vehicle(**{**payload.model_dump(), "registration_number": reg})
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_vehicle_or_404(vehicle_id, db)


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    _=Depends(manage_vehicles),
):
    vehicle = get_vehicle_or_404(vehicle_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), _=Depends(manage_vehicles)):
    vehicle = get_vehicle_or_404(vehicle_id, db)
    db.delete(vehicle)
    db.commit()
