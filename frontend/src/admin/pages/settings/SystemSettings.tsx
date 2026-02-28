import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Bell, Save, RotateCcw, Check, AlertTriangle, AlertCircle, Users } from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, useDisclosure, useToast, Spinner, Center
} from "@chakra-ui/react";
import { trpc } from "../../../utils/trpc";
import { supabase } from "../../../utils/supabaseClient";
import { GeneralSection } from "./components/GeneralSection";
import { SecurityTab } from "./components/SecurityTab";
import { NotificationsTab } from "./components/NotificationsTab";
import { SettingsAdmins } from "./components/SettingsAdmins";

type Section = "general" | "security" | "notifications" | "admins";

const navSections: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: "general",       label: "General",       icon: Settings, desc: "System preferences & behavior" },
  { id: "security",      label: "Security",      icon: Shield,   desc: "Manage authentication & security policies" },
  { id: "notifications", label: "Notifications", icon: Bell,     desc: "Alert rules & delivery settings" },
  { id: "admins",        label: "Admin Roles",   icon: Users,    desc: "Manage admin accounts and roles" },
];

export default function SystemSettings() {
  const [active, setActive] = useState<Section>("general");
  const [unsaved, setUnsaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingSection, setPendingSection] = useState<Section | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { data: user } = trpc.admin.getMe.useQuery();
  const { data, isLoading, refetch } = trpc.admin.getSystemSettings.useQuery();
  const { data: adminUsers, refetch: refetchAdmins } = trpc.admin.getAdmins.useQuery(undefined, {
    enabled: user?.role === "super_admin",
  });
  const utils = trpc.useContext();

  const updateSettings = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => { setUnsaved(false); setSaved(true); refetch(); setTimeout(() => setSaved(false), 3000); },
    onError: (error) => { toast({ title: "Error saving settings", description: error.message, status: "error", duration: 5000, isClosable: true }); }
  });

  const runArchivingManual = trpc.admin.runManualArchiving.useMutation({
    onSuccess: () => { toast({ title: "Archiving complete", status: "success", duration: 3000, isClosable: true }); refetch(); },
    onError: (err) => { toast({ title: "Archiving failed", description: err.message, status: "error", duration: 5000, isClosable: true }); }
  });

  const updateAdminRole = trpc.admin.updateAdminRole.useMutation({
    onSuccess: () => { toast({ title: "Role updated", status: "success", duration: 3000, isClosable: true }); refetchAdmins(); },
    onError: (err) => { toast({ title: "Update failed", description: err.message, status: "error", duration: 5000, isClosable: true }); }
  });

  const inviteAdmin = trpc.admin.inviteAdmin.useMutation({
    onSuccess: () => { toast({ title: "Invitation sent", status: "success", duration: 4000, isClosable: true }); setInviteEmail(""); refetchAdmins(); },
    onError: (err: any) => { toast({ title: "Invitation failed", description: err.message, status: "error", duration: 5000, isClosable: true }); }
  });

  const updateAdminProfile = trpc.admin.updateAdminProfile.useMutation({
    onSuccess: () => { utils.admin.getAdmins.invalidate(); setUnsaved(false); setSaved(true); setTimeout(() => setSaved(false), 3000); },
    onError: (error) => { toast({ title: "Error saving profile", description: error.message, status: "error", duration: 5000, isClosable: true }); }
  });

  // ── State ──
  const [adminEmail, setAdminEmail] = useState("");
  const [language, setLanguage] = useState("");
  const [timezone, setTimezone] = useState("");
  const [retention, setRetention] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [passwordExpiry, setPasswordExpiry] = useState("90 days");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"super_admin" | "admin" | "viewer">("admin");
  const [urgentAlerts, setUrgentAlerts] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [notifyOnApproval, setNotifyOnApproval] = useState(false);
  const [roleChanges, setRoleChanges] = useState<Record<string, "super_admin" | "admin" | "viewer">>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null));
  }, []);

  useEffect(() => {
    if (data) {
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
      const notifs = data.notificationThresholds || {};
      setUrgentAlerts(notifs.urgentAlerts !== false);
      setAlertThreshold(notifs.alertThreshold || "Critical & High");
      setNotifyOnApproval(notifs.notifyOnApproval !== false);
    }
  }, [data]);

  useEffect(() => {
    if (user) { setFirstName(user.firstName || ""); setLastName(user.lastName || ""); }
  }, [user]);

  const track = (fn: () => void) => { fn(); setUnsaved(true); setSaved(false); };

  const handleNavClick = (id: Section) => {
    if (unsaved && id !== active) { setPendingSection(id); onOpen(); }
    else setActive(id);
  };

  const handleSave = async () => {
    if (active === "general" || active === "security" || active === "notifications") {
      if (!adminEmail.trim()) {
        toast({ title: "Validation Error", description: "Admin Email is required.", status: "warning", duration: 3000, isClosable: true });
        return;
      }
      await updateSettings.mutateAsync({
        defaultLanguage: language,
        notificationThresholds: {
          urgentAlerts, alertThreshold, notifyOnApproval,
          emailDigest: data?.notificationThresholds.emailDigest || false,
          digestFrequency: data?.notificationThresholds.digestFrequency || "Daily",
          smsAlerts: data?.notificationThresholds.smsAlerts || false,
        },
        clinicalConfig: { adminEmail, timezone, retention, maintenanceMode, twoFA, sessionTimeout, maxLoginAttempts, passwordExpiry }
      });
    }
    if (userId) await updateAdminProfile.mutateAsync({ firstName, lastName });
    const roleEntries = Object.entries(roleChanges);
    if (roleEntries.length > 0) {
      for (const [adminId, role] of roleEntries) await updateAdminRole.mutateAsync({ adminId, role });
      setRoleChanges({});
    }
    setUnsaved(false); setSaved(true);
    toast({ title: "Settings updated", description: "Your changes have been saved successfully.", status: "success", duration: 3000, isClosable: true });
    refetch();
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDiscard = () => {
    if (data) {
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
      const notifs = data.notificationThresholds || {};
      setUrgentAlerts(notifs.urgentAlerts !== false);
      setAlertThreshold(notifs.alertThreshold || "Critical & High");
      setNotifyOnApproval(notifs.notifyOnApproval !== false);
    }
    if (adminUsers && userId) {
      const profile = adminUsers.find((a: any) => a.id === userId);
      if (profile) { setFirstName(profile.firstName || ""); setLastName(profile.lastName || ""); }
    }
    setRoleChanges({});
    setUnsaved(false);
    if (pendingSection) { setActive(pendingSection); setPendingSection(null); }
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

  const filteredNavSections = navSections.filter(s => {
    if (user?.role !== "super_admin" && s.id !== "general") return false;
    return true;
  });

  return (
    <Flex direction="column" minH="100%" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif">

      {/* Header */}
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
                <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  align="center" gap={1.5} bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="md" px={3} py={1.5}>
                  <AlertCircle size={13} color="#d97706" />
                  <Text fontSize="xs" fontWeight="bold" color="yellow.600">Unsaved changes</Text>
                </Flex>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {saved && (
                <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  align="center" gap={1.5} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="md" px={3} py={1.5}>
                  <Check size={13} color="#059669" />
                  <Text fontSize="xs" fontWeight="bold" color="emerald.600">Settings saved</Text>
                </Flex>
              )}
            </AnimatePresence>
          </Flex>
        </Flex>
      </Box>

      <Flex flex={1} p={6} px={8} gap={6}>

        {/* Sidebar Nav */}
        <Box as={motion.div} {...({} as any)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} w="260px" shrink={0}>
          <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden">
            {filteredNavSections.map((s, i) => (
              <Flex
                key={s.id}
                onClick={() => handleNavClick(s.id)}
                align="center" gap={3} p={3} px={4} cursor="pointer"
                borderBottom={i < filteredNavSections.length - 1 ? "1px solid" : "none"}
                borderColor="#f8fafc"
                bg={active === s.id ? "red.50" : "transparent"}
                borderLeft="3px solid"
                borderLeftColor={active === s.id ? "#CE0037" : "transparent"}
                transition="all 0.15s"
                _hover={{ bg: active === s.id ? "red.50" : "#f8fafc" }}
              >
                <Flex w="30px" h="30px" borderRadius="md" align="center" justify="center"
                  bg={active === s.id ? "red.50" : "#f8fafc"}
                  border="1px solid" borderColor={active === s.id ? "red.200" : "#e2e8f0"} shrink={0}>
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

        {/* Main Content */}
        <Box as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} flex={1} minW={0}>

          {active === "general" && (
            <GeneralSection
              personalEmail={user?.email || ""}
              firstName={firstName} setFirstName={setFirstName}
              lastName={lastName} setLastName={setLastName}
              retention={retention} setRetention={setRetention}
              maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode}
              track={track}
              userRole={user?.role ?? undefined}
              onRunArchiving={() => runArchivingManual.mutate()}
              isArchiving={runArchivingManual.isPending}
            />
          )}

          {active === "security" && (
            <SecurityTab
              twoFA={twoFA} setTwoFA={setTwoFA}
              sessionTimeout={sessionTimeout} setSessionTimeout={setSessionTimeout}
              maxLoginAttempts={maxLoginAttempts} setMaxLoginAttempts={setMaxLoginAttempts}
              passwordExpiry={passwordExpiry} setPasswordExpiry={setPasswordExpiry}
              track={track}
            />
          )}

          {active === "notifications" && (
            <NotificationsTab
              urgentAlerts={urgentAlerts} setUrgentAlerts={setUrgentAlerts}
              alertThreshold={alertThreshold} setAlertThreshold={setAlertThreshold}
              notifyOnApproval={notifyOnApproval} setNotifyOnApproval={setNotifyOnApproval}
              track={track}
            />
          )}

          {active === "admins" && user?.role === "super_admin" && (
            <SettingsAdmins
              adminUsers={adminUsers || []}
              inviteEmail={inviteEmail} setInviteEmail={setInviteEmail}
              inviteRole={inviteRole} setInviteRole={setInviteRole}
              roleChanges={roleChanges} setRoleChanges={setRoleChanges}
              track={track}
              onInvite={() => {
                if (inviteEmail) inviteAdmin.mutate({ email: inviteEmail, role: inviteRole, redirectTo: `${window.location.origin}/admin/reset-password` });
              }}
              isInviting={inviteAdmin.isPending}
              isUpdatingRole={updateAdminRole.isPending}
            />
          )}

          {/* Save / Reset Bar */}
          <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} justify="flex-end" gap={3} mt={5}>
            <Button as={motion.button} {...({} as any)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleDiscard} variant="outline" bg="white" color="#64748b" borderColor="#e2e8f0"
              leftIcon={<RotateCcw size={14} />} size="md">
              Reset
            </Button>
            <Button as={motion.button} {...({} as any)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              bg={unsaved ? "#CE0037" : "#e2e8f0"}
              color={unsaved ? "white" : "#94a3b8"}
              leftIcon={<Save size={14} />} size="md" transition="all 0.2s"
              _hover={unsaved ? { bg: "#b3002f" } : {}}
              isLoading={updateSettings.isPending || updateAdminProfile.isPending}>
              Save Changes
            </Button>
          </Flex>
        </Box>
      </Flex>

      {/* Unsaved Changes Modal */}
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
            <Button variant="outline" bg="#f8fafc" color="#64748b" onClick={onClose} flex={1}>Stay & Save</Button>
            <Button bg="#CE0037" color="white" onClick={handleDiscard} flex={1} _hover={{ bg: "#b3002f" }}>Discard Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}