import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { 
  Flex, Text, Center, VStack, useDisclosure, useBreakpointValue 
} from "@chakra-ui/react";
import { trpc } from "../../../../utils/config/trpc";

import type { Report, MedDRATerm, Status, Severity } from "../types";
import { useReportActions } from "../hooks/useReportActions";
import { ReportTable } from "../components/ReportTable";
import { ArchiveTable } from "../components/ArchiveTable";
import { DetailPanel } from "../components/DetailPanel";
import { MedDRAModal } from "../components/MedDRAModal";
import { WhodrugModal } from "../components/WhodrugModal";
import { BulkToolbar } from "../components/BulkToolbar";
import { ArchiveDetailsModal } from "../components/ArchiveDetailsModal";
import { ReportFilterHeader } from "../components/ReportFilterHeader";
import { ImageZoomModal } from "../components/ImageZoomModal";

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
  const [showNotifications, setShowNotifications] = useState(true);
  const [isMounting, setIsMounting] = useState(true);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const [archivedDetails, setArchivedDetails] = useState<{ storagePath: string; referenceId: string } | null>(null);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showTable = !isMobile || (isMobile && !selectedReport);

  // MedDRA & WHODrug Modals
  const [codingSymptomIndex, setCodingSymptomIndex] = useState<number | null>(null);
  const [meddraQuery, setMeddraQuery] = useState("");
  const { data: meddraResults, isLoading: searchingMeddra } = trpc.reference.searchMeddra.useQuery({ query: meddraQuery, limit: 20 }, { enabled: meddraQuery.length >= 2 });
  const { isOpen: isCodingOpen, onOpen: onCodingOpen, onClose: onCodingClose } = useDisclosure();

  const [codingDrugIndex, setCodingDrugIndex] = useState<number | null>(null);
  const [whodrugQuery, setWhodrugQuery] = useState("");
  const { data: whodrugResults, isLoading: searchingWhodrug } = trpc.whodrug.searchDrugs.useQuery({ query: whodrugQuery, limit: 20 }, { enabled: whodrugQuery.length >= 2 });
  const { isOpen: isWhodrugOpen, onOpen: onWhodrugOpen, onClose: onWhodrugClose } = useDisclosure();

  const { isOpen: isZoomOpen, onClose: onZoomClose } = useDisclosure();
  const [zoomedImage] = useState("");

  const { data: generatedReports = [], isLoading, isError } = trpc.admin.getAllReports.useQuery();
  const reportsData = generatedReports as unknown as Report[];

  const { downloadingXml, downloadingPdf, downloadingBulk, saved, updateMutation, regenerateMutation,
    handleDownloadPdf, handleDownloadXml, handleBulkDownload, executeUpdate, handleRegenerate } = useReportActions();

  const { data: fetchedArchivedDetails, isLoading: loadingArchiveDetails } = trpc.admin.getArchivedReportDetails.useQuery(
    { storagePath: archivedDetails?.storagePath || "" },
    { enabled: !!archivedDetails?.storagePath }
  );

  useEffect(() => {
    const t = setTimeout(() => setIsMounting(false), 400);
    return () => clearTimeout(t);
  }, []);

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

  const handleSave = () => {
    if (!selectedReport) return;
    const newReport = executeUpdate(selectedReport, { status: editData.status || undefined, severity: editData.severity || undefined, adminNotes: editData.adminNotes }, fullDetailsEdit);
    setSelectedReport(newReport);
    setMode("view");
  };

  return (
    <Flex h="100%" direction="column" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif">
      <ReportFilterHeader 
        search={search} setSearch={setSearch}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterType={filterType} setFilterType={setFilterType}
        viewMode={viewMode} setViewMode={(v) => { setViewMode(v); setSelectedReport(null); }}
      />

      <Flex flex={1} px={{ base: 4, md: 8 }} pb={8} minH={0} gap={0} position="relative">
        {isError ? (
          <Center w="100%" h="100%" flex={1}><VStack gap={4}><AlertCircle size={40} color="#1e293b" /><Text fontSize="lg" fontWeight="bold">Failed to load reports</Text></VStack></Center>
        ) : (
          <>
            {viewMode === "active" ? (
              <>
                {showTable && <ReportTable filtered={filtered} selectedReport={selectedReport} selectedReportIds={selectedReportIds} isLoading={isLoading} isMounting={isMounting} isError={isError} onRowClick={openReport} onToggleSelectAll={() => setSelectedReportIds(selectedReportIds.length === filtered.length ? [] : filtered.map(r => r.originalId || r.id))} onToggleSelectReport={(id, e) => { e.stopPropagation(); setSelectedReportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }} />}
                <AnimatePresence>
                  {selectedReport && (
                    <DetailPanel report={selectedReport} mode={mode} editData={editData} fullDetailsEdit={fullDetailsEdit} saved={saved} showAudit={showAudit} showFullDetails={showFullDetails} showNotifications={showNotifications} downloadingXml={downloadingXml} downloadingPdf={downloadingPdf} isRegenerating={regenerateMutation.isPending} updateMutation={updateMutation} isMobile={isMobile} onClose={() => setSelectedReport(null)} onSetMode={setMode} onEditDataChange={setEditData} onFullDetailsChange={setFullDetailsEdit} onSetShowAudit={setShowAudit} onSetShowFullDetails={setShowFullDetails} onSetShowNotifications={setShowNotifications} onDownloadXml={handleDownloadXml} onDownloadPdf={handleDownloadPdf} onRegenerate={handleRegenerate} onSave={handleSave} onOpenCodingModal={(idx: number) => { setCodingSymptomIndex(idx); onCodingOpen(); }} onOpenWhodrugModal={(idx: number) => { setCodingDrugIndex(idx); onWhodrugOpen(); }} />
                  )}
                </AnimatePresence>
              </>
            ) : (
              <ArchiveTable onViewDetails={(path, ref) => setArchivedDetails({ storagePath: path, referenceId: ref })} />
            )}
          </>
        )}
      </Flex>

      <ArchiveDetailsModal archivedDetails={archivedDetails} onClose={() => setArchivedDetails(null)} loading={loadingArchiveDetails} data={fetchedArchivedDetails} />
      
      <MedDRAModal isOpen={isCodingOpen} onClose={onCodingClose} selectedReport={selectedReport} codingSymptomIndex={codingSymptomIndex} meddraQuery={meddraQuery} setMeddraQuery={setMeddraQuery} meddraResults={meddraResults as MedDRATerm[] | undefined} searchingMeddra={searchingMeddra} updateMutation={updateMutation} onSymptomUpdated={setSelectedReport} />
      
      <WhodrugModal isOpen={isWhodrugOpen} onClose={onWhodrugClose} selectedReport={selectedReport} codingProductIndex={codingDrugIndex} whodrugQuery={whodrugQuery} setWhodrugQuery={setWhodrugQuery} whodrugResults={whodrugResults} searchingWhodrug={searchingWhodrug} updateMutation={updateMutation} onProductUpdated={setSelectedReport} />
      
      <ImageZoomModal isOpen={isZoomOpen} onClose={onZoomClose} imageSrc={zoomedImage} />

      {showTable && <BulkToolbar selectedCount={selectedReportIds.length} downloadingBulk={downloadingBulk} onDownload={() => handleBulkDownload(selectedReportIds, reportsData, () => setSelectedReportIds([]))} onClear={() => setSelectedReportIds([])} />}
    </Flex>
  );
}
