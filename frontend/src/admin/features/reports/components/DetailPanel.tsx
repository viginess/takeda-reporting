import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3, ChevronDown, User, Calendar, History, AlertCircle, 
  RefreshCw, FileText, Activity
} from "lucide-react";
import {
  Box, Flex, Text, Button, Badge, Input, SimpleGrid, VStack,
  IconButton as ChakraIconButton, useToast
} from "@chakra-ui/react";
import { trpc } from "../../../../utils/config/trpc";
import type { Report } from "../types";
import { DataDisplay } from "./DataDisplay";
import { ReportEditor } from "./ReportEditor";
import { ValidationBanner } from "./ValidationBanner";
import { DetailPanelHeader } from "./detail-panel/DetailPanelHeader";
import { StatusSeverityControl } from "./detail-panel/StatusSeverityControl";
import { MedicalCodingBlock } from "./detail-panel/MedicalCodingBlock";

interface DetailPanelProps {
  report: Report;
  mode: "view" | "edit";
  editData: { status: string; severity: string; adminNotes: string };
  fullDetailsEdit: any;
  saved: boolean;
  showAudit: boolean;
  showFullDetails: boolean;
  showNotifications: boolean;
  downloadingXml: boolean;
  downloadingPdf: boolean;
  isRegenerating: boolean;
  updateMutation: { isPending: boolean };
  isMobile?: boolean;
  onClose: () => void;
  onSetMode: (m: "view" | "edit") => void;
  onEditDataChange: (d: any) => void;
  onFullDetailsChange: (d: any) => void;
  onSetShowAudit: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetShowFullDetails: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetShowNotifications: (v: boolean | ((p: boolean) => boolean)) => void;
  onDownloadXml: (r: Report) => void;
  onDownloadPdf: (r: Report) => void;
  onRegenerate: (r: Report) => void;
  onSave: () => void;
  onOpenCodingModal: (idx: number) => void;
  onOpenWhodrugModal: (idx: number) => void;
}

export function DetailPanel(props: DetailPanelProps) {
  const { 
    report, mode, editData, fullDetailsEdit, saved, showAudit, 
    showFullDetails, showNotifications, downloadingXml, downloadingPdf, 
    isRegenerating, updateMutation, isMobile, onClose, onSetMode, 
    onEditDataChange, onFullDetailsChange, onSetShowAudit, onSetShowFullDetails, 
    onSetShowNotifications, onDownloadXml, onDownloadPdf, onRegenerate, 
    onSave, onOpenCodingModal, onOpenWhodrugModal 
  } = props;

  const toast = useToast();
  const utils = trpc.useUtils();
  const resendMutation = trpc.company.resendNotification.useMutation({
    onSuccess: () => {
      utils.admin.getAllReports.invalidate();
      toast({ title: "Email Resent Successfully", status: "success", position: 'top' });
    }
  });

  return (
    <Flex
      as={motion.div as any}
      initial={{ opacity: 0, x: isMobile ? 0 : 24, y: isMobile ? 20 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : 24, y: isMobile ? 20 : 0 }}
      transition={{ duration: 0.22 } as any}
      ml={isMobile ? 0 : 4}
      flex={1}
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="#e2e8f0"
      overflow="hidden"
      direction="column"
      position={isMobile ? "absolute" : "relative"}
      top={0} left={0} right={0} bottom={0} zIndex={10}
    >
      <DetailPanelHeader 
        report={report} mode={mode} isMobile={isMobile} saved={saved}
        isRegenerating={isRegenerating} downloadingXml={downloadingXml}
        downloadingPdf={downloadingPdf} isUpdating={updateMutation.isPending}
        onClose={onClose} onSetMode={onSetMode} onDownloadXml={onDownloadXml}
        onDownloadPdf={onDownloadPdf} onRegenerate={onRegenerate} onSave={onSave}
      />

      <Box flex={1} overflowY="auto" p={{ base: 4, md: 5 }}>
        <ValidationBanner isValid={report.isValid} errors={report.validationErrors} />

        {mode === "edit" && (
          <Flex as={motion.div as any} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} align="flex-start" gap={3}
            bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="lg" p={3} mb={5}>
            <AlertCircle size={15} color="#d97706" style={{ marginTop: "2px" }} />
            <Box><Text m={0} fontSize="xs" fontWeight="bold" color="yellow.800">Edit Mode — Changes are tracked</Text></Box>
          </Flex>
        )}

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={5}>
          {[
            { label: "Reporter", icon: User, value: `${report.reporter} (${report.reporterType})` },
            { label: "Submitted", icon: Calendar, value: report.submitted },
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

        <StatusSeverityControl 
          mode={mode} report={report} editData={editData} onEditDataChange={onEditDataChange} 
        />

        <MedicalCodingBlock 
          report={report} onOpenCodingModal={onOpenCodingModal} onOpenWhodrugModal={onOpenWhodrugModal} 
        />

        {(mode === "edit" || report.adminNotes) && (
          <Box mb={5}>
            <Flex align="center" gap={2} mb={2}>
              <Edit3 size={12} color="#94a3b8" />
              <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Admin Internal Notes</Text>
            </Flex>
            {mode === "edit" ? (
              <Input as="textarea" value={editData.adminNotes}
                onChange={(e) => onEditDataChange({ ...editData, adminNotes: e.target.value })}
                placeholder="Add internal notes..."
                size="sm" minH="100px" py={3} bg="white" borderColor="#e2e8f0" borderRadius="xl"
                fontSize="sm" _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" } as any} />
            ) : (
              <Box bg="#f8fafc" borderRadius="xl" p={4} border="1px solid" borderColor="#f1f5f9" position="relative">
                <Text fontSize="sm" color="#0f172a" lineHeight="tall">{report.adminNotes}</Text>
                <ChakraIconButton aria-label="Edit notes" icon={<Edit3 size={11} />} size="xs" variant="ghost"
                  position="absolute" top={2} right={2} color="#94a3b8" onClick={() => onSetMode("edit")} />
              </Box>
            )}
          </Box>
        )}

        {/* Collapsible Sections */}
        <VStack spacing={4} align="stretch" pb={4}>
          {/* Full Form */}
          {report.fullDetails && (
            <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,0.04)">
              <Button onClick={() => onSetShowFullDetails(v => !v)} variant="ghost" w="full"
                justifyContent="space-between" p={3} px={5} h="auto" bg={showFullDetails ? "white" : "#f8fafc"}
                borderBottom={showFullDetails ? "1px solid #f1f5f9" : "none"} borderRadius="none" _hover={{ bg: "#f8fafc" }}>
                <Flex align="center" gap={2.5}>
                  <Flex w="22px" h="22px" borderRadius="md" bg="red.50" align="center" justify="center" border="1px solid" borderColor="red.100"><FileText size={11} color="#CE0037" /></Flex>
                  <Text fontSize="sm" fontWeight="700" color="#0f172a">Full Form Details</Text>
                </Flex>
                <Box as={motion.div as any} animate={{ rotate: showFullDetails ? 180 : 0 }} transition={{ duration: 0.2 } as any}><ChevronDown size={14} color="#94a3b8" /></Box>
              </Button>
              <AnimatePresence>
                {showFullDetails && (
                  <Box as={motion.div as any} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 } as any} overflow="hidden">
                    <Box p={5}>{mode === "edit" ? <ReportEditor reportData={fullDetailsEdit} onChange={onFullDetailsChange} /> : <DataDisplay data={report.fullDetails} depth={0} />}</Box>
                  </Box>
                )}
              </AnimatePresence>
            </Box>
          )}

          {/* Notifications */}
          <Box bg="#f8fafc" borderRadius="xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden">
            <Button onClick={() => onSetShowNotifications(v => !v)} variant="ghost" w="full" justifyContent="space-between" p={3} px={4} h="auto" _hover={{ bg: "#f1f5f9" }}>
              <Flex align="center" gap={2}><Activity size={13} color="#3182ce" /><Text fontSize="sm" fontWeight="bold" color="#0f172a">Manufacturer Notifications</Text><Badge bg="blue.50" color="blue.600" border="1px solid" borderColor="blue.100" borderRadius="full" px={2} py={0.5} fontSize="2xs">{report.notifications?.length || 0}</Badge></Flex>
              <Box as={motion.div as any} animate={{ rotate: showNotifications ? 180 : 0 }} transition={{ duration: 0.2 } as any}><ChevronDown size={14} color="#94a3b8" /></Box>
            </Button>
            <AnimatePresence>
              {showNotifications && (
                <Box as={motion.div as any} initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} overflow="hidden">
                  <Box borderTop="1px solid" borderColor="#f1f5f9" p={3}>
                    {report.notifications?.length ? (
                      <VStack align="stretch" spacing={2.5}>
                        {report.notifications.map((n: any) => (
                          <Flex key={n.id} align="center" justify="space-between" bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="#f1f5f9">
                            <Box flex={1} pr={4}>
                              <Text fontSize="xs" fontWeight="bold" color="#0f172a">{n.companyName}</Text>
                              <Text fontSize="2xs" color="#94a3b8">{n.sentAt ? `Sent: ${n.sentAt}` : "Status pending"}</Text>
                              {n.status?.toLowerCase() === 'failed' && (
                                <Button size="xs" colorScheme="red" variant="solid" leftIcon={<RefreshCw size={10} />} isLoading={resendMutation.isPending} onClick={() => resendMutation.mutate({ notificationId: n.id })} mt={2} borderRadius="md" fontSize="2xs" h="24px">Retry</Button>
                              )}
                            </Box>
                            <Badge colorScheme={n.status?.toLowerCase() === 'sent' ? 'green' : n.status?.toLowerCase() === 'failed' ? 'red' : 'blue'} variant="subtle" fontSize="2xs" px={2} borderRadius="full">{n.status}</Badge>
                          </Flex>
                        ))}
                      </VStack>
                    ) : <Text fontSize="xs" color="#94a3b8" textAlign="center" py={4}>No notification logs found.</Text>}
                  </Box>
                </Box>
              )}
            </AnimatePresence>
          </Box>

          {/* Audit */}
          <Box bg="#f8fafc" borderRadius="xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden">
            <Button onClick={() => onSetShowAudit(v => !v)} variant="ghost" w="full" justifyContent="space-between" p={3} px={4} h="auto" _hover={{ bg: "#f1f5f9" }}>
              <Flex align="center" gap={2}><History size={13} color="#CE0037" /><Text fontSize="sm" fontWeight="bold" color="#0f172a">Audit Trail</Text><Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="full" px={2} py={0.5} fontSize="2xs">{report.audit.length}</Badge></Flex>
              <Box as={motion.div as any} animate={{ rotate: showAudit ? 180 : 0 }} transition={{ duration: 0.2 } as any}><ChevronDown size={14} color="#94a3b8" /></Box>
            </Button>
            <AnimatePresence>
              {showAudit && (
                <Box as={motion.div as any} initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} overflow="hidden">
                  <Box borderTop="1px solid" borderColor="#f1f5f9">
                    {report.audit.map((entry, i) => (
                      <Flex key={i} gap={3} p={3} px={4} borderBottom={i < report.audit.length - 1 ? "1px solid" : "none"} borderColor="#f8fafc" align="flex-start">
                        <Flex w="24px" h="24px" borderRadius="full" bg="red.50" border="1px solid" borderColor="red.200" align="center" justify="center" flexShrink={0} mt="2px"><History size={10} color="#CE0037" /></Flex>
                        <Box flex={1}>
                          <Text m={0} fontSize="xs" fontWeight="bold" color="#0f172a">{entry.action}</Text>
                          {entry.field && <Text m={0} mt={1} fontSize="2xs" color="#64748b">{entry.field}</Text>}
                          <Text m={0} mt={1} fontSize="2xs" color="#94a3b8">{entry.at}</Text>
                        </Box>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              )}
            </AnimatePresence>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}
