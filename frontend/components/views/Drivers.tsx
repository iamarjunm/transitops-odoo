"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";

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

type DriverView = {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  expiry: string;
  contact: string;
  safetyScore: number;
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
};

type DriverFormState = {
  name: string;
  licenseNo: string;
  category: string;
  expiry: string;
  contact: string;
  safetyScore: number;
  status: BackendDriver["status"];
};

const defaultFormState: DriverFormState = {
  name: "",
  licenseNo: "",
  category: "LMV",
  expiry: "",
  contact: "",
  safetyScore: 100,
  status: "available",
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

function mapStatus(status: BackendDriver["status"]): DriverView["status"] {
  switch (status) {
    case "on_trip":
      return "On Trip";
    case "off_duty":
      return "Off Duty";
    case "suspended":
      return "Suspended";
    default:
      return "Available";
  }
}

function toBackendStatus(status: DriverView["status"]): BackendDriver["status"] {
  switch (status) {
    case "On Trip":
      return "on_trip";
    case "Off Duty":
      return "off_duty";
    case "Suspended":
      return "suspended";
    default:
      return "available";
  }
}

function mapDriver(driver: BackendDriver): DriverView {
  return {
    id: String(driver.id),
    name: driver.full_name,
    licenseNo: driver.license_number,
    category: driver.license_category,
    expiry: driver.license_expiry_date,
    contact: driver.contact_number,
    safetyScore: driver.safety_score,
    status: mapStatus(driver.status),
  };
}

export function Drivers() {
  const { currentUser, authToken } = useStore();
  const [drivers, setDrivers] = useState<DriverView[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<DriverFormState>(defaultFormState);

  const canManageDrivers = currentUser?.role === "Admin" || currentUser?.role === "Safety Officer";

  useEffect(() => {
    const loadDrivers = async () => {
      if (!authToken) return;

      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/drivers`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = (await response.json().catch(() => null)) as BackendDriver[] | { detail?: string } | null;

        if (!response.ok) {
          throw new Error(data && "detail" in data && data.detail ? data.detail : "Unable to load drivers.");
        }

        setDrivers(Array.isArray(data) ? data.map(mapDriver) : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load drivers.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDrivers();
  }, [authToken]);

  const resetForm = () => {
    setFormData(defaultFormState);
    setEditingDriverId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setFormData(defaultFormState);
    setEditingDriverId(null);
    setShowForm(true);
  };

  const openEditForm = (driver: DriverView) => {
    setFormData({
      name: driver.name,
      licenseNo: driver.licenseNo,
      category: driver.category,
      expiry: driver.expiry,
      contact: driver.contact,
      safetyScore: driver.safetyScore,
      status: driver.status === "On Trip" ? "on_trip" : driver.status === "Off Duty" ? "off_duty" : driver.status === "Suspended" ? "suspended" : "available",
    });
    setEditingDriverId(driver.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken) {
      setError("You must be signed in to add a driver.");
      return;
    }

    if (!canManageDrivers) {
      setError("Only Admin or Safety Officer can add drivers.");
      return;
    }

    try {
      setError("");
      const isEditing = Boolean(editingDriverId);
      const response = await fetch(`${API_BASE_URL}/drivers${isEditing ? `/${editingDriverId}` : ""}`, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          full_name: formData.name.trim(),
          license_number: formData.licenseNo.trim().toUpperCase(),
          license_category: formData.category,
          license_expiry_date: formData.expiry,
          contact_number: formData.contact.trim(),
          safety_score: Number(formData.safetyScore),
          status: formData.status,
        }),
      });

      const data = (await response.json().catch(() => null)) as BackendDriver | { detail?: string } | null;

      if (!response.ok) {
        throw new Error(data && "detail" in data && data.detail ? data.detail : "Unable to save driver.");
      }

      if (data && !("detail" in data)) {
        const mapped = mapDriver(data);
        setDrivers(prev => {
          if (isEditing) {
            return prev.map(driver => (driver.id === mapped.id ? mapped : driver));
          }
          return [mapped, ...prev];
        });
      }

      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save driver.");
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!authToken) {
      setError("You must be signed in to delete a driver.");
      return;
    }

    if (!canManageDrivers) {
      setError("Only Admin or Safety Officer can delete drivers.");
      return;
    }

    const confirmDelete = window.confirm("Delete this driver?");
    if (!confirmDelete) return;

    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(data && data.detail ? data.detail : "Unable to delete driver.");
      }

      setDrivers(prev => prev.filter(driver => driver.id !== driverId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete driver.");
    }
  };

  const handleStatusUpdate = async (driverId: string, status: BackendDriver["status"]) => {
    if (!authToken) {
      setError("You must be signed in to update driver status.");
      return;
    }

    if (!canManageDrivers) {
      setError("Only Admin or Safety Officer can update driver status.");
      return;
    }

    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json().catch(() => null)) as BackendDriver | { detail?: string } | null;

      if (!response.ok) {
        throw new Error(data && "detail" in data && data.detail ? data.detail : "Unable to update driver status.");
      }

      if (data && !("detail" in data)) {
        setDrivers(prev => prev.map(driver => (driver.id === driverId ? mapDriver(data) : driver)));
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update driver status.");
    }
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Driver Management</h2>
        {canManageDrivers ? (
          <button 
            onClick={() => (showForm ? resetForm() : openCreateForm())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Driver'}
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

      {showForm && canManageDrivers && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Full Name</label>
              <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">License Number</label>
              <input required value={formData.licenseNo} onChange={e=>setFormData({...formData, licenseNo: e.target.value.toUpperCase()})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="DL-12345" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Category</label>
              <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none">
                <option>LMV</option>
                <option>HMV</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Expiry Date</label>
              <input type="date" required value={formData.expiry} onChange={e=>setFormData({...formData, expiry: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Contact Number</label>
              <input required value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Status</label>
              <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value as BackendDriver["status"]})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none">
                <option value="available">Available</option>
                <option value="on_trip">On Trip</option>
                <option value="off_duty">Off Duty</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Safety Score</label>
              <input type="number" min="0" max="100" required value={formData.safetyScore} onChange={e=>setFormData({...formData, safetyScore: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-200 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-neutral-700">Cancel</button>
                <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200">{editingDriverId ? 'Update Driver' : 'Save Driver'}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="px-5 py-8 text-center text-gray-500 dark:text-neutral-400">Loading drivers...</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
            <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-400 dark:text-neutral-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">License No</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Safety Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {canManageDrivers && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {drivers.map(d => {
                const expired = isExpired(d.expiry);
                return (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{d.name}</td>
                    <td className="px-5 py-3 font-mono">
                      {d.licenseNo} <span className="text-gray-400 dark:text-neutral-500 text-xs ml-1">({d.category})</span>
                    </td>
                    <td className={`px-5 py-3 ${expired ? 'text-red-400 font-medium' : ''}`}>
                      {d.expiry} {expired && <span className="text-xs ml-1 uppercase">(Expired)</span>}
                    </td>
                    <td className="px-5 py-3">{d.contact}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className={`h-full ${d.safetyScore > 90 ? 'bg-green-500' : d.safetyScore > 80 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${d.safetyScore}%` }}></div>
                        </div>
                        <span className="text-xs">{d.safetyScore}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {canManageDrivers ? (
                        <select
                          value={toBackendStatus(d.status)}
                          onChange={e => void handleStatusUpdate(d.id, e.target.value as BackendDriver["status"])}
                          className={`w-full max-w-[170px] rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors bg-white dark:bg-neutral-950 ${
                            d.status === 'Available' && !expired ? 'text-green-600 border-green-500/30' :
                            d.status === 'On Trip' ? 'text-blue-500 border-blue-500/30' :
                            d.status === 'Off Duty' ? 'text-gray-500 border-neutral-500/30' :
                            'text-red-500 border-red-500/30'
                          }`}
                        >
                          <option value="available">Available</option>
                          <option value="on_trip">On Trip</option>
                          <option value="off_duty">Off Duty</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 inline-flex rounded-md text-xs font-medium border ${
                          d.status === 'Available' && !expired ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          d.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          d.status === 'Off Duty' ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-neutral-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {expired && d.status !== 'Suspended' ? 'License Expired' : d.status}
                        </span>
                      )}
                    </td>
                    {canManageDrivers && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(d)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {drivers.length === 0 && (
                <tr><td colSpan={canManageDrivers ? 7 : 6} className="px-5 py-8 text-center text-gray-400 dark:text-neutral-500">No drivers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
