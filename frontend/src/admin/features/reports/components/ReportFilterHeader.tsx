import { 
  Box, Flex, Text, Heading, Button, Input, 
  InputGroup, InputLeftElement 
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { statusOptions } from "../types";

interface ReportFilterHeaderProps {
  search: string;
  setSearch: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  viewMode: "active" | "archived";
  setViewMode: (v: "active" | "archived") => void;
}

export function ReportFilterHeader({
  search, setSearch, filterStatus, setFilterStatus, 
  filterType, setFilterType, viewMode, setViewMode
}: ReportFilterHeaderProps) {
  return (
    <Box pt={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} justify="space-between" mb={6} gap={4}>
        <Box as={motion.div as any} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Flex align="center" gap={3} mb={1}>
            <FileText size={22} color="#CE0037" />
            <Heading as="h1" size={{ base: "md", md: "lg" }} color="#0f172a" letterSpacing="-0.5px">Report Management</Heading>
          </Flex>
          <Text color="#64748b" fontSize={{ base: "xs", md: "sm" }}>Review and update drug safety reports</Text>
        </Box>
      </Flex>

      <Flex 
        as={motion.div as any} 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.08 } as any} 
        direction={{ base: 'column', lg: 'row' }}
        gap={3} 
        mb={5} 
        align={{ base: 'stretch', lg: 'center' }}
      >
        <Box position="relative" flex={1}>
          <InputGroup>
            <InputLeftElement pointerEvents="none"><Search size={14} color="#94a3b8" /></InputLeftElement>
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search ID, drug, or reporter..."
              bg="white" borderColor="#e2e8f0" borderRadius="lg" fontSize="sm" />
          </InputGroup>
        </Box>
        <Flex direction={{ base: 'column', sm: 'row' }} gap={3} wrap="wrap">
          <Flex gap={1.5} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1.5} wrap="wrap">
            {["All", ...statusOptions].map(s => (
              <Button key={s} onClick={() => setFilterStatus(s)} size="xs" minW="55px" borderRadius="md" fontSize="2xs"
                variant={filterStatus === s ? "solid" : "ghost"}
                bg={filterStatus === s ? "#CE0037" : "transparent"}
                color={filterStatus === s ? "white" : "#64748b"}
                _hover={filterStatus === s ? {} : { bg: "#f8fafc" }}>{s}</Button>
            ))}
          </Flex>
          <Flex gap={1.5} bg="white" border="1px solid" borderColor="#e2e8f0" borderRadius="xl" p={1.5} wrap="wrap">
            {["All", "Patient", "HCP", "Family"].map(t => (
              <Button key={t} onClick={() => setFilterType(t)} size="xs" minW="55px" borderRadius="md" fontSize="2xs"
                variant={filterType === t ? "solid" : "ghost"}
                bg={filterType === t ? "#CE0037" : "transparent"}
                color={filterType === t ? "white" : "#64748b"}
                _hover={filterType === t ? {} : { bg: "#f8fafc" }}>{t}</Button>
            ))}
          </Flex>
        </Flex>

        <Flex gap={2} bg="gray.100" p={1} borderRadius="xl" ml={{ lg: "auto" }}>
          <Button 
            size="xs" 
            px={4} 
            borderRadius="lg"
            variant={viewMode === "active" ? "solid" : "ghost"}
            bg={viewMode === "active" ? "white" : "transparent"}
            shadow={viewMode === "active" ? "sm" : "none"}
            onClick={() => setViewMode("active")}
          >
            Active Reports
          </Button>
          <Button 
            size="xs" 
            px={4} 
            borderRadius="lg"
            variant={viewMode === "archived" ? "solid" : "ghost"}
            bg={viewMode === "archived" ? "white" : "transparent"}
            shadow={viewMode === "archived" ? "sm" : "none"}
            onClick={() => setViewMode("archived")}
          >
            Archives
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
