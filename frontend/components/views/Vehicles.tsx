"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Vehicle, VehicleStatus } from "@/lib/types";
import { Loader2, Search, Truck as TruckIcon } from "lucide-react";

type BackendVehicle = {
  id: number;
  registration_number: string;
  name: string;
  type: string;
  capacity: number;
  odometer: number;
  cost: number;
  status: Vehicle["status"];
  created_at: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

function isBackendVehicle(data: unknown): data is BackendVehicle {
  return Boolean(
    data &&
    typeof data === "object" &&
    "id" in data &&
    "registration_number" in data &&
    "name" in data
  );
}

function mapBackendVehicle(vehicle: BackendVehicle): Vehicle {
  return {
    id: String(vehicle.id),
    regNo: vehicle.registration_number,
    name: vehicle.name,
    type: vehicle.type,
    capacity: vehicle.capacity,
    odometer: vehicle.odometer,
    cost: vehicle.cost,
    status: vehicle.status,
  };
}

export function Vehicles() {
  const { currentUser, authToken } = useStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">("All");

  const [formData, setFormData] = useState({
    regNo: '', name: '', type: 'Van', capacity: 500, odometer: 0, cost: 0
  });

  const canManageVehicles = currentUser?.role === "Admin" || currentUser?.role === "Fleet Manager";

  useEffect(() => {
    const loadVehicles = async () => {
      if (!authToken) return;

      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = (await response.json().catch(() => null)) as BackendVehicle[] | { detail?: string } | null;

        if (!response.ok) {
          throw new Error(data && "detail" in data && data.detail ? data.detail : "Unable to load vehicles.");
        }

        setVehicles(Array.isArray(data) ? data.map(mapBackendVehicle) : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load vehicles.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadVehicles();
  }, [authToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken) {
      setError("You must be signed in to add a vehicle.");
      return;
    }

    if (!canManageVehicles) {
      setError("Only Fleet Managers can add vehicles.");
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          registration_number: formData.regNo.trim().toUpperCase(),
          name: formData.name.trim(),
          type: formData.type,
          capacity: Number(formData.capacity),
          odometer: Number(formData.odometer),
          cost: Number(formData.cost),
          status: "Available",
        }),
      });

      const data = (await response.json().catch(() => null)) as BackendVehicle | { detail?: string } | null;

      if (!response.ok) {
        throw new Error(data && "detail" in data && data.detail ? data.detail : "Unable to save vehicle.");
      }

      if (isBackendVehicle(data)) {
        setVehicles(prev => [mapBackendVehicle(data), ...prev]);
      }

      setShowForm(false);
      setFormData({ regNo: '', name: '', type: 'Van', capacity: 500, odometer: 0, cost: 0 });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save vehicle.");
    }
  };

  const statusTabs: (VehicleStatus | "All")[] = ["All", "Available", "On Trip", "In Shop", "Retired"];
  const filteredVehicles = vehicles.filter(v => {
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.regNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    All: vehicles.length,
    Available: vehicles.filter(v => v.status === "Available").length,
    "On Trip": vehicles.filter(v => v.status === "On Trip").length,
    "In Shop": vehicles.filter(v => v.status === "In Shop").length,
    Retired: vehicles.filter(v => v.status === "Retired").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Vehicle Registry</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Manage your fleet vehicles and their status</p>
        </div>
        {canManageVehicles ? (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97]"
          >
            {showForm ? 'Cancel' : '+ Add Vehicle'}
          </button>
        ) : (
          <span className="text-sm text-gray-500 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">View only</span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 animate-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}

      {showForm && canManageVehicles && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Registration No</label>
              <input required value={formData.regNo} onChange={e=>setFormData({...formData, regNo: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" placeholder="GJ01AB1234" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Name/Model</label>
              <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" placeholder="VAN-10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Type</label>
              <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option>Van</option>
                <option>Truck</option>
                <option>Mini</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Capacity (kg)</label>
              <input type="number" required min="1" value={formData.capacity} onChange={e=>setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Current Odometer (km)</label>
              <input type="number" required min="0" value={formData.odometer} onChange={e=>setFormData({...formData, odometer: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Acquisition Cost</label>
              <input type="number" required min="0" value={formData.cost} onChange={e=>setFormData({...formData, cost: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="md:col-span-3 flex justify-end pt-2">
              <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.97]">Save Vehicle</button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filter */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search vehicles…"
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
            {statusTabs.map(tab => (
              <button key={tab} onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === tab
                  ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
                }`}>
                {tab}
                <span className="ml-1 text-[10px] opacity-60">{statusCounts[tab]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-500 dark:text-neutral-400">Loading vehicles…</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
            <thead className="bg-gray-50/80 dark:bg-neutral-950/50 text-gray-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Reg No.</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Capacity</th>
                <th className="px-5 py-3.5">Odometer</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filteredVehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs">{v.regNo}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{v.name}</td>
                  <td className="px-5 py-3.5">{v.type}</td>
                  <td className="px-5 py-3.5">{v.capacity} kg</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{v.odometer.toLocaleString()} km</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 inline-flex rounded-full text-[11px] font-semibold border ${
                      v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                      v.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                      v.status === 'In Shop' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <TruckIcon className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-neutral-600" />
                    <p className="text-sm text-gray-400 dark:text-neutral-500">
                      {searchQuery || statusFilter !== "All" ? "No vehicles match your filters." : "No vehicles found."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
