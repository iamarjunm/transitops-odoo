"use client";

import { useStore } from "@/lib/store";
import { LayoutDashboard, Truck, Users, Map, Wrench, Receipt, LineChart, Settings, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const tabs = [
  { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Fleet Manager', 'Dispatcher'] },
  { id: 'Fleet', icon: Truck, label: 'Fleet Registry', roles: ['Admin', 'Fleet Manager'] },
  { id: 'Drivers', icon: Users, label: 'Drivers', roles: ['Admin', 'Safety Officer'] },
  { id: 'Trips', icon: Map, label: 'Trip Dispatcher', roles: ['Admin', 'Dispatcher'] },
  { id: 'Maintenance', icon: Wrench, label: 'Maintenance', roles: ['Admin', 'Fleet Manager'] },
  { id: 'Expenses', icon: Receipt, label: 'Fuel & Expenses', roles: ['Admin', 'Financial Analyst'] },
  { id: 'Analytics', icon: LineChart, label: 'Analytics', roles: ['Admin', 'Fleet Manager', 'Financial Analyst'] },
  { id: 'Settings', icon: Settings, label: 'Settings', roles: ['Admin'] },
];

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const { currentUser, logout } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!currentUser) return null;

  const allowedTabs = tabs.filter(t => t.roles.includes(currentUser.role));

  return (
    <div className="w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col h-full shadow-sm">
      <div className="p-6">
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          TransitOps
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {allowedTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-neutral-800 space-y-4">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        )}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-neutral-200">{currentUser.name}</span>
            <span className="text-xs text-gray-500 dark:text-neutral-500">{currentUser.role}</span>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
