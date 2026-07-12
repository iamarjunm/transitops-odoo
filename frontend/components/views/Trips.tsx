"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { MapPin, ArrowDown, Truck, User, Package, Route, Loader2, AlertCircle, Trash2 } from "lucide-react";

/* ───────── Backend types ───────── */

type BackendTripListItem = {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  vehicle_registration_number: string;
  driver_id: number;
  driver_name: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  revenue: number | null;
  status: "draft" | "dispatched" | "completed" | "cancelled";
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type BackendTripResponse = {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight_kg: number;
  planned_distance_km: number;
  revenue: number | null;
  status: "draft" | "dispatched" | "completed" | "cancelled";
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type BackendVehicle = {
  id: number;
  registration_number: string;
  name: string;
  type: string;
  capacity: number;
  odometer: number;
  cost: number;
  status: string;
  created_at: string;
};

type BackendDriver = {
  id: number;
  full_name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  created_at: string;
};

/* ───────── View types ───────── */

type TripView = {
  id: number;
  source: string;
  destination: string;
  vehicleId: number;
  vehicleReg: string;
  driverId: number;
  driverName: string;
  weight: number;
  distance: number;
  revenue: number | null;
  status: "Draft" | "Dispatched" | "Completed" | "Cancelled";
  dispatchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

/* ───────── Helpers ───────── */

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

function mapStatus(s: BackendTripListItem["status"]): TripView["status"] {
  switch (s) {
    case "dispatched": return "Dispatched";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    default: return "Draft";
  }
}

function mapTrip(t: BackendTripListItem): TripView {
  return {
    id: t.id,
    source: t.source,
    destination: t.destination,
    vehicleId: t.vehicle_id,
    vehicleReg: t.vehicle_registration_number,
    driverId: t.driver_id,
    driverName: t.driver_name,
    weight: t.cargo_weight_kg,
    distance: t.planned_distance_km,
    revenue: t.revenue,
    status: mapStatus(t.status),
    dispatchedAt: t.dispatched_at,
    completedAt: t.completed_at,
    createdAt: t.created_at,
  };
}

function isBackendTripList(data: unknown): data is BackendTripListItem[] {
  return Array.isArray(data) && (data.length === 0 || ("id" in data[0] && "source" in data[0]));
}

function isBackendTripResponse(data: unknown): data is BackendTripResponse {
  return Boolean(data && typeof data === "object" && "id" in data && "source" in data && "status" in data);
}

const statusColors: Record<TripView["status"], string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  Dispatched: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const columnAccent: Record<string, string> = {
  Draft: "border-t-slate-400 dark:border-t-slate-500",
  Dispatched: "border-t-blue-500 dark:border-t-blue-400",
  Completed: "border-t-emerald-500 dark:border-t-emerald-400",
  Cancelled: "border-t-red-400 dark:border-t-red-400",
};

/* ───────── Component ───────── */

export function Trips() {
  const { currentUser, authToken } = useStore();

  const [trips, setTrips] = useState<TripView[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<BackendVehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<BackendDriver[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [completeModalId, setCompleteModalId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    source: "", destination: "", vehicleId: "", driverId: "",
    weight: 0, distance: 0, revenue: "",
  });
  const [completeData, setCompleteData] = useState({ endOdometer: 0, fuelLiters: 0 });

  const canManageTrips = currentUser?.role === "Admin" || currentUser?.role === "Dispatcher";

  /* ───── Fetch trips, vehicles, drivers ───── */
  const loadData = useCallback(async () => {
    if (!authToken) return;
    try {
      setIsLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${authToken}` };

      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trips/list`, { headers }),
        fetch(`${API_BASE_URL}/vehicles?status=Available`, { headers }),
        fetch(`${API_BASE_URL}/drivers/list`, { headers }),
      ]);

      const tripsData = await tripsRes.json().catch(() => null);
      const vehiclesData = await vehiclesRes.json().catch(() => null);
      const driversData = await driversRes.json().catch(() => null);

      if (!tripsRes.ok) {
        throw new Error(tripsData?.detail || "Unable to load trips.");
      }

      if (isBackendTripList(tripsData)) {
        setTrips(tripsData.map(mapTrip));
      }

      if (Array.isArray(vehiclesData)) {
        setAvailableVehicles(vehiclesData);
      }

      if (Array.isArray(driversData)) {
        setAvailableDrivers(driversData.filter((d: BackendDriver) =>
          d.status === "available" && new Date(d.license_expiry_date) >= new Date()
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load trips.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => { void loadData(); }, [loadData]);

  /* ───── Create trip ───── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !canManageTrips) return;

    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/trips/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          source: formData.source.trim(),
          destination: formData.destination.trim(),
          vehicle_id: Number(formData.vehicleId),
          driver_id: Number(formData.driverId),
          cargo_weight_kg: formData.weight,
          planned_distance_km: formData.distance,
          revenue: formData.revenue ? Number(formData.revenue) : null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Unable to create trip.");

      setShowForm(false);
      setFormData({ source: "", destination: "", vehicleId: "", driverId: "", weight: 0, distance: 0, revenue: "" });
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create trip.");
    }
  };

  /* ───── Trip actions ───── */
  const tripAction = async (tripId: number, action: "dispatch" | "cancel", method = "POST", body?: object) => {
    if (!authToken) return;
    try {
      setError("");
      setActionLoading(tripId);
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/${action}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || `Unable to ${action} trip.`);

      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} trip.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || completeModalId === null) return;

    try {
      setError("");
      setActionLoading(completeModalId);
      const response = await fetch(`${API_BASE_URL}/trips/${completeModalId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          end_odometer_km: completeData.endOdometer,
          fuel_consumed_liters: completeData.fuelLiters,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Unable to complete trip.");

      setCompleteModalId(null);
      setCompleteData({ endOdometer: 0, fuelLiters: 0 });
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete trip.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tripId: number) => {
    if (!authToken) return;
    try {
      setError("");
      setActionLoading(tripId);
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Unable to delete trip.");
      }
      setDeleteConfirmId(null);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete trip.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ───── Derived ───── */
  const selectedVehicle = availableVehicles.find(v => String(v.id) === formData.vehicleId);
  const capacityExceeded = selectedVehicle && formData.weight > selectedVehicle.capacity;

  const statusGroups: TripView["status"][] = ["Draft", "Dispatched", "Completed", "Cancelled"];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Trip Dispatcher</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Create, dispatch, and manage transport operations</p>
        </div>
        {canManageTrips && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97]"
          >
            {showForm ? "Cancel" : "+ Create Trip"}
          </button>
        )}
      </div>

      {/* Error */}
      {error && completeModalId === null && deleteConfirmId === null && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-4">New Trip</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Source</label>
              <input required value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" placeholder="Warehouse A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Destination</label>
              <input required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" placeholder="Hub B" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Vehicle (Available)</label>
              <select required value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option value="">Select Vehicle</option>
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.name} — {v.registration_number} ({v.capacity}kg)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Driver (Available)</label>
              <select required value={formData.driverId} onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option value="">Select Driver</option>
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Cargo Weight (kg)</label>
              <input type="number" required min="1" value={formData.weight || ""} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                className={`w-full bg-gray-50 dark:bg-neutral-950 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all ${capacityExceeded ? "border-red-500 focus:ring-red-500/20" : "border-gray-200 dark:border-neutral-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"}`} />
              {capacityExceeded && <p className="text-xs text-red-500 mt-1">Exceeds max capacity of {selectedVehicle?.capacity}kg</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Planned Distance (km)</label>
              <input type="number" required min="1" value={formData.distance || ""} onChange={e => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Revenue (₹) <span className="text-gray-400">optional</span></label>
              <input type="number" min="0" value={formData.revenue} onChange={e => setFormData({ ...formData, revenue: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" placeholder="0" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-2">
              <button disabled={!!capacityExceeded || !formData.vehicleId || !formData.driverId} type="submit"
                className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]">
                Create Draft Trip
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completeModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Complete Trip</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Log final odometer reading and fuel consumed.</p>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 mb-4 animate-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">End Odometer (km)</label>
                <input type="number" required min="1" value={completeData.endOdometer || ""} onChange={e => setCompleteData({ ...completeData, endOdometer: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Fuel Consumed (Liters)</label>
                <input type="number" required min="0" step="0.1" value={completeData.fuelLiters || ""} onChange={e => setCompleteData({ ...completeData, fuelLiters: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCompleteModalId(null)} className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading === completeModalId}
                  className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all active:scale-[0.97] disabled:opacity-50">
                  {actionLoading === completeModalId ? "Completing…" : "Confirm Completion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Trip</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Are you sure you want to permanently delete this trip? This action cannot be undone.</p>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 mb-4 animate-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} disabled={actionLoading === deleteConfirmId}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all active:scale-[0.97] disabled:opacity-50">
                {actionLoading === deleteConfirmId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-500 dark:text-neutral-400">Loading trips…</span>
        </div>
      )}

      {/* Kanban columns */}
      {!isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {statusGroups.map(statusGroup => {
            const groupTrips = trips.filter(t => t.status === statusGroup).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return (
              <div key={statusGroup} className="flex flex-col gap-3">
                {/* Column header */}
                <div className={`flex items-center justify-between border-t-2 ${columnAccent[statusGroup]} pt-3 pb-1`}>
                  <h3 className="text-xs font-bold text-gray-600 dark:text-neutral-400 uppercase tracking-widest">{statusGroup}</h3>
                  <span className="text-[10px] font-mono bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-500 px-2 py-0.5 rounded-full">{groupTrips.length}</span>
                </div>

                {/* Trip cards */}
                {groupTrips.map(trip => (
                  <div key={trip.id} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-neutral-700 transition-all duration-200 flex flex-col gap-3 group">
                    {/* Top row */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-600">TRIP-{String(trip.id).padStart(4, "0")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${statusColors[trip.status]}`}>{trip.status}</span>
                    </div>

                    {/* Route */}
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <div className="w-px h-5 bg-gray-200 dark:bg-neutral-700 my-0.5" />
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{trip.source}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-2">{trip.destination}</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="bg-gray-50 dark:bg-neutral-950 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400">
                        <Truck className="w-3 h-3" />
                        <span className="truncate">{trip.vehicleReg}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400">
                        <User className="w-3 h-3" />
                        <span className="truncate">{trip.driverName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400">
                        <Route className="w-3 h-3" />
                        <span>{trip.distance} km</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400">
                        <Package className="w-3 h-3" />
                        <span>{trip.weight} kg</span>
                      </div>
                    </div>

                    {trip.revenue !== null && trip.revenue > 0 && (
                      <div className="text-xs text-gray-500 dark:text-neutral-400 font-mono">Revenue: ₹{trip.revenue.toLocaleString()}</div>
                    )}

                    {/* Actions */}
                    {canManageTrips && (
                      <div className="flex gap-2 mt-1">
                        {trip.status === "Draft" && (
                          <>
                            <button onClick={() => tripAction(trip.id, "dispatch")} disabled={actionLoading === trip.id}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 active:scale-[0.97]">
                              {actionLoading === trip.id ? "…" : "Dispatch"}
                            </button>
                            <button onClick={() => tripAction(trip.id, "cancel")} disabled={actionLoading === trip.id}
                              className="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
                              Cancel
                            </button>
                            <button onClick={() => setDeleteConfirmId(trip.id)} className="px-2 py-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete trip">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {trip.status === "Dispatched" && (
                          <>
                            <button onClick={() => setCompleteModalId(trip.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97]">
                              Complete
                            </button>
                            <button onClick={() => tripAction(trip.id, "cancel")} disabled={actionLoading === trip.id}
                              className="flex-1 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50">
                              Cancel
                            </button>
                          </>
                        )}
                        {trip.status === "Cancelled" && (
                          <button onClick={() => setDeleteConfirmId(trip.id)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {groupTrips.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 dark:text-neutral-600 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
                    <Route className="w-5 h-5 mx-auto mb-2 opacity-40" />
                    No {statusGroup.toLowerCase()} trips
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
