import { useState } from "react";
import {
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiCheckCircle, 
  FiUpload 
} from "react-icons/fi";
import { trpc } from "../../../../utils/trpc";
import { MeddraTable } from "./MeddraTable";

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

  return (
    <VStack spacing={6} align="stretch" h="full">
      {/* Filters Bar */}
      <Flex gap={4} wrap="wrap" direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} p={{ base: 3, md: 4 }} bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor} shadow="sm">
        <InputGroup maxW={{ base: "full", md: "350px" }}>
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
            bg="white"
          />
        </InputGroup>

        <Flex align="center" gap={2} flex={1} wrap="wrap">
          <HStack spacing={2} flex={{ base: "1", md: "none" }}>
            <FiFilter color="gray.400" />
            <Select
              minW="140px"
              maxW={{ base: "full", md: "180px" }}
              value={selectedVersion}
              onChange={(e) => {
                setSelectedVersion(e.target.value);
                setPage(1);
                onVersionChange?.(e.target.value);
              }}
              placeholder="Preview Version..."
              borderRadius="lg"
              fontSize="sm"
              bg="white"
            >
              {versions?.map((v) => (
                <option key={v} value={v}>
                  Version {v} {v === activeVersion ? "(Current)" : ""}
                </option>
              ))}
            </Select>
          </HStack>

          {selectedVersion && selectedVersion !== activeVersion && (
            <Button
              size="sm"
              leftIcon={<FiCheckCircle />}
              bg="#CE0037"
              color="white"
              _hover={{ bg: "#E31C5F" }}
              onClick={() => onSetAsActive(selectedVersion)}
              isLoading={isUpdatingVersion}
              fontSize="xs"
              borderRadius="lg"
            >
              Set Active
            </Button>
          )}
          
          {search && (
            <Button
              variant="link"
              fontSize="xs"
              color="gray.400"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              Clear
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
              ml={{ base: "0", md: "auto" }}
              w={{ base: "full", md: "auto" }}
              isDisabled={isImportDisabled}
              fontSize="xs"
            >
              Import MedDRA ZIP
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Results Box */}
      <Box 
        bg={bgColor} 
        borderRadius="xl" 
        border="1px" 
        borderColor={borderColor} 
        shadow="sm" 
        overflow="hidden"
        flex={1}
        display="flex"
        flexDirection="column"
      >
        <MeddraTable
          items={data?.items || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={page}
          pageSize={pageSize}
          activeVersion={activeVersion}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onPageChange={setPage}
        />
      </Box>
    </VStack>
  );
};
