import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/config/supabaseClient';
import { trpc } from '../../../utils/config/trpc';

import Sidebar from './Sidebar';
import { 
  Flex, 
  Box, 
  IconButton, 
  useDisclosure, 
  Drawer, 
  DrawerBody, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerCloseButton,
  useBreakpointValue
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';

export default function AdminLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const { data: systemSettings } = trpc.admin.getSystemSettings.useQuery();

  useEffect(() => {
    // ── Inactivity Auto-Logout ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/admin/login');
      }
    });

    let timeoutId: NodeJS.Timeout;
    const sessionTimeout = systemSettings?.clinicalConfig?.sessionTimeout;

    if (sessionTimeout && sessionTimeout !== "Never") {
      const minutes = parseInt(sessionTimeout);
      if (!isNaN(minutes)) {
        const resetTimer = () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(async () => {
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

  // Handle logout and close drawer if needed
  useEffect(() => {
    onClose();
  }, [navigate, onClose]);

  const handleToggle = () => {
    if (isMobile) {
      onOpen();
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  return (
    <Flex h="100vh" w="100vw" overflow="hidden" bg="white">
      {/* Drawer for Mobile */}
      {isMobile ? (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton zIndex="20" color="gray.500" />
            <DrawerBody p={0}>
              <Sidebar expanded={true} isMobile={true} onNavClick={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : (
        /* Sidebar for Desktop */
        <Sidebar expanded={sidebarExpanded} />
      )}

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
          px={{ base: 3, md: 4 }}
          gap={3}
          flexShrink={0}
        >
          <IconButton
            aria-label="Toggle sidebar"
            icon={<FiMenu size={18} />}
            onClick={handleToggle}
            variant="ghost"
            color="gray.600"
            size="sm"
            _hover={{ bg: "gray.100", color: "gray.800" }}
          />
          <Box as="span" color="gray.800" fontSize={{ base: 'xs', sm: 'sm' }} fontWeight="600" noOfLines={1}>
            Clin Solutions L.L.C. Admin Panel
          </Box>
        </Flex>

        <Box flex="1" overflow="auto" position="relative" p={{ base: 4, md: 6, lg: 8 }}>
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

