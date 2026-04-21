import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/config/supabaseClient';

// Layout & Auth
import AdminLayout from '../features/layout/AdminLayout';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import AdminLogin from '../features/auth/pages/AdminLogin';
import AdminResetPassword from '../features/auth/pages/AdminResetPassword';

// Dashboard & Pages
import DashBoard from '../features/dashboard/DashBoard';
import ReportManagementPage from '../features/reports/pages/ReportManagementPage';
import NotificationsPage from '../features/notifications/NotificationsPage';
import MeddraManagementPage from '../features/meddra/pages/MeddraManagementPage';
import WhodrugManagementPage from '../features/whodrug/WhodrugManagementPage';
import CompanyManagementPage from '../features/company/pages/CompanyManagementPage';
import SystemSettings from '../features/settings/pages/SystemSettings';

/**
 * Handles redirects for password recovery hashes (#type=recovery)
 * and fires the recovery event for the admin portal.
 */
const RecoveryRedirector = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event: any, _session: any) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/admin/reset-password");
      }
    });

    if (window.location.hash.includes("type=recovery")) {
      navigate("/admin/reset-password");
    }
  }, [navigate]);

  return null;
};

export default function AdminApp() {
  return (
    <>
      <RecoveryRedirector />
      <Routes>
        {/* Public Admin Routes */}
        <Route path="login" element={<AdminLogin />} />
        <Route path="reset-password" element={<AdminResetPassword />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashBoard />} />
            <Route path="reports" element={<ReportManagementPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="meddra" element={<MeddraManagementPage />} />
            <Route path="whodrug" element={<WhodrugManagementPage />} />
            <Route path="companies" element={<CompanyManagementPage />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
