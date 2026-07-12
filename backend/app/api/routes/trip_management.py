from fastapi import HTTPException, APIRouter, Depends, status, Response
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, timezone
from app.models.trips import Trip, TripStatus
from app.models.drivers import Driver, DriverStatus
from app.models.vehicle import Vehicle, VehicleStatus
from core.database import get_db
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/trips", tags=["Trips"])

class TripCreate(BaseModel):
    source: str = Field(..., min_length=1, max_length=255)
    destination: str = Field(..., min_length=1, max_length=255)

    vehicle_id: int = Field(..., gt=0)
    driver_id: int = Field(..., gt=0)

    cargo_weight_kg: float = Field(..., gt=0)
    planned_distance_km: float = Field(..., gt=0)

    revenue: Decimal | None = Field(None, ge=0)

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )


class TripResponse(BaseModel):
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float
    planned_distance_km: float
    revenue: Decimal | None
    status: TripStatus
    dispatched_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripListItem(BaseModel):
    id: int

    source: str
    destination: str

    vehicle_id: int
    vehicle_registration_number: str

    driver_id: int
    driver_name: str

    cargo_weight_kg: float
    planned_distance_km: float

    revenue: Decimal | None

    status: TripStatus

    dispatched_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompleteTripRequest(BaseModel):
    end_odometer_km: int = Field(..., gt=0)
    fuel_consumed_liters: float = Field(..., ge=0)


class TripDetailResponse(BaseModel):
    id: int

    source: str
    destination: str

    cargo_weight_kg: float
    planned_distance_km: float
    revenue: Decimal | None

    status: TripStatus

    dispatched_at: datetime | None
    completed_at: datetime | None

    start_odometer_km: int | None
    end_odometer_km: int | None
    fuel_consumed_liters: float | None

    created_at: datetime
    updated_at: datetime

    vehicle_id: int
    vehicle_registration_number: str
    vehicle_name: str
    vehicle_type: str
    vehicle_region: str | None
    vehicle_capacity: int
    vehicle_odometer: int
    vehicle_status: VehicleStatus

    driver_id: int
    driver_name: str
    driver_contact_number: str
    driver_license_number: str
    driver_license_category: str
    driver_license_expiry_date: date
    driver_safety_score: float
    driver_status: DriverStatus

    model_config = ConfigDict(from_attributes=True)




@router.post("/create", response_model=TripResponse, status_code=201)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):

    vehicle = db.get(Vehicle, payload.vehicle_id)
    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    driver = db.get(Driver, payload.driver_id)
    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle is currently '{vehicle.status.value}'",
        )

    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail=f"Driver is currently '{driver.status.value}'",
        )

    if driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Driver's license has expired",
        )

    if payload.cargo_weight_kg > vehicle.capacity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Vehicle capacity is {vehicle.capacity} kg "
                f"but cargo weight is {payload.cargo_weight_kg} kg"
            ),
        )

    active_driver_trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == payload.driver_id,
            Trip.status == TripStatus.DISPATCHED,
        )
        .first()
    )

    if active_driver_trip:
        raise HTTPException(
            status_code=400,
            detail="Driver already has an active trip",
        )

    active_vehicle_trip = (
        db.query(Trip)
        .filter(
            Trip.vehicle_id == payload.vehicle_id,
            Trip.status == TripStatus.DISPATCHED,
        )
        .first()
    )

    if active_vehicle_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already has an active trip",
        )

    trip = Trip(
        source=payload.source,
        destination=payload.destination,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        cargo_weight_kg=payload.cargo_weight_kg,
        planned_distance_km=payload.planned_distance_km,
        revenue=payload.revenue,
        status=TripStatus.DRAFT,
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip


@router.get("/list", response_model=list[TripListItem])
def get_trip_list(db: Session = Depends(get_db)):
    trips = (
        db.query(Trip)
        .options(
            joinedload(Trip.driver),
            joinedload(Trip.vehicle),
        )
        .order_by(Trip.created_at.desc())
        .all()
    )

    return [
        TripListItem(
            id=trip.id,
            source=trip.source,
            destination=trip.destination,
            vehicle_id=trip.vehicle.id,
            vehicle_registration_number=trip.vehicle.registration_number,
            driver_id=trip.driver.id,
            driver_name=trip.driver.full_name,
            cargo_weight_kg=trip.cargo_weight_kg,
            planned_distance_km=trip.planned_distance_km,
            revenue=trip.revenue,
            status=trip.status,
            dispatched_at=trip.dispatched_at,
            completed_at=trip.completed_at,
            created_at=trip.created_at,
        )
        for trip in trips
    ]


@router.post("/{trip_id}/dispatch", response_model=TripResponse)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.get(Trip, trip_id)

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    if trip.status != TripStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Only draft trips can be dispatched",
        )

    vehicle = trip.vehicle
    driver = trip.driver

    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is not available",
        )

    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail="Driver is not available",
        )

    if driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Driver's license has expired",
        )

    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.now(timezone.utc)
    trip.start_odometer_km = vehicle.odometer

    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP

    db.commit()
    db.refresh(trip)

    return trip


@router.post("/{trip_id}/complete", response_model=TripResponse)
def complete_trip(
    trip_id: int,
    payload: CompleteTripRequest,
    db: Session = Depends(get_db),
):
    trip = db.get(Trip, trip_id)

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(
            status_code=400,
            detail="Only dispatched trips can be completed",
        )

    if payload.end_odometer_km < trip.start_odometer_km:
        raise HTTPException(
            status_code=400,
            detail="End odometer cannot be less than start odometer",
        )

    vehicle = trip.vehicle
    driver = trip.driver

    trip.end_odometer_km = payload.end_odometer_km
    trip.fuel_consumed_liters = payload.fuel_consumed_liters
    trip.completed_at = datetime.now(timezone.utc)
    trip.status = TripStatus.COMPLETED

    vehicle.odometer = payload.end_odometer_km
    vehicle.status = VehicleStatus.AVAILABLE

    driver.status = DriverStatus.AVAILABLE

    db.commit()
    db.refresh(trip)

    return trip


@router.post("/{trip_id}/cancel", response_model=TripResponse)
def cancel_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.get(Trip, trip_id)

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    if trip.status == TripStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Completed trips cannot be cancelled",
        )

    if trip.status == TripStatus.CANCELLED:
        raise HTTPException(
            status_code=400,
            detail="Trip is already cancelled",
        )

    if trip.status == TripStatus.DISPATCHED:
        trip.vehicle.status = VehicleStatus.AVAILABLE
        trip.driver.status = DriverStatus.AVAILABLE

    trip.status = TripStatus.CANCELLED

    db.commit()
    db.refresh(trip)

    return trip
    

@router.get("/{trip_id}", response_model=TripDetailResponse)
def get_trip_detail(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = (
        db.query(Trip)
        .options(
            joinedload(Trip.vehicle),
            joinedload(Trip.driver),
        )
        .filter(Trip.id == trip_id)
        .first()
    )

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    return TripDetailResponse(
        id=trip.id,
        source=trip.source,
        destination=trip.destination,
        cargo_weight_kg=trip.cargo_weight_kg,
        planned_distance_km=trip.planned_distance_km,
        revenue=trip.revenue,
        status=trip.status,
        dispatched_at=trip.dispatched_at,
        completed_at=trip.completed_at,
        start_odometer_km=trip.start_odometer_km,
        end_odometer_km=trip.end_odometer_km,
        fuel_consumed_liters=trip.fuel_consumed_liters,
        created_at=trip.created_at,
        updated_at=trip.updated_at,

        vehicle_id=trip.vehicle.id,
        vehicle_registration_number=trip.vehicle.registration_number,
        vehicle_name=trip.vehicle.name,
        vehicle_type=trip.vehicle.type,
        vehicle_region=trip.vehicle.region,
        vehicle_capacity=trip.vehicle.capacity,
        vehicle_odometer=trip.vehicle.odometer,
        vehicle_status=trip.vehicle.status,

        driver_id=trip.driver.id,
        driver_name=trip.driver.full_name,
        driver_contact_number=trip.driver.contact_number,
        driver_license_number=trip.driver.license_number,
        driver_license_category=trip.driver.license_category,
        driver_license_expiry_date=trip.driver.license_expiry_date,
        driver_safety_score=trip.driver.safety_score,
        driver_status=trip.driver.status,
    )


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.get(Trip, trip_id)

    if trip is None:
        raise HTTPException(
            status_code=404,
            detail="Trip not found",
        )

    if trip.status == TripStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Completed trips cannot be deleted",
        )

    if trip.status == TripStatus.DISPATCHED:
        trip.vehicle.status = VehicleStatus.AVAILABLE
        trip.driver.status = DriverStatus.AVAILABLE

    db.delete(trip)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

