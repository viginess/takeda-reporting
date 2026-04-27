import { Flex, Text, Button, Box, IconButton as ChakraIconButton, IconButton } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Check, RefreshCw, FileCode, DownloadCloud, Edit3, X, Save 
} from "lucide-react";
import { StatusBadge } from "../ComparisonBadges";
import type { Report } from "../../types";

interface DetailPanelHeaderProps {
  report: Report;
  mode: "view" | "edit";
  isMobile?: boolean;
  saved: boolean;
  isRegenerating: boolean;
  downloadingXml: boolean;
  downloadingPdf: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onSetMode: (m: "view" | "edit") => void;
  onDownloadXml: (r: Report) => void;
  onDownloadPdf: (r: Report) => void;
  onRegenerate: (r: Report) => void;
  onSave: () => void;
}

export function DetailPanelHeader({
  report, mode, isMobile, saved, isRegenerating,
  downloadingXml, downloadingPdf, isUpdating,
  onClose, onSetMode, onDownloadXml, onDownloadPdf, onRegenerate, onSave
}: DetailPanelHeaderProps) {
  return (
    <Flex p={{ base: 3, md: 4 }} px={{ base: 4, md: 5 }} borderBottom="1px solid" borderColor="#f1f5f9" align="center" justify="space-between" bg="#f8fafc">
      <Flex align="center" gap={{ base: 2, md: 3 }}>
        {isMobile && (
          <IconButton aria-label="Back" icon={<ChevronLeft size={20} />} size="sm" variant="ghost" onClick={onClose} mr={-1} />
        )}
        <Text fontFamily="monospace" fontSize={{ base: "xs", md: "sm" }} fontWeight="extrabold" color="#CE0037">{report.id}</Text>
        <StatusBadge status={report.status} />
        {saved && !isMobile && (
          <Flex as={motion.span as any} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            align="center" gap={1} fontSize="xs" color="green.600" fontWeight="bold">
            <Check size={12} /> Saved
          </Flex>
        )}
      </Flex>
      <Flex gap={2}>
        {mode === "view" ? (
          <>
            <Button onClick={() => onRegenerate(report)} variant="outline" colorScheme="orange" size={{ base: "xs", sm: "sm" }}
              leftIcon={<RefreshCw size={11} />} isLoading={isRegenerating}>
              {isMobile ? "" : "Regenerate"}
            </Button>
            <Button onClick={() => onDownloadXml(report)} variant="outline" colorScheme="blue" size={{ base: "xs", sm: "sm" }}
              leftIcon={<FileCode size={11} />} isLoading={downloadingXml}
              isDisabled={report.isValid === false} opacity={report.isValid === false ? 0.5 : 1}>
              {isMobile ? "" : "XML"}
            </Button>
            <Button onClick={() => onDownloadPdf(report)} variant="outline" colorScheme="blue" size={{ base: "xs", sm: "sm" }}
              leftIcon={<DownloadCloud size={11} />} isLoading={downloadingPdf}
              isDisabled={report.isValid === false} opacity={report.isValid === false ? 0.5 : 1}>
              {isMobile ? "" : "PDF"}
            </Button>
            {!isMobile && <Box w="1px" h="20px" bg="#e2e8f0" mx={1} alignSelf="center" />}
            <Button as={motion.button as any} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onSetMode("edit")} bg="#CE0037" color="white" size={{ base: "xs", sm: "sm" }}
              leftIcon={<Edit3 size={11} />} _hover={{ bg: "#b3002f" }}>
              {isMobile ? "" : "Edit"}
            </Button>
          </>
        ) : (
          <>
            <Button as={motion.button as any} whileHover={{ scale: 1.02 }} onClick={() => onSetMode("view")}
              variant="solid" bg="#f1f5f9" color="#64748b" size={{ base: "xs", sm: "sm" }} leftIcon={<X size={11} />} _hover={{ bg: "#e2e8f0" }}>
              {isMobile ? "" : "Cancel"}
            </Button>
            <Button as={motion.button as any} whileHover={{ scale: 1.02 }} onClick={onSave}
              bg="#CE0037" color="white" size={{ base: "xs", sm: "sm" }} leftIcon={<Save size={11} />}
              isLoading={isUpdating} _hover={{ bg: "#b3002f" }}>
              {isMobile ? "Save" : "Save Changes"}
            </Button>
          </>
        )}
        {!isMobile && (
          <ChakraIconButton aria-label="Close panel" icon={<X size={14} />} size="sm" variant="ghost"
            onClick={onClose} color="#94a3b8" />
        )}
      </Flex>
    </Flex>
  );
}
