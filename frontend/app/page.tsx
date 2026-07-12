"use client";

import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import Auth from '@/components/Auth';
import Sidebar, { tabs } from '@/components/Sidebar';
import { Dashboard } from '@/components/views/Dashboard';
import { Vehicles } from '@/components/views/Vehicles';
import { Drivers } from '@/components/views/Drivers';
import { Trips } from '@/components/views/Trips';
import { Maintenance } from '@/components/views/Maintenance';
import { Expenses } from '@/components/views/Expenses';
import { Analytics } from '@/components/views/Analytics';
import { Settings } from '@/components/views/Settings';
import { Menu, Truck } from 'lucide-react';

function getDefaultTabForRole(role: string) {
  return tabs.find(tab => tab.roles.includes(role))?.id ?? 'Dashboard';
}

function MainLayout() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowedTabs = currentUser ? tabs.filter(tab => tab.roles.includes(currentUser.role)) : [];

  useEffect(() => {
    if (!currentUser) {
      setActiveTab('Dashboard');
      return;
    }

    const defaultTab = getDefaultTabForRole(currentUser.role);
    if (!allowedTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, allowedTabs, currentUser]);

  if (!currentUser) return <Auth />;

  const visibleTab = allowedTabs.some(tab => tab.id === activeTab) ? activeTab : getDefaultTabForRole(currentUser.role);

  const activeTabMeta = tabs.find(t => t.id === visibleTab);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-200 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            TransitOps
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {visibleTab === 'Dashboard' && <Dashboard />}
            {visibleTab === 'Fleet' && <Vehicles />}
            {visibleTab === 'Drivers' && <Drivers />}
            {visibleTab === 'Trips' && <Trips />}
            {visibleTab === 'Maintenance' && <Maintenance />}
            {visibleTab === 'Expenses' && <Expenses />}
            {visibleTab === 'Analytics' && <Analytics />}
            {visibleTab === 'Settings' && <Settings />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
