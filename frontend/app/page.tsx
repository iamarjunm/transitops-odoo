"use client";

import { useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import Auth from '@/components/Auth';
import Sidebar from '@/components/Sidebar';
import { Dashboard } from '@/components/views/Dashboard';
import { Vehicles } from '@/components/views/Vehicles';
import { Drivers } from '@/components/views/Drivers';
import { Trips } from '@/components/views/Trips';
import { Maintenance } from '@/components/views/Maintenance';
import { Expenses } from '@/components/views/Expenses';
import { Analytics } from '@/components/views/Analytics';
import { Settings } from '@/components/views/Settings';

function MainLayout() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('Dashboard');

  if (!currentUser) return <Auth />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-neutral-200 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'Dashboard' && <Dashboard />}
          {activeTab === 'Fleet' && <Vehicles />}
          {activeTab === 'Drivers' && <Drivers />}
          {activeTab === 'Trips' && <Trips />}
          {activeTab === 'Maintenance' && <Maintenance />}
          {activeTab === 'Expenses' && <Expenses />}
          {activeTab === 'Analytics' && <Analytics />}
          {activeTab === 'Settings' && <Settings />}
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
