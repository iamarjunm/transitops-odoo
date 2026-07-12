"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Loader2, AlertCircle, Wrench, CheckCircle, Clock, IndianRupee, Download } from "lucide-react";

/* ───────── Backend types ───────── */

type BackendMaintenance = {
  id: number;
  vehicle_id: number;
  service: string;
  cost: number;
  date: string;
  status: "Active" | "Completed";
  created_at: string;
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

/* ───────── View types ───────── */

type MaintenanceView = {
  id: number;
  vehicleId: number;
  vehicleName: string;
  vehicleReg: string;
  service: string;
  cost: number;
  date: string;
  status: "Active" | "Completed";
};

type StatusFilter = "All" | "Active" | "Completed";

/* ───────── Helpers ───────── */

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

function isMaintenanceArray(data: unknown): data is BackendMaintenance[] {
  return Array.isArray(data) && (data.length === 0 || ("id" in data[0] && "service" in data[0]));
}

/* ───────── Component ───────── */

export function Maintenance() {
  const { currentUser, authToken } = useStore();

  const [records, setRecords] = useState<MaintenanceView[]>([]);
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: "", service: "", cost: 0, date: new Date().toISOString().split("T")[0],
  });

  const canManage = currentUser?.role === "Admin" || currentUser?.role === "Fleet Manager";

  /* ───── Load data ───── */
  const loadData = useCallback(async () => {
    if (!authToken) return;
    try {
      setIsLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${authToken}` };

      const [maintenanceRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/maintenance`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
      ]);

      const maintenanceData = await maintenanceRes.json().catch(() => null);
      const vehiclesData = await vehiclesRes.json().catch(() => null);

      if (!maintenanceRes.ok) throw new Error(maintenanceData?.detail || "Unable to load maintenance records.");

      const vehicleMap = new Map<number, BackendVehicle>();
      if (Array.isArray(vehiclesData)) {
        for (const v of vehiclesData) vehicleMap.set(v.id, v);
        setVehicles(vehiclesData);
      }

      if (isMaintenanceArray(maintenanceData)) {
        setRecords(maintenanceData.map(m => {
          const v = vehicleMap.get(m.vehicle_id);
          return {
            id: m.id,
            vehicleId: m.vehicle_id,
            vehicleName: v?.name || `Vehicle #${m.vehicle_id}`,
            vehicleReg: v?.registration_number || "—",
            service: m.service,
            cost: m.cost,
            date: m.date,
            status: m.status,
          };
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load maintenance records.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => { void loadData(); }, [loadData]);

  /* ───── Create maintenance ───── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !canManage) return;

    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          vehicle_id: Number(formData.vehicleId),
          service: formData.service.trim(),
          cost: formData.cost,
          date: formData.date || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Unable to create maintenance record.");

      setShowForm(false);
      setFormData({ vehicleId: "", service: "", cost: 0, date: new Date().toISOString().split("T")[0] });
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create maintenance record.");
    }
  };

  /* ───── Close maintenance ───── */
  const handleClose = async (maintenanceId: number) => {
    if (!authToken || !canManage) return;
    try {
      setError("");
      setActionLoading(maintenanceId);
      const response = await fetch(`${API_BASE_URL}/maintenance/${maintenanceId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Unable to close maintenance record.");

      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to close maintenance record.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ───── Derived ───── */
  const eligibleVehicles = vehicles.filter(v => v.status === "Available");
  const filtered = statusFilter === "All" ? records : records.filter(r => r.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeCount = records.filter(r => r.status === "Active").length;
  const completedCount = records.filter(r => r.status === "Completed").length;
  const totalCost = records.reduce((a, b) => a + b.cost, 0);
  const activeCost = records.filter(r => r.status === "Active").reduce((a, b) => a + b.cost, 0);

  const filterTabs: { label: string; value: StatusFilter; count: number }[] = [
    { label: "All", value: "All", count: records.length },
    { label: "Active", value: "Active", count: activeCount },
    { label: "Completed", value: "Completed", count: completedCount },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Maintenance Log</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Track vehicle service history and active repairs</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end no-print">
          <button onClick={() => window.print()} className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          {canManage && (
            <button onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97]">
              {showForm ? "Cancel" : "+ Log Service"}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Total Records</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">In Shop</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><IndianRupee className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Total Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">₹{totalCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Vehicle</label>
              <select required value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option value="">Select Vehicle</option>
                {eligibleVehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registration_number})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Service Type</label>
              <input required value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" placeholder="Oil Change, Brake Repair…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Cost (₹)</label>
              <input type="number" required min="0" value={formData.cost || ""} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="md:col-span-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Logging maintenance automatically sets the vehicle to &quot;In Shop&quot;
              </p>
              <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.97]">
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      {!isLoading && (
        <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit no-print">
          {filterTabs.map(tab => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300"
              }`}>
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-500 dark:text-neutral-400">Loading maintenance records…</span>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
            <thead className="bg-gray-50/80 dark:bg-neutral-950/50 text-gray-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Service</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Cost</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {sorted.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{m.vehicleName}</p>
                      <p className="text-[11px] text-gray-400 dark:text-neutral-500 font-mono">{m.vehicleReg}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">{m.service}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-neutral-400">{m.date}</td>
                  <td className="px-5 py-3.5 font-mono text-gray-900 dark:text-white">₹{m.cost.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      m.status === "Active"
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                    }`}>
                      {m.status === "Active" ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {m.status === "Active" ? "In Shop" : "Completed"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.status === "Active" && canManage && (
                      <button onClick={() => handleClose(m.id)} disabled={actionLoading === m.id}
                        className="text-xs text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-all font-medium disabled:opacity-50 active:scale-[0.97]">
                        {actionLoading === m.id ? "Closing…" : "Mark Complete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Wrench className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-neutral-600" />
                    <p className="text-sm text-gray-400 dark:text-neutral-500">
                      {statusFilter === "All" ? "No maintenance records found." : `No ${statusFilter.toLowerCase()} maintenance records.`}
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
