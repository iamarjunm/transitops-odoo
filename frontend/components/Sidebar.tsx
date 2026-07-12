"use client";

import { useStore } from "@/lib/store";
import { LayoutDashboard, Truck, Users, Map, Wrench, Receipt, LineChart, Settings, Moon, Sun, LogOut, Menu, X } from "lucide-react";
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

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (v: boolean) => void;
}) {
  const { currentUser, logout } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!currentUser) return null;

  const allowedTabs = tabs.filter(t => t.roles.includes(currentUser.role));

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen?.(false);
  };

  const sidebarContent = (
    <div className="w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          TransitOps
        </h1>
        {/* Mobile close button */}
        {setMobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {allowedTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-neutral-200'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
              )}
              <Icon className={`w-[18px] h-[18px] transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-110'}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-neutral-800 space-y-1">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50 hover:text-gray-700 dark:hover:text-neutral-300 rounded-xl transition-all"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-neutral-200 truncate">{currentUser.name}</span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500">{currentUser.role}</span>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen?.(false)} />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
