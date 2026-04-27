import { Box, Heading, Center, Text, VStack, Skeleton, Flex, Badge } from "@chakra-ui/react";
import { Info } from "lucide-react";

interface WhodrugInspectorPanelProps {
  selectedDrugCode: string | null;
  loadingDetails: boolean;
  drugDetails: any;
}

export function WhodrugInspectorPanel({
  selectedDrugCode, loadingDetails, drugDetails
}: WhodrugInspectorPanelProps) {
  return (
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
              <Text fontSize="xs" color="gray.500">Source: {drugDetails.sourceId || "N/A"}</Text>
            </Box>
          </Box>

          <Box>
            <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={2}>Active Ingredients (G.k.2.3.r)</Text>
            <VStack align="stretch" spacing={2}>
            {drugDetails.ingredients.map((ing: any) => (
                <Flex key={ing.code} justify="space-between" align="center" bg="gray.50" p={2} px={3} borderRadius="lg" fontSize="xs" wrap="wrap" gap={2}>
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
  );
}
