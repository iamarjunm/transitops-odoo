"use client";

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Platform Settings</h2>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-neutral-800">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Role-Based Access Control (RBAC) Matrix</h3>
           <p className="text-sm text-gray-500 dark:text-neutral-400">This table shows the permissions granted to each role within TransitOps.</p>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
              <thead className="bg-gray-50 dark:bg-neutral-950 text-gray-400 dark:text-neutral-500 text-xs uppercase tracking-wider">
                 <tr>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Fleet</th>
                    <th className="px-5 py-3 font-medium">Drivers</th>
                    <th className="px-5 py-3 font-medium">Trips</th>
                    <th className="px-5 py-3 font-medium">Fuel/Exp.</th>
                    <th className="px-5 py-3 font-medium">Analytics</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                 <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">Admin</td>
                    <td className="px-5 py-3 text-green-500">✓ Full</td>
                    <td className="px-5 py-3 text-green-500">✓ Full</td>
                    <td className="px-5 py-3 text-green-500">✓ Full</td>
                    <td className="px-5 py-3 text-green-500">✓ Full</td>
                    <td className="px-5 py-3 text-green-500">✓ Full</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">Fleet Manager</td>
                    <td className="px-5 py-3 text-green-500">✓ Manage</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">View</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-green-500">✓ View</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">Dispatcher</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">View</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-green-500">✓ Manage</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">Safety Officer</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-green-500">✓ Manage</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">View</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                 </tr>
                 <tr className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">Financial Analyst</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">View</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-neutral-500">-</td>
                    <td className="px-5 py-3 text-green-500">✓ Manage</td>
                    <td className="px-5 py-3 text-green-500">✓ View</td>
                 </tr>
              </tbody>
           </table>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-4 opacity-50 pointer-events-none">
         <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">General Preferences</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">These settings are disabled in the prototype.</p>
         </div>
         <div>
            <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Default Currency</label>
            <input disabled value="INR (₹)" className="w-full max-w-sm bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-400 dark:text-neutral-500" />
         </div>
         <div>
            <label className="block text-xs text-gray-500 dark:text-neutral-400 mb-1">Distance Unit</label>
            <input disabled value="Kilometers (km)" className="w-full max-w-sm bg-gray-50 dark:bg-neutral-950 border border-gray-300 dark:border-neutral-700 rounded px-3 py-1.5 text-sm text-gray-400 dark:text-neutral-500" />
         </div>
         <button disabled className="bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 px-4 py-2 rounded-lg text-sm font-medium mt-2">Save Changes</button>
      </div>
    </div>
  );
}
