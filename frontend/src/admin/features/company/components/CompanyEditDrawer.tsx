import {
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, 
  DrawerCloseButton, VStack, FormControl, FormLabel, Input, 
  Switch, Box, Flex, Text, Button, Divider, Stack
} from "@chakra-ui/react";
import { ShieldCheck, History } from "lucide-react";
import { NotificationLogTable } from "./NotificationLogTable";

interface CompanyEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompany: any;
  setSelectedCompany: (company: any) => void;
  onSave: () => void;
  onResendMissed: () => void;
  isSaving: boolean;
  isResending: boolean;
}

export function CompanyEditDrawer({
  isOpen, onClose, selectedCompany, setSelectedCompany,
  onSave, onResendMissed, isSaving, isResending
}: CompanyEditDrawerProps) {
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={{ base: "full", md: "md" }}>
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
                  isLoading={isResending}
                  onClick={onResendMissed}
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
                  onClick={onSave}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </Stack>
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
