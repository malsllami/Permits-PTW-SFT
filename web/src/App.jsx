import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getPublicSettings, applyColorsFromSettings } from './services/settingsService.js';

import LoginPage from './pages/LoginPage.jsx';
import CreatePermitPage from './pages/source/CreatePermitPage.jsx';
import MyRecordsPage from './pages/source/MyRecordsPage.jsx';
import PermitLinkPage from './pages/permit/PermitLinkPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminEmployeesPage from './pages/admin/AdminEmployeesPage.jsx';
import AdminPermitsPage from './pages/admin/AdminPermitsPage.jsx';
import AdminOperationsLogPage from './pages/admin/AdminOperationsLogPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// يُستخدم HashRouter عمدًا (روابط بصيغة #/...) لأن GitHub Pages استضافة ثابتة بدون
// إعادة توجيه من السيرفر لمسارات SPA - هذا يضمن أن الرابط الدائم للتصريح (QR) يعمل دائمًا.
export default function App() {
  useEffect(() => {
    getPublicSettings().then(applyColorsFromSettings).catch(() => {});
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/permit" element={<PermitLinkPage />} />

        <Route path="/source/create" element={<ProtectedRoute><CreatePermitPage /></ProtectedRoute>} />
        <Route path="/source/records" element={<ProtectedRoute><MyRecordsPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="employees" element={<AdminEmployeesPage />} />
          <Route path="permits" element={<AdminPermitsPage />} />
          <Route path="operations-log" element={<AdminOperationsLogPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
