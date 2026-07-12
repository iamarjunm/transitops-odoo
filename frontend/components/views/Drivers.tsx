"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function Drivers() {
  const { drivers, addDriver } = useStore();
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', licenseNo: '', category: 'LMV', expiry: '', contact: '', safetyScore: 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDriver({ ...formData, status: 'Available' });
    setShowForm(false);
    setFormData({ name: '', licenseNo: '', category: 'LMV', expiry: '', contact: '', safetyScore: 100 });
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Driver Management</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Driver'}
        </button>
      </div>

      {showForm && (
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
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200">Save Driver</button>
            </div>
          </form>
        </div>
      )}

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
                    <span className={`px-2 py-1 inline-flex rounded-md text-xs font-medium border ${
                      d.status === 'Available' && !expired ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      d.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      d.status === 'Off Duty' ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-neutral-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {expired && d.status !== 'Suspended' ? 'License Expired' : d.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {drivers.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 dark:text-neutral-500">No drivers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
