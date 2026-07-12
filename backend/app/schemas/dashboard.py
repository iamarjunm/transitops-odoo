from pydantic import BaseModel


class FleetStatus(BaseModel):
    available: int
    on_trip: int
    in_shop: int
    retired: int


class DashboardKPIs(BaseModel):
    active_vehicles: int          # everything not retired
    available_vehicles: int
    vehicles_in_maintenance: int  # In Shop
    active_trips: int             # Dispatched
    pending_trips: int            # Draft
    drivers_on_duty: int          # Available or On Trip
    fleet_utilization: float      # % of the active fleet currently On Trip
    total_vehicles: int
    fleet_status: FleetStatus
