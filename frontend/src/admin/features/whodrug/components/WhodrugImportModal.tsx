import { useState, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Box,
  Flex,
  Icon,
  Badge,
  Table,
  Tbody,
  Tr,
  Td,
  Divider
} from "@chakra-ui/react";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";

interface WhodrugImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhodrugImportModal({ isOpen, onClose }: WhodrugImportModalProps) {
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const utils = trpc.useContext();

  const startImport = trpc.whodrug.startImport.useMutation({
    onSuccess: () => {
      toast({
        title: "Import Started",
        description: "The dictionary is being processed in the background. Check history for progress.",
        status: "success",
        duration: 5000,
      });
      utils.whodrug.getImportHistory.invalidate();
      onClose();
      setFile(null);
      setVersion("");
    },
    onError: (err) => {
      toast({
        title: "Import Failed",
        description: err.message,
        status: "error",
      });
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect version if empty
      if (!version) {
        let detected = selectedFile.name.replace('.zip', '').replace(/_/g, ' ');
        detected = detected.replace(/\b\w/g, c => c.toUpperCase());
        setVersion(detected);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !version) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      startImport.mutate({
        version,
        fileName: file.name,
        zipBase64: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const { data: history } = trpc.whodrug.getImportHistory.useQuery();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }}>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="2xl" border="1px" borderColor="gray.100">
        <ModalHeader borderBottom="1px" borderColor="gray.50">
          <Flex align="center" gap={2}>
            <Upload size={18} color="#CE0037" />
            <Text fontSize="md">Import WHODrug Dictionary</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Form */}
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold">Dictionary Version (Optional)</FormLabel>
                <Input 
                  placeholder="Auto-detected from file name if left blank" 
                  value={version} 
                  onChange={(e) => setVersion(e.target.value)}
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold">ZIP Package</FormLabel>
                <Box 
                  border="2px dashed" 
                  borderColor={file ? "green.200" : "gray.200"}
                  borderRadius="2xl"
                  p={8}
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ borderColor: "red.200", bg: "red.50" }}
                  onClick={() => fileInputRef.current?.click()}
                  transition="all 0.2s"
                >
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept=".zip" 
                    onChange={handleFileChange} 
                  />
                  <VStack spacing={2}>
                    <Icon as={file ? CheckCircle : FileText} color={file ? "green.500" : "gray.400"} boxSize={8} />
                    <Text fontSize="sm" fontWeight="bold" color="gray.600">
                      {file ? file.name : "Drag and drop standard WHODrug ZIP"}
                    </Text>
                    <Text fontSize="2xs" color="gray.400">Standard Text/Flat files inside zip package</Text>
                  </VStack>
                </Box>
              </FormControl>

              <Button 
                colorScheme="red" 
                w="full" 
                borderRadius="xl"
                h="48px"
                isDisabled={!file}
                isLoading={isUploading}
                onClick={handleSubmit}
              >
                Upload & Process Dictionary
              </Button>
            </VStack>

            <Divider />

            {/* History */}
            <Box>
              <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase">Recent Import Attempts</Text>
              <Table variant="simple" size="sm">
                <Tbody>
                  {history?.map((job) => (
                    <Tr key={job.id}>
                      <Td p={2}>
                        <VStack align="stretch" spacing={0}>
                          <Text fontSize="xs" fontWeight="bold">{job.version}</Text>
                          <Text fontSize="2xs" color="gray.500">{job.fileName}</Text>
                        </VStack>
                      </Td>
                      <Td p={2}>
                        <Badge 
                          colorScheme={
                            job.status === 'COMPLETED' ? 'green' : 
                            job.status === 'FAILED' ? 'red' : 
                            'blue'
                          }
                          fontSize="2xs"
                        >
                          {job.status}
                        </Badge>
                      </Td>
                      <Td p={2} isNumeric>
                        <Text fontSize="2xs" color="gray.400">
                          {new Date(job.createdAt!).toLocaleDateString()}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                  {!history?.length && (
                    <Tr><Td colSpan={3} textAlign="center" py={4} color="gray.400" fontSize="xs">No import history found</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
