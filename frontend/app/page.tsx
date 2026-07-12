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

function getDefaultTabForRole(role: string) {
  return tabs.find(tab => tab.roles.includes(role))?.id ?? 'Dashboard';
}

function MainLayout() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('Dashboard');

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-200 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-6 md:p-10">
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
