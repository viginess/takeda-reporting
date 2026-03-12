import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Flex, Box, Skeleton, VStack } from '@chakra-ui/react';
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
      <Flex direction="column" minH="100vh" bg="#f8fafc" p={8}>
        <Flex gap={6} flex={1}>
          <Box w="260px" flexShrink={0}>
             <Skeleton h="300px" borderRadius="2xl" />
          </Box>
          <Box flex={1}>
             <VStack align="stretch" spacing={6}>
                <Skeleton h="100px" borderRadius="2xl" />
                <Skeleton h="400px" borderRadius="2xl" />
             </VStack>
          </Box>
        </Flex>
      </Flex>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
