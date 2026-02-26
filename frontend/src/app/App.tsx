import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../utils/trpc';
import WelcomePage from '../WelcomePage';
import { supabase } from '../utils/supabaseClient';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '../admin/components/AdminLayout';
import DashBoard from '../admin/pages/DashBoard';
import ReportManagementPage from '../admin/pages/ReportManagementPage';
import NotificationsPage from '../admin/pages/NotificationsPage';
import AdminLogin from '../admin/pages/AdminLogin';
import AdminResetPassword from '../admin/pages/AdminResetPassword';
import SystemSettings from '../admin/pages/settings/SystemSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

// Simple helper to get or create a persistent guest ID
const getGuestId = () => {
  let id = localStorage.getItem('reporting_guest_id');
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('reporting_guest_id', id);
  }
  return id;
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}`
        : 'http://localhost:3000',
      headers: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
          'x-client-id': getGuestId(),
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        };
      },
    }),
  ],
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashBoard />} />
              <Route path="reports" element={<ReportManagementPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
