import { motion } from "framer-motion";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Badge,
  Skeleton,
  VStack,
  IconButton,
  Text,
  Center,
  useBreakpointValue,
  Flex,
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight, 
} from "react-icons/fi";

interface MeddraItem {
  lltCode: number;
  lltName: string;
  ptCode: number;
  meddraVersion: string;
}

interface MeddraTableProps {
  items: MeddraItem[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  activeVersion?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: "lltCode" | "lltName") => void;
  onPageChange: (page: number) => void;
}

export function MeddraTable({
  items,
  isLoading,
  total,
  page,
  pageSize,
  activeVersion,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
}: MeddraTableProps) {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const totalPages = Math.ceil(total / pageSize);

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={page === i ? "solid" : "outline"}
          bg={page === i ? "#CE0037" : "transparent"}
          color={page === i ? "white" : "gray.600"}
          onClick={() => onPageChange(i)}
          _hover={page === i ? {} : { bg: "red.50", color: "#CE0037" }}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  // 🧬 Mobile Card View
  if (isMobile) {
    return (
      <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
        <Box overflowY="auto" flex={1} px={1}>
          <VStack align="stretch" spacing={4} p={3} pb={10}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} p={4} bg="white" borderRadius="xl" border="1px" borderColor="gray.200">
                  <Flex justify="space-between" mb={3}>
                    <Skeleton h="16px" w="100px" />
                    <Skeleton h="20px" w="60px" />
                  </Flex>
                  <Skeleton h="24px" w="80%" mb={3} />
                  <Skeleton h="16px" w="120px" />
                </Box>
              ))
            ) : items.length === 0 ? (
              <Center py={20} flexDirection="column" gap={4}>
                <Box p={6} bg="gray.100" borderRadius="full">
                  <FiSearch size={32} color="gray.400" />
                </Box>
                <Text color="gray.500" fontWeight="bold">No dictionary terms found</Text>
              </Center>
            ) : (
              items.map((item, i) => (
                <Box
                  key={item.lltCode}
                  as={motion.div as any}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 } as any}
                  p={5}
                  bg="white"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="gray.200"
                  shadow="sm"
                  _hover={{ borderColor: "#CE0037", shadow: "md" }}
                >
                  <VStack align="stretch" spacing={3}>
                    <Flex justify="space-between" align="center">
                      <Text fontFamily="monospace" fontSize="xs" fontWeight="900" color="#CE0037">
                        {item.lltCode}
                      </Text>
                      <Badge variant="solid" bg={item.meddraVersion === activeVersion ? "#1e293b" : "gray.100"} color={item.meddraVersion === activeVersion ? "white" : "gray.600"} px={2} borderRadius="md" fontSize="2xs">
                        v{item.meddraVersion}
                      </Badge>
                    </Flex>
                    <Box>
                      <Text fontSize="md" fontWeight="800" color="gray.700" lineHeight="short">
                        {item.lltName}
                      </Text>
                    </Box>
                    <Flex pt={2} borderTop="1px solid" borderColor="gray.50" align="center" gap={2}>
                       <Text fontSize="2xs" fontWeight="bold" color="gray.400" textTransform="uppercase">PT CODE:</Text>
                       <Text fontSize="xs" fontWeight="bold" color="gray.600">{item.ptCode}</Text>
                    </Flex>
                  </VStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>
        {renderPagination()}
      </Box>
    );
  }

  // 📊 Desktop Table View
  return (
    <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
      <Box overflowX="auto" flex={1}>
        <Table variant="simple" size="sm" minW="600px">
          <Thead bg="gray.50">
            <Tr>
              <Th py={4} cursor="pointer" onClick={() => onSort("lltCode")} _hover={{ color: "#CE0037" }}>
                Code {sortBy === "lltCode" && (sortOrder === "asc" ? "↑" : "↓")}
              </Th>
              <Th py={4} cursor="pointer" onClick={() => onSort("lltName")} _hover={{ color: "#CE0037" }}>
                Term Name {sortBy === "lltName" && (sortOrder === "asc" ? "↑" : "↓")}
              </Th>
              <Th py={4}>PT Code</Th>
              <Th py={4}>Version</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <Tr key={i}>
                  <Td py={4}><Skeleton h="18px" w="90px" /></Td>
                  <Td py={4}><Skeleton h="18px" w="220px" /></Td>
                  <Td py={4}><Skeleton h="18px" w="80px" /></Td>
                  <Td py={4}><Skeleton h="18px" w="50px" /></Td>
                </Tr>
              ))
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={4} py={12} textAlign="center">
                  <VStack spacing={2}>
                    <FiSearch size={32} color="gray.200" />
                    <Text color="gray.500" fontWeight="medium">No terms found.</Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              items.map((item) => (
                <Tr key={item.lltCode} _hover={{ bg: "red.50" }} transition="background 0.2s">
                  <Td py={4} fontWeight="bold" color="#CE0037" fontFamily="monospace">{item.lltCode}</Td>
                  <Td py={4} fontWeight="600" color="gray.700">{item.lltName}</Td>
                  <Td py={4} color="gray.500">{item.ptCode}</Td>
                  <Td py={4}>
                    <Badge variant="subtle" colorScheme={item.meddraVersion === activeVersion ? "red" : "gray"} px={2} borderRadius="md">
                      v{item.meddraVersion}
                    </Badge>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      {renderPagination()}
    </Box>
  );

  function renderPagination() {
    return (
      <Flex p={4} justify="space-between" align="center" bg="gray.50" borderTop="1px" borderColor="gray.200" direction={{ base: "column", md: "row" }} gap={4}>
        <Text fontSize="xs" color="gray.500" fontWeight="700" letterSpacing="tight">
          SHOWING {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} OF {total}
        </Text>
        
        <HStack spacing={1} overflowX="auto" maxW="full" pb={{ base: 2, md: 0 }}>
          <IconButton aria-label="First page" icon={<FiChevronsLeft />} isDisabled={page <= 1} onClick={() => onPageChange(1)} size="xs" variant="ghost" color="gray.400" display={{ base: "none", sm: "flex" }} />
          <IconButton aria-label="Previous page" icon={<FiChevronLeft />} isDisabled={page === 1} onClick={() => onPageChange(page - 1)} size="sm" variant="ghost" color="gray.400" />
          <HStack spacing={1}>{renderPageButtons()}</HStack>
          <IconButton aria-label="Next page" icon={<FiChevronRight />} isDisabled={!items || page * pageSize >= total} onClick={() => onPageChange(page + 1)} size="sm" variant="ghost" color="gray.400" />
          <IconButton aria-label="Last page" icon={<FiChevronsRight />} isDisabled={!items || page * pageSize >= total} onClick={() => onPageChange(totalPages)} size="xs" variant="ghost" color="gray.400" display={{ base: "none", sm: "flex" }} />
        </HStack>
      </Flex>
    );
  }
}
