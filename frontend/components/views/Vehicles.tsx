"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Vehicle } from "@/lib/types";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Vehicle Registry</h2>
        {canManageVehicles ? (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Vehicle'}
          </button>
        ) : (
          <span className="text-sm text-gray-500 dark:text-neutral-400">View only for your role</span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && canManageVehicles && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Registration No</label>
              <input required value={formData.regNo} onChange={e=>setFormData({...formData, regNo: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="GJ01AB1234" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Name/Model</label>
              <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="VAN-10" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Type</label>
              <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none">
                <option>Van</option>
                <option>Truck</option>
                <option>Mini</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Capacity (kg)</label>
              <input type="number" required min="1" value={formData.capacity} onChange={e=>setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Current Odometer (km)</label>
              <input type="number" required min="0" value={formData.odometer} onChange={e=>setFormData({...formData, odometer: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Acquisition Cost</label>
              <input type="number" required min="0" value={formData.cost} onChange={e=>setFormData({...formData, cost: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200">Save Vehicle</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="px-5 py-8 text-center text-gray-500 dark:text-neutral-400">Loading vehicles...</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
            <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-400 dark:text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Reg No.</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Capacity</th>
                <th className="px-5 py-3 font-medium">Odometer</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3 font-mono">{v.regNo}</td>
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{v.name}</td>
                  <td className="px-5 py-3">{v.type}</td>
                  <td className="px-5 py-3">{v.capacity} kg</td>
                  <td className="px-5 py-3 font-mono">{v.odometer.toLocaleString()} km</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 inline-flex rounded-md text-xs font-medium border ${
                      v.status === 'Available' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      v.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      v.status === 'In Shop' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 dark:text-neutral-500">No vehicles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
