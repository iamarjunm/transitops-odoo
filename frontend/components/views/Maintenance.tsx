"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function Maintenance() {
  const { vehicles, maintenance, addMaintenance, closeMaintenance } = useStore();
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: '', service: '', cost: 0, date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenance({ ...formData, status: 'Active' });
    setShowForm(false);
    setFormData({ vehicleId: '', service: '', cost: 0, date: new Date().toISOString().split('T')[0] });
  };

  const eligibleVehicles = vehicles.filter(v => v.status !== 'Retired');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Maintenance Log</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Service'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Vehicle</label>
              <select required value={formData.vehicleId} onChange={e=>setFormData({...formData, vehicleId: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none">
                <option value="">Select Vehicle</option>
                {eligibleVehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.regNo})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Service Type</label>
              <input required value={formData.service} onChange={e=>setFormData({...formData, service: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="Oil Change, Engine Repair..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Estimated Cost</label>
              <input type="number" required min="0" value={formData.cost || ''} onChange={e=>setFormData({...formData, cost: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Date</label>
              <input type="date" required value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="md:col-span-4 flex justify-end items-center mt-2">
              <p className="text-xs text-blue-600 dark:text-blue-500 mr-auto">Note: Adding a vehicle to Maintenance automatically switches it to "In Shop" and removes it from dispatch.</p>
              <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200">Save Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
          <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-400 dark:text-neutral-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 font-medium">Vehicle</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Cost</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {maintenance.sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => {
              const v = vehicles.find(v => v.id === m.vehicleId);
              return (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{v?.name || 'Unknown'}</td>
                  <td className="px-5 py-3">{m.service}</td>
                  <td className="px-5 py-3">{m.date}</td>
                  <td className="px-5 py-3 font-mono">₹{m.cost.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 inline-flex rounded-md text-xs font-medium border ${
                      m.status === 'Active' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                      'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      {m.status === 'Active' ? 'In Shop' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                     {m.status === 'Active' && (
                        <button onClick={() => closeMaintenance(m.id)} className="text-xs text-gray-900 dark:text-white bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:bg-neutral-700 px-3 py-1 rounded transition-colors">
                           Mark Complete
                        </button>
                     )}
                  </td>
                </tr>
              )
            })}
            {maintenance.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 dark:text-neutral-500">No maintenance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
