import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Edit3, ChevronDown, Search,
  X, Check, Clock, AlertTriangle, CheckCircle, Shield,
  User, Calendar, Pill, Activity, Lock, History,
  ChevronRight, Save, AlertCircle
} from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, Badge, Input,
  InputGroup, InputLeftElement, SimpleGrid, VStack,
   IconButton as ChakraIconButton, useToast, Spinner, Center
} from "@chakra-ui/react";
import { trpc } from "../../utils/trpc";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "Submitted" | "In Review" | "Approved" | "Closed" | "Urgent";
type Severity = "Critical" | "High" | "Medium" | "Low";
type ReporterType = "Patient" | "HCP" | "Family";

interface AuditEntry {
  action: string;
  by: string;
  at: string;
  field?: string;
  from?: string;
  to?: string;
}

interface Report {
  id: string;
  originalId?: string;
  drug: string;
  batch: string;
  reporter: string;
  reporterType: ReporterType;
  status: Status;
  severity: Severity;
  submitted: string;
  assignee: string;
  outcome: string;
  description: string;
  audit: AuditEntry[];
}

// -- Replaced mock data with standard TRPC fetch --

// ── Style Config ──────────────────────────────────────────────────────────────
const statusCfg: Record<Status, { bg: string; text: string; border: string; icon: any }> = {
  Urgent:    { bg: "red.50", text: "#CE0037", border: "red.200", icon: AlertTriangle },
  "In Review": { bg: "yellow.50", text: "orange.500", border: "yellow.200", icon: Clock },
  Submitted: { bg: "blue.50", text: "blue.600", border: "blue.200", icon: FileText },
  Approved:  { bg: "green.50", text: "emerald.600", border: "green.200", icon: CheckCircle },
  Closed:    { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", icon: Check },
};

const severityCfg: Record<Severity, { color: string; bg: string }> = {
  Critical: { color: "#CE0037", bg: "red.50" },
  High:     { color: "orange.500", bg: "orange.50" },
  Medium:   { color: "orange.500", bg: "yellow.50" },
  Low:      { color: "emerald.600", bg: "green.50" },
};

const reporterTypeCfg: Record<ReporterType, { color: string; bg: string }> = {
  Patient: { color: "#CE0037", bg: "red.50" },
  HCP:     { color: "purple.600", bg: "purple.50" },
  Family:  { color: "cyan.700", bg: "cyan.50" },
};

const statusOptions: Status[] = ["Submitted", "In Review", "Approved", "Closed", "Urgent"];
const severityOptions: Severity[] = ["Critical", "High", "Medium", "Low"];

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const cfg = statusCfg[status];
  return (
    <Badge
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      bg={cfg.bg}
      color={cfg.text}
      border="1px solid"
      borderColor={cfg.border}
      borderRadius="full"
      px={2.5}
      py={0.5}
      fontSize="2xs"
      fontWeight="bold"
      textTransform="none"
    >
      <cfg.icon size={10} />
      {status}
    </Badge>
  );
}

function SeverityDot({ severity }: { severity: Severity }) {
  const cfg = severityCfg[severity];
  return (
    <Flex align="center" gap={1.5} fontSize="xs" fontWeight="semibold" color={cfg.color}>
      <Box w="6px" h="6px" borderRadius="full" bg={cfg.color} />
      {severity}
    </Flex>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReportManagementPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editData, setEditData] = useState<Partial<Report>>({});
  const [showAudit, setShowAudit] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const toast = useToast();
  const utils = trpc.useContext();
  const { data: generatedReports = [], isLoading, isError } = trpc.admin.getAllReports.useQuery();
  const reportsData = generatedReports as unknown as Report[];

  const updateMutation = trpc.admin.updateReport.useMutation({
    onSuccess: () => {
      utils.admin.getAllReports.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Report updated", status: "success", duration: 3000, isClosable: true });
    },
    onError: (err) => {
      toast({
        title: "Update failed",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  const filtered = reportsData.filter((r) => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.drug.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || 
      (filterStatus === "Urgent" ? r.severity === "Critical" : r.status === filterStatus);
    const matchType = filterType === "All" || r.reporterType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openReport = (r: Report) => {
    setSelectedReport(r);
    setEditData({ status: r.status, severity: r.severity, assignee: r.assignee, description: r.description });
    setMode("view");
    setShowAudit(false);
    setSaved(false);
  };

  const handleSave = () => {
    if (!selectedReport) return;

    const statusMap: Record<Status, ("new" | "under_review" | "approved" | "closed")> = {
      "Submitted": "new",
      "In Review": "under_review",
      "Approved": "approved",
      "Closed": "closed",
      "Urgent": "under_review" // Urgent severity reports are still under review
    };

    const severityMap: Record<Severity, ("info" | "warning" | "urgent")> = {
      "Critical": "urgent",
      "High": "warning",
      "Medium": "info",
      "Low": "info"
    };

    const statusValue = editData.status ? statusMap[editData.status as Status] : undefined;
    const severityValue = editData.severity ? severityMap[editData.severity as Severity] : undefined;

    updateMutation.mutate({
      reportId: selectedReport.originalId ?? selectedReport.id,
      reporterType: selectedReport.reporterType, // "Patient" | "HCP" | "Family"
      updates: {
        status: statusValue,
        severity: severityValue,
        assignee: editData.assignee || undefined,
        adminNotes: editData.description || undefined
      }
    });

    // Optimistically update local view while TRPC invalidates
    setSelectedReport({ ...selectedReport, ...editData as Report });
    setMode("view");
  };

  return (
    <Flex h="100%" direction="column" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif">

      {/* ── Page Header ── */}
      <Box pt={8} px={8}>
        <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} align="flex-start" justify="space-between" mb={6}>
          <Box>
            <Flex align="center" gap={3} mb={1}>
              <FileText size={22} color="#CE0037" />
              <Heading as="h1" size="lg" color="#0f172a" letterSpacing="-0.5px">Report Management</Heading>
            </Flex>
            <Text color="#64748b" fontSize="sm">Review, edit, and update the status of drug safety reports</Text>
          </Box>
          <Flex align="center" gap={2}>
            <Flex align="center" gap={1.5} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" px={3} py={1.5}>
              <Shield size={13} color="#CE0037" />
              <Text fontSize="xs" fontWeight="bold" color="#CE0037">Admin Access</Text>
            </Flex>
            <Flex align="center" gap={1.5} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="md" px={3} py={1.5}>
              <Lock size={13} color="#64748b" />
              <Text fontSize="xs" fontWeight="bold" color="#64748b">All actions logged</Text>
            </Flex>
          </Flex>
        </Flex>

        {/* ── Filters ── */}
        <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} gap={3} mb={5} align="center">
          <Box position="relative" flex={1}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Search size={14} color="#94a3b8" />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, drug name, or reporter..."
                bg="white"
                borderColor="#e2e8f0"
                borderRadius="lg"
                fontSize="sm"
              />
            </InputGroup>
          </Box>

          {/* Status filter */}
          <Flex gap={1} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1}>
            {["All", ...statusOptions].map((s) => (
              <Button
                key={s}
                onClick={() => setFilterStatus(s)}
                variant={filterStatus === s ? "solid" : "ghost"}
                bg={filterStatus === s ? "#CE0037" : "transparent"}
                color={filterStatus === s ? "white" : "#64748b"}
                size="sm"
                borderRadius="md"
                fontSize="xs"
                _hover={filterStatus === s ? {} : { bg: "#f8fafc" }}
              >
                {s}
              </Button>
            ))}
          </Flex>

          {/* Reporter type filter */}
          <Flex gap={1} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1}>
            {["All", "Patient", "HCP", "Family"].map((t) => (
              <Button
                key={t}
                onClick={() => setFilterType(t)}
                variant={filterType === t ? "solid" : "ghost"}
                bg={filterType === t ? "#CE0037" : "transparent"}
                color={filterType === t ? "white" : "#64748b"}
                size="sm"
                borderRadius="md"
                fontSize="xs"
                _hover={filterType === t ? {} : { bg: "#f8fafc" }}
              >
                {t}
              </Button>
            ))}
          </Flex>
        </Flex>
      </Box>

      {/* ── Main Layout ── */}
      <Flex flex={1} px={8} pb={8} minH={0} gap={0}>
        {isLoading ? (
          <Center w="100%" h="100%" flex={1}>
            <VStack gap={4}>
              <Spinner size="xl" color="#CE0037" thickness="4px" />
              <Text color="gray.500" fontWeight="medium">Loading reports...</Text>
            </VStack>
          </Center>
        ) : isError ? (
          <Center w="100%" h="100%" flex={1}>
            <VStack gap={4}>
              <AlertCircle size={40} color="#CE0037" />
              <Text fontSize="lg" fontWeight="bold" color="gray.800">Failed to load reports</Text>
              <Text color="gray.500" fontSize="sm">Please try again later.</Text>
            </VStack>
          </Center>
        ) : (
          <>
            {/* ── Table ── */}
            <Box
          as={motion.div}
          {...({} as any)}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          w={selectedReport ? "420px" : "100%"}
          shrink={0}
          bg="white"
          borderRadius="2xl"
          border="1px solid"
          borderColor="#e2e8f0"
          overflow="hidden"
        >
          {/* Table Header */}
          <SimpleGrid columns={selectedReport ? 1 : 6} gap={0} p="10px 18px" bg="#f8fafc" borderBottom="1px solid" borderColor="#f1f5f9" pt={3} pb={3}
             templateColumns={selectedReport ? "1fr" : "90px 1fr 100px 90px 80px 40px"}
          >
            {selectedReport ? (
                 <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">Selected Reports Match</Text>
            ) : (
                ["Report ID", "Drug / Reporter", "Status", "Severity", "Type", ""].map((h) => (
                  <Text key={h} fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">{h}</Text>
                ))
            )}
            
          </SimpleGrid>

          {/* Rows */}
          <Box overflowY="auto" maxH="calc(100vh - 280px)">
            {filtered.map((r, i) => (
              <SimpleGrid
                as={motion.div}
                key={r.id}
                {...({} as any)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openReport(r)}
                columns={selectedReport ? 1 : 6}
                templateColumns={selectedReport ? "1fr" : "90px 1fr 100px 90px 80px 40px"}
                gap={0}
                p="13px 18px"
                cursor="pointer"
                borderBottom="1px solid"
                borderColor="#f8fafc"
                alignItems="center"
                bg={selectedReport?.id === r.id ? "red.50" : "transparent"}
                borderLeft="3px solid"
                borderLeftColor={selectedReport?.id === r.id ? "#CE0037" : "transparent"}
                _hover={{ bg: selectedReport?.id === r.id ? "red.50" : "#f8fafc" }}
              >
                  {selectedReport ? (
                      <VStack align="flex-start" spacing={1}>
                          <Flex justify="space-between" w="full">
                              <Text fontFamily="monospace" fontSize="xs" fontWeight="bold" color="#CE0037">{r.id}</Text>
                              <StatusBadge status={r.status} />
                          </Flex>
                          <Text fontSize="sm" fontWeight="semibold" color="#0f172a" noOfLines={1}>{r.drug}</Text>
                          <Text fontSize="xs" color="#64748b">{r.reporter} · {r.submitted}</Text>
                      </VStack>
                  ) : (
                    <>
                        <Text fontFamily="monospace" fontSize="xs" fontWeight="bold" color="#CE0037">{r.id}</Text>
                        <Box>
                        <Text m={0} fontSize="sm" fontWeight="semibold" color="#0f172a">{r.drug}</Text>
                        <Text m={0} mt="2px" fontSize="xs" color="#94a3b8">{r.reporter} · {r.submitted}</Text>
                        </Box>
                        <Box><StatusBadge status={r.status} /></Box>
                        <Box><SeverityDot severity={r.severity} /></Box>
                        <Badge
                        bg={reporterTypeCfg[r.reporterType].bg}
                        color={reporterTypeCfg[r.reporterType].color}
                        borderRadius="md"
                        px={2}
                        py={0.5}
                        fontSize="2xs"
                        fontWeight="bold"
                        textTransform="none"
                        >
                        {r.reporterType}
                        </Badge>
                        <ChevronRight size={14} color="#cbd5e1" />
                    </>
                  )}
              </SimpleGrid>
            ))}
          </Box>
        </Box>

        {/* ── Detail Panel ── */}
        <AnimatePresence>
          {selectedReport && (
            <Flex
              as={motion.div}
              {...({} as any)}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              ml={4}
              flex={1}
              bg="white"
              borderRadius="2xl"
              border="1px solid"
              borderColor="#e2e8f0"
              overflow="hidden"
              direction="column"
            >
              {/* Panel Header */}
              <Flex p={4} px={5} borderBottom="1px solid" borderColor="#f1f5f9" align="center" justify="space-between" bg="#f8fafc">
                <Flex align="center" gap={3}>
                  <Text fontFamily="monospace" fontSize="sm" fontWeight="extrabold" color="#CE0037">{selectedReport.id}</Text>
                  <StatusBadge status={selectedReport.status} />
                  {saved && (
                    <Flex
                      as={motion.span}
                      {...({} as any)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      align="center"
                      gap={1}
                      fontSize="xs"
                      color="emerald.600"
                      fontWeight="bold"
                    >
                      <Check size={12} /> Saved
                    </Flex>
                  )}
                </Flex>
                <Flex gap={2}>
                  {mode === "view" ? (
                    <Button
                      as={motion.button}
                      {...({} as any)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode("edit")}
                      bg="#CE0037"
                      color="white"
                      size="sm"
                      leftIcon={<Edit3 size={13} />}
                      _hover={{ bg: "#b3002f" }}
                    >
                      Edit Report
                    </Button>
                  ) : (
                    <>
                      <Button
                        as={motion.button}
                        {...({} as any)}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setMode("view")}
                        variant="solid"
                        bg="#f1f5f9"
                        color="#64748b"
                        size="sm"
                        leftIcon={<X size={13} />}
                        _hover={{ bg: "#e2e8f0" }}
                      >
                        Cancel
                      </Button>
                      <Button
                        as={motion.button}
                        {...({} as any)}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleSave}
                        bg="#CE0037"
                        color="white"
                        size="sm"
                        leftIcon={<Save size={13} />}
                        _hover={{ bg: "emerald.700" }}
                      >
                        Save Changes
                      </Button>
                    </>
                  )}
                  <ChakraIconButton
                    aria-label="Close panel"
                    icon={<X size={14} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedReport(null)}
                    color="#94a3b8"
                  />
                </Flex>
              </Flex>

              <Box flex={1} overflowY="auto" p={5}>
                {/* Security notice in edit mode */}
                <AnimatePresence>
                  {mode === "edit" && (
                    <Flex
                      as={motion.div}
                      {...({} as any)}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      align="flex-start"
                      gap={3}
                      bg="yellow.50"
                      border="1px solid"
                      borderColor="yellow.200"
                      borderRadius="lg"
                      p={3}
                      mb={5}
                    >
                      <AlertCircle size={15} color="#d97706" style={{ marginTop: "2px" }} />
                      <Box>
                        <Text m={0} fontSize="sm" fontWeight="bold" color="yellow.800">Edit Mode — Changes are tracked</Text>
                        <Text m={0} mt={1} fontSize="xs" color="yellow.700">All modifications will be logged in the audit trail with your identity and timestamp.</Text>
                      </Box>
                    </Flex>
                  )}
                </AnimatePresence>

                {/* Report Info Grid */}
                <SimpleGrid columns={2} spacing={3} mb={5}>
                  {[
                    { label: "Drug Name", icon: Pill, value: selectedReport.drug },
                    { label: "Batch Number", icon: FileText, value: selectedReport.batch },
                    { label: "Reporter", icon: User, value: `${selectedReport.reporter} (${selectedReport.reporterType})` },
                    { label: "Submitted", icon: Calendar, value: selectedReport.submitted },
                    { label: "Outcome", icon: Activity, value: selectedReport.outcome },
                    { label: "Assignee", icon: User, value: mode === "edit" ? null : (editData.assignee || selectedReport.assignee) },
                  ].map(({ label, icon: Icon, value }) => (
                    <Box key={label} bg="#f8fafc" borderRadius="xl" p={3} px={4} border="1px solid" borderColor="#f1f5f9">
                      <Flex align="center" gap={2} mb={1.5}>
                        <Icon size={12} color="#94a3b8" />
                        <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">{label}</Text>
                      </Flex>
                      {label === "Assignee" && mode === "edit" ? (
                        <Input
                          value={editData.assignee || ""}
                          onChange={(e) => setEditData({ ...editData, assignee: e.target.value })}
                          size="sm"
                          bg="white"
                          borderColor="#e2e8f0"
                          borderRadius="md"
                        />
                      ) : (
                        <Text fontSize="sm" fontWeight="semibold" color="#0f172a">{value}</Text>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>

                {/* Status + Severity editors */}
                <SimpleGrid columns={2} spacing={3} mb={5}>
                  {/* Status */}
                  <Box bg="#f8fafc" borderRadius="xl" p={3} px={4} border="1px solid" borderColor="#f1f5f9">
                    <Flex align="center" gap={2} mb={2}>
                      <Activity size={12} color="#94a3b8" />
                      <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Status</Text>
                    </Flex>
                    {mode === "edit" ? (
                      <Flex wrap="wrap" gap={1.5}>
                        {statusOptions.map((s) => {
                          const cfg = statusCfg[s];
                          const active = editData.status === s;
                          return (
                            <Button
                              key={s}
                              onClick={() => setEditData({ ...editData, status: s })}
                              size="xs"
                              borderRadius="full"
                              border="1px solid"
                              borderColor={active ? cfg.border : "#e2e8f0"}
                              bg={active ? cfg.bg : "white"}
                              color={active ? cfg.text : "#64748b"}
                              leftIcon={<cfg.icon size={9} />}
                              _hover={active ? {} : { bg: "#f8fafc" }}
                            >
                              {s}
                            </Button>
                          );
                        })}
                      </Flex>
                    ) : (
                      <StatusBadge status={(editData.status || selectedReport.status) as Status} />
                    )}
                  </Box>

                  {/* Severity */}
                  <Box bg="#f8fafc" borderRadius="xl" p={3} px={4} border="1px solid" borderColor="#f1f5f9">
                    <Flex align="center" gap={2} mb={2}>
                      <AlertTriangle size={12} color="#94a3b8" />
                      <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Severity</Text>
                    </Flex>
                    {mode === "edit" ? (
                      <Flex gap={1.5}>
                        {severityOptions.map((s) => {
                          const cfg = severityCfg[s];
                          const active = editData.severity === s;
                          return (
                            <Button
                              key={s}
                              onClick={() => setEditData({ ...editData, severity: s })}
                              size="xs"
                              borderRadius="full"
                              border="1px solid"
                              borderColor={active ? `${cfg.color}44` : "#e2e8f0"}
                              bg={active ? cfg.bg : "white"}
                              color={active ? cfg.color : "#64748b"}
                              _hover={active ? {} : { bg: "#f8fafc" }}
                            >
                              {s}
                            </Button>
                          );
                        })}
                      </Flex>
                    ) : (
                      <SeverityDot severity={(editData.severity || selectedReport.severity) as Severity} />
                    )}
                  </Box>
                </SimpleGrid>

                {/* Description */}
                <Box bg="#f8fafc" borderRadius="xl" p={4} border="1px solid" borderColor="#f1f5f9" mb={5}>
                  <Flex align="center" gap={2} mb={2}>
                    <FileText size={12} color="#94a3b8" />
                    <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Case Description</Text>
                  </Flex>
                  {mode === "edit" ? (
                    <Box
                      as="textarea"
                      value={editData.description || ""}
                      onChange={(e: any) => setEditData({ ...editData, description: e.target.value })}
                      rows={4}
                      w="full"
                      border="1px solid"
                      borderColor="#e2e8f0"
                      borderRadius="md"
                      p={2}
                      fontSize="sm"
                      color="#0f172a"
                      bg="white"
                      style={{ resize: "vertical", outline: "none" }}
                    />
                  ) : (
                    <Text m={0} fontSize="sm" color="#334155" lineHeight="1.7">
                      {editData.description || selectedReport.description}
                    </Text>
                  )}
                </Box>

                {/* Audit Trail */}
                <Box bg="#f8fafc" borderRadius="xl" border="1px solid" borderColor="#f1f5f9" overflow="hidden">
                  <Button
                    onClick={() => setShowAudit((v) => !v)}
                    variant="ghost"
                    w="full"
                    justifyContent="space-between"
                    p={3}
                    px={4}
                    h="auto"
                    _hover={{ bg: "#f1f5f9" }}
                  >
                    <Flex align="center" gap={2}>
                      <History size={13} color="#CE0037" />
                      <Text fontSize="sm" fontWeight="bold" color="#0f172a">Audit Trail</Text>
                      <Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="full" px={2} py={0.5} fontSize="2xs">
                        {selectedReport.audit.length}
                      </Badge>
                    </Flex>
                    <Box as={motion.div} animate={{ rotate: showAudit ? 180 : 0 }} transition={{ duration: 0.2 } as any}>
                      <ChevronDown size={14} color="#94a3b8" />
                    </Box>
                  </Button>

                  <AnimatePresence>
                    {showAudit && (
                      <Box
                        as={motion.div}
                        {...({} as any)}
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        overflow="hidden"
                      >
                        <Box borderTop="1px solid" borderColor="#f1f5f9">
                          {selectedReport.audit.map((entry, i) => (
                            <Flex key={i} gap={3} p={3} px={4} borderBottom={i < selectedReport.audit.length - 1 ? "1px solid" : "none"} borderColor="#f8fafc" align="flex-start">
                              <Flex w="28px" h="28px" borderRadius="full" bg="red.50" border="1px solid" borderColor="red.200" align="center" justify="center" shrink={0} mt="2px">
                                <History size={12} color="#CE0037" />
                              </Flex>
                              <Box flex={1}>
                                <Text m={0} fontSize="sm" fontWeight="bold" color="#0f172a">{entry.action}</Text>
                                {entry.field && (
                                  <Text m={0} mt={1} fontSize="xs" color="#64748b">
                                    <Text as="span" color="#94a3b8">{entry.field}:</Text>{" "}
                                    <Text as="span" textDecoration="line-through" color="red.500">{entry.from}</Text>
                                    {" → "}
                                    <Text as="span" color="emerald.600" fontWeight="bold">{entry.to}</Text>
                                  </Text>
                                )}
                                <Text m={0} mt={1} fontSize="2xs" color="#94a3b8">
                                  by <Text as="strong" color="#64748b">{entry.by}</Text> · {entry.at}
                                </Text>
                              </Box>
                            </Flex>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>
            </Flex>
          )}
        </AnimatePresence>
        </>
        )}
      </Flex>
    </Flex>
  );
}
