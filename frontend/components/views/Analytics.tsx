"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, AlertCircle, TrendingUp } from "lucide-react";

/* ───────── Backend types ───────── */

type BackendVehicle = {
  id: number;
  name: string;
  status: string;
  cost: number;
};

type BackendTrip = {
  status: "draft" | "dispatched" | "completed" | "cancelled";
  planned_distance_km: number;
};

type BackendExpense = {
  type: "Fuel" | "Toll" | "Maintenance" | "Other";
  amount: number;
  liters: number | null;
  vehicle_id: number | null;
};

/* ───────── Component ───────── */

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

export function Analytics() {
  const { authToken, vehicles: storeVehicles, trips: storeTrips, expenses: storeExpenses } = useStore();
  const { theme } = useTheme();

  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [trips, setTrips] = useState<BackendTrip[]>([]);
  const [expenses, setExpenses] = useState<BackendExpense[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!authToken) return;
    try {
      setIsLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${authToken}` };

      const [vehiclesRes, tripsRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/trips/list`, { headers }),
        fetch(`${API_BASE_URL}/expenses`, { headers }),
      ]);

      const vehiclesData = await vehiclesRes.json().catch(() => null);
      const tripsData = await tripsRes.json().catch(() => null);
      const expensesData = await expensesRes.json().catch(() => null);

      if (!vehiclesRes.ok) throw new Error(vehiclesData?.detail || "Unable to load fleet data.");
      if (!tripsRes.ok) throw new Error(tripsData?.detail || "Unable to load trips data.");
      if (!expensesRes.ok) throw new Error(expensesData?.detail || "Unable to load expenses data.");

      if (Array.isArray(vehiclesData)) setVehicles(vehiclesData);
      if (Array.isArray(tripsData)) setTrips(tripsData);
      if (Array.isArray(expensesData)) setExpenses(expensesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics data.");
      // Fallback to store mocks
      setVehicles(storeVehicles.map(v => ({ id: Number(v.id) || 0, name: v.name, status: v.status, cost: v.cost })));
      setTrips(storeTrips.map(t => ({ status: t.status === "Completed" ? "completed" : t.status === "Dispatched" ? "dispatched" : t.status === "Draft" ? "draft" : "cancelled", planned_distance_km: t.distance })));
      setExpenses(storeExpenses.map(e => ({ type: e.type, amount: e.amount, liters: e.liters || null, vehicle_id: Number(e.vehicleId) || null })));
    } finally {
      setIsLoading(false);
    }
  }, [authToken, storeExpenses, storeTrips, storeVehicles]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Calculations
  const totalFuelCost = expenses.filter(e => e.type === "Fuel").reduce((a, b) => a + b.amount, 0);
  const totalMaintenanceCost = expenses.filter(e => e.type === "Maintenance").reduce((a, b) => a + b.amount, 0);
  const totalDistance = trips.filter(t => t.status === "completed").reduce((a, b) => a + b.planned_distance_km, 0);
  const totalFuelLiters = expenses.filter(e => e.type === "Fuel").reduce((a, b) => a + (b.liters || 0), 0);

  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;
  
  const activeVehiclesCount = vehicles.filter(v => v.status !== "Retired").length;
  const utilizedVehiclesCount = vehicles.filter(v => v.status === "On Trip").length;
  const fleetUtilization = activeVehiclesCount > 0 ? Math.round((utilizedVehiclesCount / activeVehiclesCount) * 100) : 0;

  const totalCost = totalFuelCost + totalMaintenanceCost;
  const avgCostPerKm = totalDistance > 0 ? (totalCost / totalDistance).toFixed(2) : 0;

  const estimatedRevenue = totalDistance * 150; 
  const totalAcquisitionCost = vehicles.reduce((a,b) => a + b.cost, 0);
  const roi = totalAcquisitionCost > 0 ? (((estimatedRevenue - totalCost) / totalAcquisitionCost) * 100).toFixed(2) : 0;

  const costPerVehicle = vehicles.filter(v => v.status !== "Retired").map(v => {
     const vExp = expenses.filter(e => e.vehicle_id === v.id).reduce((a,b) => a + b.amount, 0);
     return { name: v.name, cost: vExp };
  }).sort((a,b) => b.cost - a.cost).slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5 font-sans">Strategic fleet KPIs and expenditure summaries</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Showing fallback mock metrics: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-500 dark:text-neutral-400">Compiling report analytics…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border-l-2 border-l-blue-500 border border-gray-100 dark:border-neutral-850 shadow-sm">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Fuel Efficiency</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">{fuelEfficiency} <span className="text-xs text-gray-400 dark:text-neutral-500 font-sans">km/l</span></p>
             </div>
             <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border-l-2 border-l-emerald-500 border border-gray-100 dark:border-neutral-850 shadow-sm">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Fleet Utilization</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">{fleetUtilization}%</p>
             </div>
             <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border-l-2 border-l-orange-500 border border-gray-100 dark:border-neutral-850 shadow-sm">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Operational Cost</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">₹{totalCost.toLocaleString()}</p>
             </div>
             <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border-l-2 border-l-purple-500 border border-gray-100 dark:border-neutral-850 shadow-sm">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-sans flex items-center gap-1">Est. Vehicle ROI <TrendingUp className="w-3.5 h-3.5 text-purple-500" /></p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">{roi}%</p>
                <p className="text-[9px] text-gray-400 dark:text-neutral-600 mt-1.5 font-sans">ROI = (Rev - Cost) / Acq Cost</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6 flex flex-col h-80 shadow-sm">
                <h3 className="text-xs font-bold text-gray-600 dark:text-neutral-400 uppercase tracking-wider mb-6">Top Costliest Vehicles</h3>
                <div className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costPerVehicle} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: theme === "dark" ? "#888" : "#666", fontSize: 11, fontWeight: 500}} width={80} />
                         <Tooltip 
                            cursor={{fill: theme === "dark" ? "#1a1a1a" : "#f8f9fa"}}
                            contentStyle={{backgroundColor: theme === "dark" ? "#171717" : "#fff", borderColor: theme === "dark" ? "#333" : "#e5e7eb", borderRadius: "10px", color: theme === "dark" ? "#fff" : "#111", fontSize: "12px"}}
                            formatter={(value) => [`₹${value}`, "Cost"]}
                         />
                         <Bar dataKey="cost" radius={[0, 6, 6, 0]} barSize={16}>
                            {costPerVehicle.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 0 ? "#f97316" : "#3b82f6"} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6 flex flex-col justify-between shadow-sm">
                <h3 className="text-xs font-bold text-gray-600 dark:text-neutral-400 uppercase tracking-wider mb-4">General Stats</h3>
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                   <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                         <span className="text-gray-500 dark:text-neutral-400">Average Cost / km</span>
                         <span className="text-gray-900 dark:text-white font-mono">₹{avgCostPerKm}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-neutral-500 h-1.5 rounded-full" style={{width: "50%"}}></div></div>
                   </div>
                   <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                         <span className="text-gray-500 dark:text-neutral-400">Total Distance Logged</span>
                         <span className="text-gray-900 dark:text-white font-mono">{totalDistance} km</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: "80%"}}></div></div>
                   </div>
                   <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                         <span className="text-gray-500 dark:text-neutral-400">Total Fuel Consumed</span>
                         <span className="text-gray-900 dark:text-white font-mono">{totalFuelLiters.toFixed(1)} L</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{width: "65%"}}></div></div>
                   </div>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
