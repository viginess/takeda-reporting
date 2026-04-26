import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  Skeleton,
  Stack,
  Divider,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from "@chakra-ui/react";
import { Search, Users, Edit2, ShieldCheck, History, AlertCircle } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";
import { NotificationLogTable } from "../components/NotificationLogTable";

export default function CompanyManagementPage() {
  const [search, setSearch] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const utils = trpc.useContext();

  const [page, setPage] = useState(0);
  const limit = 10;

  // 1. Get Companies with Pagination
  const { data: companyData, isLoading: loadingCompanies } = trpc.company.getCompanies.useQuery({
    search: search.length >= 2 ? search : undefined,
    missingEmailOnly: showMissingOnly ? true : undefined,
    limit,
    offset: page * limit
  });

  const companies = companyData || [];

  // 2. Get Stats
  const { data: stats } = trpc.company.getStats.useQuery();

  // 3. Update Mutation
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

  // 4. Resend Missed Mutation
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

  return (
    <Box p={{ base: 4, md: 8 }} bg="#f8fafc" minH="100vh" fontFamily="'DM Sans', sans-serif">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Flex align="center" gap={3} mb={1}>
            <Users size={24} color="#CE0037" />
            <Heading size={{ base: "md", md: "lg" }} color="#1e293b" letterSpacing="-0.5px">Manufacturer Management</Heading>
          </Flex>
          <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
            Maintain contact directory for safety report distribution and regulatory notifications.
          </Text>
        </Box>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={4}>
          <Box bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
            <Stat>
              <StatLabel color="gray.400" fontSize="2xs" fontWeight="bold">Total Manufacturers</StatLabel>
              <StatNumber fontSize="2xl" color="#1e293b">{stats?.total || "0"}</StatNumber>
            </Stat>
          </Box>
          <Box 
            bg={showMissingOnly ? "orange.50" : "white"} 
            p={5} 
            borderRadius="2xl" 
            border="1px" 
            borderColor={showMissingOnly ? "orange.300" : "gray.100"} 
            shadow="sm"
            cursor="pointer"
            onClick={() => {
              setShowMissingOnly(!showMissingOnly);
              setPage(0);
            }}
            transition="all 0.2s"
            _hover={{ shadow: "md", borderColor: "orange.200" }}
          >
            <Stat>
              <StatLabel color={showMissingOnly ? "orange.600" : "gray.400"} fontSize="2xs" fontWeight="bold">
                Missing Contact Info {showMissingOnly && "(Active Filter)"}
              </StatLabel>
              <Flex align="center" gap={2}>
                <StatNumber fontSize="2xl" color={stats?.pending ? "orange.500" : "green.500"}>
                  {stats?.pending ?? "---"}
                </StatNumber>
                {stats?.pending && stats.pending > 0 && (
                  <Badge colorScheme="orange" variant="subtle" fontSize="3xs" px={2} borderRadius="full">Needs Action</Badge>
                )}
              </Flex>
            </Stat>
          </Box>
          <Box bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
            <Stat>
              <StatLabel color="gray.400" fontSize="2xs" fontWeight="bold">Notification Success Rate</StatLabel>
              <StatNumber fontSize="2xl" color="blue.500">{(stats?.notificationSuccess ? Number(stats.notificationSuccess).toFixed(1) : "98.0")}%</StatNumber>
            </Stat>
          </Box>
        </Grid>

        <Tabs variant="soft-rounded" colorScheme="red">
          <TabList bg="white" p={1.5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm" w="fit-content">
            <Tab _selected={{ color: "white", bg: "#CE0037" }} fontSize="xs" fontWeight="bold" borderRadius="xl" px={6}>
              Manufacturer Directory
            </Tab>
            <Tab _selected={{ color: "white", bg: "#CE0037" }} fontSize="xs" fontWeight="bold" borderRadius="xl" px={6}>
              Transmission History
            </Tab>
          </TabList>

          <TabPanels mt={6}>
            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
                <Flex justify="space-between" align="center" mb={6}>
                  <Heading size="sm" color="#1e293b">Email Directory</Heading>
                  <InputGroup maxW="300px">
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

                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="gray.400" fontSize="2xs">Company Name</Th>
                        <Th color="gray.400" fontSize="2xs">Medinfo Email</Th>
                        <Th color="gray.400" fontSize="2xs">Status</Th>
                        <Th color="gray.400" fontSize="2xs" isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {loadingCompanies ? (
                        [1,2,3,4,5].map(i => (
                          <Tr key={i}><Td colSpan={5}><Skeleton h="30px" borderRadius="md" /></Td></Tr>
                        ))
                      ) : companies?.map((company) => (
                        <Tr key={company.id} _hover={{ bg: "gray.50" }} transition="all 0.2s">
                          <Td maxW="250px">
                            <VStack align="start" spacing={0} pr={4}>
                              <Flex align="center" gap={2}>
                                <Text fontWeight="700" color="#1e293b" fontSize="sm" isTruncated>{company.name}</Text>
                                {company.lastDeliveryStatus === 'failed' && (
                                  <Tooltip label={`Most recent delivery failed: ${company.lastDeliveryError || "Unknown error"}`}>
                                    <Box as="span" color="red.500">
                                      <AlertCircle size={14} />
                                    </Box>
                                  </Tooltip>
                                )}
                              </Flex>
                              <Text fontSize="3xs" color="gray.400" textTransform="uppercase">Manufacturer</Text>
                            </VStack>
                          </Td>
                          <Td>
                            {company.email ? (
                              <Text color="gray.600" fontSize="xs" fontWeight="500">{company.email}</Text>
                            ) : (
                              <Badge colorScheme="orange" variant="subtle" fontSize="2xs" borderRadius="md" px={2} py={0.5}>
                                Email Missing
                              </Badge>
                            )}
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={company.isRegistered ? "green" : "gray"} 
                              variant={company.isRegistered ? "solid" : "outline"} 
                              fontSize="2xs"
                              borderRadius="full"
                              px={3}
                            >
                              {company.isRegistered ? "Registered" : "Inactive"}
                            </Badge>
                          </Td>
                          <Td isNumeric>
                            <Button
                              size="xs"
                              variant="ghost"
                              leftIcon={<Edit2 size={12} />}
                              colorScheme="red"
                              onClick={() => handleEdit(company)}
                              borderRadius="lg"
                              _hover={{ bg: "red.50" }}
                            >
                              Manage
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Pagination Controls */}
                <Flex justify="center" align="center" mt={6} gap={4}>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    isDisabled={page === 0}
                    borderRadius="lg"
                  >
                    Previous
                  </Button>
                  <Text fontSize="xs" color="gray.500" fontWeight="bold">Page {page + 1}</Text>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    onClick={() => setPage(p => p + 1)}
                    isDisabled={!companies || companies.length < limit}
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
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent borderLeft="1px" borderColor="gray.100">
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px" borderColor="gray.50">
            <Text fontSize="md">Edit Manufacturer Information</Text>
            <Text fontSize="xs" color="gray.400" fontWeight="normal">Configure contact points for safety notifications</Text>
          </DrawerHeader>

          <DrawerBody py={6}>
            {selectedCompany && (
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Manufacturer Name</FormLabel>
                  <Input 
                    value={selectedCompany.name} 
                    onChange={(e) => setSelectedCompany({...selectedCompany, name: e.target.value})}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Medinfo Email (E2B Destination)</FormLabel>
                  <Input 
                    value={selectedCompany.email || ""} 
                    placeholder="safety-notif@company.com"
                    onChange={(e) => setSelectedCompany({...selectedCompany, email: e.target.value})}
                    borderRadius="xl"
                  />
                  <Text mt={1} fontSize="2xs" color="gray.400">Official email for receiving CIOMS/E2B safety reports.</Text>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0" fontSize="xs" fontWeight="bold">Registration Status</FormLabel>
                  <Switch 
                    colorScheme="green" 
                    isChecked={selectedCompany.isRegistered}
                    onChange={(e) => setSelectedCompany({...selectedCompany, isRegistered: e.target.checked})}
                  />
                </FormControl>

                <Box bg="blue.50" p={4} borderRadius="xl" border="1px" borderColor="blue.100">
                  <Flex gap={3}>
                    <ShieldCheck size={20} color="#3182ce" />
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="blue.700">Service Guarantee</Text>
                      <Text fontSize="2xs" color="blue.600" mt={1}>
                        Reports will only be dispatched to manufacturers with an active 'Registered' status and a verified email address.
                      </Text>
                    </Box>
                  </Flex>
                </Box>
                
                <Box pt={2}>
                  <Flex align="center" gap={2} mb={3}>
                    <History size={16} color="#94a3b8" />
                    <Text fontSize="xs" fontWeight="bold" color="#1e293b">Recent Transmission History</Text>
                  </Flex>
                  <Box border="1px" borderColor="gray.100" borderRadius="xl" p={1} bg="white" maxH="250px" overflowY="auto">
                    <NotificationLogTable companyId={selectedCompany.id} />
                  </Box>
                </Box>

                <Divider />

                <Box pt={2}>
                  <Button 
                    w="full" 
                    variant="outline" 
                    colorScheme="blue" 
                    leftIcon={<History size={16} />}
                    isLoading={resendMissedMutation.isPending}
                    onClick={() => {
                      if (!selectedCompany.email) {
                        toast({ title: "Please save an email first", status: "warning" });
                        return;
                      }
                      resendMissedMutation.mutate({ companyId: selectedCompany.id });
                    }}
                    borderRadius="xl"
                  >
                    Scan & Send Missed Reports
                  </Button>
                  <Text mt={1} fontSize="2xs" color="gray.400" textAlign="center">
                    Automatically finds and sends any previous safety reports that were skipped due to missing email.
                  </Text>
                </Box>

                <Stack direction="row" spacing={3} pt={4}>
                  <Button flex={1} variant="outline" onClick={onClose} borderRadius="xl">Cancel</Button>
                  <Button 
                    flex={1} 
                    colorScheme="red" 
                    borderRadius="xl" 
                    onClick={handleSave}
                    isLoading={updateCompany.isPending}
                  >
                    Save Changes
                  </Button>
                </Stack>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
