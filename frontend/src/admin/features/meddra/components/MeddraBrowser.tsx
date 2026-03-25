import { useState } from "react";
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
  useColorModeValue,
  IconButton,
  Tooltip,
  Text,
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight, 
  FiFilter, 
  FiCheckCircle,
  FiUpload
} from "react-icons/fi";
import { trpc } from "../../../../utils/trpc";

interface MeddraBrowserProps {
  activeVersion?: string;
  onVersionChange?: (version: string) => void;
  onSetAsActive: (version: string) => void;
  isUpdatingVersion: boolean;
  onImportOpen?: () => void;
  isImportDisabled?: boolean;
}

export const MeddraBrowser = ({ 
  activeVersion, 
  onVersionChange, 
  onSetAsActive,
  isUpdatingVersion,
  onImportOpen,
  isImportDisabled
}: MeddraBrowserProps) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  const { data: versions } = trpc.reference.getMeddraVersions.useQuery();
  const [sortBy, setSortBy] = useState<"lltCode" | "lltName">("lltName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = trpc.reference.getPaginatedMeddraList.useQuery({
    page,
    pageSize,
    search: search.length >= 2 ? search : undefined,
    version: selectedVersion || activeVersion,
    sortBy,
    sortOrder,
  }, {
    placeholderData: (prev) => prev,
  });

  const handleSort = (column: "lltCode" | "lltName") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  
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
          onClick={() => setPage(i)}
          _hover={page === i ? {} : { bg: "red.50", color: "#CE0037" }}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Filters Bar */}
      <Flex gap={4} wrap="wrap" align="center" p={4} bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor} shadow="sm">
        <InputGroup maxW="350px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search terms or codes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            borderRadius="lg"
            fontSize="sm"
          />
        </InputGroup>

        <Flex align="center" gap={2} flex={1}>
          <FiFilter color="gray.400" />
          <Select
            maxW="180px"
            value={selectedVersion}
            onChange={(e) => {
              setSelectedVersion(e.target.value);
              setPage(1);
              onVersionChange?.(e.target.value);
            }}
            placeholder="Preview Version..."
            borderRadius="lg"
            fontSize="sm"
          >
            {versions?.map((v) => (
              <option key={v} value={v}>
                Version {v} {v === activeVersion ? "(Current)" : ""}
              </option>
            ))}
          </Select>

          {selectedVersion && selectedVersion !== activeVersion && (
            <Button
              size="sm"
              leftIcon={<FiCheckCircle />}
              bg="#CE0037"
              color="white"
              _hover={{ bg: "#E31C5F" }}
              onClick={() => onSetAsActive(selectedVersion)}
              isLoading={isUpdatingVersion}
            >
              Set v{selectedVersion} as Active
            </Button>
          )}
          
          {(search || selectedVersion) && (
            <Button
              variant="link"
              fontSize="xs"
              color="gray.400"
              onClick={() => {
                setSearch("");
                setSelectedVersion("");
                setPage(1);
                onVersionChange?.("");
              }}
            >
              Clear all filters
            </Button>
          )}
          {/* Custom Actions (Import Button) */}
          {onImportOpen && (
            <Button
              leftIcon={<FiUpload />}
              colorScheme="primary"
              variant="solid"
              shadow="sm"
              onClick={onImportOpen}
              size="sm"
              borderRadius="lg"
              ml="auto"
              isDisabled={isImportDisabled}
            >
              Import MedDRA ZIP
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Results table */}
      <Box bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th py={4} cursor="pointer" onClick={() => handleSort("lltCode")} _hover={{ color: "#CE0037" }}>
                Code {sortBy === "lltCode" && (sortOrder === "asc" ? "↑" : "↓")}
              </Th>
              <Th py={4} cursor="pointer" onClick={() => handleSort("lltName")} _hover={{ color: "#CE0037" }}>
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
            ) : data?.items.length === 0 ? (
              <Tr>
                <Td colSpan={4} py={12} textAlign="center">
                  <VStack spacing={2}>
                    <FiFilter size={32} color="gray.200" />
                    <Text color="gray.500" fontWeight="medium">No dictionary terms found matching your query.</Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              data?.items.map((item) => (
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

        <Flex p={4} justify="space-between" align="center" bg="gray.50" borderTop="1px" borderColor={borderColor}>
          <Text fontSize="xs" color="gray.500" fontWeight="600">
            SHOWING {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data?.total || 0)} OF {data?.total || 0} TERMS
          </Text>
          
          <HStack spacing={2}>
            <Tooltip label="Back 10 Pages">
              <IconButton aria-label="Back 10 pages" icon={<FiChevronsLeft />} isDisabled={page <= 1} onClick={() => setPage(Math.max(1, page - 10))} size="sm" variant="ghost" color="gray.400" />
            </Tooltip>
            <IconButton aria-label="Previous page" icon={<FiChevronLeft />} isDisabled={page === 1} onClick={() => setPage(page - 1)} size="sm" variant="ghost" color="gray.400" />
            <HStack spacing={1}>{renderPageButtons()}</HStack>
            <IconButton aria-label="Next page" icon={<FiChevronRight />} isDisabled={!data || page * pageSize >= (data?.total || 0)} onClick={() => setPage(page + 1)} size="sm" variant="ghost" color="gray.400" />
            <Tooltip label="Forward 10 Pages">
              <IconButton aria-label="Forward 10 pages" icon={<FiChevronsRight />} isDisabled={!data || (page + 1) * pageSize >= (data?.total || 0)} onClick={() => setPage(Math.min(totalPages, page + 10))} size="sm" variant="ghost" color="gray.400" />
            </Tooltip>
          </HStack>
        </Flex>
      </Box>
    </VStack>
  );
};
