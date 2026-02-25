import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiSettings, FiFileText, FiBell, FiLogOut } from "react-icons/fi";
import { Box, Flex, Image, Text, Link } from '@chakra-ui/react';
import { supabase } from "../../utils/supabaseClient";
import { trpc } from "../../utils/trpc";

const navItems = [
  { icon: <FiHome size={18} />, label: "Dashboard", href: "/admin" },
  { icon: <FiFileText size={18} />, label: "Reports", href: "/admin/reports" },
  { icon: <FiBell size={18} />, label: "Notifications", href: "/admin/notifications" },
  { icon: <FiSettings size={18} />, label: "Settings", href: "/admin/settings" },
];

export default function Sidebar({ expanded }: { expanded: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = trpc.admin.getMe.useQuery();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
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
      w={expanded ? "200px" : "64px"}
      transition="width 0.25s cubic-bezier(0.4,0,0.2,1)"
      overflow="hidden"
      bg="white"
      borderRight="1px solid"
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
          shrink={0}
          overflow="hidden"
        >
          <Image
            src="/src/assets/takeda-logo.png"
            alt="Takeda Logo"
            w="24px"
            h="24px"
            objectFit="contain"
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
              title={!expanded ? label : undefined}
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
              {expanded && (
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
          {expanded && (
            <Text as="span" overflow="hidden">
              Logout
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
