import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3, ChevronDown, Plus, X, AlertTriangle, User, Calendar, Activity,
  Save, AlertCircle, History, DownloadCloud, FileCode, Check, FileText, RefreshCw
} from "lucide-react";
import {
  Box, Flex, Text, Button, Badge, Input, SimpleGrid, VStack,
  IconButton as ChakraIconButton
} from "@chakra-ui/react";
import type { Report, Status, Severity } from "../types";
import { statusCfg, severityCfg, statusOptions, severityOptions } from "../types";
import { StatusBadge, SeverityDot } from "./ComparisonBadges";
import { DataDisplay } from "./DataDisplay";
import { ReportEditor } from "./ReportEditor";
import { ValidationBanner } from "./ValidationBanner";

interface DetailPanelProps {
  report: Report;
  mode: "view" | "edit";
  editData: { status: string; severity: string; adminNotes: string };
  fullDetailsEdit: any;
  saved: boolean;
  showAudit: boolean;
  showFullDetails: boolean;
  downloadingXml: boolean;
  downloadingPdf: boolean;
  isRegenerating: boolean;
  updateMutation: { isPending: boolean };
  onClose: () => void;
  onSetMode: (m: "view" | "edit") => void;
  onEditDataChange: (d: any) => void;
  onFullDetailsChange: (d: any) => void;
  onSetShowAudit: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetShowFullDetails: (v: boolean | ((p: boolean) => boolean)) => void;
  onDownloadXml: (r: Report) => void;
  onDownloadPdf: (r: Report) => void;
  onRegenerate: (r: Report) => void;
  onSave: () => void;
  onOpenCodingModal: (idx: number) => void;
}

export function DetailPanel({
  report,
  mode,
  editData,
  fullDetailsEdit,
  saved,
  showAudit,
  showFullDetails,
  downloadingXml,
  downloadingPdf,
  isRegenerating,
  updateMutation,
  onClose,
  onSetMode,
  onEditDataChange,
  onFullDetailsChange,
  onSetShowAudit,
  onSetShowFullDetails,
  onDownloadXml,
  onDownloadPdf,
  onRegenerate,
  onSave,
  onOpenCodingModal,
}: DetailPanelProps) {
  return (
    <Flex
      as={motion.div as any}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22 } as any}
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
          <Text fontFamily="monospace" fontSize="sm" fontWeight="extrabold" color="#CE0037">{report.id}</Text>
          <StatusBadge status={report.status} />
          {saved && (
            <Flex as={motion.span as any} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              align="center" gap={1} fontSize="xs" color="green.600" fontWeight="bold">
              <Check size={12} /> Saved
            </Flex>
          )}
        </Flex>
        <Flex gap={2}>
          {mode === "view" ? (
            <>
              {report.isValid === false && (
                <Button onClick={() => onRegenerate(report)} variant="outline" colorScheme="orange" size="sm"
                  leftIcon={<RefreshCw size={13} />} isLoading={isRegenerating}
                  title="Re-run compliance checks and update the report">
                  Regenerate
                </Button>
              )}
              <Button onClick={() => onDownloadXml(report)} variant="outline" colorScheme="blue" size="sm"
                leftIcon={<FileCode size={13} />} isLoading={downloadingXml}
                disabled={report.isValid === false} opacity={report.isValid === false ? 0.5 : 1}
                title={report.isValid === false ? "Fix validation errors to download" : ""}>
                XML
              </Button>
              <Button onClick={() => onDownloadPdf(report)} variant="outline" colorScheme="blue" size="sm"
                leftIcon={<DownloadCloud size={13} />} isLoading={downloadingPdf}
                disabled={report.isValid === false} opacity={report.isValid === false ? 0.5 : 1}
                title={report.isValid === false ? "Fix validation errors to download" : ""}>
                PDF
              </Button>
              <Box w="1px" h="20px" bg="#e2e8f0" mx={1} alignSelf="center" />
              {!report.adminNotes && (
                <Button as={motion.button as any} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onSetMode("edit")} variant="ghost" color="#64748b" size="sm"
                  leftIcon={<Plus size={14} color="#CE0037" />} _hover={{ bg: "#f1f5f9" }}>
                  Add Note
                </Button>
              )}
              <Button as={motion.button as any} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => onSetMode("edit")} bg="#CE0037" color="white" size="sm"
                leftIcon={<Edit3 size={13} />} _hover={{ bg: "#b3002f" }}>
                Edit Report
              </Button>
            </>
          ) : (
            <>
              <Button as={motion.button as any} whileHover={{ scale: 1.02 }} onClick={() => onSetMode("view")}
                variant="solid" bg="#f1f5f9" color="#64748b" size="sm" leftIcon={<X size={13} />} _hover={{ bg: "#e2e8f0" }}>
                Cancel
              </Button>
              <Button as={motion.button as any} whileHover={{ scale: 1.02 }} onClick={onSave}
                bg="#CE0037" color="white" size="sm" leftIcon={<Save size={13} />}
                isLoading={updateMutation.isPending} _hover={{ bg: "#b3002f" }}>
                Save Changes
              </Button>
            </>
          )}
          <ChakraIconButton aria-label="Close panel" icon={<X size={14} />} size="sm" variant="ghost"
            onClick={onClose} color="#94a3b8" />
        </Flex>
      </Flex>

      <Box flex={1} overflowY="auto" p={5}>
        {/* Validation Banner — shown at top for non-compliant reports */}
        <ValidationBanner isValid={report.isValid} errors={report.validationErrors} />

        {/* Edit Mode Warning */}
        <AnimatePresence>
          {mode === "edit" && (
            <Flex as={motion.div as any} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} align="flex-start" gap={3}
              bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="lg" p={3} mb={5}>
              <AlertCircle size={15} color="#d97706" style={{ marginTop: "2px" }} />
              <Box>
                <Text m={0} fontSize="sm" fontWeight="bold" color="yellow.800">Edit Mode — Changes are tracked</Text>
                <Text m={0} mt={1} fontSize="xs" color="yellow.700">All modifications will be logged in the audit trail with your identity and timestamp.</Text>
              </Box>
            </Flex>
          )}
        </AnimatePresence>

        {/* Reporter / Submitted */}
        <SimpleGrid columns={2} spacing={3} mb={5}>
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

        {/* Status + Severity */}
        <SimpleGrid columns={2} spacing={3} mb={5}>
          <Box bg="#f8fafc" borderRadius="xl" p={3} px={4} border="1px solid" borderColor="#f1f5f9">
            <Flex align="center" gap={2} mb={2}>
              <Activity size={12} color="#94a3b8" />
              <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Status</Text>
            </Flex>
            {mode === "edit" ? (
              <Flex wrap="wrap" gap={1.5}>
                {statusOptions.map((s) => {
                  const cfg = statusCfg[s]; const active = editData.status === s;
                  return (
                    <Button key={s} onClick={() => onEditDataChange({ ...editData, status: s })}
                      size="xs" borderRadius="full" border="1px solid"
                      borderColor={active ? cfg.border : "#e2e8f0"} bg={active ? cfg.bg : "white"}
                      color={active ? cfg.text : "#64748b"} leftIcon={<cfg.icon size={9} />}
                      _hover={active ? {} : { bg: "#f8fafc" }}>{s}</Button>
                  );
                })}
              </Flex>
            ) : (
              <StatusBadge status={(editData.status || report.status) as Status} />
            )}
          </Box>
          <Box bg="#f8fafc" borderRadius="xl" p={3} px={4} border="1px solid" borderColor="#f1f5f9">
            <Flex align="center" gap={2} mb={2}>
              <AlertTriangle size={12} color="#94a3b8" />
              <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Severity</Text>
            </Flex>
            {mode === "edit" ? (
              <Flex gap={1.5}>
                {severityOptions.map((s) => {
                  const cfg = severityCfg[s]; const active = editData.severity === s;
                  return (
                    <Button key={s} onClick={() => onEditDataChange({ ...editData, severity: s })}
                      size="xs" borderRadius="full" border="1px solid"
                      borderColor={active ? `${cfg.color}44` : "#e2e8f0"} bg={active ? cfg.bg : "white"}
                      color={active ? cfg.color : "#64748b"} _hover={active ? {} : { bg: "#f8fafc" }}>{s}</Button>
                  );
                })}
              </Flex>
            ) : (
              <SeverityDot severity={(editData.severity || report.severity) as Severity} />
            )}
          </Box>
        </SimpleGrid>

        {/* Medical Coding */}
        {report.fullDetails?.symptoms?.length > 0 && (
          <Box mb={5} bg="red.50" borderRadius="xl" p={4} border="1px solid" borderColor="red.100">
            <Flex align="center" gap={2} mb={3}>
              <Activity size={13} color="#CE0037" />
              <Text fontSize="xs" color="#CE0037" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">Medical Coding</Text>
            </Flex>
            <VStack align="stretch" spacing={2.5}>
              {report.fullDetails.symptoms.map((s: any, idx: number) => (
                <Flex key={idx} justify="space-between" align="center" bg="white" p={2.5} borderRadius="lg" border="1px solid" borderColor="red.100">
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="#1e293b" noOfLines={1}>{s.name || s.symptom || "Unknown Symptom"}</Text>
                    {s.meddraCode
                      ? <Text fontSize="2xs" color="green.600" fontWeight="bold">Mapped: {s.meddraCode}</Text>
                      : <Text fontSize="2xs" color="#94a3b8">Uncoded</Text>}
                  </Box>
                  <Button size="xs" variant="ghost" colorScheme="red" fontSize="2xs"
                    onClick={() => onOpenCodingModal(idx)} leftIcon={<Plus size={10} />}>
                    {s.meddraCode ? "Remap" : "Code"}
                  </Button>
                </Flex>
              ))}
            </VStack>
          </Box>
        )}

        {/* Admin Notes */}
        {(mode === "edit" || report.adminNotes) && (
          <Box mb={5}>
            <Flex align="center" gap={2} mb={2}>
              <Edit3 size={12} color="#94a3b8" />
              <Text fontSize="2xs" color="#94a3b8" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Admin Internal Notes</Text>
            </Flex>
            {mode === "edit" ? (
              <Input as="textarea" value={editData.adminNotes}
                onChange={(e) => onEditDataChange({ ...editData, adminNotes: e.target.value })}
                placeholder="Add internal notes about this report (visible only to admins)..."
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

        {/* Full Form Details */}
        {report.fullDetails && (
          <Box bg="white" borderRadius="xl" border="1px solid" borderColor="#e2e8f0" mb={5} overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,0.04)">
            <Button onClick={() => onSetShowFullDetails(v => !v)} variant="ghost" w="full"
              justifyContent="space-between" p={3} px={5} h="auto"
              bg={showFullDetails ? "white" : "#f8fafc"}
              borderBottom={showFullDetails ? "1px solid #f1f5f9" : "none"}
              borderRadius="none" _hover={{ bg: "#f8fafc" }}>
              <Flex align="center" gap={2.5}>
                <Flex w="22px" h="22px" borderRadius="md" bg="red.50" align="center" justify="center" border="1px solid" borderColor="red.100">
                  <FileText size={11} color="#CE0037" />
                </Flex>
                <Text fontSize="sm" fontWeight="700" color="#0f172a">Full Form Details</Text>
                <Badge bg="#f1f5f9" color="#64748b" borderRadius="full" px={2} py={0.5} fontSize="2xs" fontWeight="bold" textTransform="none">
                  {Object.keys(report.fullDetails).length} sections
                </Badge>
              </Flex>
              <Box as={motion.div as any} animate={{ rotate: showFullDetails ? 180 : 0 }} transition={{ duration: 0.2 } as any}>
                <ChevronDown size={14} color="#94a3b8" />
              </Box>
            </Button>
            <AnimatePresence>
              {showFullDetails && (
                <Box as={motion.div as any} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 } as any} overflow="hidden">
                  <Box p={5}>
                    {mode === "edit"
                      ? <ReportEditor reportData={fullDetailsEdit} onChange={onFullDetailsChange} />
                      : <DataDisplay data={report.fullDetails} depth={0} />}
                  </Box>
                </Box>
              )}
            </AnimatePresence>
          </Box>
        )}

        {/* Audit Trail */}
        <Box bg="#f8fafc" borderRadius="xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden">
          <Button onClick={() => onSetShowAudit(v => !v)} variant="ghost" w="full"
            justifyContent="space-between" p={3} px={4} h="auto" _hover={{ bg: "#f1f5f9" }}>
            <Flex align="center" gap={2}>
              <History size={13} color="#CE0037" />
              <Text fontSize="sm" fontWeight="bold" color="#0f172a">Audit Trail</Text>
              <Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="full" px={2} py={0.5} fontSize="2xs">
                {report.audit.length}
              </Badge>
            </Flex>
            <Box as={motion.div as any} animate={{ rotate: showAudit ? 180 : 0 }} transition={{ duration: 0.2 } as any}>
              <ChevronDown size={14} color="#94a3b8" />
            </Box>
          </Button>
          <AnimatePresence>
            {showAudit && (
              <Box as={motion.div as any} initial={{ height: 0 }} animate={{ height: "auto" }}
                exit={{ height: 0 }} overflow="hidden">
                <Box borderTop="1px solid" borderColor="#f1f5f9">
                  {report.audit.map((entry, i) => (
                    <Flex key={i} gap={3} p={3} px={4}
                      borderBottom={i < report.audit.length - 1 ? "1px solid" : "none"}
                      borderColor="#f8fafc" align="flex-start">
                      <Flex w="28px" h="28px" borderRadius="full" bg="red.50" border="1px solid"
                        borderColor="red.200" align="center" justify="center" flexShrink={0} mt="2px">
                        <History size={12} color="#CE0037" />
                      </Flex>
                      <Box flex={1}>
                        <Text m={0} fontSize="sm" fontWeight="bold" color="#0f172a">{entry.action}</Text>
                        {entry.field && (
                          <Text m={0} mt={1} fontSize="xs" color="#64748b">
                            <Text as="span" color="#94a3b8">{entry.field}:</Text>{" "}
                            <Text as="span" textDecoration="line-through" color="red.500">{entry.from}</Text>
                            {" → "}
                            <Text as="span" color="green.600" fontWeight="bold">{entry.to}</Text>
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
  );
}
