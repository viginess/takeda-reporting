import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  useDisclosure,
} from "@chakra-ui/react";
import { 
  FiActivity, 
} from "react-icons/fi";
import { trpc } from "../../../../utils/trpc";
import { MeddraBrowser } from "../components/MeddraBrowser";
import { ImportManagementSection } from "../components/ImportManagementSection";

export default function MeddraManagementPage() {
  const [selectedVersionForPreview, setSelectedVersionForPreview] = useState<string>("");
  const toast = useToast();
  const utils = trpc.useContext();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get active version from settings
  const { data: settings } = trpc.admin.getSystemSettings.useQuery();
  const activeVersion = settings?.clinicalConfig?.meddraVersion;

  // Get import history to check for active imports
  const { data: importHistory } = trpc.reference.getImportHistory.useQuery(undefined, {
    refetchInterval: (query) => 
      query.state.data?.some((h: any) => h.status === 'PROCESSING') ? 3000 : false
  });

  const isImporting = importHistory?.some((h: any) => h.status === 'PROCESSING');

  // Mutation to update active version
  const updateSettings = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      utils.admin.getSystemSettings.invalidate();
      toast({
        title: "System Updated",
        description: `Active MedDRA version is now ${selectedVersionForPreview}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    }
  });

  const handleSetAsActive = (version: string) => {
    if (!version || !settings) return;
    updateSettings.mutate({
      clinicalConfig: {
        ...settings.clinicalConfig,
        meddraVersion: version
      }
    });
  };

  return (
    <Box p={8} bg="#f8fafc" minH="100vh" fontFamily="'Inter', sans-serif">
      <VStack spacing={6} align="stretch">
        {/* Top Header & Stat */}
        <Grid templateColumns="1fr auto" gap={6} alignItems="start">
          <Box>
            <Flex align="center" gap={3} mb={1}>
              <FiActivity size={24} color="#CE0037" />
              <Heading size="lg" letterSpacing="-0.5px">MedDRA Management</Heading>
            </Flex>
            <Text color="gray.600" fontSize="sm">
              Search the regulatory medical dictionary and manage active system versions.
            </Text>
          </Box>
          
          <Stat 
            bg="white" 
            p={4} 
            borderRadius="xl" 
            border="1px" 
            borderColor="red.100" 
            shadow="sm"
            minW="200px"
          >
            <StatLabel color="gray.500" fontSize="xs" fontWeight="bold" textTransform="uppercase">Active System Version</StatLabel>
            <StatNumber color="#CE0037" fontSize="2xl">v{activeVersion || "---"}</StatNumber>
          </Stat>
        </Grid>

        {/* Phase 1: MedDRA Browser */}
        <MeddraBrowser 
          activeVersion={activeVersion} 
          onVersionChange={setSelectedVersionForPreview}
          onSetAsActive={handleSetAsActive}
          isUpdatingVersion={updateSettings.isPending}
          onImportOpen={onOpen}
          isImportDisabled={isImporting}
        />

        {/* Phase 2: Import Management */}
        <ImportManagementSection 
          isOpen={isOpen} 
          onClose={onClose} 
          history={importHistory} 
        />
      </VStack>
    </Box>
  );
}
