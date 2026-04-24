import { Search, AlertCircle } from "lucide-react";
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Heading, Text, Box, Badge, Flex, VStack, Input, InputGroup,
  InputLeftElement, Skeleton, Center, useToast,
  Spinner
} from "@chakra-ui/react";
import type { Report, MedDRATerm } from "../types";
import { useState } from "react";

interface MedDRAModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: Report | null;
  codingSymptomIndex: number | null;
  meddraQuery: string;
  setMeddraQuery: (v: string) => void;
  meddraResults: MedDRATerm[] | undefined;
  searchingMeddra: boolean;
  updateMutation: { mutateAsync: (args: any) => Promise<any> };
  onSymptomUpdated: (report: Report) => void;
}

export function MedDRAModal({
  isOpen,
  onClose,
  selectedReport,
  codingSymptomIndex,
  meddraQuery,
  setMeddraQuery,
  meddraResults,
  searchingMeddra,
  updateMutation,
  onSymptomUpdated,
}: MedDRAModalProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const symptom = codingSymptomIndex !== null
    ? selectedReport?.fullDetails?.symptoms?.[codingSymptomIndex]
    : null;

  return (
    <Modal isOpen={isOpen} onClose={isSaving ? () => {} : onClose} size="xl">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent borderRadius="2xl" p={2} mx={{ base: 4, md: 0 }} overflow="hidden">
        {isSaving && (
          <Box
            position="absolute"
            top={0} left={0} right={0} bottom={0}
            bg="whiteAlpha.800"
            zIndex={10}
            display="flex"
            alignItems="center"
            justifyContent="center"
            backdropFilter="blur(2px)"
          >
            <VStack spacing={4}>
              <Spinner size="xl" color="#CE0037" thickness="4px" />
              <Text fontWeight="700" color="#1e293b">Applying Coding...</Text>
            </VStack>
          </Box>
        )}
        <ModalCloseButton mt={2} mr={2} isDisabled={isSaving} />
        <ModalBody p={5} opacity={isSaving ? 0.3 : 1}>
          <Heading size="md" mb={1} color="#1e293b">Medical Coding (MedDRA)</Heading>
          <Text fontSize="sm" color="#64748b" mb={6}>Map the reported symptom to an official MedDRA term.</Text>

          {symptom && (
            <Box bg="#f8fafc" p={4} borderRadius="xl" border="1px solid" borderColor="#e2e8f0" mb={6}>
              <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={1}>Reported Symptom</Text>
              <Text fontWeight="700" color="#0f172a">{symptom.name || symptom.symptom || "Unknown"}</Text>
              {symptom.meddraCode && (
                <Badge mt={2} colorScheme="green" variant="subtle" borderRadius="md">
                  Current Code: {symptom.meddraCode}
                </Badge>
              )}
            </Box>
          )}

          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none"><Search size={18} color="#94a3b8" /></InputLeftElement>
            <Input
              placeholder="Search MedDRA (e.g. Headache, Nausea...)"
              value={meddraQuery}
              onChange={(e) => setMeddraQuery(e.target.value.replace(/"/g, ""))}
              isDisabled={isSaving}
              borderRadius="xl" border="2px solid" borderColor="#f1f5f9"
              _focus={{ borderColor: "#CE0037", boxShadow: "none" }}
            />
          </InputGroup>

          <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto" pr={2}>
            {searchingMeddra && (
              <VStack spacing={2} align="stretch" py={2}>
                {[1, 2, 3].map(i => <Skeleton key={i} h="40px" borderRadius="xl" />)}
              </VStack>
            )}
            {meddraResults?.map((term: MedDRATerm) => (
              <Box
                key={term.code || "uncoded"}
                p={3} borderRadius="xl" border="1px solid" borderColor="#f1f5f9"
                cursor={isSaving ? "not-allowed" : "pointer"} 
                transition="all 0.2s" 
                _hover={!isSaving ? { bg: "red.50", borderColor: "red.100" } : {}}
                onClick={async () => {
                  if (codingSymptomIndex === null || !selectedReport || isSaving) return;
                  setIsSaving(true);
                  
                  const updatedSymptoms = [...selectedReport.fullDetails.symptoms];
                  updatedSymptoms[codingSymptomIndex] = {
                    ...updatedSymptoms[codingSymptomIndex],
                    meddraCode: term.code || null,
                    meddraTerm: term.term || "Unknown",
                    name: term.term || "Unknown",    // Sync display name
                    symptom: term.term || "Unknown" // Sync display name
                  };
                  try {
                    const res = await updateMutation.mutateAsync({
                      reportId: selectedReport.originalId!,
                      reporterType: selectedReport.reporterType,
                      updates: { symptoms: updatedSymptoms }
                    });
                    
                    toast({ title: "Symptom Coded", description: `Linked to MedDRA term: ${term.term}`, status: "success" });
                    
                    // Update state locally with merged data to prevent structure mismatch crash
                    onSymptomUpdated({ 
                      ...selectedReport, 
                      fullDetails: { 
                        ...selectedReport.fullDetails, 
                        symptoms: updatedSymptoms 
                      },
                      // If the backend returned new validation status, include it
                      isValid: res?.data?.isValid ?? selectedReport.isValid,
                      validationErrors: res?.data?.validationErrors ?? selectedReport.validationErrors
                    });
                    onClose();
                  } catch (err: any) {
                    toast({ title: "Coding Failed", description: err.message, status: "error" });
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="#1e293b">{term.term || "Unknown Term"}</Text>
                    <Text fontSize="xs" color="#64748b">{term.description || "No description"}</Text>
                  </Box>
                  {term.code
                    ? <Badge colorScheme="red" variant="outline" fontSize="2xs">{term.code}</Badge>
                    : <Badge colorScheme="gray" variant="solid" fontSize="2xs">Uncoded Term</Badge>}
                </Flex>
              </Box>
            ))}
            {!searchingMeddra && meddraQuery.length >= 2 && meddraResults?.length === 0 && (
              <Center py={8} flexDirection="column" gap={2}>
                <AlertCircle size={24} color="#94a3b8" />
                <Text color="#94a3b8" fontSize="sm">No matching MedDRA terms found</Text>
              </Center>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
