"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Vehicle, Driver, Trip, Maintenance, Expense } from './types';

interface StoreState {
  currentUser: User | null;
  authToken: string | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: Maintenance[];
  expenses: Expense[];
}

interface StoreContextType extends StoreState {
  login: (user: User, authToken?: string | null) => void;
  logout: () => void;
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  addDriver: (d: Omit<Driver, 'id'>) => void;
  createTrip: (t: Omit<Trip, 'id' | 'status' | 'createdAt'>) => void;
  dispatchTrip: (id: string) => void;
  completeTrip: (id: string, endOdometer: number, fuelLiters: number, fuelCost: number) => void;
  cancelTrip: (id: string) => void;
  addMaintenance: (m: Omit<Maintenance, 'id'>) => void;
  closeMaintenance: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
}

const mockVehicles: Vehicle[] = [
  { id: 'v1', regNo: 'GJ01AB4522', name: 'VAN-05', type: 'Van', capacity: 500, odometer: 74000, cost: 620000, status: 'Available' },
  { id: 'v2', regNo: 'GJ01AB9981', name: 'TRUCK-11', type: 'Truck', capacity: 5000, odometer: 182000, cost: 2450000, status: 'On Trip' },
  { id: 'v3', regNo: 'GJ01AB1120', name: 'MINI-03', type: 'Mini', capacity: 1000, odometer: 66000, cost: 410000, status: 'In Shop' },
  { id: 'v4', regNo: 'GJ01AB0088', name: 'VAN-09', type: 'Van', capacity: 750, odometer: 241900, cost: 590000, status: 'Retired' },
];

const mockDrivers: Driver[] = [
  { id: 'd1', name: 'Alex', licenseNo: 'DL-88213', category: 'LMV', expiry: '2028-12-01', contact: '9876543210', safetyScore: 96, status: 'Available' },
  { id: 'd2', name: 'John', licenseNo: 'DL-44120', category: 'HMV', expiry: '2025-03-15', contact: '9822012345', safetyScore: 81, status: 'Suspended' },
  { id: 'd3', name: 'Priya', licenseNo: 'DL-77031', category: 'LMV', expiry: '2029-08-20', contact: '9911098765', safetyScore: 99, status: 'On Trip' },
  { id: 'd4', name: 'Suresh', licenseNo: 'DL-90045', category: 'HMV', expiry: '2027-01-10', contact: '9744055443', safetyScore: 88, status: 'Off Duty' },
];

const mockTrips: Trip[] = [
  { id: 't1', source: 'Gandhinagar Depot', dest: 'Ahmedabad Hub', vehicleId: 'v1', driverId: 'd1', weight: 450, distance: 35, status: 'Dispatched', createdAt: new Date().toISOString() },
  { id: 't2', source: 'Vatva Industrial', dest: 'Sanand Warehouse', vehicleId: 'v2', driverId: 'd3', weight: 4800, distance: 60, status: 'Completed', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const mockMaintenance: Maintenance[] = [
  { id: 'm1', vehicleId: 'v3', service: 'Engine Repair', cost: 18000, date: '2026-07-01', status: 'Active' },
];

const mockExpenses: Expense[] = [
  { id: 'e1', vehicleId: 'v2', tripId: 't2', type: 'Fuel', amount: 8400, date: '2026-07-06', details: 'Refill', liters: 110 },
  { id: 'e2', vehicleId: 'v3', type: 'Maintenance', amount: 18000, date: '2026-07-01', details: 'Engine Repair' },
];

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [maintenance, setMaintenance] = useState<Maintenance[]>(mockMaintenance);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('transitops_data');
    if (saved) {
      const data = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVehicles(data.vehicles || mockVehicles);
      setDrivers(data.drivers || mockDrivers);
      setTrips(data.trips || mockTrips);
      setMaintenance(data.maintenance || mockMaintenance);
      setExpenses(data.expenses || mockExpenses);
      setCurrentUser(data.currentUser || null);
      setAuthToken(data.authToken || null);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('transitops_data', JSON.stringify({
        currentUser, authToken, vehicles, drivers, trips, maintenance, expenses
      }));
    }
  }, [currentUser, authToken, vehicles, drivers, trips, maintenance, expenses, isLoaded]);

  const login = (user: User, nextAuthToken: string | null = null) => {
    setCurrentUser(user);
    setAuthToken(nextAuthToken);
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
  };

  const addVehicle = (v: Omit<Vehicle, 'id'>) => {
    if (vehicles.some(existing => existing.regNo === v.regNo)) {
      alert("Registration number must be unique.");
      return;
    }
    setVehicles([...vehicles, { ...v, id: crypto.randomUUID() }]);
  };

  const addDriver = (d: Omit<Driver, 'id'>) => {
    setDrivers([...drivers, { ...d, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const createTrip = (t: Omit<Trip, 'id' | 'status' | 'createdAt'>) => {
    const vehicle = vehicles.find(v => v.id === t.vehicleId);
    if (!vehicle || t.weight > vehicle.capacity) {
      alert("Cargo weight exceeds vehicle capacity!");
      return;
    }
    setTrips([...trips, { ...t, id: Math.random().toString(36).substr(2, 9), status: 'Draft', createdAt: new Date().toISOString() }]);
  };

  const dispatchTrip = (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;
    
    setTrips(trips.map(t => t.id === id ? { ...t, status: 'Dispatched' } : t));
    setVehicles(vehicles.map(v => v.id === trip.vehicleId ? { ...v, status: 'On Trip' } : v));
    setDrivers(drivers.map(d => d.id === trip.driverId ? { ...d, status: 'On Trip' } : d));
  };

  const completeTrip = (id: string, endOdometer: number, fuelLiters: number, fuelCost: number) => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    setTrips(trips.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
    setVehicles(vehicles.map(v => v.id === trip.vehicleId ? { ...v, status: 'Available', odometer: endOdometer } : v));
    setDrivers(drivers.map(d => d.id === trip.driverId ? { ...d, status: 'Available' } : d));

    if (fuelCost > 0) {
      addExpense({
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        type: 'Fuel',
        amount: fuelCost,
        date: new Date().toISOString().split('T')[0],
        details: 'Trip completion fuel log',
        liters: fuelLiters
      });
    }
  };

  const cancelTrip = (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return;

    setTrips(trips.map(t => t.id === id ? { ...t, status: 'Cancelled' } : t));
    if (trip.status === 'Dispatched') {
      setVehicles(vehicles.map(v => v.id === trip.vehicleId ? { ...v, status: 'Available' } : v));
      setDrivers(drivers.map(d => d.id === trip.driverId ? { ...d, status: 'Available' } : d));
    }
  };

  const addMaintenance = (m: Omit<Maintenance, 'id'>) => {
    setMaintenance([...maintenance, { ...m, id: Math.random().toString(36).substr(2, 9) }]);
    setVehicles(vehicles.map(v => v.id === m.vehicleId ? { ...v, status: 'In Shop' } : v));
    addExpense({
      vehicleId: m.vehicleId,
      type: 'Maintenance',
      amount: m.cost,
      date: m.date,
      details: m.service
    });
  };

  const closeMaintenance = (id: string) => {
    const main = maintenance.find(m => m.id === id);
    if (!main) return;
    setMaintenance(maintenance.map(m => m.id === id ? { ...m, status: 'Completed' } : m));
    
    // Restore vehicle if not retired
    const vehicle = vehicles.find(v => v.id === main.vehicleId);
    if (vehicle && vehicle.status !== 'Retired') {
       setVehicles(vehicles.map(v => v.id === main.vehicleId ? { ...v, status: 'Available' } : v));
    }
  };

  const addExpense = (e: Omit<Expense, 'id'>) => {
    setExpenses([...expenses, { ...e, id: Math.random().toString(36).substr(2, 9) }]);
  };

  if (!isLoaded) return null; // or loading spinner

  return (
    <StoreContext.Provider value={{
      currentUser, authToken, vehicles, drivers, trips, maintenance, expenses,
      login, logout, addVehicle, addDriver, createTrip, dispatchTrip, completeTrip, cancelTrip, addMaintenance, closeMaintenance, addExpense
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
