import { useState } from "react";
import {
  Box, Flex, Heading, Text, VStack, Grid, GridItem, Select, 
  Button, useToast, useDisclosure, HStack, Tooltip, Input, 
  InputGroup, InputLeftElement
} from "@chakra-ui/react";
import { Search, Package, Upload, CheckCircle } from "lucide-react";
import { trpc } from "../../../utils/config/trpc";
import { WhodrugImportModal } from "./components/WhodrugImportModal";
import { WhodrugSummaryStats } from "./components/WhodrugSummaryStats";
import { WhodrugBrowserTable } from "./components/WhodrugBrowserTable";
import { WhodrugInspectorPanel } from "./components/WhodrugInspectorPanel";
import { WhodrugHistoryTable } from "./components/WhodrugHistoryTable";
  
export default function WhodrugManagementPage() {
  const [query, setQuery] = useState("");
  const [selectedDrugCode, setSelectedDrugCode] = useState<string | null>(null);
  const toast = useToast();
  const utils = trpc.useUtils();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 1. Data Queries
  const { data: stats, isLoading: loadingStats } = trpc.whodrug.getDictionaryStats.useQuery();
  const { data: versions } = trpc.whodrug.getVersions.useQuery();
  const { data: importHistory } = trpc.whodrug.getImportHistory.useQuery(undefined, {
    refetchInterval: (query) => 
      query.state.data?.some((h: any) => h.status === 'PROCESSING') ? 3000 : false
  });

  const activeVersion = stats?.version || "Global B3 March 2025";
  const [previewVersion, setPreviewVersion] = useState<string>(activeVersion);
  const isImporting = importHistory?.some((h: any) => h.status === 'PROCESSING');

  // 2. Search & Details Queries
  const { data: searchResults, isLoading: searching } = trpc.whodrug.searchDrugs.useQuery(
    { query, limit: 15, version: previewVersion },
    { enabled: query.length >= 2 }
  );

  const { data: drugDetails, isLoading: loadingDetails } = trpc.whodrug.getDrugDetails.useQuery(
    { code: selectedDrugCode ?? "", version: previewVersion },
    { enabled: !!selectedDrugCode }
  );

  // 3. Mutations
  const updateVersion = trpc.whodrug.updateActiveVersion.useMutation({
    onSuccess: () => {
      utils.whodrug.getDictionaryStats.invalidate();
      toast({ title: "Active Version Updated", description: `The system is now using ${previewVersion}.`, status: "success", duration: 3000 });
    },
    onError: (err) => { toast({ title: "Failed to update version", description: err.message, status: "error" }); }
  });

  const deleteVersion = trpc.whodrug.deleteVersion.useMutation({
    onSuccess: (_, { version }) => {
      utils.whodrug.getImportHistory.invalidate();
      utils.whodrug.getVersions.invalidate();
      utils.whodrug.getDictionaryStats.invalidate();
      toast({ title: "Version Deleted", description: `Successfully removed ${version}.`, status: "info", duration: 3000 });
    },
    onError: (err) => { toast({ title: "Delete Failed", description: err.message, status: "error" }); }
  });

  return (
    <Box p={{ base: 4, md: 8 }} bg="#f8fafc" minH="100vh" fontFamily="'DM Sans', sans-serif">
      <WhodrugImportModal isOpen={isOpen} onClose={onClose} />
      
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="start">
          <Box>
            <Flex align="center" gap={3} mb={1}>
              <Package size={24} color="#CE0037" /><Heading size={{ base: "md", md: "lg" }} color="#1e293b" letterSpacing="-0.5px">WHODrug Management</Heading>
            </Flex>
            <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>Monitor dictionary volume and manage dictionary versions (Global B3).</Text>
          </Box>
          <HStack spacing={3} w={{ base: "full", md: "auto" }} justify={{ base: "flex-end", md: "flex-start" }}>
            <Tooltip label={isImporting ? "An import is already in progress" : "Import new dictionary version"}>
              <Button leftIcon={<Upload size={16} />} onClick={onOpen} isDisabled={isImporting} variant="outline" colorScheme="red" size="sm" borderRadius="xl" w={{ base: "full", md: "auto" }}>
                {isImporting ? "Importing..." : "Import Dictionary"}
              </Button>
            </Tooltip>
          </HStack>
        </Flex>

        <WhodrugSummaryStats stats={stats} loadingStats={loadingStats} />

        <Grid templateColumns={{ base: "1fr", lg: "1fr 400px" }} gap={6}>
          {/* Browser Section */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
              <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} mb={4} gap={4}>
                <Heading size="sm" color="#1e293b">Drug Browser</Heading>
                <HStack wrap="wrap" justify={{ base: "flex-start", md: "flex-end" }}>
                  <Select size="xs" borderRadius="md" w={{ base: "full", sm: "200px" }} value={previewVersion} onChange={(e) => setPreviewVersion(e.target.value)}>
                    {versions?.map(v => <option key={v} value={v}>{v} {v === activeVersion ? "(Active)" : ""}</option>)}
                    {!versions?.length && <option value={activeVersion}>{activeVersion}</option>}
                  </Select>
                  {previewVersion !== activeVersion && (
                    <Button size="xs" colorScheme="red" leftIcon={<CheckCircle size={12} />} onClick={() => updateVersion.mutate({ version: previewVersion })} isLoading={updateVersion.isPending} w={{ base: "full", sm: "auto" }}>Set Active</Button>
                  )}
                </HStack>
              </Flex>
              
              <InputGroup mb={6}>
                <InputLeftElement pointerEvents="none"><Search size={18} color="#94a3b8" /></InputLeftElement>
                <Input placeholder="Search Trade Name (e.g. Paracetamol, Aspirin...)" value={query} onChange={(e) => setQuery(e.target.value)} borderRadius="xl" border="2px solid" borderColor="#f1f5f9" _focus={{ borderColor: "#CE0037", boxShadow: "none" }} />
              </InputGroup>

              <WhodrugBrowserTable 
                searching={searching} searchResults={searchResults || []} 
                selectedDrugCode={selectedDrugCode} onSelectDrug={setSelectedDrugCode} 
                query={query} 
              />
            </Box>
          </GridItem>

          {/* Inspector Section */}
          <GridItem>
            <WhodrugInspectorPanel 
              selectedDrugCode={selectedDrugCode} 
              loadingDetails={loadingDetails} 
              drugDetails={drugDetails} 
            />
          </GridItem>
        </Grid>

        <WhodrugHistoryTable 
          importHistory={importHistory || []} 
          onDeleteVersion={(v) => deleteVersion.mutate({ version: v })} 
          isDeleting={deleteVersion.isPending} 
        />
      </VStack>
    </Box>
  );
}
