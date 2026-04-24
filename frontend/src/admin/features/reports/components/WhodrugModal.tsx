import { useState } from "react";
import { Search, AlertCircle, Package } from "lucide-react";
import {
  Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
  Heading, Text, Box, Badge, Flex, VStack, Input, InputGroup,
  InputLeftElement, Skeleton, Center, useToast, Spinner
} from "@chakra-ui/react";
import type { Report } from "../types";

interface WhodrugModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: Report | null;
  codingProductIndex: number | null;
  whodrugQuery: string;
  setWhodrugQuery: (v: string) => void;
  whodrugResults: any[] | undefined;
  searchingWhodrug: boolean;
  updateMutation: { mutateAsync: (args: any) => Promise<any> };
  onProductUpdated: (report: Report) => void;
}

export function WhodrugModal({
  isOpen,
  onClose,
  selectedReport,
  codingProductIndex,
  whodrugQuery,
  setWhodrugQuery,
  whodrugResults,
  searchingWhodrug,
  updateMutation,
  onProductUpdated,
}: WhodrugModalProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const product = codingProductIndex !== null
    ? selectedReport?.fullDetails?.products?.[codingProductIndex]
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
          <Heading size="md" mb={1} color="#1e293b">Regulatory Coding (WHODrug)</Heading>
          <Text fontSize="sm" color="#64748b" mb={6}>Map the reported product to an official WHODrug Global B3 record.</Text>

          {product && (
            <Box bg="#f8fafc" p={4} borderRadius="xl" border="1px solid" borderColor="#e2e8f0" mb={6}>
              <Text fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" mb={1}>Reported Product</Text>
              <Text fontWeight="700" color="#0f172a">{product.productName || product.name || product.product || "Unknown Product"}</Text>
              {product.whodrugCode && (
                <Badge mt={2} colorScheme="red" variant="subtle" borderRadius="md">
                  Current ID: {product.whodrugCode}
                </Badge>
              )}
            </Box>
          )}

          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none"><Search size={18} color="#94a3b8" /></InputLeftElement>
            <Input
              placeholder="Search WHODrug (e.g. Tylenol, Paracetamol...)"
              value={whodrugQuery}
              onChange={(e) => setWhodrugQuery(e.target.value)}
              isDisabled={isSaving}
              borderRadius="xl" border="2px solid" borderColor="#f1f5f9"
              _focus={{ borderColor: "#CE0037", boxShadow: "none" }}
            />
          </InputGroup>

          <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto" pr={2}>
            {searchingWhodrug && (
              <VStack spacing={2} align="stretch" py={2}>
                {[1, 2, 3].map(i => <Skeleton key={i} h="40px" borderRadius="xl" />)}
              </VStack>
            )}
            {whodrugResults?.map((drug: any) => (
              <Box
                key={drug.rid}
                p={3} borderRadius="xl" border="1px solid" borderColor="#f1f5f9"
                cursor={isSaving ? "not-allowed" : "pointer"} 
                transition="all 0.2s" 
                _hover={!isSaving ? { bg: "red.50", borderColor: "red.100" } : {}}
                onClick={async () => {
                  if (codingProductIndex === null || !selectedReport || isSaving) return;
                  setIsSaving(true);
                  const updatedProducts = [...selectedReport.fullDetails.products];
                  updatedProducts[codingProductIndex] = {
                    ...updatedProducts[codingProductIndex],
                    whodrugCode: drug.code,
                    whodrugName: drug.name,
                    productName: drug.name, // Sync display name
                    name: drug.name,        // Sync display name
                  };
                  try {
                    const res = await updateMutation.mutateAsync({
                      reportId: selectedReport.originalId!,
                      reporterType: selectedReport.reporterType,
                      updates: { products: updatedProducts }
                    });
                    
                    toast({ title: "Product Mapped", description: `Linked to official record: ${drug.name}`, status: "success" });
                    
                    // Update state locally with merged data to prevent structure mismatch crash
                    onProductUpdated({ 
                      ...selectedReport, 
                      drug: drug.name, // Update primary heading
                      fullDetails: { 
                        ...selectedReport.fullDetails, 
                        products: updatedProducts 
                      },
                      // If the backend returned new validation status, include it
                      isValid: res?.data?.isValid ?? selectedReport.isValid,
                      validationErrors: res?.data?.validationErrors ?? selectedReport.validationErrors
                    });
                    onClose();
                  } catch (err: any) {
                    toast({ title: "Mapping Failed", description: err.message, status: "error" });
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Flex align="center" gap={2}>
                      <Package size={12} color="#1e293b" />
                      <Text fontWeight="bold" fontSize="sm" color="#1e293b">{drug.name}</Text>
                    </Flex>
                  </Box>
                  <Flex align="center" gap={3}>
                    <Text fontSize="2xs" color="gray.400">Match {(drug.similarity * 100).toFixed(0)}%</Text>
                    <Badge colorScheme="red" variant="outline" fontSize="2xs">{drug.code}</Badge>
                  </Flex>
                </Flex>
              </Box>
            ))}
            {!searchingWhodrug && whodrugQuery.length >= 2 && whodrugResults?.length === 0 && (
              <Center py={8} flexDirection="column" gap={2}>
                <AlertCircle size={24} color="#94a3b8" />
                <Text color="#94a3b8" fontSize="sm">No matching WHODrug records found</Text>
              </Center>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
