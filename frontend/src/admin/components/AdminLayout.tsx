import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { trpc } from '../../utils/trpc';
import Sidebar from './Sidebar';
import { Flex, Box, IconButton } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';

export default function AdminLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const navigate = useNavigate();

  const { data: systemSettings } = trpc.admin.getSystemSettings.useQuery();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/admin/login');
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/admin/login');
      }
    });

    // ── Inactivity Auto-Logout ──
    let timeoutId: NodeJS.Timeout;
    const sessionTimeout = systemSettings?.clinicalConfig?.sessionTimeout;

    if (sessionTimeout && sessionTimeout !== "Never") {
      const minutes = parseInt(sessionTimeout);
      if (!isNaN(minutes)) {
        const resetTimer = () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(async () => {
            console.log("Inactivity timeout reached. Signing out...");
            await supabase.auth.signOut();
            navigate('/admin/login');
          }, minutes * 60 * 1000);
        };

        // Reset timer on activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer(); // Start initial timer

        return () => {
          if (timeoutId) clearTimeout(timeoutId);
          events.forEach(e => window.removeEventListener(e, resetTimer));
          subscription.unsubscribe();
        };
      }
    }

    return () => subscription.unsubscribe();
  }, [navigate, systemSettings]);

  return (
    <Flex h="100vh" w="100vw" overflow="hidden" bg="white">
      {/* Sidebar with state controls */}
      <Sidebar expanded={sidebarExpanded} />

      {/* Main Content Area */}
      <Flex 
        flex="1" 
        direction="column"
        h="100vh" 
        bg="gray.50" 
        overflowY="auto" 
        position="relative"
      >
        <Flex
          as="header"
          h="52px"
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="white"
          align="center"
          px={4}
          gap={3}
          shrink={0}
        >
          <IconButton
            aria-label="Toggle sidebar"
            icon={<FiMenu size={18} />}
            onClick={() => setSidebarExpanded(e => !e)}
            variant="ghost"
            color="gray.600"
            size="sm"
            _hover={{ bg: "gray.100", color: "gray.800" }}
          />
          <Box as="span" color="gray.800" fontSize="sm" fontWeight="600">
            Takeda Admin Panel
          </Box>
        </Flex>

        <Box flex="1" overflow="auto" position="relative">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
