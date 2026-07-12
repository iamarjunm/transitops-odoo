export type Role = 'Admin' | 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';

export type User = {
  email: string;
  name: string;
  role: Role;
};

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export type Vehicle = {
  id: string;
  regNo: string; // Unique
  name: string;
  type: string;
  capacity: number; // in kg
  odometer: number;
  cost: number;
  status: VehicleStatus;
};

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export type Driver = {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  expiry: string; // YYYY-MM-DD
  contact: string;
  safetyScore: number;
  status: DriverStatus;
};

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export type Trip = {
  id: string;
  source: string;
  dest: string;
  vehicleId: string;
  driverId: string;
  weight: number;
  distance: number;
  status: TripStatus;
  eta?: string;
  createdAt: string;
};

export type MaintenanceStatus = 'Active' | 'Completed';

export type Maintenance = {
  id: string;
  vehicleId: string;
  service: string;
  cost: number;
  date: string;
  status: MaintenanceStatus;
};

export type ExpenseType = 'Fuel' | 'Toll' | 'Maintenance' | 'Other';

export type Expense = {
  id: string;
  tripId?: string;
  vehicleId?: string;
  type: ExpenseType;
  amount: number;
  date: string;
  details: string;
  liters?: number;
};
