import {
  Box, Flex, Table, Thead, Tbody, Tr, Th, Td, Text, 
  Badge, Button, Skeleton, VStack, Tooltip
} from "@chakra-ui/react";
import { Edit2, AlertCircle } from "lucide-react";

interface CompanyTableProps {
  companies: any[];
  isLoading: boolean;
  onEdit: (company: any) => void;
}

export function CompanyTable({ companies, isLoading, onEdit }: CompanyTableProps) {
  return (
    <Box>
      {/* Desktop View */}
      <Box display={{ base: "none", md: "block" }} overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th color="gray.400" fontSize="2xs">Company Name</Th>
              <Th color="gray.400" fontSize="2xs">Medinfo Email</Th>
              <Th color="gray.400" fontSize="2xs">Status</Th>
              <Th color="gray.400" fontSize="2xs" isNumeric>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <Tr key={i}><Td colSpan={5}><Skeleton h="30px" borderRadius="md" /></Td></Tr>
              ))
            ) : companies?.map((company) => (
              <Tr key={company.id} _hover={{ bg: "gray.50" }} transition="all 0.2s">
                <Td maxW="250px">
                  <VStack align="start" spacing={0} pr={4}>
                    <Flex align="center" gap={2}>
                      <Text fontWeight="700" color="#1e293b" fontSize="sm" isTruncated>{company.name}</Text>
                      {company.lastDeliveryStatus === 'failed' && (
                        <Tooltip label={`Most recent delivery failed: ${company.lastDeliveryError || "Unknown error"}`}>
                          <Box as="span" color="red.500">
                            <AlertCircle size={14} />
                          </Box>
                        </Tooltip>
                      )}
                    </Flex>
                    <Text fontSize="3xs" color="gray.400" textTransform="uppercase">Manufacturer</Text>
                  </VStack>
                </Td>
                <Td>
                  {company.email ? (
                    <Text color="gray.600" fontSize="xs" fontWeight="500">{company.email}</Text>
                  ) : (
                    <Badge colorScheme="orange" variant="subtle" fontSize="2xs" borderRadius="md" px={2} py={0.5}>
                      Email Missing
                    </Badge>
                  )}
                </Td>
                <Td>
                  <Badge 
                    colorScheme={company.isRegistered ? "green" : "gray"} 
                    variant={company.isRegistered ? "solid" : "outline"} 
                    fontSize="2xs"
                    borderRadius="full"
                    px={3}
                  >
                    {company.isRegistered ? "Registered" : "Inactive"}
                  </Badge>
                </Td>
                <Td isNumeric>
                  <Button
                    size="xs"
                    variant="ghost"
                    leftIcon={<Edit2 size={12} />}
                    colorScheme="red"
                    onClick={() => onEdit(company)}
                    borderRadius="lg"
                    _hover={{ bg: "red.50" }}
                  >
                    Manage
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile View - Card Layout */}
      <Box display={{ base: "block", md: "none" }}>
        <VStack spacing={4} align="stretch">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} h="100px" borderRadius="xl" />)
          ) : companies?.map((company) => (
            <Box 
              key={company.id} 
              p={4} 
              bg="white" 
              borderRadius="xl" 
              border="1px solid" 
              borderColor="#f1f5f9"
              shadow="sm"
              onClick={() => onEdit(company)}
            >
              <Flex justify="space-between" align="start" mb={3}>
                <Box>
                  <Text fontWeight="800" color="#1e293b" fontSize="sm">{company.name}</Text>
                  <Text fontSize="2xs" color="gray.400" textTransform="uppercase">Manufacturer</Text>
                </Box>
                <Badge 
                  colorScheme={company.isRegistered ? "green" : "gray"} 
                  variant={company.isRegistered ? "solid" : "outline"} 
                  fontSize="3xs"
                  borderRadius="full"
                  px={2}
                >
                  {company.isRegistered ? "Registered" : "Inactive"}
                </Badge>
              </Flex>
              <Flex justify="space-between" align="center">
                <Box>
                  {company.email ? (
                    <Text color="gray.600" fontSize="xs" fontWeight="500">{company.email}</Text>
                  ) : (
                    <Badge colorScheme="orange" variant="subtle" fontSize="2xs" borderRadius="md" px={2}>
                      Email Missing
                    </Badge>
                  )}
                </Box>
                <Button size="xs" variant="ghost" colorScheme="red" rightIcon={<Edit2 size={10} />} onClick={(e) => { e.stopPropagation(); onEdit(company); }}>
                  Manage
                </Button>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
