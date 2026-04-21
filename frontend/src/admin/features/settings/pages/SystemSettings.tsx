
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Bell, Save, RotateCcw, Check, AlertTriangle, AlertCircle, Users, UserCircle } from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Skeleton,
  VStack
} from "@chakra-ui/react";
import { GeneralSection } from "../components/GeneralSection";
import { ProfileSection } from "../components/ProfileSection";
import { SecurityTab } from "../components/SecurityTab";
import { NotificationsTab } from "../components/NotificationsTab";
import { SettingsAdmins } from "../components/SettingsAdmins";

import { useSystemSettings } from "../hooks/useSystemSettings";
import { type Section } from "../types";



const navSections: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: "account",       label: "My Account",    icon: UserCircle, desc: "Personal profile & security" },
  { id: "general",       label: "General",       icon: Settings,   desc: "System preferences & behavior" },
  { id: "security",      label: "Security",      icon: Shield,     desc: "Manage authentication & security policies" },
  { id: "notifications", label: "Notifications", icon: Bell,       desc: "Alert rules & delivery settings" },
  { id: "admins",        label: "Admin Roles",   icon: Users,      desc: "Manage admin accounts and roles" },
];

export default function SystemSettings() {

  const settings = useSystemSettings();
  const { state, actions, mutations } = settings;

  if (state.isLoading || state.isMounting) {
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
    if (state.user?.role !== "super_admin" && (s.id !== "general" && s.id !== "account")) return false;
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
              {state.unsaved && (
                <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  align="center" gap={1.5} bg="yellow.50" border="1px solid" borderColor="yellow.200" borderRadius="md" px={2} py={1}>
                  <AlertCircle size={12} color="#d97706" />
                  <Text fontSize="2xs" fontWeight="bold" color="yellow.600">Unsaved</Text>
                </Flex>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {state.saved && (
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
                onClick={() => actions.handleNavClick(s.id)}
                align="center" gap={3} p={3} px={4} cursor="pointer"
                borderBottom={{ base: 'none', md: i < filteredNavSections.length - 1 ? "1px solid" : "none" }}
                borderRight={{ base: i < filteredNavSections.length - 1 ? "1px solid" : "none", md: 'none' }}
                borderColor="#f8fafc"
                bg={state.active === s.id ? "red.50" : "transparent"}
                borderLeftWidth={{ base: "0", md: "3px" }}
                borderLeftStyle="solid"
                borderLeftColor={state.active === s.id ? "#CE0037" : "transparent"}
                borderBottomColor={{ base: state.active === s.id ? "#CE0037" : "transparent", md: "none" }}
                borderBottomWidth={{ base: state.active === s.id ? "2px" : "0", md: "0" }}
                transition="all 0.15s"
                _hover={{ bg: state.active === s.id ? "red.50" : "#f8fafc" }}
                minW={{ base: '140px', md: 'auto' }}
              >
                <Flex w="30px" h="30px" borderRadius="md" align="center" justify="center"
                  bg={state.active === s.id ? "red.50" : "#f8fafc"}
                  border="1px solid" borderColor={state.active === s.id ? "red.200" : "#e2e8f0"} flexShrink={0} display={{ base: 'none', sm: 'flex' }}>
                  <s.icon size={14} color={state.active === s.id ? "#CE0037" : "#94a3b8"} />
                </Flex>
                <Box>
                  <Text m={0} fontSize="sm" fontWeight={state.active === s.id ? "bold" : "medium"} color={state.active === s.id ? "#CE0037" : "#0f172a"}>{s.label}</Text>
                  <Text m={0} fontSize="2xs" color="#64748b" display={{ base: 'none', md: 'block' }}>{s.desc}</Text>
                </Box>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* Main Content */}
        <Box as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} flex={1} minW={0}>

          {state.active === "account" && (
            <ProfileSection
              personalEmail={state.user?.email || ""}
              firstName={state.firstName} setFirstName={actions.setFirstName}
              lastName={state.lastName} setLastName={actions.setLastName}
              userTwoFA={state.userTwoFA} setUserTwoFA={actions.setUserTwoFA}
              track={actions.track}
            />
          )}

          {state.active === "general" && (
            <GeneralSection
              retention={state.retention} setRetention={(v) => actions.track(() => actions.setRetention(v))}
              track={actions.track}
              userRole={state.user?.role ?? undefined}
              onRunArchiving={() => mutations.runArchivingManual.mutate()}
              isArchiving={mutations.runArchivingManual.isPending}
              senderId={state.senderId} setSenderId={actions.setSenderId}
              receiverId={state.receiverId} setReceiverId={actions.setReceiverId}
              meddraVersion={state.meddraVersion} setMeddraVersion={actions.setMeddraVersion}
              meddraVersions={state.meddraVersions}
              smtpHost={state.smtpHost} setSmtpHost={actions.setSmtpHost}
              smtpPort={state.smtpPort} setSmtpPort={actions.setSmtpPort}
              smtpUser={state.smtpUser} setSmtpUser={actions.setSmtpUser}
              smtpPass={state.smtpPass} setSmtpPass={actions.setSmtpPass}
              smtpFrom={state.smtpFrom} setSmtpFrom={actions.setSmtpFrom}
            />
          )}

          {state.active === "security" && (
            <SecurityTab
              sessionTimeout={state.sessionTimeout} setSessionTimeout={actions.setSessionTimeout}
              maxLoginAttempts={state.maxLoginAttempts} setMaxLoginAttempts={actions.setMaxLoginAttempts}
              passwordExpiry={state.passwordExpiry} setPasswordExpiry={actions.setPasswordExpiry}
              lockoutCooldown={state.lockoutCooldown} setLockoutCooldown={actions.setLockoutCooldown}
              track={actions.track}
            />
          )}

          {state.active === "notifications" && (
            <NotificationsTab
              urgentAlerts={state.urgentAlerts} setUrgentAlerts={actions.setUrgentAlerts}
              alertThreshold={state.alertThreshold} setAlertThreshold={actions.setAlertThreshold}
              notifyOnApproval={state.notifyOnApproval} setNotifyOnApproval={actions.setNotifyOnApproval}
              track={actions.track}
            />
          )}

          {state.active === "admins" && state.user?.role === "super_admin" && (
            <SettingsAdmins
              adminUsers={state.adminUsers || []}
              inviteEmail={state.inviteEmail} setInviteEmail={actions.setInviteEmail}
              inviteRole={state.inviteRole} setInviteRole={actions.setInviteRole}
              roleChanges={state.roleChanges} setRoleChanges={actions.setRoleChanges}
              track={actions.track}
              onInvite={() => {
                if (state.inviteEmail) mutations.inviteAdmin.mutate({ email: state.inviteEmail, role: state.inviteRole, redirectTo: `${window.location.origin}/admin/reset-password` });
              }}
              isInviting={mutations.inviteAdmin.isPending}
              isUpdatingRole={mutations.updateAdminRole.isPending}
            />
          )}

          {/* Save / Reset Bar */}
          <Flex as={motion.div} {...({} as any)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} justify="flex-end" gap={3} mt={5}>
            <Button as={motion.button} {...({} as any)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={actions.handleDiscard} variant="outline" bg="white" color="#64748b" borderColor="#e2e8f0"
              leftIcon={<RotateCcw size={14} />} size="md">
              Reset
            </Button>
            <Button as={motion.button} {...({} as any)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={actions.handleSave}
              bg={state.unsaved ? "#CE0037" : "#e2e8f0"}
              color={state.unsaved ? "white" : "#94a3b8"}
              leftIcon={<Save size={14} />} size="md" transition="all 0.2s"
              _hover={state.unsaved ? { bg: "#b3002f" } : {}}
              isLoading={mutations.updateSettings.isPending || mutations.updateAdminProfile.isPending}>
              Save Changes
            </Button>
          </Flex>
        </Box>
      </Flex>

      {/* Unsaved Changes Modal */}
      <Modal isOpen={state.isOpen} onClose={actions.onClose} isCentered>
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
            <Button variant="outline" bg="#f8fafc" color="#64748b" onClick={actions.onClose} flex={1}>Stay & Save</Button>
            <Button bg="#CE0037" color="white" onClick={actions.handleDiscard} flex={1} _hover={{ bg: "#b3002f" }}>Discard Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}