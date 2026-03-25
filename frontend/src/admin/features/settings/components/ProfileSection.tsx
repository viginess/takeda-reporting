import { Input, Switch } from "@chakra-ui/react";
import { UserCircle, ShieldCheck } from "lucide-react";
import { RowItem } from "./Settingsrow";
import { SettingsCard } from "./SettingsCard";

interface ProfileSectionProps {
  personalEmail: string;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  userTwoFA: boolean;
  setUserTwoFA: (v: boolean) => void;
  track: (fn: () => void) => void;
}

export function ProfileSection({
  personalEmail,
  firstName, setFirstName,
  lastName, setLastName,
  userTwoFA, setUserTwoFA,
  track,
}: ProfileSectionProps) {
  return (
    <>
      <SettingsCard title="Your Account Information" icon={UserCircle}>
        <RowItem label="Account Email" desc="The email address associated with your login (Read-only)">
          <Input value={personalEmail} isReadOnly size="sm" w="220px" bg="#f8fafc" border="none" fontWeight="bold" />
        </RowItem>
        <RowItem label="First Name" desc="Your first name for professional attribution">
          <Input value={firstName} onChange={(e) => track(() => setFirstName(e.target.value))} size="sm" w="220px" bg="white" />
        </RowItem>
        <RowItem label="Last Name" desc="Your last name for professional attribution">
          <Input value={lastName} onChange={(e) => track(() => setLastName(e.target.value))} size="sm" w="220px" bg="white" />
        </RowItem>
      </SettingsCard>

      <SettingsCard title="Personal Security" icon={ShieldCheck}>
        <RowItem label="Two-Factor Authentication" desc="Enable extra security for your personal admin account">
           <Switch colorScheme="red" isChecked={userTwoFA} onChange={(e) => track(() => setUserTwoFA(e.target.checked))} />
        </RowItem>
      </SettingsCard>
    </>
  );
}
