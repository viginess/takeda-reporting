import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Progress,
  useToast,
  Box,
  Badge,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Icon
} from '@chakra-ui/react';
import { FiUploadCloud, FiFile, FiCheckCircle, FiXCircle, FiLoader, FiInfo } from 'react-icons/fi';
import { trpc } from '../../../../utils/trpc';

interface ImportMeddraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  history?: any[];
}

export const ImportMeddraModal: React.FC<ImportMeddraModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  history
}) => {
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  
  const toast = useToast();
  const utils = trpc.useContext();

  const importMutation = trpc.reference.importMeddraFromZip.useMutation({
    onSuccess: (data) => {
      setJobId(data.id);
      setIsUploading(true);
    },
    onError: (err) => {
      toast({
        title: 'Upload Failed',
        description: err.message,
      });
    },
  });

  const { data: existingVersions } = trpc.reference.getMeddraVersions.useQuery();

  // Robust check: Compare versions while ignoring 'v' prefix and case
  const cleanV = (v: string) => v.toLowerCase().replace(/^v/, '').trim();
  
  const isDuplicateVersion = !!version && (
    existingVersions?.some(v => cleanV(v) === cleanV(version)) ||
    history?.some(h => h.status === 'COMPLETED' && cleanV(h.version) === cleanV(version))
  );

  const jobStatusQuery = trpc.reference.getMeddraImportStatus.useQuery(
    { id: jobId as number },
    { 
      enabled: !!jobId,
      refetchInterval: (query) => 
        query.state.data?.status === 'PROCESSING' || query.state.data?.status === 'PENDING' ? 2000 : false,
    }
  );
  const jobStatus = jobStatusQuery.data;

  useEffect(() => {
    if (jobStatus?.status === 'COMPLETED') {
      setIsUploading(false);
      toast({
        title: 'Import Successful',
        description: `MedDRA v${version} has been imported successfully.`,
        status: 'success',
        duration: 5000,
      });
      onSuccess();
      utils.reference.getMeddraVersions.invalidate();
      utils.reference.getImportHistory.invalidate();
    } else if (jobStatus?.status === 'FAILED') {
      setIsUploading(false);
    }
  }, [jobStatus?.status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect version from filename (e.g., meddra_v29.0.zip -> 29.0)
      const match = selectedFile.name.match(/v?(\d+\.\d+)/i) || selectedFile.name.match(/v?(\d+)/i);
      if (match) {
        setVersion(match[1]);
      } else {
        setVersion('');
      }
    }
  };

  const handleImport = async () => {
    if (!file || isDuplicateVersion) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      importMutation.mutate({
        version: version || undefined, // Let backend detect if empty
        zipBase64: base64,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setVersion('');
    setFile(null);
    setJobId(null);
    setIsUploading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? () => {} : reset} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
      <ModalContent 
        borderRadius="2xl" 
        shadow="2xl" 
        overflow="hidden"
        border="1px"
        borderColor="gray.100"
        mx={{ base: 4, md: 0 }}
      >
        <ModalHeader bg="gray.50" py={6} px={8} borderBottom="1px" borderColor="gray.100">
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">Import MedDRA Dictionary</Text>
            <Text fontSize="sm" fontWeight="normal" color="gray.500">Update terminology from regulatory ZIP files</Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} isDisabled={isUploading} />
        
        <ModalBody p={8}>
          {!jobId ? (
            <VStack spacing={8} align="stretch">
              {/* Dropzone */}
              <Box
                className="dropzone"
                p={10}
                textAlign="center"
                position="relative"
                bg={file ? "primary.50" : "gray.50"}
                border="2px dashed"
                borderColor={file ? "primary.300" : "gray.200"}
                borderRadius="xl"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={!isUploading ? { borderColor: "primary.400", bg: "gray.100" } : {}}
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  aria-label="Upload MedDRA ZIP file"
                  className="file-input"
                  disabled={isUploading}
                />
                <VStack spacing={4}>
                  <Box 
                    p={4} 
                    bg="white" 
                    borderRadius="full" 
                    shadow="sm" 
                    color={file ? "primary.500" : "gray.400"}
                  >
                    <Icon as={file ? FiFile : FiUploadCloud} boxSize={8} />
                  </Box>
                  <VStack spacing={1}>
                    <Text fontWeight="bold" color="gray.700" fontSize="lg">
                      {file ? file.name : 'Click or drag ZIP file here'}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {file ? `(${(file.size / (1024 * 1024)).toFixed(2)} MB)` : 'Standard MedDRA release ZIP format'}
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              {/* Detected Version Section */}
              {file && (
                <Box 
                  p={5} 
                  borderRadius="xl" 
                  bg="white" 
                  border="1px" 
                  borderColor="gray.100"
                  shadow="sm"
                  animation="fadeIn 0.3s ease-out"
                >
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={3}>
                      Confirm Dictionary Version
                    </FormLabel>
                    <HStack spacing={4}>
                      <Input
                        placeholder="e.g. 29.0"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        size="lg"
                        maxW="150px"
                        borderRadius="lg"
                        focusBorderColor="primary.500"
                        fontWeight="bold"
                        color="primary.600"
                      />
                      <Box>
                        {isDuplicateVersion ? (
                          <HStack spacing={1} color="red.500">
                            <Icon as={FiXCircle} />
                            <Text fontSize="xs" fontWeight="bold">Duplicate Version</Text>
                          </HStack>
                        ) : version ? (
                          <HStack spacing={1} color="green.500">
                            <Icon as={FiCheckCircle} />
                            <Text fontSize="xs" fontWeight="bold">Version Detected</Text>
                          </HStack>
                        ) : (
                          <HStack spacing={1} color="orange.500">
                            <Icon as={FiInfo} />
                            <Text fontSize="xs">Please enter version manually</Text>
                          </HStack>
                        )}
                      </Box>
                    </HStack>
                    <Text fontSize="xs" color={isDuplicateVersion ? "red.400" : "gray.400"} mt={2} fontWeight={isDuplicateVersion ? "bold" : "normal"}>
                      {isDuplicateVersion 
                        ? `MedDRA v${version} has already been imported. Please use a different version.`
                        : "We detected this from the filename. If incorrect, please adjust it."
                      }
                    </Text>
                  </FormControl>
                </Box>
              )}

              {!file && (
                <Alert status="info" variant="subtle" bg="blue.50" color="blue.700" borderRadius="lg" border="1px" borderColor="blue.100">
                  <AlertIcon color="blue.400" />
                  <Box>
                    <AlertTitle fontSize="sm">Importing MedDRA</AlertTitle>
                    <AlertDescription fontSize="xs">
                      The ZIP must contain standard ASCII files (.asc) using the <b>$|</b> delimiter.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          ) : (
            <VStack spacing={8} py={4} align="stretch" animation="fadeIn 0.5s ease-out">
              <Box textAlign="center" w="full">
                {jobStatus?.status === 'PROCESSING' && (
                  <VStack spacing={6}>
                    <Box position="relative" display="inline-block">
                        <FiLoader size={60} className="spin-animation" color="#CE0037" />
                    </Box>
                    <VStack spacing={2}>
                        <Text fontWeight="extrabold" fontSize="xl" color="gray.800">Importing MedDRA v{version}</Text>
                        <Text fontSize="sm" color="gray.500">Extracting, parsing and validating dictionary terms...</Text>
                    </VStack>
                    <Box w="full" px={4}>
                        <Progress 
                            size="sm" 
                            isIndeterminate 
                            w="full" 
                            colorScheme="primary" 
                            borderRadius="full" 
                            shadow="inner"
                        />
                    </Box>
                  </VStack>
                )}

                {jobStatus?.status === 'COMPLETED' && (
                  <VStack spacing={6} py={4}>
                    <Box p={4} bg="green.50" borderRadius="full">
                        <FiCheckCircle size={60} color="#48BB78" />
                    </Box>
                    <VStack spacing={2}>
                        <Text fontWeight="extrabold" fontSize="2xl" color="gray.800">Success!</Text>
                        <Text color="gray.600">MedDRA <b>v{version}</b> has been successfully imported and is ready to use.</Text>
                    </VStack>
                    <Badge colorScheme="green" size="lg" px={4} py={1} borderRadius="full" fontSize="md">Version {version} Active</Badge>
                  </VStack>
                )}

                {jobStatus?.status === 'FAILED' && (
                  <VStack spacing={6} py={4}>
                    <Box p={4} bg="red.50" borderRadius="full">
                        <FiXCircle size={60} color="#F56565" />
                    </Box>
                    <VStack spacing={2}>
                        <Text fontWeight="extrabold" fontSize="2xl" color="gray.800">Import Failed</Text>
                        <Text color="gray.600" fontSize="sm">An error occurred during the import process.</Text>
                    </VStack>
                    <Code 
                        p={5} 
                        borderRadius="xl" 
                        bg="gray.50" 
                        color="red.600" 
                        fontSize="xs" 
                        w="full" 
                        textAlign="left"
                        border="1px"
                        borderColor="red.100"
                        maxH="150px"
                        overflowY="auto"
                    >
                      <b>LOGS:</b><br/>
                      {jobStatus.errorLog || 'Reason unknown. Check server logs for details.'}
                    </Code>
                  </VStack>
                )}
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter bg="gray.50" p={6} borderTop="1px" borderColor="gray.100" gap={3}>
          {!jobId ? (
            <>
              <Button variant="ghost" onClick={reset} colorScheme="gray" borderRadius="lg" px={8}>
                Cancel
              </Button>
              <Button
                colorScheme="primary"
                leftIcon={<FiUploadCloud />}
                onClick={handleImport}
                isDisabled={!file || !version || isDuplicateVersion}
                isLoading={importMutation.isPending}
                borderRadius="lg"
                px={10}
                shadow="md"
                _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
              >
                Launch Import
              </Button>
            </>
          ) : (
            <Button 
              w="full" 
              onClick={reset} 
              size="lg"
              borderRadius="xl"
              isDisabled={jobStatus?.status === 'PROCESSING'}
              colorScheme={jobStatus?.status === 'COMPLETED' ? "green" : "gray"}
              shadow="sm"
            >
              {jobStatus?.status === 'PROCESSING' ? 'Import in Progress...' : 'Finish & Close'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin-animation { animation: spin 2s linear infinite; }
        .file-input {
          opacity: 0;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          z-index: 10;
        }
      `}</style>
    </Modal>
  );
};
