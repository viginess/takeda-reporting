import { Flex, Box, Text, Switch, Select } from "@chakra-ui/react";
import { Shield, Key } from "lucide-react";
import { RowItem } from "./Settingsrow";
import { SettingsCard } from "./SettingsCard";

interface SecurityTabProps {
  twoFA: boolean;
  setTwoFA: (v: boolean) => void;
  sessionTimeout: string;
  setSessionTimeout: (v: string) => void;
  maxLoginAttempts: string;
  setMaxLoginAttempts: (v: string) => void;
  passwordExpiry: string;
  setPasswordExpiry: (v: string) => void;
  track: (fn: () => void) => void;
}

export function SecurityTab({
  twoFA, setTwoFA,
  sessionTimeout, setSessionTimeout,
  maxLoginAttempts, setMaxLoginAttempts,
  passwordExpiry, setPasswordExpiry,
  track,
}: SecurityTabProps) {
  return (
    <>
      <Flex align="flex-start" gap={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="xl" p={4} mb={5}>
        <Box mt="2px"><Shield size={16} color="#CE0037" /></Box>
        <Box>
          <Text m={0} fontSize="sm" fontWeight="bold" color="#9b0028">Security Settings — Handle with care</Text>
          <Text m={0} mt={1} fontSize="xs" color="#CE0037">Changes to these settings affect all users and are logged with admin identity and IP address.</Text>
        </Box>
      </Flex>

      <SettingsCard title="Authentication" icon={Key}>
        <RowItem label="Two-Factor Authentication" desc="Require 2FA for all admin accounts" sensitive>
          <Switch colorScheme="red" isChecked={twoFA} onChange={(e) => track(() => setTwoFA(e.target.checked))} />
        </RowItem>
        <RowItem label="Session Timeout" desc="Automatically log out inactive users after this period">
          <select aria-label="Session timeout" value={sessionTimeout} onChange={(e) => track(() => setSessionTimeout(e.target.value))}>
            {["15 min", "30 min", "60 min", "2 hours", "8 hours"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </RowItem>
        <RowItem label="Max Login Attempts" desc="Lock account after N consecutive failed logins" sensitive>
          <select aria-label="Max login attempts" value={maxLoginAttempts} onChange={(e) => track(() => setMaxLoginAttempts(e.target.value))}>
            {["3", "5", "10"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </RowItem>
        <RowItem label="Password Expiry" desc="Force users to reset password after this period">
          <Select aria-label="Password expiry" value={passwordExpiry} onChange={(e) => track(() => setPasswordExpiry(e.target.value))}>
            {["30 days", "60 days", "90 days", "180 days", "Never"].map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </RowItem>
      </SettingsCard>
    </>
  );
}