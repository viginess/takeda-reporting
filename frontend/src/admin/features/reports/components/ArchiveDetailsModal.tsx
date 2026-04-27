import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalCloseButton, ModalBody, Flex, VStack, Text, 
  Skeleton, Box, Center 
} from "@chakra-ui/react";
import { History as HistoryIcon } from "lucide-react";

interface ArchiveDetailsModalProps {
  archivedDetails: { storagePath: string; referenceId: string } | null;
  onClose: () => void;
  loading: boolean;
  data: any;
}

export function ArchiveDetailsModal({ archivedDetails, onClose, loading, data }: ArchiveDetailsModalProps) {
  return (
    <Modal isOpen={!!archivedDetails} onClose={onClose} size={{ base: "full", md: "4xl" }}>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius={{ base: "0", md: "2xl" }} maxH={{ base: "100vh", md: "90vh" }} m={{ base: 0, md: "auto" }}>
        <ModalHeader borderBottom="1px" borderColor="gray.100">
          <Flex align="center" gap={3}>
            <HistoryIcon size={20} color="#CE0037" />
            <VStack align="start" spacing={0}>
              <Text fontSize="md">Archived Report Details</Text>
              <Text fontSize="xs" color="gray.400" fontWeight="normal">Reference: {archivedDetails?.referenceId}</Text>
            </VStack>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto" py={6} bg="#f8fafc">
          {loading ? (
            <VStack spacing={4}>
              <Skeleton h="200px" w="full" borderRadius="xl" />
              <Skeleton h="400px" w="full" borderRadius="xl" />
            </VStack>
          ) : data ? (
            <Box 
              bg="white" 
              p={6} 
              borderRadius="xl" 
              border="1px" 
              borderColor="gray.200" 
              shadow="sm"
              as="pre"
              fontSize="xs"
              whiteSpace="pre-wrap"
              fontFamily="mono"
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          ) : (
            <Center py={10}><Text color="gray.500">Could not retrieve details from storage.</Text></Center>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
