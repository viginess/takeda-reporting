import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, AlertCircle } from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, Input,
  InputGroup, InputLeftElement, Center, VStack,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Image, useDisclosure, useBreakpointValue
} from "@chakra-ui/react";
import { trpc } from "../../../utils/config/trpc";

import type { Report, MedDRATerm, Status, Severity } from "./types";
import { statusOptions } from "./types";
import { useReportActions } from "./hooks/useReportActions";
import { ReportTable } from "./components/ReportTable";
import { DetailPanel } from "./components/DetailPanel";
import { MedDRAModal } from "./components/MedDRAModal";
import { WhodrugModal } from "./components/WhodrugModal";
import { BulkToolbar } from "./components/BulkToolbar";

export default function ReportManagementPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editData, setEditData] = useState<{ status: Status | ""; severity: Severity | ""; adminNotes: string }>({ status: "", severity: "", adminNotes: "" });
  const [fullDetailsEdit, setFullDetailsEdit] = useState<any>({});
  const [showAudit, setShowAudit] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(true);
  const [isMounting, setIsMounting] = useState(true);

  // Responsive logic
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showTable = !isMobile || (isMobile && !selectedReport);

  // MedDRA Modal
  const [codingSymptomIndex, setCodingSymptomIndex] = useState<number | null>(null);
  const [meddraQuery, setMeddraQuery] = useState("");
  
  const { data: meddraResults, isLoading: searchingMeddra } = trpc.reference.searchMeddra.useQuery(
    { query: meddraQuery, limit: 20 },
    { enabled: meddraQuery.length >= 2 }
  );

  const { isOpen: isCodingOpen, onOpen: onCodingOpen, onClose: onCodingClose } = useDisclosure();

  // WHODrug Modal
  const [codingDrugIndex, setCodingDrugIndex] = useState<number | null>(null);
  const [whodrugQuery, setWhodrugQuery] = useState("");

  const { data: whodrugResults, isLoading: searchingWhodrug } = trpc.whodrug.searchDrugs.useQuery(
    { query: whodrugQuery, limit: 20 },
    { enabled: whodrugQuery.length >= 2 }
  );

  const { isOpen: isWhodrugOpen, onOpen: onWhodrugOpen, onClose: onWhodrugClose } = useDisclosure();

  // Zoom Modal
  const { isOpen: isZoomOpen, onClose: onZoomClose } = useDisclosure();
  const [zoomedImage] = useState("");

  const { data: generatedReports = [], isLoading, isError } = trpc.admin.getAllReports.useQuery();
  const reportsData = generatedReports as unknown as Report[];

  const { downloadingXml, downloadingPdf, downloadingBulk, saved, updateMutation, regenerateMutation,
    handleDownloadPdf, handleDownloadXml, handleBulkDownload, executeUpdate, handleRegenerate } = useReportActions();

  useEffect(() => {
    const t = setTimeout(() => setIsMounting(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Keep detail panel in sync with refreshed data
  useEffect(() => {
    if (selectedReport && reportsData) {
      const updated = reportsData.find(r => (r.originalId || r.id) === (selectedReport.originalId || selectedReport.id));
      if (updated && (updated.isValid !== selectedReport.isValid ||
          JSON.stringify(updated.validationErrors) !== JSON.stringify(selectedReport.validationErrors))) {
        setSelectedReport(updated);
      }
    }
  }, [reportsData, selectedReport]);

  const filtered = reportsData.filter(r => {
    const matchSearch = (r.originalId || r.id).toLowerCase().includes(search.toLowerCase()) ||
      r.drug.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || (filterStatus === "Urgent" ? r.severity === "Critical" : r.status === filterStatus);
    const matchType = filterType === "All" || r.reporterType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const openReport = (r: Report) => {
    setSelectedReport(r);
    setEditData({ status: r.status, severity: r.severity, adminNotes: r.adminNotes || "" });
    setFullDetailsEdit(r.fullDetails || {});
    setMode("view");
    setShowAudit(false);
    setShowFullDetails(true);
  };

  const toggleSelectAll = () => {
    setSelectedReportIds(selectedReportIds.length === filtered.length ? [] : filtered.map(r => r.originalId || r.id));
  };

  const toggleSelectReport = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedReportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!selectedReport) return;
    const newReport = executeUpdate(selectedReport, {
      status: editData.status || undefined,
      severity: editData.severity || undefined,
      adminNotes: editData.adminNotes,
    }, fullDetailsEdit);
    setSelectedReport(newReport);
    setMode("view");
  };

  return (
    <Flex h="100%" direction="column" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif">
      {/* Header */}
      <Box pt={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
        <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} justify="space-between" mb={6} gap={4}>
          <Box as={motion.div as any} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Flex align="center" gap={3} mb={1}>
              <FileText size={22} color="#CE0037" />
              <Heading as="h1" size={{ base: "md", md: "lg" }} color="#0f172a" letterSpacing="-0.5px">Report Management</Heading>
            </Flex>
            <Text color="#64748b" fontSize={{ base: "xs", md: "sm" }}>Review and update drug safety reports</Text>
          </Box>
        </Flex>

        {/* Filters */}
        <Flex 
          as={motion.div as any} 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.08 } as any} 
          direction={{ base: 'column', lg: 'row' }}
          gap={3} 
          mb={5} 
          align={{ base: 'stretch', lg: 'center' }}
        >
          <Box position="relative" flex={1}>
            <InputGroup>
              <InputLeftElement pointerEvents="none"><Search size={14} color="#94a3b8" /></InputLeftElement>
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search ID, drug, or reporter..."
                bg="white" borderColor="#e2e8f0" borderRadius="lg" fontSize="sm" />
            </InputGroup>
          </Box>
          <Flex direction={{ base: 'column', sm: 'row' }} gap={3} wrap="wrap">
            <Flex gap={1.5} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1.5} wrap="wrap">
              {["All", ...statusOptions].map(s => (
                <Button key={s} onClick={() => setFilterStatus(s)} size="xs" minW="55px" borderRadius="md" fontSize="2xs"
                  variant={filterStatus === s ? "solid" : "ghost"}
                  bg={filterStatus === s ? "#CE0037" : "transparent"}
                  color={filterStatus === s ? "white" : "#64748b"}
                  _hover={filterStatus === s ? {} : { bg: "#f8fafc" }}>{s}</Button>
              ))}
            </Flex>
            <Flex gap={1.5} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1.5} wrap="wrap">
              {["All", "Patient", "HCP", "Family"].map(t => (
                <Button key={t} onClick={() => setFilterType(t)} size="xs" minW="55px" borderRadius="md" fontSize="2xs"
                  variant={filterType === t ? "solid" : "ghost"}
                  bg={filterType === t ? "#CE0037" : "transparent"}
                  color={filterType === t ? "white" : "#64748b"}
                  _hover={filterType === t ? {} : { bg: "#f8fafc" }}>{t}</Button>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Flex flex={1} px={{ base: 4, md: 8 }} pb={8} minH={0} gap={0} position="relative">
        {isError ? (
          <Center w="100%" h="100%" flex={1}>
            <VStack gap={4}>
              <AlertCircle size={40} color="#1e293b" />
              <Text fontSize="lg" fontWeight="bold" color="gray.800">Failed to load reports</Text>
              <Text color="gray.500" fontSize="sm">Please try again later.</Text>
            </VStack>
          </Center>
        ) : (
          <>
            {showTable && (
              <ReportTable
                filtered={filtered}
                selectedReport={selectedReport}
                selectedReportIds={selectedReportIds}
                isLoading={isLoading}
                isMounting={isMounting}
                isError={isError}
                onRowClick={openReport}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelectReport={toggleSelectReport}
              />
            )}
            <AnimatePresence>
              {selectedReport && (
                <DetailPanel
                  report={selectedReport}
                  mode={mode}
                  editData={editData}
                  fullDetailsEdit={fullDetailsEdit}
                  saved={saved}
                  showAudit={showAudit}
                  showFullDetails={showFullDetails}
                  downloadingXml={downloadingXml}
                  downloadingPdf={downloadingPdf}
                  isRegenerating={regenerateMutation.isPending}
                  updateMutation={updateMutation}
                  isMobile={isMobile}
                  onClose={() => setSelectedReport(null)}
                  onSetMode={setMode}
                  onEditDataChange={setEditData}
                  onFullDetailsChange={setFullDetailsEdit}
                  onSetShowAudit={setShowAudit}
                  onSetShowFullDetails={setShowFullDetails}
                  onDownloadXml={handleDownloadXml}
                  onDownloadPdf={handleDownloadPdf}
                  onRegenerate={handleRegenerate}
                  onSave={handleSave}
                  onOpenCodingModal={(idx) => { setCodingSymptomIndex(idx); onCodingOpen(); }}
                  onOpenWhodrugModal={(idx) => { setCodingDrugIndex(idx); onWhodrugOpen(); }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </Flex>

      {/* Modals */}
      <MedDRAModal
        isOpen={isCodingOpen}
        onClose={onCodingClose}
        selectedReport={selectedReport}
        codingSymptomIndex={codingSymptomIndex}
        meddraQuery={meddraQuery}
        setMeddraQuery={setMeddraQuery}
        meddraResults={meddraResults as MedDRATerm[] | undefined}
        searchingMeddra={searchingMeddra}
        updateMutation={updateMutation}
        onSymptomUpdated={setSelectedReport}
      />

      <WhodrugModal
        isOpen={isWhodrugOpen}
        onClose={onWhodrugClose}
        selectedReport={selectedReport}
        codingProductIndex={codingDrugIndex}
        whodrugQuery={whodrugQuery}
        setWhodrugQuery={setWhodrugQuery}
        whodrugResults={whodrugResults}
        searchingWhodrug={searchingWhodrug}
        updateMutation={updateMutation}
        onProductUpdated={setSelectedReport}
      />

      <Modal isOpen={isZoomOpen} onClose={onZoomClose} size="full">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" zIndex={2} />
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={{ base: 4, md: 0 }} onClick={onZoomClose}>
            <Center w="full" h="full">
              <Image src={zoomedImage} maxH="85vh" maxW="90vw" objectFit="contain"
                borderRadius="lg" boxShadow="2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>

      {showTable && (
        <BulkToolbar
          selectedCount={selectedReportIds.length}
          downloadingBulk={downloadingBulk}
          onDownload={() => handleBulkDownload(selectedReportIds, reportsData, () => setSelectedReportIds([]))}
          onClear={() => setSelectedReportIds([])}
        />
      )}
    </Flex>
  );
}

