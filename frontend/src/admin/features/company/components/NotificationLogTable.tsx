import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Skeleton,
  VStack,
  Tooltip,
  Box
} from "@chakra-ui/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";

interface NotificationLogTableProps {
  companyId?: string;
}

export function NotificationLogTable({ companyId }: NotificationLogTableProps) {
  const { data: logs, isLoading } = trpc.company.getNotificationLogs.useQuery({
    companyId,
    limit: 15
  });

  if (isLoading) {
    return (
      <VStack align="stretch" spacing={2}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} h="40px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  if (!logs?.length) {
    return (
      <Box py={10} textAlign="center">
        <Text color="gray.400" fontSize="sm">No notification records found.</Text>
      </Box>
    );
  }

  return (
    <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th color="gray.400" fontSize="2xs">Report ID</Th>
          {!companyId && <Th color="gray.400" fontSize="2xs">Recipient</Th>}
          <Th color="gray.400" fontSize="2xs">Status</Th>
          <Th color="gray.400" fontSize="2xs">Timestamp</Th>
          <Th color="gray.400" fontSize="2xs">Protocol</Th>
        </Tr>
      </Thead>
      <Tbody>
        {logs.map((log) => (
          <Tr key={log.id} _hover={{ bg: "gray.50" }}>
            <Td>
              <Text fontWeight="bold" fontSize="xs" color="#1e293b">#R-{log.reportId}</Text>
            </Td>
            {!companyId && (
              <Td>
                <Text fontSize="xs" color="gray.600">Company ID: {log.companyId}</Text>
              </Td>
            )}
            <Td>
              <Tooltip label={log.lastError || "Dispatched successfully"}>
                <Badge 
                  colorScheme={log.status === 'SENT' ? 'green' : 'red'} 
                  variant="subtle"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  w="fit-content"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  {log.status === 'SENT' ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <AlertCircle size={10} />
                  )}
                  {log.status}
                </Badge>
              </Tooltip>
            </Td>
            <Td>
              <VStack align="start" spacing={0}>
                <Text fontSize="2xs" color="gray.700">
                  {new Date(log.sentAt!).toLocaleDateString()}
                </Text>
                <Text fontSize="3xs" color="gray.400" textTransform="uppercase">
                  {new Date(log.sentAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </VStack>
            </Td>
            <Td>
              <Badge variant="outline" color="gray.400" fontSize="3xs">E2B R3 (SMTP)</Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
