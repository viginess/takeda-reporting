import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  GridItem,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Center,
} from "@chakra-ui/react";
import { Search, Package, Database, Layers, Info } from "lucide-react";
import { trpc } from "../../../utils/config/trpc";
  
export default function WhodrugManagementPage() {
  const [query, setQuery] = useState("");
  const [selectedDrugCode, setSelectedDrugCode] = useState<string | null>(null);

  // 1. Get Dictionary Stats
  const { data: stats, isLoading: loadingStats } = trpc.whodrug.getDictionaryStats.useQuery();

  // 2. Search Drugs
  const { data: searchResults, isLoading: searching } = trpc.whodrug.searchDrugs.useQuery(
    { query, limit: 15 },
    { enabled: query.length >= 2 }
  );

  // 3. Get Drug Details
  const { data: drugDetails, isLoading: loadingDetails } = trpc.whodrug.getDrugDetails.useQuery(
    { code: selectedDrugCode ?? "" },
    { enabled: !!selectedDrugCode }
  );

  return (
    <Box p={{ base: 4, md: 8 }} bg="#f8fafc" minH="100vh" fontFamily="'DM Sans', sans-serif">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Flex align="center" gap={3} mb={1}>
            <Package size={24} color="#CE0037" />
            <Heading size={{ base: "md", md: "lg" }} color="#1e293b" letterSpacing="-0.5px">WHODrug Management</Heading>
          </Flex>
          <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
            Monitor dictionary volume and explore regulatory drug terminology (Global B3).
          </Text>
        </Box>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={4}>
          <SummaryStat label="Medicinal Products" value={stats?.counts.medicinalProducts} icon={Database} isLoading={loadingStats} />
          <SummaryStat label="Active Ingredients" value={stats?.counts.ingredients} icon={Layers} isLoading={loadingStats} />
          <SummaryStat label="Dictionary Version" value={stats?.version} icon={Info} isLoading={loadingStats} isText />
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 400px" }} gap={6}>
          {/* Search Section */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
              <Heading size="sm" mb={4} color="#1e293b">Drug Browser</Heading>
              
              <InputGroup mb={6}>
                <InputLeftElement pointerEvents="none"><Search size={18} color="#94a3b8" /></InputLeftElement>
                <Input
                  placeholder="Search Trade Name (e.g. Paracetamol, Aspirin...)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  borderRadius="xl" border="2px solid" borderColor="#f1f5f9"
                  _focus={{ borderColor: "#CE0037", boxShadow: "none" }}
                />
              </InputGroup>

              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="gray.400" fontSize="2xs">Trade Name</Th>
                      <Th color="gray.400" fontSize="2xs">Rid Code</Th>
                      <Th color="gray.400" fontSize="2xs" isNumeric>Match %</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {searching ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <Tr key={i}><Td colSpan={3}><Skeleton h="30px" borderRadius="md" /></Td></Tr>
                      ))
                    ) : searchResults?.map((drug: any) => (
                      <Tr 
                        key={drug.rid} 
                        cursor="pointer" 
                        _hover={{ bg: "red.50" }} 
                        onClick={() => setSelectedDrugCode(drug.code)}
                        bg={selectedDrugCode === drug.code ? "red.50" : "transparent"}
                      >
                        <Td fontWeight="bold" color="#1e293b">{drug.name}</Td>
                        <Td><Badge variant="outline" colorScheme="red" fontSize="2xs">{drug.code}</Badge></Td>
                        <Td isNumeric color="gray.500" fontSize="xs">{(drug.similarity * 100).toFixed(0)}%</Td>
                      </Tr>
                    ))}
                    {!searching && query.length >= 2 && !searchResults?.length && (
                      <Tr><Td colSpan={3} py={10} textAlign="center" color="gray.400">No matching drugs found</Td></Tr>
                    )}
                    {query.length < 2 && (
                      <Tr><Td colSpan={3} py={10} textAlign="center" color="gray.400">Enter at least 2 characters to search</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          </GridItem>

          {/* Details Section */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm" position="sticky" top={8}>
              <Heading size="sm" mb={4} color="#1e293b">Drug Inspector</Heading>
              
              {!selectedDrugCode ? (
                <Center py={20} flexDirection="column" gap={3}>
                  <Box p={4} bg="gray.50" borderRadius="full"><Info size={24} color="#94a3b8" /></Box>
                  <Text color="gray.400" fontSize="sm" textAlign="center">Select a drug from the browser to view regulatory details.</Text>
                </Center>
              ) : loadingDetails ? (
                <VStack spacing={4} align="stretch">
                  <Skeleton h="20px" w="150px" />
                  <Skeleton h="100px" />
                  <Skeleton h="200px" />
                </VStack>
              ) : drugDetails && (
                <VStack align="stretch" spacing={5}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={1}>Core Information</Text>
                    <Box bg="#f8fafc" p={3} borderRadius="xl" border="1px" borderColor="gray.100">
                      <Text fontWeight="bold" color="#0f172a">{drugDetails.tradeName}</Text>
                      <Text fontSize="xs" color="gray.500">Record ID (RID): {drugDetails.rid}</Text>
                      <Text fontSize="xs" color="gray.500">Source: {drugDetails.sourceCode || "N/A"}</Text>
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={2}>Active Ingredients (G.k.2.3.r)</Text>
                    <VStack align="stretch" spacing={2}>
                      {drugDetails.ingredients.map((ing: any) => (
                        <Flex key={ing.code} justify="space-between" align="center" bg="gray.50" p={2} px={3} borderRadius="lg" fontSize="xs">
                          <Text fontWeight="semibold" color="#1e293b">{ing.name}</Text>
                          <Badge variant="subtle" fontSize="2xs">{ing.code}</Badge>
                        </Flex>
                      ))}
                      {!drugDetails.ingredients.length && <Text fontSize="xs" color="gray.400">No ingredients enumerated</Text>}
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={2}>ATC Classification</Text>
                    <VStack align="stretch" spacing={2}>
                      {drugDetails.atcs.map((atc: any) => (
                        <Box key={atc.atcCode} bg="blue.50" p={2} px={3} borderRadius="lg">
                          <Flex justify="space-between" align="center" mb={1}>
                            <Text fontWeight="bold" fontSize="2xs" color="blue.700">{atc.atcCode}</Text>
                          </Flex>
                          <Text fontSize="2xs" color="blue.600" noOfLines={1}>{atc.description}</Text>
                        </Box>
                      ))}
                      {!drugDetails.atcs.length && <Text fontSize="xs" color="gray.400">No ATC hierarchy found</Text>}
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Box>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}

function SummaryStat({ label, value, icon: Icon, isLoading, isText }: any) {
  return (
    <Stat bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
      <Flex justify="space-between" align="center" mb={1}>
        <StatLabel color="gray.500" fontSize="2xs" fontWeight="extrabold" textTransform="uppercase" letterSpacing="0.1em">{label}</StatLabel>
        <Box p={2} bg="red.50" borderRadius="xl"><Icon size={14} color="#CE0037" /></Box>
      </Flex>
      {isLoading ? (
        <Skeleton h="30px" w="100px" mt={2} />
      ) : (
        <StatNumber color="#1e293b" fontSize={isText ? "md" : "2xl"}>
          {isText ? value : (value?.toLocaleString() || "0")}
        </StatNumber>
      )}
    </Stat>
  );
}
