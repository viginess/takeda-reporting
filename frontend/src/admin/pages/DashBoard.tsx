import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, FileText, CheckCircle, Clock, AlertTriangle,
  X, ChevronRight, TrendingUp, MoreHorizontal
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { trpc } from "../../utils/trpc";
import {
  Box, Flex, Text, Heading, Button, IconButton, Badge, SimpleGrid,
  Card, CardBody, HStack, VStack
} from "@chakra-ui/react";

// ── Data ──────────────────────────────────────────────────────────────────────
const stats = [
  { title: "Total Reports", value: 128, icon: FileText, trend: "+12%", color: "#CE0037" },
  { title: "Pending Review", value: 34, icon: Clock, trend: "+4%", color: "#f59e0b" },
  { title: "Approved", value: 76, icon: CheckCircle, trend: "+18%", color: "#10b981" },
  { title: "Urgent Cases", value: 5, icon: AlertTriangle, trend: "+2", color: "#ef4444" },
];

const activities = [
  { message: "Report #124 submitted by Rania K.", time: "2 min ago", type: "submit" },
  { message: "Report #118 approved by admin", time: "10 min ago", type: "approve" },
  { message: "System settings updated", time: "1 hour ago", type: "system" },
  { message: "New admin account created", time: "3 hours ago", type: "account" },
  { message: "Report #112 flagged as urgent", time: "Yesterday", type: "urgent" },
  { message: "Backup completed successfully", time: "Yesterday", type: "system" },
];

const urgentReports = [
  { id: "#U-091", title: "Severe allergic reaction – Amoxicillin", severity: "Critical", assignee: "Rania K.", due: "Today, 3PM" },
  { id: "#U-088", title: "Liver damage reported – Paracetamol overdose", severity: "Critical", assignee: "Marco D.", due: "Today, 5PM" },
  { id: "#U-085", title: "Cardiac event post-medication", severity: "High", assignee: "Selin A.", due: "Tomorrow" },
  { id: "#U-081", title: "Unexpected drug interaction flagged", severity: "High", assignee: "James T.", due: "In 2 days" },
  { id: "#U-079", title: "Batch #RX-442 side effects cluster", severity: "Medium", assignee: "Priya N.", due: "In 3 days" },
];

const severityStyle = {
  Critical: { bg: "red.50", text: "red.600", dot: "red.600" },
  High:     { bg: "orange.50", text: "orange.600", dot: "orange.600" },
  Medium:   { bg: "yellow.50", text: "yellow.600", dot: "yellow.600" },
};

const reportStatusData = [
  { name: "Submitted", value: 40 },
  { name: "In Review", value: 34 },
  { name: "Approved", value: 76 },
  { name: "Closed", value: 18 },
];

const monthlyReports = [
  { month: "Jan", Patient: 12, HCP: 8, Family: 5 },
  { month: "Feb", Patient: 18, HCP: 10, Family: 7 },
  { month: "Mar", Patient: 25, HCP: 15, Family: 9 },
  { month: "Apr", Patient: 20, HCP: 12, Family: 6 },
  { month: "May", Patient: 32, HCP: 20, Family: 11 },
  { month: "Jun", Patient: 21, HCP: 14, Family: 8 },
];



// ── Colors ────────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#CE0037", "#f59e0b", "#10b981", "#64748b"];
const AREA_COLORS = { Patient: "#CE0037", HCP: "#E31C5F", Family: "#f59e0b" };

const activityDot = {
  submit:  "#CE0037",
  approve: "#10b981",
  system:  "#64748b",
  account: "#E31C5F",
  urgent:  "#a1002b",
};

const notifStyle = {
  urgent:  { border: "#a1002b", bg: "red.50", icon: "🔴" },
  info:    { border: "#CE0037", bg: "red.50", icon: "📄" },
  account: { border: "#E31C5F", bg: "purple.50", icon: "👤" },
  warning: { border: "#f59e0b", bg: "yellow.50", icon: "⚠️" },
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="#1e293b" border="1px solid" borderColor="#334155" borderRadius="md" p={3} shadow="md">
      <Text color="#94a3b8" fontSize="sm" mb={1}>{label}</Text>
      {payload.map((p: any) => (
        <Text key={p.dataKey} color={p.color} fontSize="sm" fontWeight="semibold" m={0}>
          {p.dataKey}: {p.value}
        </Text>
      ))}
    </Box>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [notifOpen, setNotifOpen] = useState(false);
  const utils = trpc.useContext();
  const { data: notifications = [] } = trpc.notifications.getAll.useQuery();

  const markReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });
  const markAllReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });

  const markRead = (id: number) => markReadMutation.mutate({ id });
  const markAllRead = () => markAllReadMutation.mutate();

  // Only show unread notifications in the dashboard bell dropdown
  const visibleNotifs = notifications.filter((n) => !n.read);

  return (
    <Box minH="100%" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif" p={8}>

      {/* ── Header ── */}
      <Flex align="flex-start" justify="space-between" mb={7}>
        <Box as={motion.div} {...({} as any)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Heading as="h1" size="lg" color="#0f172a" letterSpacing="-0.5px">Admin Dashboard</Heading>
          <Text color="#64748b" mt={1} fontSize="sm">Overview of reports and system activity</Text>
        </Box>

        {/* Notification Bell */}
        <Box position="relative">
          <Button
            as={motion.button}
            {...({} as any)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen((o) => !o)}
            variant="outline"
            bg="white"
            borderColor="#e2e8f0"
            borderRadius="xl"
            px={4}
            py={2}
            boxShadow="sm"
            leftIcon={<Bell size={17} color="#0f172a" />}
            position="relative"
          >
            <Text fontSize="sm" fontWeight="medium" color="#0f172a" as="span">Notifications</Text>
            {visibleNotifs.length > 0 && (
              <Flex
                position="absolute"
                top="-6px"
                right="-6px"
                bg="#CE0037"
                color="white"
                borderRadius="full"
                w="20px"
                h="20px"
                fontSize="xs"
                fontWeight="bold"
                align="center"
                justify="center"
                border="2px solid"
                borderColor="#f8fafc"
              >
                {visibleNotifs.length}
              </Flex>
            )}
          </Button>

          {/* Dropdown Panel */}
          <AnimatePresence>
            {notifOpen && (
              <Box
                as={motion.div}
                {...({} as any)}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                position="absolute"
                top="calc(100% + 10px)"
                right={0}
                w="340px"
                bg="white"
                border="1px solid"
                borderColor="#e2e8f0"
                borderRadius="2xl"
                boxShadow="xl"
                zIndex={100}
                overflow="hidden"
              >
                <Flex p={4} borderBottom="1px solid" borderColor="#f1f5f9" justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="sm" color="#0f172a">Notifications</Text>
                  <Text fontSize="xs" color="#CE0037" fontWeight="semibold" cursor="pointer" onClick={() => markAllRead()}>
                    Clear all
                  </Text>
                </Flex>

                <Box>
                  {visibleNotifs.length === 0 ? (
                    <Text p={6} textAlign="center" color="#94a3b8" fontSize="sm">All caught up!</Text>
                  ) : (
                    visibleNotifs.map((n) => {
                      const s = notifStyle[n.type as keyof typeof notifStyle] || notifStyle.info;
                      return (
                        <Flex
                          as={motion.div}
                          key={n.id}
                          {...({} as any)}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          p={3}
                          px={4}
                          borderLeft="3px solid"
                          borderLeftColor={s.border}
                          bg={s.bg}
                          borderBottom="1px solid"
                          borderBottomColor="#f1f5f9"
                          align="flex-start"
                          gap={3}
                        >
                          <Text fontSize="lg" mt={1}>{s.icon}</Text>
                          <Box flex={1}>
                            <Text fontWeight="semibold" fontSize="xs" color="#0f172a" m={0}>{n.title}</Text>
                            <Text fontSize="xs" color="#64748b" mt={1} mb={1}>{n.desc}</Text>
                            <Text fontSize="2xs" color="#94a3b8">{n.time}</Text>
                          </Box>
                          <IconButton
                            aria-label="dismiss"
                            icon={<X size={13} />}
                            variant="ghost"
                            size="xs"
                            color="#94a3b8"
                            onClick={() => markRead(n.id)}
                          />
                        </Flex>
                      );
                    })
                  )}
                </Box>
              </Box>
            )}
          </AnimatePresence>
        </Box>
      </Flex>

      {/* ── Stat Cards ── */}
      <SimpleGrid columns={4} spacing={4} mb={6}>
        {stats.map((stat, i) => (
          <Card
            as={motion.div}
            key={stat.title}
            {...({} as any)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}
            borderRadius="2xl"
            variant="outline"
            boxShadow="sm"
          >
            <CardBody p={5}>
              <Flex justify="space-between" align="flex-start" mb={3}>
                <Text fontSize="sm" color="#64748b" fontWeight="medium">{stat.title}</Text>
                <Flex bg={`${stat.color}18`} borderRadius="lg" p={2}>
                  <stat.icon size={16} color={stat.color} />
                </Flex>
              </Flex>
              <Text fontSize="3xl" fontWeight="extrabold" color="#0f172a" letterSpacing="-1px">
                {stat.value}
              </Text>
              <Flex mt={2} align="center" gap={1}>
                <TrendingUp size={12} color={stat.trend.startsWith("+") ? "#10b981" : "#ef4444"} />
                <Text fontSize="xs" color={stat.trend.startsWith("+") ? "emerald.500" : "red.500"} fontWeight="semibold">
                  {stat.trend}
                </Text>
                <Text fontSize="xs" color="#94a3b8">vs last month</Text>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* ── Urgent Reports ── */}
      <Card
        as={motion.div}
        {...({} as any)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        borderRadius="2xl"
        border="1.5px solid"
        borderColor="red.300"
        boxShadow="0 2px 16px 0 rgba(206,0,55,0.10), 0 1px 4px 0 rgba(206,0,55,0.07)"
        mb={6}
        overflow="hidden"
      >
        <Flex p={4} px={5} borderBottom="1px solid" borderColor="red.100" justify="space-between" align="center" bg="red.50">
          <Flex align="center" gap={2}>
            <AlertTriangle size={16} color="#ef4444" />
            <Text fontWeight="bold" fontSize="sm" color="#0f172a">Urgent Reports</Text>
            <Badge bg="red.500" color="white" borderRadius="full" px={2} py={0.5}>{urgentReports.length}</Badge>
          </Flex>
          <Button variant="link" color="#CE0037" fontSize="sm" rightIcon={<ChevronRight size={14} />}>
            View all
          </Button>
        </Flex>
        <Box>
          {urgentReports.map((r, i) => {
            const s = severityStyle[r.severity as keyof typeof severityStyle];
            return (
              <Flex
                as={motion.div}
                key={r.id}
                {...({} as any)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                whileHover={{ background: "#f8fafc" }}
                align="center"
                p={3}
                px={5}
                borderBottom={i < urgentReports.length - 1 ? "1px solid" : "none"}
                borderColor="#f1f5f9"
                gap={4}
                cursor="pointer"
              >
                <Text fontFamily="monospace" fontSize="xs" color="#94a3b8" w="56px" flexShrink={0}>{r.id}</Text>
                <Text flex={1} fontSize="sm" fontWeight="medium" color="#0f172a">{r.title}</Text>
                <Flex bg={s.bg} color={s.text} fontSize="2xs" fontWeight="bold" px={3} py={1} borderRadius="full" align="center" gap={2} flexShrink={0}>
                  <Box w="6px" h="6px" borderRadius="full" bg={s.dot} />
                  {r.severity}
                </Flex>
                <Text fontSize="sm" color="#64748b" w="90px" textAlign="right" flexShrink={0}>{r.assignee}</Text>
                <Text fontSize="xs" color={r.due.includes("Today") ? "red.500" : "#94a3b8"} fontWeight={r.due.includes("Today") ? "semibold" : "normal"} w="90px" textAlign="right" flexShrink={0}>{r.due}</Text>
                <MoreHorizontal size={15} color="#cbd5e1" />
              </Flex>
            );
          })}
        </Box>
      </Card>

      {/* ── Charts Row ── */}
      <SimpleGrid columns={2} spacing={5} mb={6}>
        {/* Monthly Reports Area Chart */}
        <Card
          as={motion.div}
          {...({} as any)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          borderRadius="2xl"
          variant="outline"
          boxShadow="sm"
          overflow="hidden"
        >
          <Flex p={4} px={5} borderBottom="1px solid" borderColor="#f1f5f9" justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="sm" color="#0f172a">Monthly Reports by Form</Text>
            <HStack spacing={3}>
              {Object.entries(AREA_COLORS).map(([key, color]) => (
                <Flex key={key} align="center" gap={1} fontSize="xs" color="#64748b">
                  <Box w="8px" h="8px" borderRadius="full" bg={color} />
                  {key}
                </Flex>
              ))}
            </HStack>
          </Flex>
          <Box p={4} pb={2}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyReports} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  {Object.entries(AREA_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(AREA_COLORS).map(([key, color]) => (
                  <Area key={key} type="monotone" dataKey={key} stroke={color} fill={`url(#grad-${key})`} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: color }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Status Distribution Pie + Bars */}
        <Card
          as={motion.div}
          {...({} as any)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          borderRadius="2xl"
          variant="outline"
          boxShadow="sm"
          overflow="hidden"
        >
          <Box p={4} px={5} borderBottom="1px solid" borderColor="#f1f5f9">
            <Text fontWeight="bold" fontSize="sm" color="#0f172a">Report Status Distribution</Text>
          </Box>
          <Flex p={4} align="center" gap={4}>
            <Box w="50%" h="200px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportStatusData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={46} paddingAngle={3} cx="50%" cy="50%">
                    {reportStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <VStack flex={1} align="stretch" spacing={3}>
              {reportStatusData.map((d, i) => {
                const total = reportStatusData.reduce((s, r) => s + r.value, 0);
                const pct = Math.round((d.value / total) * 100);
                return (
                  <Box key={d.name}>
                    <Flex justify="space-between" mb={1}>
                      <Flex align="center" gap={2} fontSize="xs" color="#334155" fontWeight="medium">
                        <Box w="9px" h="9px" borderRadius="full" bg={PIE_COLORS[i]} />
                        {d.name}
                      </Flex>
                      <Text fontSize="xs" fontWeight="bold" color="#0f172a">
                        {d.value} <Text as="span" color="#94a3b8" fontWeight="normal">({pct}%)</Text>
                      </Text>
                    </Flex>
                    <Box h="5px" bg="#f1f5f9" borderRadius="full" overflow="hidden">
                      <Box
                        as={motion.div}
                        {...({} as any)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
                        h="100%"
                        bg={PIE_COLORS[i]}
                        borderRadius="full"
                      />
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          </Flex>
        </Card>
      </SimpleGrid>

      {/* ── Recent Activity ── */}
      <Card
        as={motion.div}
        {...({} as any)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        borderRadius="2xl"
        variant="outline"
        boxShadow="sm"
        overflow="hidden"
      >
        <Flex p={4} px={5} borderBottom="1px solid" borderColor="#f1f5f9" justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="sm" color="#0f172a">Recent Activity</Text>
          <Button variant="link" color="#CE0037" fontSize="sm" rightIcon={<ChevronRight size={14} />}>
            View all
          </Button>
        </Flex>
        <Box py={1}>
          {activities.map((a, i) => (
            <Flex
              as={motion.div}
              key={i}
              {...({} as any)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              whileHover={{ bg: "#f8fafc" }}
              align="center"
              gap={4}
              p={3}
              px={5}
              borderBottom={i < activities.length - 1 ? "1px solid" : "none"}
              borderColor="#f1f5f9"
            >
              <Box
                w="10px"
                h="10px"
                borderRadius="full"
                flexShrink={0}
                bg={activityDot[a.type as keyof typeof activityDot]}
                boxShadow={`0 0 0 3px ${activityDot[a.type as keyof typeof activityDot]}28`}
              />
              <Text flex={1} m={0} fontSize="sm" color="#0f172a" fontWeight="medium">{a.message}</Text>
              <Text fontSize="xs" color="#94a3b8" flexShrink={0}>{a.time}</Text>
            </Flex>
          ))}
        </Box>
      </Card>
    </Box>
  );
}
