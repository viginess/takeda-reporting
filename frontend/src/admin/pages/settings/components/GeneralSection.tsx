import { Flex, Input, Switch, Button } from "@chakra-ui/react";
import { Database, RotateCcw, UserCircle } from "lucide-react";
import { RowItem } from "./Settingsrow";
import { SettingsCard } from "./SettingsCard";

interface GeneralSectionProps {
  personalEmail: string;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  retention: string;
  setRetention: (v: string) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  track: (fn: () => void) => void;
  userRole?: string;
  onRunArchiving: () => void;
  isArchiving: boolean;
}

export function GeneralSection({
  personalEmail,
  firstName, setFirstName,
  lastName, setLastName,
  retention, setRetention,
  maintenanceMode, setMaintenanceMode,
  track,
  userRole,
  onRunArchiving,
  isArchiving,
}: GeneralSectionProps) {
  return (
    <>
      <SettingsCard title="Your Account Profile" icon={UserCircle}>
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

      {userRole === "super_admin" && (
        <SettingsCard title="Data Management" icon={Database}>
          <RowItem label="Report Retention Period" desc="How long submitted reports are stored before archiving">
            <Flex align="center" gap={3}>
              <select
                aria-label="Report retention period"
                value={retention}
                onChange={(e) => track(() => setRetention(e.target.value))}
              >
                {["6 months", "12 months", "24 months", "5 years", "Indefinite"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <Button
                size="xs"
                variant="outline"
                colorScheme="red"
                leftIcon={<RotateCcw size={12} />}
                onClick={onRunArchiving}
                isLoading={isArchiving}
              >
                Run Cleanup Now
              </Button>
            </Flex>
          </RowItem>
          <RowItem label="Maintenance Mode" desc="Temporarily disables submissions from all reporters" sensitive>
            <Switch colorScheme="red" isChecked={maintenanceMode} onChange={(e) => track(() => setMaintenanceMode(e.target.checked))} />
          </RowItem>
        </SettingsCard>
      )}
    </>
  );
}