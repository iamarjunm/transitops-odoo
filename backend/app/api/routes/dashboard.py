from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, text, bindparam, inspect
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas.dashboard import DashboardKPIs, FleetStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def vehicle_counts(db: Session, vehicle_type: str | None) -> dict[VehicleStatus, int]:
    stmt = select(Vehicle.status, func.count()).group_by(Vehicle.status)
    if vehicle_type:
        stmt = stmt.where(Vehicle.type == vehicle_type)
    return {status: count for status, count in db.execute(stmt).all()}


def count_where_in(db: Session, table: str, column: str, values: list[str]) -> int:
    """Count rows where `column` is one of `values`.

    Drivers/trips tables are built by other modules and may not exist yet, so
    this returns 0 instead of failing if the table isn't there.
    """
    if table not in inspect(db.bind).get_table_names():
        return 0
    try:
        stmt = text(f"SELECT count(*) FROM {table} WHERE {column} IN :vals").bindparams(
            bindparam("vals", expanding=True)
        )
        return db.execute(stmt, {"vals": values}).scalar() or 0
    except Exception:
        return 0


@router.get("/kpis", response_model=DashboardKPIs)
def get_kpis(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    vehicle_type: str | None = Query(default=None, description="filter KPIs to one vehicle type"),
):
    counts = vehicle_counts(db, vehicle_type)
    available = counts.get(VehicleStatus.AVAILABLE, 0)
    on_trip = counts.get(VehicleStatus.ON_TRIP, 0)
    in_shop = counts.get(VehicleStatus.IN_SHOP, 0)
    retired = counts.get(VehicleStatus.RETIRED, 0)
    total = available + on_trip + in_shop + retired
    active = total - retired

    return DashboardKPIs(
        active_vehicles=active,
        available_vehicles=available,
        vehicles_in_maintenance=in_shop,
        active_trips=count_where_in(db, "trips", "status", ["Dispatched"]),
        pending_trips=count_where_in(db, "trips", "status", ["Draft"]),
        drivers_on_duty=count_where_in(db, "drivers", "status", ["Available", "On Trip"]),
        fleet_utilization=round(on_trip / active * 100, 1) if active else 0,
        total_vehicles=total,
        fleet_status=FleetStatus(available=available, on_trip=on_trip, in_shop=in_shop, retired=retired),
    )
