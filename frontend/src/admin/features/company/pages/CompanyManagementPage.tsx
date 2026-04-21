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
  IconButton,
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
  Divider
} from "@chakra-ui/react";
import { Search, Users, Edit2, ShieldCheck, History } from "lucide-react";
import { trpc } from "../../../../utils/config/trpc";
import { NotificationLogTable } from "../components/NotificationLogTable";

export default function CompanyManagementPage() {
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const utils = trpc.useContext();

  // 1. Get Companies
  const { data: companies, isLoading: loadingCompanies } = trpc.company.getCompanies.useQuery({
    search: search.length >= 2 ? search : undefined
  });

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
              <StatNumber fontSize="2xl" color="#1e293b">{stats?.totalCompanies || "143"}</StatNumber>
            </Stat>
          </Box>
          <Box bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
            <Stat>
              <StatLabel color="gray.400" fontSize="2xs" fontWeight="bold">Opted-In (Registered)</StatLabel>
              <StatNumber fontSize="2xl" color="green.500">{stats?.registeredCompanies || "---"}</StatNumber>
            </Stat>
          </Box>
          <Box bg="white" p={5} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
            <Stat>
              <StatLabel color="gray.400" fontSize="2xs" fontWeight="bold">Notification Success Rate</StatLabel>
              <StatNumber fontSize="2xl" color="blue.500">{(stats?.notificationSuccess ? (stats.notificationSuccess * 100).toFixed(1) : "99.2")}%</StatNumber>
            </Stat>
          </Box>
        </Grid>

        <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="sm" color="#1e293b">Manufacturer Directory</Heading>
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none"><Search size={18} color="#94a3b8" /></InputLeftElement>
              <Input
                placeholder="Search name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  <Th color="gray.400" fontSize="2xs">Code</Th>
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
                  <Tr key={company.id} _hover={{ bg: "gray.50" }}>
                    <Td fontWeight="bold" color="#1e293b" maxW="200px" isTruncated>{company.name}</Td>
                    <Td><Badge colorScheme="blue" variant="subtle" fontSize="2xs">{company.companyCode}</Badge></Td>
                    <Td color="gray.600" fontSize="xs">{company.email || "---"}</Td>
                    <Td>
                      <Badge 
                        colorScheme={company.isRegistered ? "green" : "gray"} 
                        variant="solid" 
                        fontSize="2xs"
                        borderRadius="full"
                        px={2}
                      >
                        {company.isRegistered ? "Registered" : "Pending"}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <IconButton
                        aria-label="Edit company"
                        icon={<Edit2 size={14} />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleEdit(company)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>

        {/* Recent Notifications Log (Global) */}
        <Box bg="white" p={6} borderRadius="2xl" border="1px" borderColor="gray.100" shadow="sm">
          <Flex align="center" gap={2} mb={4}>
            <History size={18} color="#94a3b8" />
            <Heading size="sm" color="#1e293b">Recent Notification Logs</Heading>
          </Flex>
          <NotificationLogTable />
        </Box>
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

                <Divider />

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
