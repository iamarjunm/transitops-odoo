"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function Trips() {
  const { trips, vehicles, drivers, createTrip, dispatchTrip, completeTrip, cancelTrip } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    source: '', dest: '', vehicleId: '', driverId: '', weight: 0, distance: 0
  });

  const [completeData, setCompleteData] = useState({
    endOdometer: 0, fuelLiters: 0, fuelCost: 0
  });

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  
  // Filter out expired drivers as per business rules
  const availableDrivers = drivers.filter(d => 
    d.status === 'Available' && new Date(d.expiry) >= new Date()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrip(formData);
    setShowForm(false);
    setFormData({ source: '', dest: '', vehicleId: '', driverId: '', weight: 0, distance: 0 });
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (completeModalOpen) {
      completeTrip(completeModalOpen, completeData.endOdometer, completeData.fuelLiters, completeData.fuelCost);
      setCompleteModalOpen(null);
      setCompleteData({ endOdometer: 0, fuelLiters: 0, fuelCost: 0 });
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const capacityExceeded = selectedVehicle && formData.weight > selectedVehicle.capacity;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trip Dispatcher</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create Trip'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Source</label>
              <input required value={formData.source} onChange={e=>setFormData({...formData, source: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="Warehouse A" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Destination</label>
              <input required value={formData.dest} onChange={e=>setFormData({...formData, dest: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="Hub B" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Vehicle (Available Only)</label>
              <select required value={formData.vehicleId} onChange={e=>setFormData({...formData, vehicleId: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none">
                <option value="">Select Vehicle</option>
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.capacity}kg max)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Driver (Available Only)</label>
              <select required value={formData.driverId} onChange={e=>setFormData({...formData, driverId: e.target.value})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none">
                <option value="">Select Driver</option>
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Cargo Weight (kg)</label>
              <input type="number" required min="1" value={formData.weight || ''} onChange={e=>setFormData({...formData, weight: parseInt(e.target.value) || 0})} className={`w-full bg-gray-50 dark:bg-neutral-950 border rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none ${capacityExceeded ? 'border-red-500' : 'border-gray-300 dark:border-neutral-700 focus:border-blue-500'}`} />
              {capacityExceeded && <p className="text-xs text-red-500 mt-1">Exceeds max capacity of {selectedVehicle?.capacity}kg</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Planned Distance (km)</label>
              <input type="number" required min="1" value={formData.distance || ''} onChange={e=>setFormData({...formData, distance: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button disabled={capacityExceeded || !formData.vehicleId || !formData.driverId} type="submit" className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Create Draft Trip</button>
            </div>
          </form>
        </div>
      )}

      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Complete Trip</h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Log final odometer and fuel consumed during this trip.</p>
              <form onSubmit={handleComplete} className="space-y-4">
                 <div>
                    <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Closing Odometer</label>
                    <input type="number" required value={completeData.endOdometer || ''} onChange={e=>setCompleteData({...completeData, endOdometer: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Fuel Consumed (Liters)</label>
                      <input type="number" required value={completeData.fuelLiters || ''} onChange={e=>setCompleteData({...completeData, fuelLiters: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Fuel Cost</label>
                      <input type="number" required value={completeData.fuelCost || ''} onChange={e=>setCompleteData({...completeData, fuelCost: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" />
                    </div>
                 </div>
                 <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setCompleteModalOpen(null)} className="px-4 py-2 text-sm text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:text-white">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg">Confirm Completion</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
         {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map(statusGroup => {
            const groupTrips = trips.filter(t => t.status === statusGroup).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return (
               <div key={statusGroup} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-2">
                     <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">{statusGroup}</h3>
                     <span className="text-xs bg-gray-50 dark:bg-neutral-950 px-2 py-0.5 rounded text-gray-400 dark:text-neutral-500">{groupTrips.length}</span>
                  </div>
                  
                  {groupTrips.map(trip => {
                     const v = vehicles.find(x => x.id === trip.vehicleId);
                     const d = drivers.find(x => x.id === trip.driverId);
                     return (
                        <div key={trip.id} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                              <span className="text-xs font-mono text-gray-400 dark:text-neutral-500">#{trip.id.toUpperCase()}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                                 trip.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                 trip.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-500' :
                                 trip.status === 'Draft' ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400' :
                                 'bg-red-500/10 text-red-500'
                              }`}>{trip.status}</span>
                           </div>
                           
                           <div>
                              <p className="text-sm text-white font-medium truncate">{trip.source}</p>
                              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">↓ to</p>
                              <p className="text-sm text-white font-medium truncate">{trip.dest}</p>
                           </div>

                           <div className="bg-gray-50 dark:bg-neutral-950 rounded p-2 text-xs flex justify-between text-gray-500 dark:text-neutral-400 mt-1">
                              <span>{v?.name || 'Unknown'}</span>
                              <span>{d?.name || 'Unknown'}</span>
                           </div>

                           <div className="flex justify-between items-center text-xs text-gray-400 dark:text-neutral-500">
                              <span>{trip.distance} km</span>
                              <span>{trip.weight} kg</span>
                           </div>

                           <div className="flex gap-2 mt-2">
                              {trip.status === 'Draft' && (
                                 <>
                                    <button onClick={() => dispatchTrip(trip.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-medium transition-colors">Dispatch</button>
                                    <button onClick={() => cancelTrip(trip.id)} className="flex-1 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 py-1.5 rounded text-xs font-medium transition-colors">Cancel</button>
                                 </>
                              )}
                              {trip.status === 'Dispatched' && (
                                 <>
                                    <button onClick={() => setCompleteModalOpen(trip.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-medium transition-colors">Complete</button>
                                    <button onClick={() => cancelTrip(trip.id)} className="flex-1 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 py-1.5 rounded text-xs font-medium transition-colors">Cancel</button>
                                 </>
                              )}
                           </div>
                        </div>
                     )
                  })}
                  {groupTrips.length === 0 && (
                     <div className="text-center py-8 text-xs text-gray-400 dark:text-neutral-600 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
                        No trips
                     </div>
                  )}
               </div>
            )
         })}
      </div>
    </div>
  );
}
