import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Shield, Bell,  Database,
  Lock, Key, Save, RotateCcw, Check, AlertTriangle,
 AlertCircle, UserCircle
} from "lucide-react";
import {
  Box, Flex, Text, Heading, Button,  Badge, Input,
  Select, Switch, Card, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, useDisclosure, useToast, Spinner, Center
} from "@chakra-ui/react";
import { trpc } from "../../utils/trpc";
import { supabase } from "../../utils/supabaseClient";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "general" | "security" | "notifications";



// ── Nav Sections ──────────────────────────────────────────────────────────────
const navSections: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: "general",       label: "General",       icon: Settings, desc: "System preferences & behavior" },
  { id: "security",      label: "Security",      icon: Shield,   desc: "Manage authentication & security policies" },
  { id: "notifications", label: "Notifications", icon: Bell,     desc: "Alert rules & delivery settings" },
];

// ── Setting Row ───────────────────────────────────────────────────────────────
function SettingRow({ label, desc, children, sensitive }: { 
  label: string; 
  desc?: string; 
  children: React.ReactNode; 
  sensitive?: boolean 
}) {
  return (
    <Flex align="center" justify="space-between" py={4} borderBottom="1px solid" borderColor="#f1f5f9">
      <Box flex={1} pr={8}>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" fontWeight="bold" color="#0f172a">{label}</Text>
          {sensitive && (
            <Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="md" px={1.5} py={0} fontSize="2xs" fontWeight="extrabold" display="flex" alignItems="center" gap={1}>
              <Lock size={8} /> SENSITIVE
            </Badge>
          )}
        </Flex>
        {desc && <Text mt={1} fontSize="xs" color="#64748b" lineHeight="1.5">{desc}</Text>}
      </Box>
      <Box flexShrink={0}>{children}</Box>
    </Flex>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" mb={5} overflow="hidden" boxShadow="none">
      <Flex p={3} px={5} borderBottom="1px solid" borderColor="#f1f5f9" align="center" gap={2} bg="#f8fafc">
        <Icon size={15} color="#CE0037" />
        <Text fontWeight="bold" fontSize="sm" color="#0f172a">{title}</Text>
      </Flex>
      <Box px={5} pb={1}>{children}</Box>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SystemSettings() {
  const [active, setActive] = useState<Section>("general");
  const [unsaved, setUnsaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingSection, setPendingSection] = useState<Section | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();


  const { data, isLoading, refetch } = trpc.admin.getSystemSettings.useQuery();
  const { data: adminUsers } = trpc.admin.getAdmins.useQuery();
  const utils = trpc.useContext();
  const updateSettings = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      setUnsaved(false);
      setSaved(true);
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      refetch();
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  const runArchivingManual = trpc.admin.runManualArchiving.useMutation({
    onSuccess: () => {
      toast({
        title: "Archiving complete",
        description: "Old reports have been moved to the archive.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      refetch();
    },
    onError: (err) => {
      toast({
        title: "Archiving failed",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  const toast = useToast();

  // ── General Settings State ──
  const [adminEmail, setAdminEmail] = useState("");
  const [language, setLanguage] = useState("");
  const [timezone, setTimezone] = useState("");
  const [retention, setRetention] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // ── Security Settings State ──
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("");
  const [passwordExpiry, setPasswordExpiry] = useState("");

  // ── Notification Settings State ──
  const [urgentAlerts, setUrgentAlerts] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [notifyOnApproval, setNotifyOnApproval] = useState(false);
  
  const updateAdminProfile = trpc.admin.updateAdminProfile.useMutation({
    onSuccess: () => {
      utils.admin.getAdmins.invalidate();
      setUnsaved(false);
      setSaved(true);
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      toast({
        title: "Error saving profile",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  // Integration settings removed

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (data) {
      setLanguage(data.defaultLanguage || "English (US)");
      
      const clinical = data.clinicalConfig || {};
      setAdminEmail(clinical.adminEmail || "admin@pharma.com");
      setTimezone(clinical.timezone || "UTC+05:30 (IST)");
      setRetention(clinical.retention || "24 months");
      setMaintenanceMode(!!clinical.maintenanceMode);
      setTwoFA(clinical.twoFA !== false); // Default to true if not explicitly false
      setSessionTimeout(clinical.sessionTimeout || "60 min");
      setMaxLoginAttempts(clinical.maxLoginAttempts || "5");
      setPasswordExpiry(clinical.passwordExpiry || "90 days");
  
      const notifs = data.notificationThresholds || {};
      setUrgentAlerts(notifs.urgentAlerts !== false);
      setAlertThreshold(notifs.alertThreshold || "Critical & High");
      setNotifyOnApproval(notifs.notifyOnApproval !== false);
    }
  }, [data]);

  useEffect(() => {
    if (adminUsers && userId) {
      const profile = adminUsers.find(a => a.id === userId);
      if (profile) {
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
      }
    }
  }, [adminUsers, userId]);

  const track = (fn: () => void) => { fn(); setUnsaved(true); setSaved(false); };

  const handleNavClick = (id: Section) => {
    if (unsaved && id !== active) {
      setPendingSection(id);
      onOpen();
    } else {
      setActive(id);
    }
  };

  const handleSave = async () => {
    if (active === "general" || active === "security" || active === "notifications") {
      if (!adminEmail.trim()) {
        toast({
          title: "Validation Error",
          description: "Admin Email is required.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await updateSettings.mutateAsync({
        defaultLanguage: language,
        notificationThresholds: {
          urgentAlerts,
          alertThreshold,
          notifyOnApproval,
          emailDigest: data?.notificationThresholds.emailDigest || false,
          digestFrequency: data?.notificationThresholds.digestFrequency || "Daily",
          smsAlerts: data?.notificationThresholds.smsAlerts || false,
        },
        clinicalConfig: {
          adminEmail,
          timezone,
          retention,
          maintenanceMode,
          twoFA,
          sessionTimeout,
          maxLoginAttempts,
          passwordExpiry,
        }
      });
    }

    // Always update profile fields if they are in the General tab now
    if (userId) {
      await updateAdminProfile.mutateAsync({
        firstName,
        lastName,
      });
    }

    setUnsaved(false);
    setSaved(true);
    toast({
      title: "Settings updated",
      description: "Your changes have been saved successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    refetch();
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDiscard = () => {
    if (data) {
        // Reset to fetched state
        setLanguage(data.defaultLanguage || "English (US)");
        
        const clinical = data.clinicalConfig || {};
        setAdminEmail(clinical.adminEmail || "admin@pharma.com");
        setTimezone(clinical.timezone || "UTC+05:30 (IST)");
        setRetention(clinical.retention || "24 months");
        setMaintenanceMode(!!clinical.maintenanceMode);
        setTwoFA(clinical.twoFA !== false);
        setSessionTimeout(clinical.sessionTimeout || "60 min");
        setMaxLoginAttempts(clinical.maxLoginAttempts || "5");
        setPasswordExpiry(clinical.passwordExpiry || "90 days");
        // integration-related fields intentionally omitted when discarding

        const notifs = data.notificationThresholds || {};
        setUrgentAlerts(notifs.urgentAlerts !== false);
        setAlertThreshold(notifs.alertThreshold || "Critical & High");
        setNotifyOnApproval(notifs.notifyOnApproval !== false);
    }

    if (adminUsers && userId) {
      const profile = adminUsers.find(a => a.id === userId);
      if (profile) {
        setFirstName(profile.firstName || "");
        setLastName(profile.lastName || "");
      }
    }

    setUnsaved(false);
    if (pendingSection) { 
      setActive(pendingSection); 
      setPendingSection(null); 
    }
    onClose();
  };

  if (isLoading) {
    return (
        <Center h="100vh" w="100%">
            <Flex direction="column" align="center" gap={4}>
                <Spinner size="xl" color="#CE0037" thickness="4px" />
                <Text color="#64748b" fontWeight="medium">Loading system configurations...</Text>
            </Flex>
        </Center>
    );
  }

  return (
    <Flex direction="column" minH="100%" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif">

      {/* ── Header ── */}
      <Box p={7} px={8} borderBottom="1px solid" borderColor="#e2e8f0" bg="white">
        <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} align="flex-start" justify="space-between">
          <Box>
            <Flex align="center" gap={3} mb={1}>
              <Settings size={22} color="#CE0037" />
              <Heading as="h1" size="lg" color="#0f172a" letterSpacing="-0.5px">System Settings</Heading>
            </Flex>
            <Text color="#64748b" fontSize="sm">Configure system behavior and security policies</Text>
          </Box>
          <Flex align="center" gap={3}>
            <Flex align="center" gap={1.5} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" px={3} py={1.5}>
              <Shield size={13} color="#CE0037" />
              <Text fontSize="xs" fontWeight="bold" color="#CE0037">Admin Only</Text>
            </Flex>
            <AnimatePresence>
                {unsaved && (
                <Flex
                    as={motion.div}
                    {...({} as any)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    align="center"
                    gap={1.5}
                    bg="yellow.50"
                    border="1px solid"
                    borderColor="yellow.200"
                    borderRadius="md"
                    px={3}
                    py={1.5}
                >
                    <AlertCircle size={13} color="#d97706" />
                    <Text fontSize="xs" fontWeight="bold" color="yellow.600">Unsaved changes</Text>
                </Flex>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {saved && (
                <Flex
                    as={motion.div}
                    {...({} as any)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    align="center"
                    gap={1.5}
                    bg="green.50"
                    border="1px solid"
                    borderColor="green.200"
                    borderRadius="md"
                    px={3}
                    py={1.5}
                >
                    <Check size={13} color="#059669" />
                    <Text fontSize="xs" fontWeight="bold" color="emerald.600">Settings saved</Text>
                </Flex>
                )}
            </AnimatePresence>
          </Flex>
        </Flex>
      </Box>

      <Flex flex={1} p={6} px={8} gap={6}>

        {/* ── Sidebar Nav ── */}
        <Box
          as={motion.div}
          {...({} as any)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          w="260px"
          shrink={0}
        >
          <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden">
            {navSections.map((s, i) => (
              <Flex
                key={s.id}
                onClick={() => handleNavClick(s.id)}
                align="center"
                gap={3}
                p={3}
                px={4}
                cursor="pointer"
                borderBottom={i < navSections.length - 1 ? "1px solid" : "none"}
                borderColor="#f8fafc"
                bg={active === s.id ? "red.50" : "transparent"}
                borderLeft="3px solid"
                borderLeftColor={active === s.id ? "#CE0037" : "transparent"}
                transition="all 0.15s"
                _hover={{ bg: active === s.id ? "red.50" : "#f8fafc" }}
              >
                <Flex w="30px" h="30px" borderRadius="md" align="center" justify="center" bg={active === s.id ? "red.50" : "#f8fafc"} border="1px solid" borderColor={active === s.id ? "red.200" : "#e2e8f0"} shrink={0}>
                  <s.icon size={14} color={active === s.id ? "#CE0037" : "#94a3b8"} />
                </Flex>
                <Box>
                  <Text m={0} fontSize="sm" fontWeight={active === s.id ? "bold" : "medium"} color={active === s.id ? "#CE0037" : "#0f172a"}>{s.label}</Text>
                  <Text m={0} fontSize="xs" color="#64748b">{s.desc}</Text>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* ── Main Content ── */}
        <Box
          as={motion.div}
          {...({} as any)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          flex={1}
          minW={0}
        >
          {active === "general" && (
            <>
              <SectionCard title="Profile" icon={UserCircle}>
                <SettingRow label="First Name" desc="Your first name for professional attribution">
                  <Input value={firstName} onChange={(e) => track(() => setFirstName(e.target.value))} size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="Last Name" desc="Your last name for professional attribution">
                  <Input value={lastName} onChange={(e) => track(() => setLastName(e.target.value))} size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="Admin Email" desc="Used for system alerts and professional contact">
                  <Input value={adminEmail} onChange={(e) => track(() => setAdminEmail(e.target.value))} size="sm" w="220px" bg="white" />
                </SettingRow>
              </SectionCard>

             

              <SectionCard title="Data Management" icon={Database}>
                <SettingRow label="Report Retention Period" desc="How long submitted reports are stored before archiving">
                  <Flex align="center" gap={3}>
                    <Select value={retention} onChange={(e) => track(() => setRetention(e.target.value))} size="sm" w="220px" bg="white">
                       {["6 months", "12 months", "24 months", "5 years", "Indefinite"].map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      colorScheme="red" 
                      leftIcon={<RotateCcw size={12} />}
                      onClick={() => runArchivingManual.mutate()}
                      isLoading={runArchivingManual.isPending}
                    >
                      Run Cleanup Now
                    </Button>
                  </Flex>
                </SettingRow>
                <SettingRow label="Maintenance Mode" desc="Temporarily disables submissions from all reporters" sensitive>
                  <Switch colorScheme="red" isChecked={maintenanceMode} onChange={(e) => track(() => setMaintenanceMode(e.target.checked))} />
                </SettingRow>
              </SectionCard>

             
            </>
          )}

          {/* ── Security ── */}
          {active === "security" && (
            <>
              <Flex align="flex-start" gap={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="xl" p={4} mb={5}>
                <Box mt="2px"><Shield size={16} color="#CE0037" /></Box>
                <Box>
                  <Text m={0} fontSize="sm" fontWeight="bold" color="#9b0028">Security Settings — Handle with care</Text>
                  <Text m={0} mt={1} fontSize="xs" color="#CE0037">Changes to these settings affect all users and are logged with admin identity and IP address.</Text>
                </Box>
              </Flex>

              <SectionCard title="Authentication" icon={Key}>
                <SettingRow label="Two-Factor Authentication" desc="Require 2FA for all admin accounts" sensitive>
                   <Switch colorScheme="red" isChecked={twoFA} onChange={(e) => track(() => setTwoFA(e.target.checked))} />
                </SettingRow>
                <SettingRow label="Session Timeout" desc="Automatically log out inactive users after this period">
                  <Select value={sessionTimeout} onChange={(e) => track(() => setSessionTimeout(e.target.value))} size="sm" w="220px" bg="white">
                     {["15 min", "30 min", "60 min", "2 hours", "8 hours"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
                <SettingRow label="Max Login Attempts" desc="Lock account after N consecutive failed logins" sensitive>
                   <Select value={maxLoginAttempts} onChange={(e) => track(() => setMaxLoginAttempts(e.target.value))} size="sm" w="220px" bg="white">
                     {["3", "5", "10"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
                <SettingRow label="Password Expiry" desc="Force users to reset password after this period">
                   <Select value={passwordExpiry} onChange={(e) => track(() => setPasswordExpiry(e.target.value))} size="sm" w="220px" bg="white">
                     {["30 days", "60 days", "90 days", "180 days", "Never"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {/* ── Notifications ── */}
          {active === "notifications" && (
            <>
              <SectionCard title="Alert Rules" icon={Bell}>
                <SettingRow label="Urgent Case Alerts" desc="Send immediate alerts when a report is flagged as Critical or Urgent">
                  <Switch colorScheme="red" isChecked={urgentAlerts} onChange={(e) => track(() => setUrgentAlerts(e.target.checked))} />
                </SettingRow>
                <SettingRow label="Alert Threshold" desc="Minimum severity level to trigger an alert">
                   <Select value={alertThreshold} onChange={(e) => track(() => setAlertThreshold(e.target.value))} size="sm" w="220px" bg="white">
                     {["All Severities", "Critical & High", "Critical Only"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
                <SettingRow label="Notify on Approval" desc="Send notification when a report is approved or closed">
                   <Switch colorScheme="red" isChecked={notifyOnApproval} onChange={(e) => track(() => setNotifyOnApproval(e.target.checked))} />
                </SettingRow>
              </SectionCard>
          </>
          )}

       


          {/* ── Save / Reset Bar ── */}
          {true && (
            <Flex
              as={motion.div}
              {...({} as any)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              justify="flex-end"
              gap={3}
              mt={5}
            >
              <Button
                as={motion.button}
                {...({} as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDiscard}
                variant="outline"
                bg="white"
                color="#64748b"
                borderColor="#e2e8f0"
                leftIcon={<RotateCcw size={14} />}
                size="md"
              >
                Reset
              </Button>
              <Button
                as={motion.button}
                {...({} as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                bg={unsaved ? "#CE0037" : "#e2e8f0"}
                color={unsaved ? "white" : "#94a3b8"}
                leftIcon={<Save size={14} />}
                size="md"
                transition="all 0.2s"
                _hover={unsaved ? { bg: "#b3002f" } : {}}
                isLoading={updateSettings.isPending || updateAdminProfile.isPending}
              >
                Save Changes
              </Button>
            </Flex>
          )}
        </Box>
      </Flex>

      {/* ── Unsaved Changes Confirm Modal ── */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" />
        <ModalContent borderRadius="2xl">
          <ModalHeader pb={0}>
            <Flex align="center" gap={3}>
              <Flex w="38px" h="38px" borderRadius="lg" bg="red.50" border="1px solid" borderColor="red.200" align="center" justify="center">
                <AlertTriangle size={18} color="#CE0037" />
              </Flex>
              <Text fontSize="md" fontWeight="bold" color="#0f172a">Unsaved Changes</Text>
            </Flex>
          </ModalHeader>
          <ModalBody pt={4} pb={6}>
            <Text fontSize="sm" color="#64748b" lineHeight="1.6">
              You have unsaved changes in this section. If you leave now, your changes will be lost.
            </Text>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="outline" bg="#f8fafc" color="#64748b" onClick={onClose} flex={1}>
              Stay & Save
            </Button>
            <Button bg="#CE0037" color="white" onClick={handleDiscard} flex={1} _hover={{ bg: "#b3002f" }}>
              Discard Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
