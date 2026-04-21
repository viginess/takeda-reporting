import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiSettings, FiFileText, FiBell, FiLogOut, FiActivity, FiPackage, FiUsers } from "react-icons/fi";
import { Box, Flex, Image, Text, Link } from '@chakra-ui/react';
import { supabase } from "../../../utils/config/supabaseClient";
import { trpc } from "../../../utils/config/trpc";
import logo from "../../../assets/logo.jpg";

const navItems = [
  { icon: <FiHome size={18} />, label: "Dashboard", href: "/admin" },
  { icon: <FiFileText size={18} />, label: "Reports", href: "/admin/reports" },
  { icon: <FiBell size={18} />, label: "Notifications", href: "/admin/notifications" },
  { icon: <FiActivity size={18} />, label: "MedDRA Codes", href: "/admin/meddra" },
  { icon: <FiPackage size={18} />, label: "WHODrug Dictionary", href: "/admin/whodrug" },
  { icon: <FiUsers size={18} />, label: "Company Admin", href: "/admin/companies" },
  { icon: <FiSettings size={18} />, label: "Settings", href: "/admin/settings" },
];

interface SidebarProps {
  expanded: boolean;
  isMobile?: boolean;
  onNavClick?: () => void;
}

export default function Sidebar({ expanded, isMobile, onNavClick }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = trpc.admin.getMe.useQuery();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
    if (onNavClick) onNavClick();
  };

  const activeLabel = navItems.find((item) => {
      if (item.href === "/admin") return location.pathname === "/admin";
      return location.pathname.startsWith(item.href);
  })?.label || "Home";

  const filteredNavItems = navItems.filter(item => {
    if (user?.role === "viewer") {
      return item.label === "Dashboard" || item.label === "Reports";
    }
    // Only super_admin and admin see Settings
    if (item.label === "Settings" && user?.role !== "super_admin" && user?.role !== "admin") {
      return false; // Safegaurd
    }
    return true;
  });

  return (
    <Box
      as="aside"
      w={isMobile ? "full" : (expanded ? "200px" : "64px")}
      transition="width 0.25s cubic-bezier(0.4,0,0.2,1)"
      overflow="hidden"
      bg="white"
      borderRight={isMobile ? "none" : "1px solid"}
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      alignItems="center"
      pt={3}
      flexShrink={0}
      h="100%"
      zIndex={10}
    >
      {/* Logo */}
      <Flex 
        w="full" 
        justify={expanded ? "flex-start" : "center"} 
        pl={expanded ? 4 : 0} 
        pb={4} 
        pt={2}
      >
        <Flex
          w="36px"
          h="36px"
          borderRadius="full"
          bg="white"
          boxShadow="sm"
          align="center"
          justify="center"
          flexShrink={0}
          overflow="hidden"
        >
          <Image
            src={logo}
            alt="Clin Solutions L.L.C. Logo"
            w="32px"
            h="32px"
            objectFit="contain"
            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
          />
        </Flex>
      </Flex>

      {/* Nav Items */}
      <Flex as="nav" direction="column" gap={1} w="full" px={2}>
        {filteredNavItems.map(({ icon, label, href }) => {
          const isActive = activeLabel === label;
          return (
            <Link
              as={RouterLink}
              key={label}
              to={href}
              onClick={onNavClick}
              title={!expanded ? label : "Clin Solutions L.L.C. Admin Panel"}
              display="flex"
              alignItems="center"
              justifyContent={expanded ? "flex-start" : "center"}
              gap="10px"
              p="10px"
              borderRadius="md"
              bg={isActive ? "#CE0037" : "transparent"}
              color={isActive ? "white" : "gray.600"}
              fontSize="sm"
              fontWeight={isActive ? "600" : "500"}
              transition="all 0.15s"
              whiteSpace="nowrap"
              w="full"
              _hover={{
                textDecoration: "none",
                bg: isActive ? "#CE0037" : "red.50",
                color: isActive ? "white" : "#E31C5F"
              }}
            >
              <Box as="span" flexShrink={0} display="flex" alignItems="center">
                {icon}
              </Box>
              {(expanded || isMobile) && (
                <Text as="span" overflow="hidden">
                  {label}
                </Text>
              )}
            </Link>
          );
        })}
      </Flex>

      {/* Logout Button */}
      <Box w="full" px={2} pb={4} mt="auto">
        <Flex
          onClick={handleLogout}
          cursor="pointer"
          alignItems="center"
          justifyContent={expanded ? "flex-start" : "center"}
          gap="10px"
          p="10px"
          borderRadius="md"
          color="gray.600"
          fontSize="sm"
          fontWeight="500"
          transition="all 0.15s"
          whiteSpace="nowrap"
          w="full"
          _hover={{
            bg: "red.50",
            color: "#E31C5F"
          }}
        >
          <Box as="span" flexShrink={0} display="flex" alignItems="center">
            <FiLogOut size={18} />
          </Box>
          {(expanded || isMobile) && (
            <Text as="span" overflow="hidden">
              Logout
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
}

