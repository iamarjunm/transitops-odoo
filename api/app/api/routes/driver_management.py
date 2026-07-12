from datetime import date
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.drivers import Driver, DriverStatus
from app.core.database import get_db

from app.models.user import User


class CreateDriverRequest(BaseModel):
    full_name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str

class UpdateDriverRequest(BaseModel):
    full_name: str | None = None
    license_number: str | None = None
    license_category: str | None = None
    license_expiry_date: date | None = None
    contact_number: str | None = None
    safety_score: float | None = None
    status: DriverStatus | None = None

router = APIRouter(prefix="/drivers", tags=["Driver Management"])


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_driver(
    request: CreateDriverRequest,
    db: Session = Depends(get_db),
):
    # Verify user exists
    user = db.get(User, request.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Ensure user doesn't already have a driver profile
    existing_driver = (
        db.query(Driver)
        .filter(Driver.user_id == request.user_id)
        .first()
    )

    if existing_driver:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver profile already exists for this user",
        )

    # Ensure license number is unique
    existing_license = (
        db.query(Driver)
        .filter(Driver.license_number == request.license_number)
        .first()
    )

    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="License number already exists",
        )

    driver = Driver(
        user_id=request.user_id,
        license_number=request.license_number,
        license_category=request.license_category,
        license_expiry_date=request.license_expiry_date,
        contact_number=request.contact_number,
    )

    db.add(driver)
    db.commit()
    db.refresh(driver)

    return driver

@router.get("/list")
def list_drivers(
    db: Session = Depends(get_db),
):
    drivers = db.query(Driver).all()
    return drivers


@router.patch("/update/{driver_id}", status_code=status.HTTP_200_OK)
def update_driver(
    driver_id: int,
    request: UpdateDriverRequest,
    db: Session = Depends(get_db),
):
    driver = db.get(Driver, driver_id)

    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )

    # Ensure updated license number is unique
    if (
        request.license_number is not None
        and request.license_number != driver.license_number
    ):
        existing_driver = (
            db.query(Driver)
            .filter(Driver.license_number == request.license_number)
            .first()
        )

        if existing_driver:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="License number already exists",
            )

    update_data = request.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)

    return driver

@router.patch("/delete/{driver_id}", status_code=status.HTTP_200_OK)
def update_driver(
    driver_id: int,
    request: UpdateDriverRequest,
    db: Session = Depends(get_db),
):
    driver = db.get(Driver, driver_id)

    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found",
        )

    # Ensure updated license number is unique
    if (
        request.license_number is not None
        and request.license_number != driver.license_number
    ):
        existing_driver = (
            db.query(Driver)
            .filter(Driver.license_number == request.license_number)
            .first()
        )

        if existing_driver:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="License number already exists",
            )

    update_data = request.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)

    return driver