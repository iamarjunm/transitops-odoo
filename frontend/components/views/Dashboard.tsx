"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Truck, Activity, Wrench, AlertTriangle, Route, CheckCircle, Clock, Loader2 } from "lucide-react";

type DashboardFleetStatus = {
  available: number;
  on_trip: number;
  in_shop: number;
  retired: number;
};

type DashboardKPIs = {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization: number;
  total_vehicles: number;
  fleet_status: DashboardFleetStatus;
};

type DriverStatusRow = {
  available: number;
  onTrip: number;
  offDuty: number;
  suspended: number;
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

function isDashboardKPIs(value: unknown): value is DashboardKPIs {
  return Boolean(
    value &&
    typeof value === "object" &&
    "active_vehicles" in value &&
    "available_vehicles" in value &&
    "vehicles_in_maintenance" in value &&
    "active_trips" in value &&
    "pending_trips" in value &&
    "drivers_on_duty" in value &&
    "fleet_utilization" in value &&
    "total_vehicles" in value &&
    "fleet_status" in value,
  );
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

const emptyKpis: DashboardKPIs = {
  active_vehicles: 0,
  available_vehicles: 0,
  vehicles_in_maintenance: 0,
  active_trips: 0,
  pending_trips: 0,
  drivers_on_duty: 0,
  fleet_utilization: 0,
  total_vehicles: 0,
  fleet_status: {
    available: 0,
    on_trip: 0,
    in_shop: 0,
    retired: 0,
  },
};

const emptyDriverStatus: DriverStatusRow = {
  available: 0,
  onTrip: 0,
  offDuty: 0,
  suspended: 0,
};

function mapDriverStatus(drivers: BackendDriver[]): DriverStatusRow {
  return drivers.reduce(
    (acc, driver) => {
      if (driver.status === "available") acc.available += 1;
      if (driver.status === "on_trip") acc.onTrip += 1;
      if (driver.status === "off_duty") acc.offDuty += 1;
      if (driver.status === "suspended") acc.suspended += 1;
      return acc;
    },
    { ...emptyDriverStatus },
  );
}

export function Dashboard() {
  const { currentUser, authToken, vehicles: storeVehicles, drivers: storeDrivers, trips: storeTrips } = useStore();
  const [kpis, setKpis] = useState<DashboardKPIs>(emptyKpis);
  const [driverStatus, setDriverStatus] = useState<DriverStatusRow>(emptyDriverStatus);
  const [localVehicles, setLocalVehicles] = useState<{ id: string; name: string }[]>([]);
  const [localDrivers, setLocalDrivers] = useState<{ id: string; name: string }[]>([]);
  const [localTrips, setLocalTrips] = useState<{
    id: string;
    source: string;
    dest: string;
    vehicleId: string;
    driverId: string;
    status: string;
    distance: number;
    createdAt: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadKpis = async () => {
      if (!authToken) {
        setKpis(emptyKpis);
        setDriverStatus(emptyDriverStatus);
        setLoading(false);
        return;
      }

      try {
        const [kpiResponse, driversResponse, vehiclesResponse, tripsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/kpis`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`${API_BASE_URL}/drivers/list`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`${API_BASE_URL}/vehicles`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`${API_BASE_URL}/trips/list`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        const kpiData = await kpiResponse.json().catch(() => null);
        const driverData = await driversResponse.json().catch(() => null);
        const vehicleData = await vehiclesResponse.json().catch(() => null);
        const tripData = await tripsResponse.json().catch(() => null);

        if (!kpiResponse.ok) {
          throw new Error(kpiData?.detail || "Unable to load dashboard metrics.");
        }

        if (!driversResponse.ok) {
          throw new Error(driverData?.detail || "Unable to load driver metrics.");
        }

        if (isDashboardKPIs(kpiData)) {
          setKpis(kpiData);
        }

        if (Array.isArray(driverData)) {
          setDriverStatus(mapDriverStatus(driverData));
          setLocalDrivers(driverData.map(d => ({ id: String(d.id), name: d.full_name })));
        }

        if (Array.isArray(vehicleData)) {
          setLocalVehicles(vehicleData.map(v => ({ id: String(v.id), name: v.name })));
        }

        if (Array.isArray(tripData)) {
          setLocalTrips(tripData.map(t => ({
            id: String(t.id),
            source: t.source,
            dest: t.destination,
            vehicleId: String(t.vehicle_id),
            driverId: String(t.driver_id),
            status: t.status === "draft" ? "Draft" : t.status === "dispatched" ? "Dispatched" : t.status === "completed" ? "Completed" : "Cancelled",
            distance: t.planned_distance_km,
            createdAt: t.created_at
          })));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard metrics.");
        
        setLocalVehicles(storeVehicles.map(v => ({ id: v.id, name: v.name })));
        setLocalDrivers(storeDrivers.map(d => ({ id: d.id, name: d.name })));
        setLocalTrips(storeTrips.map(t => ({
          id: t.id,
          source: t.source,
          dest: t.dest,
          vehicleId: t.vehicleId,
          driverId: t.driverId,
          status: t.status,
          distance: t.distance,
          createdAt: t.createdAt
        })));

        const activeVehicles = storeVehicles.filter(v => v.status !== 'Retired').length;
        const availableVehicles = storeVehicles.filter(v => v.status === 'Available').length;
        const inMaintenance = storeVehicles.filter(v => v.status === 'In Shop').length;
        const activeTrips = storeTrips.filter(t => t.status === 'Dispatched').length;
        const pendingTrips = storeTrips.filter(t => t.status === 'Draft').length;
        const driversOnDuty = storeDrivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;
        const offDutyDrivers = storeDrivers.filter(d => d.status === 'Off Duty').length;
        const onTripVehicles = storeVehicles.filter(v => v.status === 'On Trip').length;
        const retiredVehicles = storeVehicles.filter(v => v.status === 'Retired').length;

        setKpis({
          active_vehicles: activeVehicles,
          available_vehicles: availableVehicles,
          vehicles_in_maintenance: inMaintenance,
          active_trips: activeTrips,
          pending_trips: pendingTrips,
          drivers_on_duty: driversOnDuty,
          fleet_utilization: activeVehicles > 0 ? Math.round((onTripVehicles / activeVehicles) * 100) : 0,
          total_vehicles: storeVehicles.length,
          fleet_status: {
            available: availableVehicles,
            on_trip: onTripVehicles,
            in_shop: inMaintenance,
            retired: retiredVehicles,
          },
        });
        setDriverStatus({
          available: storeDrivers.filter(d => d.status === 'Available').length,
          onTrip: storeDrivers.filter(d => d.status === 'On Trip').length,
          offDuty: offDutyDrivers,
          suspended: storeDrivers.filter(d => d.status === 'Suspended').length,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadKpis();
  }, [authToken, storeDrivers, storeTrips, storeVehicles]);

  const recentTrips = [...localTrips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-3 text-sm text-gray-500 dark:text-neutral-400">Loading dashboard overview…</span>
      </div>
    );
  }

  const stats = [
    { label: "Active Fleet", value: kpis.active_vehicles, icon: Truck, color: "text-blue-600 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10" },
    { label: "Available", value: kpis.available_vehicles, icon: CheckCircle, color: "text-green-600 dark:text-green-500", bg: "bg-green-100 dark:bg-green-500/10" },
    { label: "In Shop", value: kpis.vehicles_in_maintenance, icon: Wrench, color: "text-orange-600 dark:text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/10" },
    { label: "Active Trips", value: kpis.active_trips, icon: Route, color: "text-purple-600 dark:text-purple-500", bg: "bg-purple-100 dark:bg-purple-500/10" },
    { label: "Pending", value: kpis.pending_trips, icon: Clock, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
    { label: "On Duty", value: kpis.drivers_on_duty, icon: Activity, color: "text-teal-600 dark:text-teal-500", bg: "bg-teal-100 dark:bg-teal-500/10" },
    { label: "Off Duty", value: loading ? '…' : driverStatus.offDuty, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10" },
  ];

  const fleetStatusRows = [
    { label: 'Available', count: kpis.fleet_status.available, color: 'bg-green-500' },
    { label: 'On Trip', count: kpis.fleet_status.on_trip, color: 'bg-blue-500' },
    { label: 'In Shop', count: kpis.fleet_status.in_shop, color: 'bg-orange-500' },
    { label: 'Retired', count: kpis.fleet_status.retired, color: 'bg-red-500' },
  ];

  const driverStatusRows = [
    { label: 'Available', count: driverStatus.available, color: 'bg-emerald-500' },
    { label: 'On Trip', count: driverStatus.onTrip, color: 'bg-blue-500' },
    { label: 'Off Duty', count: driverStatus.offDuty, color: 'bg-amber-500' },
    { label: 'Suspended', count: driverStatus.suspended, color: 'bg-red-500' },
  ];

  const totalDrivers = driverStatus.available + driverStatus.onTrip + driverStatus.offDuty + driverStatus.suspended;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">Real-time metrics and operations status</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 px-5 py-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Fleet Utilization</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{loading ? '…' : `${kpis.fleet_utilization}%`}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Showing fallback dashboard data because live metrics could not be loaded: {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center group hover:border-gray-200 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200">
              <div className={`p-3 rounded-xl mb-3 ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1 animate-count-up">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Trips</h3>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-mono">{recentTrips.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
              <thead className="bg-gray-50/50 dark:bg-neutral-950/30 text-gray-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Driver</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {recentTrips.map(t => {
                  const v = localVehicles.find(v => v.id === t.vehicleId);
                  const d = localDrivers.find(d => d.id === t.driverId);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[100px]">{t.source}</span>
                          <span className="text-gray-400 dark:text-neutral-600">→</span>
                          <span className="text-gray-600 dark:text-neutral-300 truncate max-w-[100px]">{t.dest}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-900 dark:text-neutral-200">{v?.name || '-'}</td>
                      <td className="px-6 py-3.5">{d?.name || '-'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                          t.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                          t.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700' :
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 dark:text-neutral-400 font-mono text-xs">{t.distance} km</td>
                    </tr>
                  )
                })}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-neutral-500">
                      <Route className="w-5 h-5 mx-auto mb-2 opacity-40" />
                      No recent trips
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Fleet Status */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-5">Fleet Status</h3>
            <div className="space-y-4">
              {fleetStatusRows.map((status, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-neutral-400 w-20">{status.label}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${status.color} rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${kpis.total_vehicles ? (status.count / kpis.total_vehicles) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-right">{status.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Status */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-5">Driver Status</h3>
            <div className="space-y-4">
              {driverStatusRows.map((status, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-neutral-400 w-20">{status.label}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${status.color} rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${totalDrivers ? (status.count / totalDrivers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-right">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
