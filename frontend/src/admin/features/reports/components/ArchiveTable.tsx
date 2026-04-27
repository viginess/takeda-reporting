import { 
  Table, Thead, Tbody, Tr, Th, Td, Box, Text, 
  Badge, Skeleton, VStack, Button, Icon,
  Flex
} from "@chakra-ui/react";
import { History as HistoryIcon, Eye, AlertCircle } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";

interface ArchiveTableProps {
  onViewDetails: (storagePath: string, referenceId: string) => void;
}

export function ArchiveTable({ onViewDetails }: ArchiveTableProps) {
  const { data: archives, isLoading, isError } = trpc.admin.getArchivedReports.useQuery();

  if (isError) {
    return (
      <Box bg="white" borderRadius="xl" border="1px" borderColor="#e2e8f0" p={20} flex={1} textAlign="center">
        <Icon as={AlertCircle} boxSize={10} color="red.300" mb={4} />
        <Text color="red.500" fontWeight="medium">Database error. Please run migrations.</Text>
        <Text fontSize="xs" color="gray.400" mt={2}>Try running: npm run db:migrate</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box bg="white" borderRadius="xl" border="1px" borderColor="#e2e8f0" p={4} flex={1} overflow="auto">
        <VStack spacing={3} align="stretch">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h="45px" borderRadius="md" />)}
        </VStack>
      </Box>
    );
  }

  if (!archives || archives.length === 0) {
    return (
      <Box bg="white" borderRadius="xl" border="1px" borderColor="#e2e8f0" p={20} flex={1} textAlign="center">
        <Icon as={HistoryIcon} boxSize={10} color="gray.300" mb={4} />
        <Text color="gray.500" fontWeight="medium">No archived reports found.</Text>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="xl" border="1px" borderColor="#e2e8f0" overflow="hidden" flex={1} display="flex" flexDirection="column">
      {/* Desktop View */}
      <Box display={{ base: "none", md: "block" }} overflowX="auto" overflowY="auto" flex={1}>
        <Table variant="simple" size="sm">
          <Thead bg="#f8fafc" position="sticky" top={0} zIndex={1}>
            <Tr>
              <Th color="#64748b" fontSize="2xs" py={4}>Reference ID</Th>
              <Th color="#64748b" fontSize="2xs">Reporter Type</Th>
              <Th color="#64748b" fontSize="2xs">Archived At</Th>
              <Th color="#64748b" fontSize="2xs" isNumeric>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {archives.map((row: any) => (
              <Tr key={row.id} _hover={{ bg: "#fdf2f4" }} transition="all 0.2s">
                <Td>
                  <Text fontWeight="bold" color="#1e293b" fontSize="xs">{row.referenceId}</Text>
                </Td>
                <Td>
                  <Badge 
                    variant="subtle" 
                    colorScheme={row.reporterType === 'HCP' ? 'blue' : 'purple'}
                    fontSize="2xs"
                    px={2}
                    borderRadius="md"
                  >
                    {row.reporterType}
                  </Badge>
                </Td>
                <Td>
                  <Text color="#64748b" fontSize="2xs">
                    {new Date(row.archivedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    colorScheme="red" 
                    leftIcon={<Eye size={14} />}
                    onClick={() => onViewDetails(row.storagePath, row.referenceId)}
                  >
                    View Details
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile View - Card Layout */}
      <Box display={{ base: "block", md: "none" }} p={3}>
        <VStack spacing={3} align="stretch">
          {archives.map((row: any) => (
            <Box 
              key={row.id} 
              p={4} 
              bg="white" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="#f1f5f9"
              shadow="sm"
              onClick={() => onViewDetails(row.storagePath, row.referenceId)}
              cursor="pointer"
              _active={{ bg: "gray.50" }}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="extrabold" color="#CE0037" fontSize="sm">{row.referenceId}</Text>
                <Badge 
                  variant="subtle" 
                  colorScheme={row.reporterType === 'HCP' ? 'blue' : 'purple'}
                  fontSize="3xs"
                  borderRadius="full"
                  px={2}
                >
                  {row.reporterType}
                </Badge>
              </Flex>
              <Flex justify="space-between" align="center">
                <Text color="gray.500" fontSize="2xs">
                  {new Date(row.archivedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
                <Button 
                  size="xs" 
                  variant="link" 
                  colorScheme="red" 
                  rightIcon={<Eye size={12} />}
                  onClick={(e) => { e.stopPropagation(); onViewDetails(row.storagePath, row.referenceId); }}
                >
                  View
                </Button>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

      <Box p={3} bg="#f8fafc" borderTop="1px" borderColor="#e2e8f0">
        <Text fontSize="2xs" color="gray.400" textAlign="center">
          Showing {archives.length} archived reports stored in Supabase.
        </Text>
      </Box>
    </Box>
  );
}
