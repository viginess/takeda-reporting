import { useState, useEffect } from "react";
import { useToast, useDisclosure } from "@chakra-ui/react";
import { trpc } from "../../../../utils/config/trpc";
import { supabase } from "../../../../utils/config/supabaseClient";

import { type Section } from "../types";

/**
 * useSystemSettings Hook
 * 
 * This custom hook encapsulates all the complex state, TRPC queries, and
 * backend mutations for the System Settings page. By moving this logic here,
 * the main UI component is kept clean and only responsible for rendering.
 * 
 * It returns three distinct objects:
 * - state: All raw values (e.g. user details, form fields, loading flags)
 * - actions: UI handler functions (e.g. tracking changes, setting tabs)
 * - mutations: Direct backend TRPC mutation functions 
 */
export function useSystemSettings() {
  // Navigation & UI State
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

  // ── Backend TRPC Mutations ──
  // These handle saving specific groups of settings to the database

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

  // ── Form State Variables ──
  // Local state for all input fields across the 5 different settings tabs
  
  // General Tab
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

  /**
   * Helper function to pull the latest backend data and sync it 
   * into our local React useState variables.
   */
  const syncDataToState = () => {
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
  };

  useEffect(() => {
    syncDataToState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Sync user profile data (My Account tab) to state when 'getMe' returns
  useEffect(() => {
    if (user) { 
      setFirstName(user.firstName || ""); 
      setLastName(user.lastName || ""); 
      setUserTwoFA(!!user.twoFactorEnabled);
    }
  }, [user]);

  /**
   * Wraps any state-setting function to automatically flag the form
   * as "unsaved". This triggers the warning popup if the user tries to leave.
   */
  const track = (fn: () => void) => { fn(); setUnsaved(true); setSaved(false); };

  const { data: meddraVersionsData } = trpc.reference.getMeddraVersions.useQuery();
  const meddraVersions = meddraVersionsData || [];

  /**
   * Safe Navigation: Blocks switching tabs if there are unsaved changes
   */
  const handleNavClick = (id: Section) => {
    if (unsaved && id !== active) { setPendingSection(id); onOpen(); }
    else setActive(id);
  };

  /**
   * Master Save Controller
   * Submits all edited fields from all tabs in a single batch.
   */
  const handleSave = async () => {
    // 1. Save global settings
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

    // 2. Save personal profile updates
    if (userId) {
      await updateAdminProfile.mutateAsync({ firstName, lastName });
      if (userTwoFA !== !!user?.twoFactorEnabled) {
          await toggleTwoFactor.mutateAsync({ enabled: userTwoFA });
      }
    }

    // 3. Process any role changes made in the Admin Roles tab
    const roleEntries = Object.entries(roleChanges);
    if (roleEntries.length > 0) {
      for (const [adminId, role] of roleEntries) await updateAdminRole.mutateAsync({ adminId, role });
      setRoleChanges({});
    }

    // 4. Clean up state and show confirmation toast
    setUnsaved(false); setSaved(true);
    toast({ title: "Settings updated", description: "Your changes have been saved successfully.", status: "success", duration: 3000, isClosable: true });
    refetch();
    setTimeout(() => setSaved(false), 3000);
  };

  /**
   * Resets all visual forms back to whatever data is currently in the DB
   */
  const handleDiscard = () => {
    syncDataToState();
    if (adminUsers && userId) {
      const profile = adminUsers.find((a: any) => a.id === userId);
      if (profile) { setFirstName(profile.firstName || ""); setLastName(profile.lastName || ""); }
    }
    setRoleChanges({});
    setUnsaved(false);
    if (pendingSection) { setActive(pendingSection); setPendingSection(null); }
    onClose();
  };
  
  // ── Exposed API ──
  // Package everything cleanly so the UI component can just use dot notation.

  return {
    state: {
      active, unsaved, saved, pendingSection, isOpen, isMounting, isLoading,
      senderId, receiverId, retention, firstName, lastName, userId, sessionTimeout,
      maxLoginAttempts, passwordExpiry, meddraVersion, lockoutCooldown,
      smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, inviteEmail, inviteRole,
      urgentAlerts, alertThreshold, notifyOnApproval, userTwoFA, roleChanges,
      user, data, adminUsers, meddraVersions
    },
    actions: {
      setActive, setPendingSection, onClose, track, handleNavClick, handleSave, handleDiscard,
      setSenderId, setReceiverId, setRetention, setFirstName, setLastName, setSessionTimeout,
      setMaxLoginAttempts, setPasswordExpiry, setMeddraVersion, setLockoutCooldown,
      setSmtpHost, setSmtpPort, setSmtpUser, setSmtpPass, setSmtpFrom, setInviteEmail, setInviteRole,
      setUrgentAlerts, setAlertThreshold, setNotifyOnApproval, setUserTwoFA, setRoleChanges
    },
    mutations: {
      runArchivingManual, updateAdminRole, inviteAdmin, updateAdminProfile, toggleTwoFactor, updateSettings
    }
  };
}
