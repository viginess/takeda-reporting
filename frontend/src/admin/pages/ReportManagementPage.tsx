import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Edit3, ChevronDown, Search,
  Plus,
  X, AlertTriangle, User, Calendar, Activity,
  Save, AlertCircle,
  Clock,
  CheckCircle,
  Check,
  History,
  DownloadCloud,
  FileCode
} from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, Badge, Input,
  InputGroup, InputLeftElement, SimpleGrid, VStack,
   IconButton as ChakraIconButton, useToast, Center,
   Image, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure,
   Checkbox, Skeleton
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
  description: string;
  adminNotes?: string | null;
  audit: AuditEntry[];
  fullDetails?: any;
}



// ── Style Config ──────────────────────────────────────────────────────────────
const statusCfg: Record<Status, { bg: string; text: string; border: string; icon: any }> = {
  Urgent:    { bg: "red.50", text: "#1e293b", border: "red.200", icon: AlertTriangle },
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

// ── MedDRA Types ──────────────────────────────────────────────────────────────
interface MedDRATerm {
  term: string;
  code: string | null;
  description?: string;
  type?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPrimitive(val: any) {
  return typeof val === "string" || typeof val === "number" || typeof val === "boolean";
}

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

// ── Improved DataDisplay ──────────────────────────────────────────────────────
const DataDisplay = ({ data, depth = 0 }: { data: any; depth?: number }): any => {
  if (data === null || data === undefined) return null;

  // Primitive leaf value
  if (isPrimitive(data)) {
    const str = data.toString();
    // Check for base64 image or data URL
    if (typeof data === "string" && (data.startsWith("data:image/") || (data.length > 50 && data.includes(";base64,")))) {
      return (
        <Box 
          mt={2} 
          borderRadius="lg" 
          overflow="hidden" 
          border="1px solid" 
          borderColor="#e2e8f0" 
          maxW="400px" 
          boxShadow="sm"
          cursor="zoom-in"
          transition="all 0.2s"
          _hover={{ transform: "scale(1.01)", borderColor: "#CE0037" }}
          onClick={() => {
            // We'll pass a global handler or use a Custom Event if needed, 
            // but for simplicity, let's look for the state in context or pass it down.
            // Since DataDisplay is a recursive component, let's use a window event 
            // or just rely on the parent having a global ImageZoom handler.
            (window as any).__zoomImage?.(data);
          }}
        >
          <Image
              src={data}
              alt="Attachment Preview"
              w="100%"
              h="auto"
              display="block"
              fallback={<Text fontSize="xs" color="gray.500" p={2}>Unable to load image preview</Text>}
            />
        </Box>
      );
    } 
    return (
      <Text as="span" fontSize="sm" color="#0f172a" fontWeight="500">
        {str}
      </Text>
    );
  }

  // Array
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    const allPrimitive = data.every(isPrimitive);
    if (allPrimitive) {
      // Check if any item looks like a base64 image
      const hasImages = data.some(item => typeof item === "string" && (item.startsWith("data:image/") || (item.length > 50 && item.includes(";base64,"))));
      
      if (hasImages) {
        return (
          <Flex wrap="wrap" gap={3} mt={2}>
            {data.map((item, i) => (
              <DataDisplay key={i} data={item} depth={depth + 1} />
            ))}
          </Flex>
        );
      }

      // Render as pill-badges for normal text
      return (
        <Flex wrap="wrap" gap={1.5} mt={1}>
          {data.map((item, i) => (
            <Badge
              key={i}
              bg="#f1f5f9"
              color="#334155"
              borderRadius="md"
              px={2}
              py={0.5}
              fontSize="xs"
              fontWeight="medium"
              textTransform="none"
              border="1px solid #e2e8f0"
            >
              {item.toString()}
            </Badge>
          ))}
        </Flex>
      );
    }
    // Array of objects/arrays — numbered cards
    return (
      <VStack align="stretch" spacing={2} mt={2} w="full">
        {data.map((item, i) => (
          <Box
            key={i}
            bg="white"
            borderRadius="lg"
            p={3}
            border="1px solid #e2e8f0"
            borderLeft="3px solid #CE0037"
          >
            {data.length > 1 && (
              <Text fontSize="2xs" color="#CE0037" fontWeight="800" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
                Entry {i + 1}
              </Text>
            )}
            <DataDisplay data={item} depth={depth + 1} />
          </Box>
        ))}
      </VStack>
    );
  }

  // Object
  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data).filter((k) => {
      const v = data[k];
      return (
        v !== null &&
        v !== undefined &&
        v !== "" &&
        k !== "xmlUrl" &&
        k !== "pdfUrl" &&
        !(Array.isArray(v) && v.length === 0) &&
        !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
      );
    });

    const flatKeys = keys.filter((k) => isPrimitive(data[k]));
    const nestedKeys = keys.filter((k) => !isPrimitive(data[k]));

    return (
      <VStack align="stretch" spacing={0} w="full">
        {/* Flat primitive fields — clean 2-column label/value grid */}
        {flatKeys.length > 0 && (
          <SimpleGrid
            columns={2}
            spacing={0}
            mb={nestedKeys.length > 0 ? 4 : 0}
          >
            {flatKeys.map((key) => (
              <Box
                key={key}
                py={2.5}
                pr={4}
                borderBottom="1px solid #f1f5f9"
              >
                <Text
                  fontSize="2xs"
                  color="#94a3b8"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.06em"
                  mb={0.5}
                >
                  {formatKey(key)}
                </Text>
                <DataDisplay data={data[key]} depth={depth + 1} />
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* Nested fields — labeled expandable sections */}
        {nestedKeys.map((key) => (
          <Box key={key} mb={4}>
            {/* Section header with red accent bar */}
            <Flex align="center" gap={2} mb={2.5}>
              <Box w="3px" h="14px" bg="#CE0037" borderRadius="full" flexShrink={0} />
              <Text
                fontSize="xs"
                color="#475569"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.07em"
              >
                {formatKey(key)}
              </Text>
              <Box flex={1} h="1px" bg="#f1f5f9" />
            </Flex>
            {/* Indented content */}
            <Box pl={4} borderLeft="2px solid #f1f5f9">
              <DataDisplay data={data[key]} depth={depth + 1} />
            </Box>
          </Box>
        ))}
      </VStack>
    );
  }

  return null;
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReportManagementPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editData, setEditData] = useState<{ status?: Status; severity?: Severity; adminNotes: string }>({ adminNotes: "" });
  const [showAudit, setShowAudit] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [downloadingXml, setDownloadingXml] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounting(false), 700);
    return () => clearTimeout(timer);
  }, []);
  
  // MedDRA Coding State
  const { 
    isOpen: isCodingOpen, 
    onOpen: onCodingOpen, 
    onClose: onCodingClose 
  } = useDisclosure();
  const [meddraQuery, setMeddraQuery] = useState("");
  const [codingSymptomIndex, setCodingSymptomIndex] = useState<number | null>(null);

  const { data: meddraResults, isLoading: searchingMeddra } = trpc.reference.searchMeddra.useQuery(
    { query: meddraQuery },
    { enabled: meddraQuery.length >= 2 }
  );
  const [saved, setSaved] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const { isOpen: isZoomOpen, onOpen: onZoomOpen, onClose: onZoomClose } = useDisclosure();
  const [zoomedImage, setZoomedImage] = useState("");

  // Global handler for DataDisplay to trigger zoom
  (window as any).__zoomImage = (src: string) => {
    setZoomedImage(src);
    onZoomOpen();
  };
  
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
    const matchSearch = (r.originalId || r.id).toLowerCase().includes(search.toLowerCase()) ||
      r.drug.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || 
      (filterStatus === "Urgent" ? r.severity === "Critical" : r.status === filterStatus);
    const matchType = filterType === "All" || r.reporterType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openReport = (r: Report) => {
    setSelectedReport(r);
    setEditData({ 
      status: r.status, 
      severity: r.severity, 
      adminNotes: r.adminNotes || "" 
    });
    setMode("view");
    setShowAudit(false);
    setShowFullDetails(true);
    setSaved(false);
  };

  const toggleSelectAll = () => {
    if (selectedReportIds.length === filtered.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(filtered.map(r => r.originalId || r.id));
    }
  };

  const toggleSelectReport = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedReportIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!selectedReport) return;

    const statusMap: Record<Status, ("new" | "under_review" | "approved" | "closed")> = {
      "Submitted": "new",
      "In Review": "under_review",
      "Approved": "approved",
      "Closed": "closed",
      "Urgent": "under_review"
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
      reporterType: selectedReport.reporterType,
      updates: {
        status: statusValue,
        severity: severityValue,
        adminNotes: editData.adminNotes
      }
    });

    setSelectedReport({ ...selectedReport, ...editData as Report });
    setMode("view");
  };

  const pdfMutation = trpc.admin.getReportPDF.useMutation();
  const xmlMutation = trpc.admin.getReportXML.useMutation();
  const bulkMutation = trpc.admin.getBulkReports.useMutation();

  const handleDownloadPdf = async (report: Report) => {
    setDownloadingPdf(true);
    try {
      const res = await pdfMutation.mutateAsync({ 
        reportId: report.originalId || report.id, 
        reporterType: report.reporterType 
      });
      if (res.url) {
        const link = document.createElement('a');
        link.href = res.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      toast({ title: "PDF Generation Failed", description: err.message, status: "error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadXml = async (report: Report) => {
    setDownloadingXml(true);
    try {
      const res = await xmlMutation.mutateAsync({ 
        reportId: report.originalId || report.id, 
        reporterType: report.reporterType 
      });
      if (res.url) {
        const link = document.createElement('a');
        link.href = res.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      toast({ title: "XML Retrieval Failed", description: err.message, status: "error" });
    } finally {
      setDownloadingXml(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedReportIds.length === 0) return;
    setDownloadingBulk(true);
    try {
      const reportItems = selectedReportIds.map(id => {
        const r = reportsData.find(rep => (rep.originalId || rep.id) === id);
        return { reportId: r!.originalId || r!.id, reporterType: r!.reporterType };
      });

      const res = await bulkMutation.mutateAsync({ reports: reportItems });
      if (res.url) {
        const link = document.createElement('a');
        link.href = res.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSelectedReportIds([]);
        toast({ title: "Bulk download complete", status: "success" });
      }
    } catch (err: any) {
      toast({ title: "Bulk download failed", description: err.message, status: "error" });
    } finally {
      setDownloadingBulk(false);
    }
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
        {isLoading || isMounting ? (
          <Box w="full" bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="#e2e8f0">
             <VStack align="stretch" spacing={5}>
                <Skeleton h="40px" w="200px" borderRadius="md" mb={2} />
                <Flex gap={4} mb={4}>
                   <Skeleton h="40px" flex={1} borderRadius="lg" />
                   <Skeleton h="40px" w="150px" borderRadius="lg" />
                   <Skeleton h="40px" w="150px" borderRadius="lg" />
                </Flex>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Flex key={i} gap={6} align="center" py={2} borderBottom="1px solid" borderColor="#f1f5f9">
                    <Skeleton h="20px" w="80px" />
                    <Skeleton h="20px" flex={1} />
                    <Skeleton h="20px" w="100px" />
                    <Skeleton h="20px" w="80px" />
                    <Skeleton h="20px" w="60px" />
                  </Flex>
                ))}
             </VStack>
          </Box>
        ) : isError ? (
          <Center w="100%" h="100%" flex={1}>
            <VStack gap={4}>
              <AlertCircle size={40} color="#1e293b" />
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
          flexShrink={0}
          bg="white"
          borderRadius="2xl"
          border="1px solid"
          borderColor="#e2e8f0"
          overflow="hidden"
        >
          {/* Table Header */}
          <SimpleGrid columns={selectedReport ? 1 : 6} gap={0} p="10px 18px" bg="#f8fafc" borderBottom="1px solid" borderColor="#f1f5f9" pt={3} pb={3}
             templateColumns={selectedReport ? "1fr" : "40px 90px 1fr 100px 90px 80px"}
          >
            {selectedReport ? (
                 <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">Selected Reports Match</Text>
            ) : (
                <>
                  <Box pl={1}>
                    <Checkbox 
                      colorScheme="red" 
                      isChecked={filtered.length > 0 && selectedReportIds.length === filtered.length}
                      isIndeterminate={selectedReportIds.length > 0 && selectedReportIds.length < filtered.length}
                      onChange={toggleSelectAll}
                    />
                  </Box>
                  {["Report ID", "Drug / Reporter", "Status", "Severity", "Type"].map((h) => (
                    <Text key={h} fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">{h}</Text>
                  ))}
                </>
            )}
            
          </SimpleGrid>

          {/* Rows */}
          <Box overflowY="auto" maxH="calc(100vh - 280px)">
            {filtered.map((r, i) => (
              <SimpleGrid
                as={motion.div}
                key={r.originalId || r.id}
                {...({} as any)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openReport(r)}
                columns={selectedReport ? 1 : 6}
                templateColumns={selectedReport ? "1fr" : "40px 90px 1fr 100px 90px 80px"}
                gap={0}
                p="13px 18px"
                cursor="pointer"
                borderBottom="1px solid"
                borderColor="#f8fafc"
                alignItems="center"
                bg={selectedReport?.originalId === (r.originalId || r.id) || selectedReportIds.includes(r.originalId || r.id) ? "red.50" : "transparent"}
                borderLeft="3px solid"
                borderLeftColor={selectedReport?.originalId === (r.originalId || r.id) ? "#CE0037" : "transparent"}
                _hover={{ bg: selectedReport?.originalId === (r.originalId || r.id) || selectedReportIds.includes(r.originalId || r.id) ? "red.50" : "#f8fafc" }}
              >
                  {!selectedReport && (
                    <Box pl={1} onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        colorScheme="red" 
                        isChecked={selectedReportIds.includes(r.originalId || r.id)}
                        onChange={(e) => toggleSelectReport(r.originalId || r.id, e)}
                      />
                    </Box>
                  )}
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
                    <>
                      <Button
                        onClick={() => handleDownloadXml(selectedReport)}
                        variant="outline"
                        colorScheme="blue"
                        size="sm"
                        leftIcon={<FileCode size={13} />}
                        isLoading={downloadingXml}
                      >
                        XML
                      </Button>
                      <Button
                        onClick={() => handleDownloadPdf(selectedReport)}
                        variant="outline"
                        colorScheme="blue"
                        size="sm"
                        leftIcon={<DownloadCloud size={13} />}
                        isLoading={downloadingPdf}
                      >
                        PDF
                      </Button>
                      <Box w="1px" h="20px" bg="#e2e8f0" mx={1} alignSelf="center" />
                      {!selectedReport.adminNotes && (
                        <Button
                          as={motion.button}
                          {...({} as any)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setMode("edit")}
                          variant="ghost"
                          color="#64748b"
                          size="sm"
                          leftIcon={<Plus size={14} color="#CE0037" />}
                          _hover={{ bg: "#f1f5f9" }}
                        >
                          Add Note
                        </Button>
                      )}
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
                    </>
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
                    { label: "Reporter", icon: User, value: `${selectedReport.reporter} (${selectedReport.reporterType})` },
                    { label: "Submitted", icon: Calendar, value: selectedReport.submitted },
                  ].map(({ label, icon: Icon, value }) => (
                    <Box key={label} bg="#f8fafc" borderRadius="xl" p={3} px={4} border="1px solid" borderColor="#f1f5f9">
                      <Flex align="center" gap={2} mb={1.5}>
                        <Icon size={12} color="#94a3b8" />
                        <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">{label}</Text>
                      </Flex>
                      <Text fontSize="sm" fontWeight="semibold" color="#0f172a">{value}</Text>
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

                {/* Medical Coding Section */}
                {selectedReport.fullDetails?.symptoms?.length > 0 && (
                  <Box mb={5} bg="red.50" borderRadius="xl" p={4} border="1px solid" borderColor="red.100">
                    <Flex align="center" gap={2} mb={3}>
                      <Activity size={13} color="#CE0037" />
                      <Text fontSize="xs" color="#CE0037" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">Medical Coding</Text>
                    </Flex>
                    <VStack align="stretch" spacing={2.5}>
                      {selectedReport.fullDetails.symptoms.map((s: any, idx: number) => (
                        <Flex key={idx} justify="space-between" align="center" bg="white" p={2.5} borderRadius="lg" border="1px solid" borderColor="red.100">
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color="#1e293b" noOfLines={1}>
                              {s.name || s.symptom || "Unknown Symptom"}
                            </Text>
                            {s.meddraCode ? (
                              <Text fontSize="2xs" color="emerald.600" fontWeight="bold">Mapped: {s.meddraCode}</Text>
                            ) : (
                              <Text fontSize="2xs" color="#94a3b8">Uncoded</Text>
                            )}
                          </Box>
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            colorScheme="red" 
                            fontSize="2xs"
                            onClick={() => {
                              setCodingSymptomIndex(idx);
                              onCodingOpen();
                            }}
                            leftIcon={<Plus size={10} />}
                          >
                            {s.meddraCode ? "Remap" : "Code"}
                          </Button>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Admin Notes Section */}
                {(mode === "edit" || selectedReport.adminNotes) && (
                  <Box mb={5}>
                    <Flex align="center" gap={2} mb={2}>
                      <Edit3 size={12} color="#94a3b8" />
                      <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Admin Internal Notes</Text>
                    </Flex>
                    {mode === "edit" ? (
                      <Box>
                        <Input
                          as="textarea"
                          value={editData.adminNotes}
                          onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                          placeholder="Add internal notes about this report (visible only to admins)..."
                          size="sm"
                          minH="100px"
                          py={3}
                          bg="white"
                          borderColor="#e2e8f0"
                          borderRadius="xl"
                          fontSize="sm"
                          _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" } as any}
                        />
                      </Box>
                    ) : (
                      <Box bg="#f8fafc" borderRadius="xl" p={4} border="1px solid" borderColor="#f1f5f9" position="relative">
                        <Text fontSize="sm" color="#0f172a" lineHeight="tall">
                          {selectedReport.adminNotes}
                        </Text>
                        <ChakraIconButton
                            aria-label="Edit notes"
                            icon={<Edit3 size={11} />}
                            size="xs"
                            variant="ghost"
                            position="absolute"
                            top={2}
                            right={2}
                            color="#94a3b8"
                            onClick={() => setMode("edit")}
                        />
                      </Box>
                    )}
                  </Box>
                )}


                {/* ── Full Form Details — improved ── */}
                {selectedReport.fullDetails && (
                  <Box
                    bg="white"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="#e2e8f0"
                    mb={5}
                    overflow="hidden"
                    boxShadow="0 1px 3px rgba(0,0,0,0.04)"
                  >
                    {/* Collapsible Header */}
                    <Button
                      onClick={() => setShowFullDetails((v) => !v)}
                      variant="ghost"
                      w="full"
                      justifyContent="space-between"
                      p={3}
                      px={5}
                      h="auto"
                      bg={showFullDetails ? "white" : "#f8fafc"}
                      borderBottom={showFullDetails ? "1px solid #f1f5f9" : "none"}
                      borderRadius="none"
                      _hover={{ bg: "#f8fafc" }}
                    >
                      <Flex align="center" gap={2.5}>
                        <Flex
                          w="22px"
                          h="22px"
                          borderRadius="md"
                          bg="red.50"
                          align="center"
                          justify="center"
                          border="1px solid"
                          borderColor="red.100"
                        >
                          <FileText size={11} color="#CE0037" />
                        </Flex>
                        <Text fontSize="sm" fontWeight="700" color="#0f172a">Full Form Details</Text>
                        <Badge
                          bg="#f1f5f9"
                          color="#64748b"
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          fontSize="2xs"
                          fontWeight="bold"
                          textTransform="none"
                        >
                          {Object.keys(selectedReport.fullDetails).length} sections
                        </Badge>
                      </Flex>
                      <Box
                        as={motion.div}
                        animate={{ rotate: showFullDetails ? 180 : 0 }}
                        transition={{ duration: 0.2 } as any}
                      >
                        <ChevronDown size={14} color="#94a3b8" />
                      </Box>
                    </Button>

                    <AnimatePresence>
                      {showFullDetails && (
                        <Box
                          as={motion.div}
                          {...({} as any)}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          overflow="hidden"
                        >
                          <Box p={5}>
                            <DataDisplay data={selectedReport.fullDetails} depth={0} />
                          </Box>
                        </Box>
                      )}
                    </AnimatePresence>
                  </Box>
                )}

                {/* Audit Trail */}
                <Box bg="#f8fafc" borderRadius="xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden">
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
                              <Flex w="28px" h="28px" borderRadius="full" bg="red.50" border="1px solid" borderColor="red.200" align="center" justify="center" flexShrink={0} mt="2px">
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

      {/* ── MedDRA Coding Modal ── */}
      <Modal isOpen={isCodingOpen} onClose={onCodingClose} size="xl">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="2xl" p={2}>
          <ModalCloseButton mt={2} mr={2} />
          <ModalBody p={5}>
            <Heading size="md" mb={1} color="#1e293b">Medical Coding (MedDRA)</Heading>
            <Text fontSize="sm" color="#64748b" mb={6}>
              Map the reported symptom to an official MedDRA term.
            </Text>

            {codingSymptomIndex !== null && selectedReport?.fullDetails?.symptoms?.[codingSymptomIndex] && (
               <Box bg="#f8fafc" p={4} borderRadius="xl" border="1px solid" borderColor="#e2e8f0" mb={6}>
                 <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={1}>Reported Symptom</Text>
                 <Text fontWeight="700" color="#0f172a">
                    {selectedReport.fullDetails.symptoms[codingSymptomIndex].name || 
                     selectedReport.fullDetails.symptoms[codingSymptomIndex].symptom || "Unknown"}
                 </Text>
                 {selectedReport.fullDetails.symptoms[codingSymptomIndex].meddraCode && (
                    <Badge mt={2} colorScheme="green" variant="subtle" borderRadius="md">
                      Current Code: {selectedReport.fullDetails.symptoms[codingSymptomIndex].meddraCode}
                    </Badge>
                 )}
               </Box>
            )}

            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Search size={18} color="#94a3b8" />
              </InputLeftElement>
              <Input 
                placeholder="Search MedDRA (e.g. Headache, Nausea...)" 
                value={meddraQuery}
                onChange={(e) => {
                  const val = e.target.value.replace(/"/g, ''); // Remove auto-quotes
                  setMeddraQuery(val);
                }}
                borderRadius="xl"
                border="2px solid"
                borderColor="#f1f5f9"
                _focus={{ borderColor: "#CE0037", boxShadow: "none" }}
              />
            </InputGroup>

            <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto" pr={2}>
              {searchingMeddra && (
                <VStack spacing={2} align="stretch" py={2}>
                  {[1, 2, 3].map(i => <Skeleton key={i} h="40px" borderRadius="xl" />)}
                </VStack>
              )}
              
              {meddraResults?.map((term: MedDRATerm) => (
                <Box 
                  key={term.code}
                  p={3}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="#f1f5f9"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ bg: "red.50", borderColor: "red.100" }}
                  onClick={async () => {
                    if (codingSymptomIndex === null || !selectedReport) return;
                    
                    const updatedSymptoms = [...selectedReport.fullDetails.symptoms];
                    updatedSymptoms[codingSymptomIndex] = {
                      ...updatedSymptoms[codingSymptomIndex],
                      meddraCode: term.code,
                      meddraTerm: term.term
                    };

                    try {
                      await updateMutation.mutateAsync({
                        reportId: selectedReport.originalId!,
                        reporterType: selectedReport.reporterType,
                        updates: {
                          symptoms: updatedSymptoms
                        }
                      });
                      
                      toast({ title: "Symptom Coded", status: "success" });
                      
                      // Update local state for immediate feedback
                      if (selectedReport) {
                        setSelectedReport({
                          ...selectedReport,
                          fullDetails: {
                            ...selectedReport.fullDetails,
                            symptoms: updatedSymptoms
                          }
                        });
                      }
                      
                      onCodingClose();
                    } catch (err: any) {
                      toast({ title: "Coding Failed", description: err.message, status: "error" });
                    }
                  }}
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color="#1e293b">{term.term}</Text>
                      <Text fontSize="xs" color="#64748b">{term.description || "No description"}</Text>
                    </Box>
                    {term.code ? (
                      <Badge colorScheme="red" variant="outline" fontSize="2xs">{term.code}</Badge>
                    ) : (
                      <Badge colorScheme="gray" variant="solid" fontSize="2xs">Uncoded Term</Badge>
                    )}
                  </Flex>
                </Box>
              ))}

              {!searchingMeddra && meddraQuery.length >= 2 && meddraResults?.length === 0 && (
                <Center py={8} flexDirection="column" gap={2}>
                  <AlertCircle size={24} color="#94a3b8" />
                  <Text color="#94a3b8" fontSize="sm">No matching MedDRA terms found</Text>
                </Center>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Image Zoom Modal ── */}
      <Modal isOpen={isZoomOpen} onClose={onZoomClose} size="full">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" zIndex={2} />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0} onClick={onZoomClose}>
            <Center w="full" h="full">
               <Image 
                src={zoomedImage} 
                maxH="90vh" 
                maxW="90vw" 
                objectFit="contain" 
                borderRadius="lg"
                boxShadow="2xl"
                onClick={(e) => e.stopPropagation()} // Prevent close on image click
               />
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Bulk Action Toolbar ── */}
      <AnimatePresence>
        {selectedReportIds.length > 0 && (
          <Box
            as={motion.div}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            position="fixed"
            bottom="24px"
            left="50%"
            transform="translateX(-50%)"
            bg="#0f172a"
            color="white"
            borderRadius="2xl"
            px={6}
            py={4}
            boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)"
            zIndex={1000}
            display="flex"
            alignItems="center"
            gap={6}
            minW="400px"
          >
            <Flex align="center" gap={3}>
              <Flex bg="#CE0037" borderRadius="full" w="24px" h="24px" align="center" justify="center" fontSize="xs" fontWeight="bold">
                {selectedReportIds.length}
              </Flex>
              <Text fontSize="sm" fontWeight="bold">Reports Selected</Text>
            </Flex>
            <Box w="1px" h="24px" bg="whiteAlpha.300" />
            <Flex gap={2}>
              <Button 
                size="sm" 
                variant="outline" 
                color="white" 
                borderColor="whiteAlpha.400" 
                _hover={{ bg: "whiteAlpha.200" }}
                isLoading={downloadingBulk}
                leftIcon={<DownloadCloud size={14} />}
                onClick={handleBulkDownload}
              >
                Download ZIP
              </Button>
              <Button 
                size="sm" 
                bg="#CE0037" 
                color="white" 
                _hover={{ bg: "#b3002f" }}
                leftIcon={<X size={14} />}
                onClick={() => setSelectedReportIds([])}
              >
                Clear Selection
              </Button>
            </Flex>
          </Box>
        )}
      </AnimatePresence>
    </Flex>
  );
}
