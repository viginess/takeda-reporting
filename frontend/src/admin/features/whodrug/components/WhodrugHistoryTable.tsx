import { Box, Flex, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Tooltip, Heading } from "@chakra-ui/react";
import { History } from "lucide-react";

interface WhodrugHistoryTableProps {
  importHistory: any[];
  onDeleteVersion: (version: string) => void;
  isDeleting: boolean;
}

export function WhodrugHistoryTable({
  importHistory, onDeleteVersion, isDeleting
}: WhodrugHistoryTableProps) {
  return (
    <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
      <Flex align="center" gap={2} mb={4}>
        <History size={18} color="#94a3b8" />
        <Heading size="sm" color="#1e293b">Dictionary Import History</Heading>
      </Flex>
      
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th color="gray.400" fontSize="2xs">Version</Th>
              <Th color="gray.400" fontSize="2xs">File Name</Th>
              <Th color="gray.400" fontSize="2xs">Status</Th>
              <Th color="gray.400" fontSize="2xs" isNumeric>Date</Th>
              <Th w="40px"></Th>
            </Tr>
          </Thead>
          <Tbody>
            {importHistory?.map((job: any) => (
              <Tr key={job.id} _hover={{ bg: "gray.50" }}>
                <Td fontWeight="bold" color="#1e293b">{job.version}</Td>
                <Td color="gray.500" fontSize="xs">{job.fileName}</Td>
                <Td>
                  <Badge 
                    colorScheme={
                      job.status === 'COMPLETED' ? 'green' : 
                      job.status === 'FAILED' ? 'red' : 
                      'blue'
                    }
                    variant="subtle"
                    fontSize="2xs"
                    borderRadius="full"
                    px={2}
                  >
                    {job.status}
                  </Badge>
                </Td>
                <Td isNumeric color="gray.400" fontSize="xs">
                  {new Date(job.createdAt!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </Td>
                <Td>
                  <Tooltip label="Delete completely">
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete the dictionary: ${job.version}?`)) {
                          onDeleteVersion(job.version);
                        }
                      }}
                      isLoading={isDeleting}
                    >
                      Delete
                    </Button>
                  </Tooltip>
                </Td>
              </Tr>
            ))}
            {!importHistory?.length && (
              <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.400">No import records found</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
