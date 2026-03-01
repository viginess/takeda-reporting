import { useEffect } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../utils/trpc';
import WelcomePage from '../WelcomePage';
import { supabase } from '../utils/supabaseClient';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AdminLayout from '../admin/components/AdminLayout';
import DashBoard from '../admin/pages/DashBoard';
import ReportManagementPage from '../admin/pages/ReportManagementPage';
import NotificationsPage from '../admin/pages/NotificationsPage';
import AdminLogin from '../admin/pages/AdminLogin';
import AdminResetPassword from '../admin/pages/AdminResetPassword';
import SystemSettings from '../admin/pages/settings/SystemSettings';
import ProtectedRoute from '../admin/components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
  queryCache: new QueryCache({
    onError: async (err: any) => {
      if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
        console.warn('Backend session expired. Signing out...');
        await supabase.auth.signOut();
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: async (err: any) => {
      if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
        console.warn('Backend session expired during mutation. Signing out...');
        await supabase.auth.signOut();
      }
    },
  }),
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
      url: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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

const RecoveryRedirector = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/admin/reset-password");
      }
    });

    // Also check on initial mount for hashes/params if the event hasn't fired yet
    if (window.location.hash.includes("type=recovery")) {
      navigate("/admin/reset-password");
    }
  }, [navigate]);

  return null;
};

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RecoveryRedirector />
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashBoard />} />
                <Route path="reports" element={<ReportManagementPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>
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
