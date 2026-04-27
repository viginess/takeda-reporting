import { Box, SimpleGrid, Flex, Text, Button } from "@chakra-ui/react";
import { Activity, AlertTriangle } from "lucide-react";
import { StatusBadge, SeverityDot } from "../ComparisonBadges";
import { 
  statusOptions, statusCfg, severityOptions, severityCfg
} from "../../types";
import type { Status, Severity } from "../../types";

interface StatusSeverityControlProps {
  mode: "view" | "edit";
  editData: { status: string; severity: string };
  report: { status: string; severity: string };
  onEditDataChange: (d: any) => void;
}

export function StatusSeverityControl({
  mode, editData, report, onEditDataChange
}: StatusSeverityControlProps) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={5}>
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
                  onClick={() => onEditDataChange({ ...editData, status: s })}
                  size="xs" 
                  borderRadius="full" 
                  border="2px solid"
                  borderColor={active ? cfg.border : "#e2e8f0"} 
                  bg={active ? cfg.bg : "white"}
                  color={active ? cfg.text : "#64748b"} 
                  leftIcon={<cfg.icon size={10} />}
                  boxShadow={active ? `0 0 0 3px ${cfg.bg}` : "none"}
                  fontWeight={active ? "bold" : "medium"}
                  _hover={active ? {} : { bg: "#f8fafc", borderColor: "#cbd5e1" }}
                  transition="all 0.2s"
                >
                  {s}
                </Button>
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
          <Flex gap={1.5} wrap="wrap">
            {severityOptions.map((s) => {
              const cfg = severityCfg[s]; 
              const active = editData.severity === s;
              return (
                <Button 
                  key={s} 
                  onClick={() => onEditDataChange({ ...editData, severity: s })}
                  size="xs" 
                  borderRadius="full" 
                  border="2px solid"
                  borderColor={active ? `${cfg.color}` : "#e2e8f0"} 
                  bg={active ? cfg.bg : "white"}
                  color={active ? cfg.color : "#64748b"} 
                  boxShadow={active ? `0 0 0 3px ${cfg.bg}` : "none"}
                  fontWeight={active ? "bold" : "medium"}
                  _hover={active ? {} : { bg: "#f8fafc", borderColor: "#cbd5e1" }}
                  transition="all 0.2s"
                >
                  {s}
                </Button>
              );
            })}
          </Flex>
        ) : (
          <SeverityDot severity={(editData.severity || report.severity) as Severity} />
        )}
      </Box>
    </SimpleGrid>
  );
}
