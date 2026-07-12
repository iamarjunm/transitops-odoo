"use client";

import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Analytics() {
  const { vehicles, trips, expenses } = useStore();
  const { theme } = useTheme();

  const totalFuelCost = expenses.filter(e => e.type === 'Fuel').reduce((a, b) => a + b.amount, 0);
  const totalMaintenanceCost = expenses.filter(e => e.type === 'Maintenance').reduce((a, b) => a + b.amount, 0);
  const totalDistance = trips.filter(t => t.status === 'Completed').reduce((a, b) => a + b.distance, 0);
  const totalFuelLiters = expenses.filter(e => e.type === 'Fuel').reduce((a, b) => a + (b.liters || 0), 0);

  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : 0;
  
  const activeVehiclesCount = vehicles.filter(v => v.status !== 'Retired').length;
  const utilizedVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtilization = activeVehiclesCount > 0 ? Math.round((utilizedVehiclesCount / activeVehiclesCount) * 100) : 0;

  const totalCost = totalFuelCost + totalMaintenanceCost;
  const avgCostPerKm = totalDistance > 0 ? (totalCost / totalDistance).toFixed(2) : 0;

  // Assuming arbitrary revenue metric for the mockup's ROI calculation since trips don't have revenue explicitly
  // We'll calculate a proxy revenue: distance * 150 (₹/km)
  const estimatedRevenue = totalDistance * 150; 
  const totalAcquisitionCost = vehicles.reduce((a,b) => a + b.cost, 0);
  const roi = totalAcquisitionCost > 0 ? (((estimatedRevenue - totalCost) / totalAcquisitionCost) * 100).toFixed(2) : 0;

  // Cost per vehicle
  const costPerVehicle = vehicles.filter(v => v.status !== 'Retired').map(v => {
     const vExp = expenses.filter(e => e.vehicleId === v.id).reduce((a,b) => a + b.amount, 0);
     return { name: v.name, cost: vExp };
  }).sort((a,b) => b.cost - a.cost).slice(0, 5); // top 5 costliest

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Reports & Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-2 border-l-blue-500 border border-gray-200 dark:border-neutral-800">
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Fuel Efficiency</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{fuelEfficiency} <span className="text-lg text-gray-400 dark:text-neutral-500">km/l</span></p>
         </div>
         <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-2 border-l-green-500 border border-gray-200 dark:border-neutral-800">
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Fleet Utilization</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{fleetUtilization}%</p>
         </div>
         <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-2 border-l-orange-500 border border-gray-200 dark:border-neutral-800">
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Operational Cost</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-mono">₹{totalCost.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border-l-2 border-l-purple-500 border border-gray-200 dark:border-neutral-800">
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Est. Vehicle ROI</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{roi}%</p>
            <p className="text-[10px] text-gray-400 dark:text-neutral-600 mt-1">ROI = (Rev - Cost) / Acq Cost</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
         <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-6">Top Costliest Vehicles</h3>
            <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costPerVehicle} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#999' : '#6b7280', fontSize: 12}} width={80} />
                     <Tooltip 
                        cursor={{fill: theme === 'dark' ? '#1a1a1a' : '#f3f4f6'}}
                        contentStyle={{backgroundColor: theme === 'dark' ? '#171717' : '#fff', borderColor: theme === 'dark' ? '#333' : '#e5e7eb', color: theme === 'dark' ? '#fff' : '#111'}}
                        formatter={(value) => [`₹${value}`, 'Cost']}
                     />
                     <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                        {costPerVehicle.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#3b82f6'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-6">General Stats</h3>
            <div className="space-y-6 flex-1">
               <div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-500 dark:text-neutral-400">Average Cost / km</span>
                     <span className="text-gray-900 dark:text-white font-mono">₹{avgCostPerKm}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-neutral-500 h-1.5 rounded-full" style={{width: '50%'}}></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-500 dark:text-neutral-400">Total Distance Logged</span>
                     <span className="text-gray-900 dark:text-white font-mono">{totalDistance} km</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: '80%'}}></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1">
                     <span className="text-gray-500 dark:text-neutral-400">Total Fuel Consumed</span>
                     <span className="text-gray-900 dark:text-white font-mono">{totalFuelLiters} L</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{width: '65%'}}></div></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
