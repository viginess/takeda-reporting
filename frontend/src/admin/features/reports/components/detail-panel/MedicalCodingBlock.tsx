import { Box, Flex, Text, VStack, Button } from "@chakra-ui/react";
import { Activity, Package, Plus } from "lucide-react";

interface MedicalCodingBlockProps {
  report: any;
  onOpenCodingModal: (idx: number) => void;
  onOpenWhodrugModal: (idx: number) => void;
}

export function MedicalCodingBlock({
  report, onOpenCodingModal, onOpenWhodrugModal
}: MedicalCodingBlockProps) {
  return (
    <>
      {/* MedDRA Symptoms */}
      {report.fullDetails?.symptoms?.length > 0 && (
        <Box mb={5} bg="red.50" borderRadius="xl" p={4} border="1px solid" borderColor="red.100">
          <Flex align="center" gap={2} mb={3}>
            <Activity size={13} color="#CE0037" />
            <Text fontSize="xs" color="#CE0037" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">Medical Coding (MedDRA)</Text>
          </Flex>
          <VStack align="stretch" spacing={2.5}>
            {report.fullDetails.symptoms.map((s: any, idx: number) => (
              <Flex key={idx} justify="space-between" align="center" bg="white" p={2.5} borderRadius="lg" border="1px solid" borderColor="red.100" gap={2}>
                <Box flex={1}>
                  <Text fontSize="xs" fontWeight="bold" color="#1e293b" noOfLines={1}>{s.name || s.symptom || "Unknown Symptom"}</Text>
                  {s.meddraCode
                    ? <Text fontSize="2xs" color="green.600" fontWeight="bold">Mapped: {s.meddraCode}</Text>
                    : <Text fontSize="2xs" color="#94a3b8">Uncoded</Text>}
                </Box>
                <Button size="xs" variant="ghost" colorScheme="red" fontSize="2xs" flexShrink={0}
                  onClick={() => onOpenCodingModal(idx)} leftIcon={<Plus size={10} />}>
                  {s.meddraCode ? "Remap" : "Code"}
                </Button>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      {/* WHODrug Products */}
      {report.fullDetails?.products?.length > 0 && (
        <Box mb={5} bg="blue.50" borderRadius="xl" p={4} border="1px solid" borderColor="blue.100">
          <Flex align="center" gap={2} mb={3}>
            <Package size={13} color="blue.600" />
            <Text fontSize="xs" color="blue.700" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">Drug Coding (WHODrug)</Text>
          </Flex>
          <VStack align="stretch" spacing={2.5}>
            {report.fullDetails.products.map((p: any, idx: number) => (
              <Flex key={idx} justify="space-between" align="center" bg="white" p={2.5} borderRadius="lg" border="1px solid" borderColor="blue.100" gap={2}>
                <Box flex={1}>
                  <Text fontSize="xs" fontWeight="bold" color="#1e293b" noOfLines={1}>{p.productName || p.name || p.product || "Unknown Product"}</Text>
                  {p.whodrugCode
                    ? <Text fontSize="2xs" color="blue.600" fontWeight="bold">Mapped: {p.whodrugCode}</Text>
                    : <Text fontSize="2xs" color="#94a3b8">Uncoded</Text>}
                </Box>
                <Button size="xs" variant="ghost" colorScheme="blue" fontSize="2xs" flexShrink={0}
                  onClick={() => onOpenWhodrugModal(idx)} leftIcon={<Plus size={10} />}>
                  {p.whodrugCode ? "Remap" : "Code"}
                </Button>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}
    </>
  );
}
