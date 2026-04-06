import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Bell, Save, RotateCcw, Check, AlertTriangle, AlertCircle, Users, UserCircle } from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, useDisclosure, useToast,Skeleton,
  VStack
} from "@chakra-ui/react";
import { trpc } from "../../../../utils/trpc";
import { supabase } from "../../../../utils/supabaseClient";
import { GeneralSection } from "../components/GeneralSection";
import { ProfileSection } from "../components/ProfileSection";
import { SecurityTab } from "../components/SecurityTab";
import { NotificationsTab } from "../components/NotificationsTab";
import { SettingsAdmins } from "../components/SettingsAdmins";


type Section = "account" | "general" | "security" | "notifications" | "admins";

const navSections: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: "account",       label: "My Account",    icon: UserCircle, desc: "Personal profile & security" },
  { id: "general",       label: "General",       icon: Settings,   desc: "System preferences & behavior" },
  { id: "security",      label: "Security",      icon: Shield,     desc: "Manage authentication & security policies" },
  { id: "notifications", label: "Notifications", icon: Bell,       desc: "Alert rules & delivery settings" },
  { id: "admins",        label: "Admin Roles",   icon: Users,      desc: "Manage admin accounts and roles" },
];

export default function SystemSettings() {
  const [active, setActive] = useState<Section>("account");
  const [unsaved, setUnsaved] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingSection, setPendingSection] = useState<Section | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounting(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
    onSuccess: () => { utils.admin.getAdmins.invalidate(); utils.admin.getMe.invalidate(); setUnsaved(false); setSaved(true); setTimeout(() => setSaved(false), 3000); },
    onError: (error) => { toast({ title: "Error saving profile", description: error.message, status: "error", duration: 5000, isClosable: true }); }
  });

  const toggleTwoFactor = trpc.admin.toggleTwoFactor.useMutation({
    onSuccess: () => { utils.admin.getMe.invalidate(); },
    onError: (err) => { toast({ title: "Failed to update 2FA", description: err.message, status: "error" }); }
  });

  // ── State ──
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [retention, setRetention] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState("");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [passwordExpiry, setPasswordExpiry] = useState("90 days");
  const [meddraVersion, setMeddraVersion] = useState("29.1");
  const [lockoutCooldown, setLockoutCooldown] = useState("30 min"); 
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"super_admin" | "admin" | "viewer">("admin");
  const [urgentAlerts, setUrgentAlerts] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [notifyOnApproval, setNotifyOnApproval] = useState(false);
  const [userTwoFA, setUserTwoFA] = useState(false);
  const [roleChanges, setRoleChanges] = useState<Record<string, "super_admin" | "admin" | "viewer">>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null));
  }, []);

  useEffect(() => {
    if (data) {
      const clinical = data.clinicalConfig || {};
      setRetention(clinical.retention || "24 months");

      setSessionTimeout(clinical.sessionTimeout || "60 min");
      setMaxLoginAttempts(clinical.maxLoginAttempts || "5");
      setPasswordExpiry(clinical.passwordExpiry || "90 days");
      setMeddraVersion(clinical.meddraVersion || "29.1");
      setLockoutCooldown(clinical.lockoutCooldown || "30 min");
      setSenderId(clinical.senderId || "CLINSOLUTION-DEFAULT");
      setReceiverId(clinical.receiverId || "EVHUMAN");

      setSmtpHost(clinical.smtpHost || "");
      setSmtpPort(clinical.smtpPort || "587");
      setSmtpUser(clinical.smtpUser || "");
      setSmtpPass(clinical.smtpPass || "");
      setSmtpFrom(clinical.smtpFrom || "");

      const notifs = data.notificationThresholds || {};
      setUrgentAlerts(notifs.urgentAlerts !== false);
      setAlertThreshold(notifs.alertThreshold || "All Severities");
      setNotifyOnApproval(notifs.notifyOnApproval !== false);
    }
  }, [data]);

  useEffect(() => {
    if (user) { 
      setFirstName(user.firstName || ""); 
      setLastName(user.lastName || ""); 
      setUserTwoFA(!!user.twoFactorEnabled);
    }
  }, [user]);

  const track = (fn: () => void) => { fn(); setUnsaved(true); setSaved(false); };

  const { data: meddraVersionsData } = trpc.reference.getMeddraVersions.useQuery();
  const meddraVersions = meddraVersionsData || [];

  const handleNavClick = (id: Section) => {
    if (unsaved && id !== active) { setPendingSection(id); onOpen(); }
    else setActive(id);
  };

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      notificationThresholds: {
        urgentAlerts, alertThreshold, notifyOnApproval,
        emailDigest: data?.notificationThresholds.emailDigest || false,
        digestFrequency: data?.notificationThresholds.digestFrequency || "Daily",
        smsAlerts: data?.notificationThresholds.smsAlerts || false,
      },
      clinicalConfig: { retention, sessionTimeout, maxLoginAttempts, passwordExpiry, meddraVersion, lockoutCooldown, senderId, receiverId,
        smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom
      }
    });
    if (userId) {
      await updateAdminProfile.mutateAsync({ firstName, lastName });
      if (userTwoFA !== !!user?.twoFactorEnabled) {
          await toggleTwoFactor.mutateAsync({ enabled: userTwoFA });
      }
    }
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
      const clinical = data.clinicalConfig || {};
      setRetention(clinical.retention || "24 months");

      setSessionTimeout(clinical.sessionTimeout || "60 min");
      setMaxLoginAttempts(clinical.maxLoginAttempts || "5");
      setPasswordExpiry(clinical.passwordExpiry || "90 days");
      setMeddraVersion(clinical.meddraVersion || "29.1");
      setLockoutCooldown(clinical.lockoutCooldown || "30 min");
      setSenderId(clinical.senderId || "CLINSOLUTION-DEFAULT");
      setReceiverId(clinical.receiverId || "EVHUMAN");

      setSmtpHost(clinical.smtpHost || "");
      setSmtpPort(clinical.smtpPort || "587");
      setSmtpUser(clinical.smtpUser || "");
      setSmtpPass(clinical.smtpPass || "");
      setSmtpFrom(clinical.smtpFrom || "");

      const notifs = data.notificationThresholds || {};
      setUrgentAlerts(notifs.urgentAlerts !== false);
      setAlertThreshold(notifs.alertThreshold || "All Severities");
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

  if (isLoading || isMounting) {
    return (
      <Flex direction="column" minH="100vh" bg="#f8fafc" p={8}>
        <Flex gap={6} flex={1}>
          <Box w="260px" flexShrink={0}>
             <Skeleton h="300px" borderRadius="2xl" />
          </Box>
          <Box flex={1}>
             <VStack align="stretch" spacing={6}>
                <Skeleton h="100px" borderRadius="2xl" />
                <Skeleton h="400px" borderRadius="2xl" />
             </VStack>
          </Box>
        </Flex>
      </Flex>
    );
  }

  const filteredNavSections = navSections.filter(s => {
    if (user?.role !== "super_admin" && (s.id !== "general" && s.id !== "account")) return false;
    return true;
  });

  return (
    <Flex direction="column" minH="100%" bg="#f8fafc" fontFamily="'DM Sans', system-ui, sans-serif">

      {/* Header */}
      <Box p={{ base: 4, md: 7 }} px={{ base: 4, md: 8 }} borderBottom="1px solid" borderColor="#e2e8f0" bg="white">
        <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} direction={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} justify="space-between" gap={4}>
          <Box>
            <Flex align="center" gap={3} mb={1}>
              <Settings size={22} color="#CE0037" />
              <Heading as="h1" size={{ base: "md", md: "lg" }} color="#0f172a" letterSpacing="-0.5px">System Settings</Heading>
            </Flex>
            <Text color="#64748b" fontSize={{ base: "xs", md: "sm" }}>Configure system behavior and security policies</Text>
          </Box>
          <Flex align="center" gap={2} wrap="wrap">
            <Flex align="center" gap={1.5} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" px={2} py={1}>
              <Shield size={12} color="#CE0037" />
              <Text fontSize="2xs" fontWeight="bold" color="#CE0037">Admin Only</Text>
            </Flex>
            <AnimatePresence>
              {unsaved && (
                <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  align="center" gap={1.5} bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="md" px={2} py={1}>
                  <AlertCircle size={12} color="#d97706" />
                  <Text fontSize="2xs" fontWeight="bold" color="yellow.600">Unsaved</Text>
                </Flex>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {saved && (
                <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  align="center" gap={1.5} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="md" px={2} py={1}>
                  <Check size={12} color="#059669" />
                  <Text fontSize="2xs" fontWeight="bold" color="emerald.600">Saved</Text>
                </Flex>
              )}
            </AnimatePresence>
          </Flex>
        </Flex>
      </Box>

      <Flex flex={1} direction={{ base: 'column', md: 'row' }} p={{ base: 4, md: 6 }} px={{ base: 4, md: 8 }} gap={6}>

        {/* Sidebar Nav */}
        <Box as={motion.div} {...({} as any)} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} w={{ base: 'full', md: '260px' }} flexShrink={0}>
          <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden" display={{ base: 'flex', md: 'block' }} overflowX={{ base: 'auto', md: 'hidden' }} sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
            {filteredNavSections.map((s, i) => (
              <Flex
                key={s.id}
                onClick={() => handleNavClick(s.id)}
                align="center" gap={3} p={3} px={4} cursor="pointer"
                borderBottom={{ base: 'none', md: i < filteredNavSections.length - 1 ? "1px solid" : "none" }}
                borderRight={{ base: i < filteredNavSections.length - 1 ? "1px solid" : "none", md: 'none' }}
                borderColor="#f8fafc"
                bg={active === s.id ? "red.50" : "transparent"}
                borderLeft={{ base: 'none', md: "3px solid" }}
                borderLeftColor={active === s.id ? "#CE0037" : "transparent"}
                borderBottomColor={{ base: active === s.id ? "#CE0037" : "transparent", md: 'none' }}
                borderBottomWidth={{ base: active === s.id ? "2px" : "0", md: '0' }}
                transition="all 0.15s"
                _hover={{ bg: active === s.id ? "red.50" : "#f8fafc" }}
                minW={{ base: '140px', md: 'auto' }}
              >
                <Flex w="30px" h="30px" borderRadius="md" align="center" justify="center"
                  bg={active === s.id ? "red.50" : "#f8fafc"}
                  border="1px solid" borderColor={active === s.id ? "red.200" : "#e2e8f0"} flexShrink={0} display={{ base: 'none', sm: 'flex' }}>
                  <s.icon size={14} color={active === s.id ? "#CE0037" : "#94a3b8"} />
                </Flex>
                <Box>
                  <Text m={0} fontSize="sm" fontWeight={active === s.id ? "bold" : "medium"} color={active === s.id ? "#CE0037" : "#0f172a"}>{s.label}</Text>
                  <Text m={0} fontSize="2xs" color="#64748b" display={{ base: 'none', md: 'block' }}>{s.desc}</Text>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* Main Content */}
        <Box as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} flex={1} minW={0}>

          {active === "account" && (
            <ProfileSection
              personalEmail={user?.email || ""}
              firstName={firstName} setFirstName={setFirstName}
              lastName={lastName} setLastName={setLastName}
              userTwoFA={userTwoFA} setUserTwoFA={setUserTwoFA}
              track={track}
            />
          )}

          {active === "general" && (
            <GeneralSection
              retention={retention} setRetention={(v) => track(() => setRetention(v))}
              track={track}
              userRole={user?.role ?? undefined}
              onRunArchiving={() => runArchivingManual.mutate()}
              isArchiving={runArchivingManual.isPending}
              senderId={senderId} setSenderId={setSenderId}
              receiverId={receiverId} setReceiverId={setReceiverId}
              meddraVersion={meddraVersion} setMeddraVersion={setMeddraVersion}
              meddraVersions={meddraVersions}
              smtpHost={smtpHost} setSmtpHost={setSmtpHost}
              smtpPort={smtpPort} setSmtpPort={setSmtpPort}
              smtpUser={smtpUser} setSmtpUser={setSmtpUser}
              smtpPass={smtpPass} setSmtpPass={setSmtpPass}
              smtpFrom={smtpFrom} setSmtpFrom={setSmtpFrom}
            />
          )}

          {active === "security" && (
            <SecurityTab
              sessionTimeout={sessionTimeout} setSessionTimeout={setSessionTimeout}
              maxLoginAttempts={maxLoginAttempts} setMaxLoginAttempts={setMaxLoginAttempts}
              passwordExpiry={passwordExpiry} setPasswordExpiry={setPasswordExpiry}
              lockoutCooldown={lockoutCooldown} setLockoutCooldown={setLockoutCooldown}
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
        <ModalContent borderRadius="2xl" mx={{ base: 4, md: 0 }}>
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