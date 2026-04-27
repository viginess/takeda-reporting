import { useState } from "react";
import {
  Box, Flex, Heading, Text, VStack, Input, InputGroup, 
  InputLeftElement, useDisclosure, useToast, Tabs, 
  TabList, TabPanels, Tab, TabPanel, Button
} from "@chakra-ui/react";
import { Search, Users, History } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";
import { NotificationLogTable } from "../components/NotificationLogTable";
import { CompanyTable } from "../components/CompanyTable";
import { CompanyEditDrawer } from "../components/CompanyEditDrawer";
import { CompanyStatsGrid } from "../components/CompanyStatsGrid";

export default function CompanyManagementPage() {
  const [search, setSearch] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const utils = trpc.useUtils();

  const [page, setPage] = useState(0);
  const limit = 10;

  // 1. Queries
  const { data: companyData, isLoading: loadingCompanies } = trpc.company.getCompanies.useQuery({
    search: search.length >= 2 ? search : undefined,
    missingEmailOnly: showMissingOnly ? true : undefined,
    limit,
    offset: page * limit
  });

  const { data: stats } = trpc.company.getStats.useQuery();

  // 2. Mutations
  const updateCompany = trpc.company.updateCompany.useMutation({
    onSuccess: () => {
      utils.company.getCompanies.invalidate();
      toast({ title: "Manufacturer Updated", status: "success", duration: 2000 });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, status: "error" });
    }
  });

  const resendMissedMutation = trpc.company.resendMissedReports.useMutation({
    onSuccess: (res) => {
      utils.company.getNotificationLogs.invalidate();
      utils.company.getCompanies.invalidate();
      toast({ title: `Scanned successfully`, description: `Sent ${res.count} missed reports.`, status: "success" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to send missed reports", description: err.message, status: "error" });
    }
  });

  // 3. Handlers
  const handleEdit = (company: any) => {
    setSelectedCompany(company);
    onOpen();
  };

  const handleSave = () => {
    if (!selectedCompany) return;
    updateCompany.mutate({
      id: selectedCompany.id,
      data: {
        email: selectedCompany.email,
        isRegistered: selectedCompany.isRegistered,
        name: selectedCompany.name
      }
    });
  };

  const handleResend = () => {
    if (!selectedCompany.email) {
      toast({ title: "Please save an email first", status: "warning" });
      return;
    }
    resendMissedMutation.mutate({ companyId: selectedCompany.id });
  };

  return (
    <Box p={{ base: 4, md: 8 }} bg="#f8fafc" minH="100vh" fontFamily="'DM Sans', sans-serif">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Flex align="center" gap={3} mb={1}>
            <Users size={24} color="#CE0037" />
            <Heading size={{ base: "md", md: "lg" }} color="#1e293b" letterSpacing="-0.5px">Manufacturer Management</Heading>
          </Flex>
          <Text color="gray.500" fontSize={{ base: "2xs", md: "sm" }}>
            Maintain contact directory for safety report distribution and regulatory notifications.
          </Text>
        </Box>

        {/* Stats Grid */}
        <CompanyStatsGrid 
          stats={stats} 
          showMissingOnly={showMissingOnly} 
          onToggleMissing={() => { setShowMissingOnly(!showMissingOnly); setPage(0); }} 
        />

        <Tabs variant="soft-rounded" colorScheme="red">
          <TabList bg="white" p={1.5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm" w="fit-content">
            <Tab _selected={{ color: "white", bg: "#CE0037" }} fontSize="xs" fontWeight="bold" borderRadius="xl" px={6}>
              Manufacturer Directory
            </Tab>
            <Tab _selected={{ color: "white", bg: "#CE0037" }} fontSize={{ base: "2xs", md: "xs" }} fontWeight="bold" borderRadius="xl" px={{ base: 3, md: 6 }}>
              Transmission History
            </Tab>
          </TabList>

          <TabPanels mt={6}>
            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
                <Flex justify="space-between" align={{ base: "stretch", md: "center" }} mb={6} direction={{ base: "column", md: "row" }} gap={4}>
                  <Heading size="sm" color="#1e293b">Email Directory</Heading>
                  <InputGroup maxW={{ base: "full", md: "300px" }}>
                    <InputLeftElement pointerEvents="none"><Search size={18} color="#94a3b8" /></InputLeftElement>
                    <Input
                      placeholder="Search name or email..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      borderRadius="xl" borderColor="#f1f5f9"
                      size="sm"
                    />
                  </InputGroup>
                </Flex>

                <CompanyTable 
                  companies={companyData || []} 
                  isLoading={loadingCompanies} 
                  onEdit={handleEdit} 
                />

                {/* Pagination Controls */}
                <Flex justify="center" align="center" mt={6} gap={4}>
                  <Button 
                    size="xs" variant="outline" 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    isDisabled={page === 0} borderRadius="lg"
                  >
                    Previous
                  </Button>
                  <Text fontSize="xs" color="gray.500" fontWeight="bold">Page {page + 1}</Text>
                  <Button 
                    size="xs" variant="outline" 
                    onClick={() => setPage(p => p + 1)}
                    isDisabled={!companyData || companyData.length < limit}
                    borderRadius="lg"
                  >
                    Next
                  </Button>
                </Flex>
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
                <Flex align="center" gap={2} mb={6}>
                  <History size={18} color="#94a3b8" />
                  <Heading size="sm" color="#1e293b">Full Transmission Log</Heading>
                </Flex>
                <NotificationLogTable />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Edit Drawer */}
      <CompanyEditDrawer 
        isOpen={isOpen} 
        onClose={onClose} 
        selectedCompany={selectedCompany} 
        setSelectedCompany={setSelectedCompany}
        onSave={handleSave}
        onResendMissed={handleResend}
        isSaving={updateCompany.isPending}
        isResending={resendMissedMutation.isPending}
      />
    </Box>
  );
}
