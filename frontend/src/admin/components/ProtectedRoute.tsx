import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Center, Spinner } from '@chakra-ui/react';
import { trpc } from '../../utils/trpc';

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Deep session check with backend to verify TRPC/JWT validity
  const { isLoading: isBackendLoading, error } = trpc.admin.getMe.useQuery(undefined, {
    retry: false,
    enabled: authenticated, // Only check backend if Supabase says we have a local session
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle backend-detected session expiration (e.g. inactivity timeout)
  if (error?.data?.code === 'UNAUTHORIZED') {
    return <Navigate to="/admin/login" replace />;
  }

  if (loading || (authenticated && isBackendLoading)) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="red.500" thickness="4px" />
      </Center>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
