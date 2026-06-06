import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddContact from './pages/AddContact';
import ContactDetail from './pages/ContactDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-navy-900">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/contacts/new" element={<AddContact onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/contacts/:id" element={<ContactDetail onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/contacts/:id/edit" element={<AddContact onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/events" element={<Events onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/events/:id" element={<EventDetail onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/analytics" element={<Analytics onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="/settings" element={<Settings onMenuClick={() => setSidebarOpen(true)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
