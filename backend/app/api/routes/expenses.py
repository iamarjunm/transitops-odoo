from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.user import UserRole
from app.models.vehicle import Vehicle
from app.models.trips import Trip
from app.models.maintenance import Maintenance
from app.models.expense import Expense, ExpenseType
from app.schemas.expense import ExpenseCreate, ExpenseOut, OperationalCost

router = APIRouter(prefix="/expenses", tags=["expenses"])

manage = require_role(UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST)


def get_or_404(expense_id: int, db: Session) -> Expense:
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
    vehicle_id: int | None = None,
    trip_id: int | None = None,
    type: ExpenseType | None = None,
):
    stmt = select(Expense)
    if vehicle_id:
        stmt = stmt.where(Expense.vehicle_id == vehicle_id)
    if trip_id:
        stmt = stmt.where(Expense.trip_id == trip_id)
    if type:
        stmt = stmt.where(Expense.type == type)
    return db.execute(stmt.order_by(Expense.date.desc())).scalars().all()


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db), _=Depends(manage)):
    if payload.vehicle_id and not db.get(Vehicle, payload.vehicle_id):
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if payload.trip_id and not db.get(Trip, payload.trip_id):
        raise HTTPException(status_code=404, detail="Trip not found")

    expense = Expense(
        type=payload.type,
        amount=payload.amount,
        vehicle_id=payload.vehicle_id,
        trip_id=payload.trip_id,
        date=payload.date or date.today(),
        details=payload.details,
        liters=payload.liters,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/operational-cost/{vehicle_id}", response_model=OperationalCost)
def operational_cost(vehicle_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Total operational cost for a vehicle = Fuel + Maintenance.

    Fuel comes from fuel expenses, maintenance from the maintenance log so the
    figure isn't double counted.
    """
    if not db.get(Vehicle, vehicle_id):
        raise HTTPException(status_code=404, detail="Vehicle not found")

    def expense_sum(*types: ExpenseType) -> float:
        total = db.execute(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.vehicle_id == vehicle_id, Expense.type.in_(types)
            )
        ).scalar()
        return float(total or 0)

    fuel_cost = expense_sum(ExpenseType.FUEL)
    other_expenses = expense_sum(ExpenseType.TOLL, ExpenseType.MAINTENANCE, ExpenseType.OTHER)
    maintenance_cost = float(
        db.execute(
            select(func.coalesce(func.sum(Maintenance.cost), 0)).where(
                Maintenance.vehicle_id == vehicle_id
            )
        ).scalar()
        or 0
    )

    return OperationalCost(
        vehicle_id=vehicle_id,
        fuel_cost=fuel_cost,
        maintenance_cost=maintenance_cost,
        other_expenses=other_expenses,
        total_operational_cost=fuel_cost + maintenance_cost,
    )


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return get_or_404(expense_id, db)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db), _=Depends(manage)):
    db.delete(get_or_404(expense_id, db))
    db.commit()
