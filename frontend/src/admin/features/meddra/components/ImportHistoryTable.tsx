import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Box,
  Heading,
  HStack,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { FiClock, FiCheckCircle, FiXCircle, FiLoader, FiFile } from 'react-icons/fi';

interface ImportHistoryTableProps {
  history: any[];
}

export const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({ history }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge colorScheme="green" variant="subtle" bg="green.50" color="green.700" px={3} py={1} borderRadius="lg" textTransform="capitalize">
            <HStack spacing={1.5}>
              <Icon as={FiCheckCircle} boxSize={3} />
              <Text fontSize="xs" fontWeight="bold">Success</Text>
            </HStack>
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge colorScheme="red" variant="subtle" bg="red.50" color="red.700" px={3} py={1} borderRadius="lg" textTransform="capitalize">
            <HStack spacing={1.5}>
              <Icon as={FiXCircle} boxSize={3} />
              <Text fontSize="xs" fontWeight="bold">Failed</Text>
            </HStack>
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge colorScheme="blue" variant="subtle" bg="blue.50" color="blue.700" px={3} py={1} borderRadius="lg" textTransform="capitalize">
            <HStack spacing={1.5}>
              <Icon as={FiLoader} boxSize={3} className="spin-animation" />
              <Text fontSize="xs" fontWeight="bold">Processing</Text>
            </HStack>
          </Badge>
        );
      default:
        return <Badge colorScheme="gray" variant="subtle" bg="gray.100" color="gray.600" px={3} py={1} borderRadius="lg">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Box 
      mt={10} 
      bg="white" 
      p={8} 
      borderRadius="2xl" 
      border="1px solid" 
      borderColor="gray.100"
      shadow="sm"
    >
      <HStack mb={8} spacing={3}>
        <Box p={2} bg="red.50" borderRadius="lg">
          <Icon as={FiClock} color="red.600" boxSize={5} />
        </Box>
        <VStack align="start" spacing={0}>
          <Heading size="md" color="gray.800" fontWeight="bold">Import History</Heading>
          <Text fontSize="xs" color="gray.500">Track dictionary updates and background processing tasks</Text>
        </VStack>
      </HStack>

      <Table variant="simple" size="md">
        <Thead>
          <Tr borderBottom="2px solid" borderColor="gray.50">
            <Th color="gray.400" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={4}>Date</Th>
            <Th color="gray.400" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={4}>Version</Th>
            <Th color="gray.400" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={4}>File Name</Th>
            <Th color="gray.400" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={4}>Status</Th>
            <Th color="gray.400" textTransform="uppercase" fontSize="xs" letterSpacing="wider" py={4}>Admin</Th>
          </Tr>
        </Thead>
        <Tbody>
          {history.length === 0 ? (
            <Tr>
              <Td colSpan={5} textAlign="center" py={20}>
                <VStack spacing={4}>
                  <Box 
                    p={6} 
                    bg="gray.50" 
                    borderRadius="full" 
                    border="1px dashed" 
                    borderColor="gray.200"
                  >
                    <Icon as={FiClock} boxSize={10} color="gray.300" />
                  </Box>
                  <VStack spacing={1}>
                    <Text color="gray.800" fontWeight="bold" fontSize="lg">No history found</Text>
                    <Text color="gray.500" fontSize="sm">New imports will appear here once they are initiated.</Text>
                  </VStack>
                </VStack>
              </Td>
            </Tr>
          ) : (
            history.map((job) => (
              <Tr 
                key={job.id} 
                _hover={{ bg: "gray.50" }} 
                transition="all 0.2s"
                borderBottom="1px solid"
                borderColor="gray.50"
              >
                <Td color="gray.700" py={5}>
                  <Text fontWeight="medium">{formatDate(job.createdAt)}</Text>
                </Td>
                <Td py={5}>
                  <Badge 
                    colorScheme="blue" 
                    variant="subtle" 
                    bg="blue.50" 
                    color="blue.600" 
                    px={3} 
                    py={0.5} 
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    v{job.version}
                  </Badge>
                </Td>
                <Td color="gray.600" py={5} fontSize="sm">
                  <HStack spacing={2}>
                    <Icon as={FiFile} boxSize={3} color="gray.400" />
                    <Text>{job.fileName}</Text>
                  </HStack>
                </Td>
                <Td py={5}>{getStatusBadge(job.status)}</Td>
                <Td color="gray.500" fontSize="xs" py={5}>
                  <Text isTruncated maxW="150px">{job.createdBy}</Text>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

const styles = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin-animation { animation: spin 2s linear infinite; }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}
