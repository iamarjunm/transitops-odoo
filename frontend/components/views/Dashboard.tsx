"use client";

import { useStore } from "@/lib/store";
import { Truck, Activity, Wrench, AlertTriangle, Route, CheckCircle, Clock } from "lucide-react";

export function Dashboard() {
  const { vehicles, drivers, trips } = useStore();

  const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const inMaintenance = vehicles.filter(v => v.status === 'In Shop');
  
  const activeTrips = trips.filter(t => t.status === 'Dispatched');
  const pendingTrips = trips.filter(t => t.status === 'Draft');
  
  const driversOnDuty = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip');
  
  const fleetUtilization = activeVehicles.length > 0 
    ? Math.round((vehicles.filter(v => v.status === 'On Trip').length / activeVehicles.length) * 100) 
    : 0;

  const recentTrips = [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: "Active Fleet", value: activeVehicles.length, icon: Truck, color: "text-blue-600 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10" },
    { label: "Available", value: availableVehicles.length, icon: CheckCircle, color: "text-green-600 dark:text-green-500", bg: "bg-green-100 dark:bg-green-500/10" },
    { label: "In Shop", value: inMaintenance.length, icon: Wrench, color: "text-orange-600 dark:text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/10" },
    { label: "Active Trips", value: activeTrips.length, icon: Route, color: "text-purple-600 dark:text-purple-500", bg: "bg-purple-100 dark:bg-purple-500/10" },
    { label: "Pending", value: pendingTrips.length, icon: Clock, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
    { label: "On Duty", value: driversOnDuty.length, icon: Activity, color: "text-teal-600 dark:text-teal-500", bg: "bg-teal-100 dark:bg-teal-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">Real-time metrics and operations status</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 px-4 py-3 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 flex items-center gap-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Fleet Utilization</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{fleetUtilization}%</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center group hover:border-gray-200 dark:hover:border-neutral-700 transition-colors">
              <div className={`p-3 rounded-xl mb-3 ${s.bg} ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Trips</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
              <thead className="bg-gray-50/50 dark:bg-neutral-900/50 text-gray-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Trip ID</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {recentTrips.map(t => {
                  const v = vehicles.find(v => v.id === t.vehicleId);
                  const d = drivers.find(d => d.id === t.driverId);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{t.id.toUpperCase()}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-neutral-200">{v?.name || '-'}</td>
                      <td className="px-6 py-4">{d?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          t.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                          t.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                          t.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700' :
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-neutral-400">{t.distance} km</td>
                    </tr>
                  )
                })}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-neutral-400">No recent trips</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6 flex flex-col">
           <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Fleet Status</h3>
           <div className="space-y-6 flex-1 flex flex-col justify-center">
              {[
                { label: 'Available', count: availableVehicles.length, color: 'bg-green-500' },
                { label: 'On Trip', count: vehicles.filter(v=>v.status==='On Trip').length, color: 'bg-blue-500' },
                { label: 'In Shop', count: inMaintenance.length, color: 'bg-orange-500' },
                { label: 'Retired', count: vehicles.filter(v=>v.status==='Retired').length, color: 'bg-red-500' }
              ].map((status, i) => (
                <div key={i} className="flex justify-between items-center group">
                   <span className="text-sm font-medium text-gray-600 dark:text-neutral-400 w-24">{status.label}</span>
                   <div className="flex-1 flex items-center gap-4 mx-4">
                     <div className="h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${status.color} transition-all duration-500`} 
                         style={{ width: `${vehicles.length ? (status.count / vehicles.length) * 100 : 0}%` }}
                       />
                     </div>
                   </div>
                   <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{status.count}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
