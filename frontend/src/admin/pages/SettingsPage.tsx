import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Shield, Bell, Mail, Database, Globe,
  Lock, Key, Save, RotateCcw, Check, AlertTriangle,
 Eye, EyeOff, History, AlertCircle,
  Users, Zap
} from "lucide-react";
import {
  Box, Flex, Text, Heading, Button, IconButton, Badge, Input,
  Select, Switch, SimpleGrid, Card, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, useDisclosure
} from "@chakra-ui/react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "general" | "security" | "notifications" | "integrations" | "audit";

interface AuditLog {
  id: number;
  section: string;
  field: string;
  from: string;
  to: string;
  by: string;
  at: string;
  ip: string;
}

// ── Mock Audit Log ─────────────────────────────────────────────────────────────
const auditLogs: AuditLog[] = [
  { id: 1, section: "Security",      field: "Session Timeout",        from: "30 min",           to: "60 min",             by: "Admin",     at: "Today, 10:14 AM",   ip: "192.168.1.10" },
  { id: 2, section: "Notifications", field: "Urgent Alert Email",     from: "Disabled",          to: "Enabled",            by: "Admin",     at: "Today, 9:48 AM",    ip: "192.168.1.10" },
  { id: 3, section: "General",       field: "System Language",        from: "English (UK)",      to: "English (US)",       by: "SuperAdmin", at: "Yesterday, 3:22 PM", ip: "10.0.0.5" },
  { id: 4, section: "Integrations",  field: "SMTP Host",              from: "smtp.old.com",      to: "smtp.sendgrid.com",  by: "Admin",     at: "Yesterday, 11:05 AM", ip: "192.168.1.10" },
  { id: 5, section: "Security",      field: "2FA Enforcement",        from: "Optional",          to: "Required",           by: "SuperAdmin", at: "Jun 19, 2:00 PM",   ip: "10.0.0.5" },
  { id: 6, section: "General",       field: "Report Retention Period", from: "12 months",        to: "24 months",          by: "Admin",     at: "Jun 18, 4:30 PM",   ip: "192.168.1.10" },
];

// ── Nav Sections ──────────────────────────────────────────────────────────────
const navSections: { id: Section; label: string; icon: any; desc: string }[] = [
  { id: "general",       label: "General",       icon: Settings, desc: "System preferences & behavior" },
  { id: "security",      label: "Security",      icon: Shield,   desc: "Access control & authentication" },
  { id: "notifications", label: "Notifications", icon: Bell,     desc: "Alert rules & delivery settings" },
  { id: "integrations",  label: "Integrations",  icon: Zap,      desc: "Email, APIs & external services" },
  { id: "audit",         label: "Audit Log",     icon: History,  desc: "Change history & activity trail" },
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
  const [showApiKey, setShowApiKey] = useState(false);

  // ── General Settings State ──
  const [systemName, setSystemName] = useState("Drug Safety Reporting System");
  const [adminEmail, setAdminEmail] = useState("admin@pharma.com");
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState("UTC+05:30 (IST)");
  const [retention, setRetention] = useState("24 months");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // ── Security Settings State ──
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60 min");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [passwordExpiry, setPasswordExpiry] = useState("90 days");
  const [ipWhitelist, setIpWhitelist] = useState("192.168.1.0/24");
  const [auditLogging, setAuditLogging] = useState(true);

  // ── Notification Settings State ──
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState("Daily");
  const [alertThreshold, setAlertThreshold] = useState("Critical & High");
  const [notifyOnApproval, setNotifyOnApproval] = useState(true);

  // ── Integration Settings State ──
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("noreply@pharma.com");
  const [apiKey, setApiKey] = useState("sk-prod-a8f3k2...xxxx");
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.internal.com/safety");
  const [webhookEnabled, setWebhookEnabled] = useState(true);

  const track = (fn: () => void) => { fn(); setUnsaved(true); setSaved(false); };

  const handleNavClick = (id: Section) => {
    if (unsaved && id !== active) {
      setPendingSection(id);
      onOpen();
    } else {
      setActive(id);
    }
  };

  const handleSave = () => {
    setUnsaved(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDiscard = () => {
    setUnsaved(false);
    if (pendingSection) { 
      setActive(pendingSection); 
      setPendingSection(null); 
    }
    onClose();
  };

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
            <Text color="#64748b" fontSize="sm">Configure system behavior, security policies, and integrations</Text>
          </Box>

          <Flex align="center" gap={3}>
            <Flex align="center" gap={1.5} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" px={3} py={1.5}>
              <Shield size={13} color="#CE0037" />
              <Text fontSize="xs" fontWeight="bold" color="#CE0037">Admin Only</Text>
            </Flex>
            <Flex align="center" gap={1.5} bg="#f8fafc" border="1px solid" borderColor="#e2e8f0" borderRadius="md" px={3} py={1.5}>
              <History size={13} color="#64748b" />
              <Text fontSize="xs" fontWeight="bold" color="#64748b">Changes Logged</Text>
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

          {/* Quick Stats */}
          <Box mt={4} bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" p={4}>
            <Text m={0} mb={3} fontSize="xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">System Status</Text>
            {[
              { label: "DB Connection", value: "Active", color: "emerald.600" },
              { label: "Last Backup", value: "2 hrs ago", color: "#64748b" },
              { label: "Version", value: "v2.4.1", color: "#64748b" },
            ].map((s) => (
              <Flex key={s.label} justify="space-between" align="center" mb={1.5}>
                <Text fontSize="xs" color="#64748b">{s.label}</Text>
                <Text fontSize="xs" fontWeight="bold" color={s.color}>{s.value}</Text>
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
          {/* ── General ── */}
          {active === "general" && (
            <>
              <SectionCard title="System Identity" icon={Globe}>
                <SettingRow label="System Name" desc="Display name shown across the application">
                  <Input value={systemName} onChange={(e) => track(() => setSystemName(e.target.value))} size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="Admin Email" desc="All system alerts (Critical reports, HCP 3+ reports) are sent to this address">
                  <Input value={adminEmail} onChange={(e) => track(() => setAdminEmail(e.target.value))} placeholder="admin@pharma.com" type="email" size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="Default Language" desc="Language used across all user interfaces">
                  <Select value={language} onChange={(e) => track(() => setLanguage(e.target.value))} size="sm" w="220px" bg="white">
                      {["English (US)", "English (UK)", "French", "German", "Japanese"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
                <SettingRow label="Timezone" desc="Used for timestamps, reports, and scheduling">
                  <Select value={timezone} onChange={(e) => track(() => setTimezone(e.target.value))} size="sm" w="220px" bg="white">
                     {["UTC+00:00", "UTC+05:30 (IST)", "UTC+08:00 (SGT)", "UTC-05:00 (EST)"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
              </SectionCard>

              <SectionCard title="Data Management" icon={Database}>
                <SettingRow label="Report Retention Period" desc="How long submitted reports are stored before archiving">
                  <Select value={retention} onChange={(e) => track(() => setRetention(e.target.value))} size="sm" w="220px" bg="white">
                     {["6 months", "12 months", "24 months", "5 years", "Indefinite"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
                <SettingRow label="Maintenance Mode" desc="Temporarily disables submissions from all reporters" sensitive>
                  <Switch colorScheme="red" isChecked={maintenanceMode} onChange={(e) => track(() => setMaintenanceMode(e.target.checked))} />
                </SettingRow>
                <SettingRow label="Debug Mode" desc="Enables verbose logging for troubleshooting (do not use in production)" sensitive>
                  <Switch colorScheme="red" isChecked={debugMode} onChange={(e) => track(() => setDebugMode(e.target.checked))} />
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

              <SectionCard title="Access Control" icon={Lock}>
                <SettingRow label="IP Whitelist" desc="Restrict admin access to these IP ranges (CIDR format)" sensitive>
                  <Input value={ipWhitelist} onChange={(e) => track(() => setIpWhitelist(e.target.value))} placeholder="e.g. 192.168.1.0/24" size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="Audit Logging" desc="Log all admin actions including settings changes" sensitive>
                  <Switch colorScheme="red" isChecked={auditLogging} onChange={(e) => track(() => setAuditLogging(e.target.checked))} />
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

              <SectionCard title="Delivery Channels" icon={Mail}>
                <SettingRow label="Email Digest" desc="Send daily or weekly summary emails to admin team">
                   <Switch colorScheme="red" isChecked={emailDigest} onChange={(e) => track(() => setEmailDigest(e.target.checked))} />
                </SettingRow>
                <SettingRow label="Digest Frequency" desc="How often to send the summary digest email">
                  <Select value={digestFrequency} onChange={(e) => track(() => setDigestFrequency(e.target.value))} size="sm" w="220px" bg="white">
                     {["Daily", "Weekly", "Bi-weekly"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </SettingRow>
                <SettingRow label="SMS Alerts" desc="Send SMS to on-call safety officers for Critical cases" sensitive>
                  <Switch colorScheme="red" isChecked={smsAlerts} onChange={(e) => track(() => setSmsAlerts(e.target.checked))} />
                </SettingRow>
              </SectionCard>
            </>
          )}

          {/* ── Integrations ── */}
          {active === "integrations" && (
            <>
              {/* Email alert info banner */}
              <Flex align="flex-start" gap={3} bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="xl" p={4} mb={5}>
                <Box mt="2px"><Mail size={16} color="#2563eb" /></Box>
                <Box>
                  <Text m={0} fontSize="sm" fontWeight="bold" color="blue.800">When does the system send an email to Admin?</Text>
                  <Box as="ul" m={0} mt={2} pl={4} fontSize="xs" color="blue.700" style={{ lineHeight: 2 }}>
                    <li>👨⚕️ An <strong>HCP submits 3 or more reports</strong> — admin is notified immediately</li>
                    <li>🚨 A report is flagged as <strong>Critical</strong> — admin receives an urgent alert email</li>
                  </Box>
                  <Text m={0} mt={2} fontSize="xs" color="blue.600">
                    📬 Email is sent to the <Text as="strong">Admin Email configured in General Settings</Text>. No other recipients.
                  </Text>
                </Box>
              </Flex>

              <SectionCard title="Email / SMTP Configuration" icon={Mail}>
                <SettingRow label="SMTP Host" desc="Email server that sends alert emails when reports have issues or status changes">
                  <Input value={smtpHost} onChange={(e) => track(() => setSmtpHost(e.target.value))} placeholder="smtp.example.com" size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="SMTP Port" desc="Connection channel — use 587 for secure TLS email delivery">
                  <Input value={smtpPort} onChange={(e) => track(() => setSmtpPort(e.target.value))} placeholder="587" size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="SMTP Username" desc="The 'From' email address that recipients see when they receive system alerts">
                  <Input value={smtpUser} onChange={(e) => track(() => setSmtpUser(e.target.value))} placeholder="noreply@company.com" size="sm" w="220px" bg="white" />
                </SettingRow>
              </SectionCard>

              <SectionCard title="API & Webhooks" icon={Zap}>
                <SettingRow label="API Key" desc="Used to authenticate external integrations" sensitive>
                  <Flex align="center" gap={2}>
                    <Input
                      value={showApiKey ? apiKey : "••••••••••••••••"}
                      onChange={(e) => track(() => setApiKey(e.target.value))}
                      readOnly={!showApiKey}
                      size="sm"
                      w="190px"
                      bg="white"
                      fontFamily="monospace"
                    />
                    <IconButton
                      aria-label="Toggle API Key visibility"
                      icon={showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      size="sm"
                      onClick={() => setShowApiKey((v) => !v)}
                      variant="outline"
                      color="#64748b"
                    />
                  </Flex>
                </SettingRow>
                <SettingRow label="Webhook URL" desc="POST endpoint for real-time report event notifications">
                  <Input value={webhookUrl} onChange={(e) => track(() => setWebhookUrl(e.target.value))} placeholder="https://your-endpoint.com/hook" size="sm" w="220px" bg="white" />
                </SettingRow>
                <SettingRow label="Webhook Active" desc="Enable outbound webhook calls on report events">
                  <Switch colorScheme="red" isChecked={webhookEnabled} onChange={(e) => track(() => setWebhookEnabled(e.target.checked))} />
                </SettingRow>
              </SectionCard>
            </>
          )}

          {/* ── Audit Log ── */}
          {active === "audit" && (
            <Card bg="white" borderRadius="2xl" border="1px solid" borderColor="#e2e8f0" overflow="hidden" boxShadow="none">
              <Flex p={3} px={5} borderBottom="1px solid" borderColor="#f1f5f9" align="center" justify="space-between" bg="#f8fafc">
                <Flex align="center" gap={2}>
                  <History size={15} color="#CE0037" />
                  <Text fontWeight="bold" fontSize="sm" color="#0f172a">Settings Change History</Text>
                  <Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="full" px={2} py={0.5} fontSize="2xs" fontWeight="bold">
                    {auditLogs.length} entries
                  </Badge>
                </Flex>
                <Flex align="center" gap={1.5} fontSize="xs" color="#64748b">
                  <Lock size={12} />
                  Read-only — immutable log
                </Flex>
              </Flex>

              {/* Column Headers */}
              <SimpleGrid columns={7} gap={0} p={3} px={5} bg="#f8fafc" borderBottom="1px solid" borderColor="#f1f5f9" templateColumns="110px 120px 1fr 1fr 90px 130px 110px">
                {["Section", "Field", "From", "To", "Changed By", "Timestamp", "IP Address"].map((h) => (
                  <Text key={h} fontSize="2xs" fontWeight="bold" color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em">{h}</Text>
                ))}
              </SimpleGrid>

              {/* Rows */}
              <Box>
                {auditLogs.map((log, i) => (
                  <SimpleGrid
                    as={motion.div}
                    key={log.id}
                    {...({} as any)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    columns={7}
                    gap={0}
                    p={3}
                    px={5}
                    borderBottom={i < auditLogs.length - 1 ? "1px solid" : "none"}
                    borderColor="#f8fafc"
                    alignItems="center"
                    templateColumns="110px 120px 1fr 1fr 90px 130px 110px"
                    _hover={{ bg: "#f8fafc" }}
                  >
                    <Box>
                      <Badge bg="red.50" color="#CE0037" border="1px solid" borderColor="red.200" borderRadius="md" px={2} py={0.5} fontSize="xs" fontWeight="bold" textTransform="none">
                        {log.section}
                      </Badge>
                    </Box>
                    <Text fontSize="sm" fontWeight="semibold" color="#0f172a">{log.field}</Text>
                    <Text fontSize="xs" color="red.500" textDecoration="line-through">{log.from}</Text>
                    <Text fontSize="xs" color="emerald.600" fontWeight="bold">{log.to}</Text>
                    <Flex align="center" gap={1.5}>
                      <Flex w="22px" h="22px" borderRadius="full" bg="red.50" border="1px solid" borderColor="red.200" align="center" justify="center">
                        <Users size={10} color="#CE0037" />
                      </Flex>
                      <Text fontSize="xs" color="#64748b">{log.by}</Text>
                    </Flex>
                    <Text fontSize="xs" color="#64748b">{log.at}</Text>
                    <Text fontSize="2xs" fontFamily="monospace" color="#94a3b8">{log.ip}</Text>
                  </SimpleGrid>
                ))}
              </Box>
            </Card>
          )}

          {/* ── Save / Reset Bar ── */}
          {active !== "audit" && (
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
                onClick={() => { setUnsaved(false); setSaved(false); }}
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
