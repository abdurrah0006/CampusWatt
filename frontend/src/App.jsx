import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Topbar } from './components/layout/Topbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import WasteFinderPage from './pages/WasteFinderPage.jsx';
import BuildingsPage from './pages/BuildingsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ManageBuildingsPage from './pages/manage/ManageBuildingsPage.jsx';
import ManageRoomsPage from './pages/manage/ManageRoomsPage.jsx';
import ManageSchedulesPage from './pages/manage/ManageSchedulesPage.jsx';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink-primary">
        Skip to content
      </a>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main id="main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/waste" element={<WasteFinderPage />} />
            <Route path="/buildings" element={<BuildingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/manage/buildings" element={<ManageBuildingsPage />} />
            <Route path="/manage/rooms" element={<ManageRoomsPage />} />
            <Route path="/manage/schedules" element={<ManageSchedulesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
