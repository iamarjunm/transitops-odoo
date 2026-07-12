from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.user import UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.maintenance import Maintenance, MaintenanceStatus
from app.schemas.maintenance import MaintenanceCreate, MaintenanceOut

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

manage = require_role(UserRole.FLEET_MANAGER)


def get_or_404(maintenance_id: int, db: Session) -> Maintenance:
    record = db.get(Maintenance, maintenance_id)
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return record


@router.get("", response_model=list[MaintenanceOut])
def list_maintenance(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    vehicle_id: int | None = None,
    status: MaintenanceStatus | None = None,
):
    stmt = select(Maintenance)
    if vehicle_id:
        stmt = stmt.where(Maintenance.vehicle_id == vehicle_id)
    if status:
        stmt = stmt.where(Maintenance.status == status)
    return db.execute(stmt.order_by(Maintenance.date.desc())).scalars().all()


@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def create_maintenance(payload: MaintenanceCreate, db: Session = Depends(get_db), _=Depends(manage)):
    vehicle = db.get(Vehicle, payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status == VehicleStatus.RETIRED:
        raise HTTPException(status_code=400, detail="Cannot log maintenance for a retired vehicle")

    record = Maintenance(
        vehicle_id=payload.vehicle_id,
        service=payload.service,
        cost=payload.cost,
        date=payload.date or date.today(),
        status=MaintenanceStatus.ACTIVE,
    )
    # Business rule: an active maintenance record puts the vehicle In Shop,
    # which removes it from the dispatch pool.
    vehicle.status = VehicleStatus.IN_SHOP

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{maintenance_id}/close", response_model=MaintenanceOut)
def close_maintenance(maintenance_id: int, db: Session = Depends(get_db), _=Depends(manage)):
    record = get_or_404(maintenance_id, db)
    if record.status == MaintenanceStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Maintenance is already closed")

    record.status = MaintenanceStatus.COMPLETED

    # Restore the vehicle to Available unless it's retired or still has other
    # open maintenance records.
    vehicle = db.get(Vehicle, record.vehicle_id)
    if vehicle and vehicle.status != VehicleStatus.RETIRED:
        other_open = db.execute(
            select(func.count())
            .select_from(Maintenance)
            .where(
                Maintenance.vehicle_id == record.vehicle_id,
                Maintenance.id != record.id,
                Maintenance.status == MaintenanceStatus.ACTIVE,
            )
        ).scalar()
        if not other_open:
            vehicle.status = VehicleStatus.AVAILABLE

    db.commit()
    db.refresh(record)
    return record


@router.get("/{maintenance_id}", response_model=MaintenanceOut)
def get_maintenance(maintenance_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_or_404(maintenance_id, db)
