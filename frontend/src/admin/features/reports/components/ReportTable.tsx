import { motion } from "framer-motion";
import {
  Box, SimpleGrid, Text, VStack, Flex, Badge, Checkbox, Skeleton
} from "@chakra-ui/react";
import type { Report } from "../types";
import { reporterTypeCfg } from "../types";
import { StatusBadge, SeverityDot, ValidationBadge } from "./ComparisonBadges";

interface ReportTableProps {
  filtered: Report[];
  selectedReport: Report | null;
  selectedReportIds: string[];
  isLoading: boolean;
  isMounting: boolean;
  isError: boolean;
  onRowClick: (r: Report) => void;
  onToggleSelectAll: () => void;
  onToggleSelectReport: (id: string, e: React.MouseEvent | React.ChangeEvent) => void;
}

export function ReportTable({
  filtered,
  selectedReport,
  selectedReportIds,
  isLoading,
  isMounting,
  isError,
  onRowClick,
  onToggleSelectAll,
  onToggleSelectReport,
}: ReportTableProps) {
  if (isLoading || isMounting) {
    return (
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
    );
  }

  if (isError) {
    return null; // error state handled in parent
  }

  const cols = selectedReport ? "1fr" : "40px 90px 1fr 100px 90px 90px 80px";

  return (
    <Box
      as={motion.div as any}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 } as any}
      w={selectedReport ? "420px" : "100%"}
      flexShrink={0}
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="#e2e8f0"
      overflow="hidden"
    >
      {/* Header */}
      <SimpleGrid
        columns={selectedReport ? 1 : 7}
        gap={0}
        p="10px 18px"
        bg="#f8fafc"
        borderBottom="1px solid"
        borderColor="#f1f5f9"
        pt={3}
        pb={3}
        templateColumns={cols}
      >
        {selectedReport ? (
          <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">
            Selected Reports Match
          </Text>
        ) : (
          <>
            <Box display="flex" alignItems="center" pl={1}>
              <Checkbox
                colorScheme="red"
                isChecked={filtered.length > 0 && selectedReportIds.length === filtered.length}
                isIndeterminate={selectedReportIds.length > 0 && selectedReportIds.length < filtered.length}
                onChange={onToggleSelectAll}
              />
            </Box>
            {["Report ID", "Drug / Reporter", "Status", "Severity", "Regulatory", "Type"].map((h, i) => (
              <Box key={h} display="flex" alignItems="center" justifyContent={i >= 2 ? "center" : "flex-start"}>
                <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">{h}</Text>
              </Box>
            ))}
          </>
        )}
      </SimpleGrid>

      {/* Rows */}
      <Box overflowY="auto" maxH="calc(100vh - 280px)">
        {filtered.map((r, i) => (
          <SimpleGrid
            as={motion.div as any}
            key={r.originalId || r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 } as any}
            onClick={() => onRowClick(r)}
            columns={selectedReport ? 1 : 7}
            templateColumns={cols}
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
              <Box pl={1} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Checkbox
                  colorScheme="red"
                  isChecked={selectedReportIds.includes(r.originalId || r.id)}
                  onChange={(e) => onToggleSelectReport(r.originalId || r.id, e)}
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
                <Box display="flex" alignItems="center">
                  <Text m={0} fontFamily="monospace" fontSize="xs" fontWeight="bold" color="#CE0037">{r.id}</Text>
                </Box>
                <Box display="flex" flexDirection="column" justifyContent="center">
                  <Text m={0} fontSize="sm" fontWeight="semibold" color="#0f172a">{r.drug}</Text>
                  <Text m={0} mt="2px" fontSize="xs" color="#94a3b8">{r.reporter} · {r.submitted}</Text>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center"><StatusBadge status={r.status} /></Box>
                <Box display="flex" alignItems="center" justifyContent="center"><SeverityDot severity={r.severity} /></Box>
                <Box display="flex" alignItems="center" justifyContent="center"><ValidationBadge isValid={r.isValid} errors={r.validationErrors} /></Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                  <Badge
                    bg={reporterTypeCfg[r.reporterType].bg}
                    color={reporterTypeCfg[r.reporterType].color}
                    borderRadius="md" px={2} py={0.5} fontSize="2xs" fontWeight="bold" textTransform="none"
                  >
                    {r.reporterType}
                  </Badge>
                </Box>
              </>
            )}
          </SimpleGrid>
        ))}
      </Box>
    </Box>
  );
}
