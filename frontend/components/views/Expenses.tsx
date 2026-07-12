"use client";

import { useStore } from "@/lib/store";

export function Expenses() {
  const { expenses, vehicles } = useStore();

  const fuelLogs = expenses.filter(e => e.type === 'Fuel').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const otherExpenses = expenses.filter(e => e.type !== 'Fuel').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOtherCost = otherExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOperationalCost = totalFuelCost + totalOtherCost;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-800 pb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Fuel & Expenses</h2>
        <div className="text-right">
           <p className="text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Total Operational Cost</p>
           <p className="text-2xl font-bold text-blue-600 dark:text-blue-500 font-mono">₹{totalOperationalCost.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-neutral-300">Fuel Logs</h3>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
               <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
                  <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-400 dark:text-neutral-500 text-xs uppercase tracking-wider">
                     <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Vehicle</th>
                        <th className="px-4 py-3 font-medium text-right">Liters</th>
                        <th className="px-4 py-3 font-medium text-right">Cost</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                     {fuelLogs.map(log => {
                        const v = vehicles.find(x => x.id === log.vehicleId);
                        return (
                           <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                              <td className="px-4 py-3">{log.date}</td>
                              <td className="px-4 py-3 text-gray-900 dark:text-white">{v?.name || 'Unknown'}</td>
                              <td className="px-4 py-3 text-right font-mono">{log.liters} L</td>
                              <td className="px-4 py-3 text-right font-mono">₹{log.amount.toLocaleString()}</td>
                           </tr>
                        )
                     })}
                     {fuelLogs.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 dark:text-neutral-500">No fuel records.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-neutral-300">Other Expenses</h3>
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
               <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
                  <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-400 dark:text-neutral-500 text-xs uppercase tracking-wider">
                     <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Details</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium text-right">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                     {otherExpenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                           <td className="px-4 py-3">{exp.date}</td>
                           <td className="px-4 py-3 text-gray-900 dark:text-white truncate max-w-[150px]">{exp.details}</td>
                           <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400">{exp.type}</span>
                           </td>
                           <td className="px-4 py-3 text-right font-mono text-blue-500 dark:text-blue-400">₹{exp.amount.toLocaleString()}</td>
                        </tr>
                     ))}
                     {otherExpenses.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 dark:text-neutral-500">No other expenses.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
