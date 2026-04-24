import { useState } from "react";
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
  Box,
  Button,
  Flex,
  useDisclosure,
  useToast, // Added missing import
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Heading
} from "@chakra-ui/react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";

interface NotificationLogTableProps {
  companyId?: string;
}

export function NotificationLogTable({ companyId }: NotificationLogTableProps) {
  const utils = trpc.useContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const toast = useToast();

  const { data: logs, isLoading } = trpc.company.getNotificationLogs.useQuery({
    companyId,
    limit: 25
  });

  const syncMutation = trpc.company.syncInboxes.useMutation({
    onSuccess: () => {
      utils.company.getNotificationLogs.invalidate();
      utils.company.getStats.invalidate();
    }
  });

  const resendMutation = trpc.company.resendNotification.useMutation({
    onSuccess: () => {
      utils.company.getNotificationLogs.invalidate();
      onClose();
      toast({ title: "Resend successful", status: "success" });
    },
    onError: () => {
      toast({ title: "Resend failed", status: "error" });
    }
  });

  const handleRowClick = (log: any) => {
    if (log.status?.toLowerCase() === 'failed' || log.lastError) {
      setSelectedLog(log);
      onOpen();
    }
  };

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
    <Box>
      <Flex justify="flex-end" mb={3}>
        <Button 
          size="xs" 
          leftIcon={<RefreshCw size={12} />} 
          colorScheme="blue" 
          variant="outline"
          isLoading={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
          loadingText="Syncing with IONOS..."
          borderRadius="lg"
        >
          Check for Bounces
        </Button>
      </Flex>
      <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th color="gray.400" fontSize="2xs" px={2}>Report ID</Th>
          {!companyId && <Th color="gray.400" fontSize="2xs">Recipient</Th>}
          <Th color="gray.400" fontSize="2xs" px={2}>Status</Th>
          <Th color="gray.400" fontSize="2xs" px={2}>Time</Th>
          {!companyId && <Th color="gray.400" fontSize="2xs">Protocol</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {logs.map((log) => {
          const isFailed = log.status?.toLowerCase() === 'failed' || log.lastError;
          return (
            <Tr 
              key={log.id} 
              _hover={{ bg: "gray.50", cursor: isFailed ? "pointer" : "default" }} 
              transition="background 0.2s"
              onClick={() => handleRowClick(log)}
            >
              <Td px={2}>
                <Box bg="gray.100" px={2} py={1} borderRadius="md" w="fit-content">
                  <Text fontWeight="800" fontSize="2xs" color="#CE0037" fontFamily="mono">
                    {log.referenceId?.substring(0, 10) || `#R-${log.reportId.substring(0,6)}`}
                  </Text>
                </Box>
              </Td>
              {!companyId && (
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="#1e293b" fontWeight="700">{log.companyName || "Unknown"}</Text>
                    <Text fontSize="3xs" color="gray.400">Recipient</Text>
                  </VStack>
                </Td>
              )}
              <Td px={2}>
                <Tooltip label={isFailed ? "Click for Full Log" : "Delivered"}>
                  <Badge 
                    colorScheme={log.status?.toLowerCase() === 'sent' ? 'green' : 'red'} 
                    variant="solid"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontSize="3xs"
                    textTransform="uppercase"
                  >
                    {log.status?.toLowerCase() === 'sent' ? 'SENT' : 'FAILED'}
                  </Badge>
                </Tooltip>
              </Td>
              <Td px={2}>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xs" color="gray.700" fontWeight="600" whiteSpace="nowrap">
                    {new Date(log.sentAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {!companyId && (
                    <Text fontSize="3xs" color="gray.400" fontWeight="bold">
                      {new Date(log.sentAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  )}
                </VStack>
              </Td>
              {!companyId && (
                <Td>
                  <Badge variant="subtle" colorScheme="blue" fontSize="3xs" px={2} borderRadius="md">E2B R3</Badge>
                </Td>
              )}
            </Tr>
          );
        })}
      </Tbody>
    </Table>

    {/* Technical Error Drawer */}
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <DrawerContent borderRadius="2xl 0 0 2xl" borderLeft="1px solid" borderColor="gray.100">
        <DrawerCloseButton borderRadius="full" m={2} />
        <DrawerHeader borderBottomWidth="1px" borderColor="gray.50" px={6} py={5}>
          <VStack align="start" spacing={0}>
            <Text fontSize="xs" fontWeight="bold" color="#CE0037" textTransform="uppercase" letterSpacing="widest">Transmission Failure</Text>
            <Heading size="md" color="#0f172a" mt={1}>Technical Diagnostic</Heading>
          </VStack>
        </DrawerHeader>

        <DrawerBody p={6} bg="#fdfdfe">
          <VStack align="stretch" spacing={6}>
            {/* Context Stats */}
            <Flex gap={4}>
              <Box flex={1} bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm">
                <Text fontSize="2xs" color="gray.400" fontWeight="bold" mb={1}>Report ID</Text>
                <Text fontSize="sm" fontWeight="bold" color="#CE0037" fontFamily="mono">{selectedLog?.referenceId}</Text>
              </Box>
              <Box flex={1} bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm">
                <Text fontSize="2xs" color="gray.400" fontWeight="bold" mb={1}>Recipient</Text>
                <Text fontSize="sm" fontWeight="bold" color="#1e293b">{selectedLog?.companyName}</Text>
              </Box>
            </Flex>

            {/* Error Message */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={3} display="flex" align="center" gap={2}>
                <Box color="red.500"><AlertCircle size={14} /></Box>
                Detailed Failure Message
              </Text>
              <Box 
                bg="#1a1a1a" 
                color="#e0e0e0" 
                p={5} 
                borderRadius="xl" 
                fontFamily="mono" 
                fontSize="xs" 
                lineHeight="tall"
                overflow="auto"
                maxH="500px"
                border="1px solid"
                borderColor="whiteAlpha.200"
                shadow="dark-lg"
              >
                {selectedLog?.lastError?.split('\n').map((line: string, i: number) => {
                  const [label, ...rest] = line.split(': ');
                  const content = rest.join(': ');
                  if (label && content) {
                    return (
                      <Box key={i} mb={2}>
                        <Text as="span" color="red.400" fontWeight="bold">{label}: </Text>
                        <Text as="span">{content}</Text>
                      </Box>
                    );
                  }
                  return <Box key={i} mb={2}>{line}</Box>;
                }) || "No detailed error message was provided."}
              </Box>
              
              <Button 
                mt={4} 
                w="full" 
                colorScheme="red" 
                size="sm" 
                borderRadius="xl"
                leftIcon={<RefreshCw size={14} />}
                isLoading={resendMutation.isPending}
                onClick={() => resendMutation.mutate({ notificationId: selectedLog.id })}
              >
                Attempt Resend Now
              </Button>
            </Box>

            {/* Hint */}
            <Box bg="blue.50" p={5} borderRadius="xl" border="1px solid" borderColor="blue.100">
              <VStack align="start" spacing={2}>
                <Text fontSize="xs" color="blue.800" fontWeight="bold">Troubleshooting Hint:</Text>
                <Text fontSize="2xs" color="blue.700">
                  This message was captured from the IONOS Postmaster. If it mentions "Recipient Rejected" or "User Unknown," 
                  please verify the manufacturer's email address in your settings.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
    </Box>
  );
}
