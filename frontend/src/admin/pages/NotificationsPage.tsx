import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, AlertTriangle, CheckCircle, Info, Settings,
  Trash2, Check, Filter, Search, X, Clock,
} from "lucide-react";

import { trpc } from "../../utils/trpc";
import {
  Box, Flex, Text, Heading, Button, IconButton, Badge, Input,
  InputGroup, InputLeftElement, InputRightElement, SimpleGrid,
  Spinner,

} from "@chakra-ui/react";



// ── Config ────────────────────────────────────────────────────────────────────
const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  urgent:   { icon: AlertTriangle, color: "#CE0037", bg: "red.50", border: "red.200", label: "Urgent"   },
  warning:  { icon: AlertTriangle, color: "#d97706", bg: "yellow.50", border: "yellow.200", label: "Warning"  },
  approved: { icon: CheckCircle,   color: "#059669", bg: "green.50", border: "green.200", label: "Approved" },
  info:     { icon: Info,          color: "#2563eb", bg: "blue.50", border: "blue.200", label: "Info"     },
  system:   { icon: Settings,      color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "System"   },
};

const filterOptions: { label: string; value: string }[] = [
  { label: "All",      value: "all"      },
  { label: "Urgent",   value: "urgent"   },
  { label: "Warning",  value: "warning"  },
  { label: "Approved", value: "approved" },
  { label: "Info",     value: "info"     },
  { label: "System",   value: "system"   },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const utils = trpc.useContext();
  const { data: notifications = [], isLoading } = trpc.notifications.getAll.useQuery();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const markAllReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });
  const markReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });
  const deleteNotifMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });
  const clearAllMutation = trpc.notifications.clearAll.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });

  const markAllRead = () => markAllReadMutation.mutate();
  const markRead = (id: number) => markReadMutation.mutate({ id });
  const deleteNotif = (id: number) => deleteNotifMutation.mutate({ id });
  const clearAll = () => clearAllMutation.mutate();

  const filtered = notifications.filter((n) => {
    const matchType   = filter === "all" || n.type === filter;
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                        n.desc.toLowerCase().includes(search.toLowerCase());
    const matchUnread = !showUnreadOnly || !n.read;
    return matchType && matchSearch && matchUnread;
  });

  const grouped = filtered.reduce<Record<string, any[]>>((acc, n) => {
    const date = n.date || "Earlier";
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {});

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Box minH="100%" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif" p={8}>

      {/* ── Header ── */}
      <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} align="flex-start" justify="space-between" mb={8}>
        <Box>
          <Flex align="center" gap={3} mb={1}>
            <Bell size={22} color="#CE0037" />
            <Heading as="h1" size="lg" color="#0f172a" letterSpacing="-0.5px">
              Notifications
            </Heading>
            {unreadCount > 0 && (
              <Badge bg="#CE0037" color="white" borderRadius="full" px={3} py={0.5} fontSize="xs" fontWeight="bold">
                {unreadCount} unread
              </Badge>
            )}
          </Flex>
          <Text color="#64748b" fontSize="sm">
            Stay updated on drug reports, urgent cases, and system activity
          </Text>
        </Box>

        <Flex gap={3}>
          <Button
            as={motion.button}
            {...({} as any)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={markAllRead}
            variant="outline"
            bg="white"
            borderColor="#e2e8f0"
            borderRadius="lg"
            leftIcon={<Check size={14} />}
            fontSize="sm"
            color="#334155"
            boxShadow="sm"
          >
            Mark all read
          </Button>
          <Button
            as={motion.button}
            {...({} as any)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearAll}
            variant="outline"
            bg="red.50"
            borderColor="red.200"
            borderRadius="lg"
            leftIcon={<Trash2 size={14} />}
            fontSize="sm"
            color="#CE0037"
            boxShadow="sm"
          >
            Clear all
          </Button>
        </Flex>
      </Flex>

      {/* ── Filters & Search ── */}
      <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} gap={3} mb={6} align="center" wrap="wrap">

        {/* Search */}
        <Box flex={1} minW="220px">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Search size={15} color="#94a3b8" />
            </InputLeftElement>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              bg="white"
              borderColor="#e2e8f0"
              borderRadius="lg"
              boxShadow="sm"
              fontSize="sm"
            />
            {search && (
              <InputRightElement>
                <IconButton
                  aria-label="Clear search"
                  icon={<X size={13} />}
                  size="xs"
                  variant="ghost"
                  color="#94a3b8"
                  onClick={() => setSearch("")}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>

        {/* Type Filter Tabs */}
        <Flex gap={1} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1}>
          {filterOptions.map((f) => (
            <Button
              key={f.value}
              onClick={() => setFilter(f.value)}
              variant={filter === f.value ? "solid" : "ghost"}
              bg={filter === f.value ? "#CE0037" : "transparent"}
              color={filter === f.value ? "white" : "#64748b"}
              size="sm"
              borderRadius="md"
              fontSize="xs"
              _hover={filter === f.value ? {} : { bg: "#f8fafc" }}
            >
              {f.label}
            </Button>
          ))}
        </Flex>

        {/* Unread toggle */}
        <Button
          onClick={() => setShowUnreadOnly((v) => !v)}
          variant="outline"
          bg={showUnreadOnly ? "red.50" : "white"}
          color={showUnreadOnly ? "#CE0037" : "#64748b"}
          borderColor="#e2e8f0"
          borderRadius="lg"
          leftIcon={<Filter size={13} />}
          size="sm"
          boxShadow="sm"
        >
          Unread only
        </Button>
      </Flex>

      {/* ── Summary Stats ── */}
      <SimpleGrid
        as={motion.div}
        {...({} as any)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        columns={5}
        spacing={3}
        mb={8}
      >
        {(["urgent", "warning", "approved", "info", "system"]).map((type) => {
          const cfg = typeConfig[type];
          const count = notifications.filter((n) => n.type === type).length;
          const unread = notifications.filter((n) => n.type === type && !n.read).length;
          return (
            <Box
              as={motion.div}
              {...({} as any)}
              key={type}
              whileHover={{ y: -2 }}
              onClick={() => setFilter(filter === type ? "all" : type)}
              bg={filter === type ? cfg.bg : "white"}
              border="1px solid"
              borderColor={filter === type ? cfg.border : "#e2e8f0"}
              borderRadius="xl"
              p={4}
              cursor="pointer"
              boxShadow="sm"
              transition="all 0.15s"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <cfg.icon size={15} color={cfg.color} />
                {unread > 0 && (
                  <Badge bg={cfg.color} color="white" borderRadius="full" px={2} py={0.5} fontSize="2xs">
                    {unread}
                  </Badge>
                )}
              </Flex>
              <Text fontSize="2xl" fontWeight="extrabold" color="#0f172a" letterSpacing="-0.5px">
                {count}
              </Text>
              <Text fontSize="xs" color="#64748b" fontWeight="medium" mt={1}>
                {cfg.label}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* ── Notification List ── */}
      {isLoading ? (
        <Flex justify="center" align="center" py={16}>
          <Spinner color="#CE0037" size="xl" />
        </Flex>
      ) : Object.keys(grouped).length === 0 ? (
        <Flex
          as={motion.div}
          {...({} as any)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          direction="column"
          align="center"
          justify="center"
          py={16}
          color="#94a3b8"
        >
          <Bell size={40} color="#e2e8f0" style={{ marginBottom: "12px" }} />
          <Text fontSize="md" fontWeight="bold" color="#64748b" mb={1}>No notifications found</Text>
          <Text fontSize="sm">Try changing your filters or search query</Text>
        </Flex>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <Box key={date} mb={7}>
            {/* Date group header */}
            <Flex align="center" gap={3} mb={4}>
              <Clock size={13} color="#94a3b8" />
              <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.08em">
                {date}
              </Text>
              <Box flex={1} h="1px" bg="#f1f5f9" />
              <Text fontSize="xs" color="#cbd5e1">
                {items.length} notification{items.length > 1 ? "s" : ""}
              </Text>
            </Flex>

            {/* Cards */}
            <Flex direction="column" gap={2}>
              <AnimatePresence>
                {items.map((n, i) => {
                  const cfg = typeConfig[n.type];
                  return (
                    <Flex
                      as={motion.div}
                      {...({} as any)}
                      key={n.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                      onClick={() => markRead(n.id)}
                      align="flex-start"
                      gap={4}
                      bg={n.read ? "white" : cfg.bg}
                      border="1px solid"
                      borderColor={n.read ? "#f1f5f9" : cfg.border}
                      borderLeft="4px solid"
                      borderLeftColor={n.read ? "#e2e8f0" : cfg.color}
                      borderRadius="xl"
                      p={4}
                      cursor="pointer"
                      boxShadow={n.read ? "none" : "sm"}
                      whileHover={{ y: -1, boxShadow: "md" }}
                    >
                      {/* Icon */}
                      <Flex
                        w="36px"
                        h="36px"
                        borderRadius="lg"
                        shrink={0}
                        bg={n.read ? "#f8fafc" : cfg.bg}
                        border="1px solid"
                        borderColor={n.read ? "#e2e8f0" : cfg.border}
                        align="center"
                        justify="center"
                      >
                        <cfg.icon size={16} color={cfg.color} />
                      </Flex>

                      {/* Content */}
                      <Box flex={1} minW={0}>
                        <Flex align="flex-start" justify="space-between" gap={3} mb={1}>
                          <Text fontSize="sm" fontWeight={n.read ? "medium" : "bold"} color="#0f172a" lineHeight="1.4">
                            {n.title}
                          </Text>
                          <Flex align="center" gap={2} shrink={0}>
                            <Text fontSize="xs" color="#94a3b8" whiteSpace="nowrap">{n.time}</Text>
                            {!n.read && (
                              <Box w="8px" h="8px" borderRadius="full" bg={cfg.color} flexShrink={0} />
                            )}
                          </Flex>
                        </Flex>
                        <Text fontSize="sm" color="#64748b" lineHeight="1.5" mb={2}>
                          {n.desc}
                        </Text>
                        <Flex align="center" gap={2}>
                          <Badge bg={cfg.bg} color={cfg.color} border="1px solid" borderColor={cfg.border} borderRadius="md" px={2} py={0.5} fontSize="2xs">
                            {cfg.label}
                          </Badge>
                          {n.reportId && (
                            <Text fontSize="xs" color="#94a3b8" fontFamily="monospace">{n.reportId}</Text>
                          )}
                        </Flex>
                      </Box>

                      {/* Delete */}
                      <IconButton
                        as={motion.button}
                        {...({} as any)}
                        aria-label="Delete notification"
                        icon={<X size={14} />}
                        whileHover={{ scale: 1.1, color: "#CE0037" }}
                        variant="ghost"
                        size="xs"
                        color="#94a3b8"
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                      />
                    </Flex>
                  );
                })}
              </AnimatePresence>
            </Flex>
          </Box>
        ))
      )}
    </Box>
  );
}
