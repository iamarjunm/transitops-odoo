"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Loader2, AlertCircle, Fuel, Receipt, IndianRupee, Trash2, Calendar, FileText, PlusCircle, Search } from "lucide-react";

/* ───────── Backend types ───────── */

type BackendExpense = {
  id: number;
  vehicle_id: number | null;
  trip_id: number | null;
  type: "Fuel" | "Toll" | "Maintenance" | "Other";
  amount: number;
  date: string;
  details: string | null;
  liters: number | null;
  created_at: string;
};

type BackendVehicle = {
  id: number;
  registration_number: string;
  name: string;
  type: string;
  status: string;
};

type BackendTrip = {
  id: number;
  source: string;
  destination: string;
  vehicle_registration_number: string;
};

/* ───────── Component ───────── */

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

export function Expenses() {
  const { currentUser, authToken } = useStore();

  const [expenses, setExpenses] = useState<BackendExpense[]>([]);
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [trips, setTrips] = useState<BackendTrip[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    type: "Fuel" as BackendExpense["type"],
    amount: "",
    vehicleId: "",
    tripId: "",
    date: new Date().toISOString().split("T")[0],
    details: "",
    liters: "",
  });

  const [activeTab, setActiveTab] = useState<"all" | "fuel" | "other">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const canManage = currentUser?.role === "Admin" || currentUser?.role === "Fleet Manager" || currentUser?.role === "Financial Analyst";

  /* ───── Load Data ───── */
  const loadData = useCallback(async () => {
    if (!authToken) return;
    try {
      setIsLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${authToken}` };

      const [expensesRes, vehiclesRes, tripsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/expenses`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/trips/list`, { headers }),
      ]);

      const expensesData = await expensesRes.json().catch(() => null);
      const vehiclesData = await vehiclesRes.json().catch(() => null);
      const tripsData = await tripsRes.json().catch(() => null);

      if (!expensesRes.ok) throw new Error(expensesData?.detail || "Unable to load expenses.");
      
      if (Array.isArray(expensesData)) setExpenses(expensesData);
      if (Array.isArray(vehiclesData)) setVehicles(vehiclesData);
      if (Array.isArray(tripsData)) setTrips(tripsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => { void loadData(); }, [loadData]);

  /* ───── Create Expense ───── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !canManage) return;

    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          vehicle_id: formData.vehicleId ? Number(formData.vehicleId) : null,
          trip_id: formData.tripId ? Number(formData.tripId) : null,
          date: formData.date || null,
          details: formData.details.trim() || null,
          liters: formData.type === "Fuel" && formData.liters ? parseFloat(formData.liters) : null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Unable to save expense.");

      setShowForm(false);
      setFormData({
        type: "Fuel",
        amount: "",
        vehicleId: "",
        tripId: "",
        date: new Date().toISOString().split("T")[0],
        details: "",
        liters: "",
      });
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save expense.");
    }
  };

  /* ───── Delete Expense ───── */
  const handleDelete = async (expenseId: number) => {
    if (!authToken || !canManage) return;
    try {
      setError("");
      setActionLoading(expenseId);
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Unable to delete expense.");
      }
      setDeleteConfirmId(null);
      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete expense.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ───── Calculations ───── */
  const fuelLogs = expenses.filter(e => e.type === "Fuel");
  const otherExpenses = expenses.filter(e => e.type !== "Fuel");

  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOtherCost = otherExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCost = totalFuelCost + totalOtherCost;
  const totalLiters = fuelLogs.reduce((acc, curr) => acc + (curr.liters || 0), 0);

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  // Filter list based on search and tab
  const filtered = expenses.filter(exp => {
    const matchesTab = activeTab === "all" || (activeTab === "fuel" ? exp.type === "Fuel" : exp.type !== "Fuel");
    
    const v = exp.vehicle_id ? vehicleMap.get(exp.vehicle_id) : null;
    const matchesSearch = !searchQuery || 
      exp.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.details && exp.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v && v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Fuel & Expenses</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Monitor and record operations expenditure</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.97] flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> {showForm ? "Cancel" : "Log Expense"}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Total Expenditures</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">₹{totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Fuel Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">₹{totalFuelCost.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg"><Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Tolls & Other</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">₹{totalOtherCost.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><Fuel className="w-4 h-4 text-orange-600 dark:text-orange-400" /></div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Fuel Volume</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{totalLiters.toFixed(1)} L</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && canManage && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Log Expense</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Type</label>
              <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as BackendExpense["type"] })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option value="Fuel">Fuel</option>
                <option value="Toll">Toll</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Amount (₹)</label>
              <input type="number" required min="1" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" placeholder="0" />
            </div>
            {formData.type === "Fuel" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Liters</label>
                <input type="number" required min="0.1" step="0.01" value={formData.liters} onChange={e => setFormData({ ...formData, liters: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" placeholder="0.0" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Vehicle <span className="text-gray-400 font-normal">(optional)</span></label>
              <select value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registration_number})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Trip <span className="text-gray-400 font-normal">(optional)</span></label>
              <select value={formData.tripId} onChange={e => setFormData({ ...formData, tripId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all">
                <option value="">Select Trip</option>
                {trips.filter(t => !formData.vehicleId || String(vehicles.find(v => v.registration_number === t.vehicle_registration_number)?.id) === formData.vehicleId).map(t => (
                  <option key={t.id} value={t.id}>TRIP-{String(t.id).padStart(4, "0")} ({t.source} → {t.destination})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1.5">Details/Notes</label>
              <input value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })}
                className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all" placeholder="Toll tag refill, premium gas..." />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-2">
              <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.97]">
                Record Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search expenses by vehicle, details..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
            <button onClick={() => setActiveTab("all")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "all" ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-neutral-400"}`}>All</button>
            <button onClick={() => setActiveTab("fuel")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "fuel" ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-neutral-400"}`}>Fuel Only</button>
            <button onClick={() => setActiveTab("other")} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "other" ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-neutral-400"}`}>Other Expenses</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Expense Record</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Are you sure you want to permanently delete this expense? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} disabled={actionLoading === deleteConfirmId}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all active:scale-[0.97]">
                {actionLoading === deleteConfirmId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-500 dark:text-neutral-400">Loading expenses…</span>
        </div>
      )}

      {/* Main Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
            <thead className="bg-gray-50/80 dark:bg-neutral-950/50 text-gray-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5 text-right">Liters</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                {canManage && <th className="px-5 py-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {filtered.map(exp => {
                const v = exp.vehicle_id ? vehicleMap.get(exp.vehicle_id) : null;
                return (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      {exp.date}
                    </td>
                    <td className="px-5 py-3.5">
                      {v ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{v.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">{v.registration_number}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        exp.type === "Fuel"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                          : exp.type === "Toll"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                          : exp.type === "Maintenance"
                          ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
                          : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20"
                      }`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        <span className="truncate max-w-[200px]" title={exp.details || ""}>
                          {exp.details || <span className="text-gray-400 italic">No notes</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs">
                      {exp.liters !== null ? `${exp.liters.toFixed(1)} L` : <span className="text-gray-300 dark:text-neutral-800">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-900 dark:text-white font-semibold">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setDeleteConfirmId(exp.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-5 py-12 text-center text-gray-400 dark:text-neutral-500">
                    <Receipt className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    No records found.
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
