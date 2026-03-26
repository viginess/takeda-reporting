import { Flex, Input, Button } from "@chakra-ui/react";
import { Database, RotateCcw } from "lucide-react";
import { RowItem } from "./Settingsrow";
import { SettingsCard } from "./SettingsCard";

interface GeneralSectionProps {
  retention: string;
  setRetention: (v: string) => void;

  track: (fn: () => void) => void;
  userRole?: string;
  onRunArchiving: () => void;
  isArchiving: boolean;
  senderId: string;
  setSenderId: (v: string) => void;
  receiverId: string;
  setReceiverId: (v: string) => void;
  meddraVersion: string;
  setMeddraVersion: (v: string) => void;
  meddraVersions: string[];

  smtpHost: string;
  setSmtpHost: (v: string) => void;
  smtpPort: string;
  setSmtpPort: (v: string) => void;
  smtpUser: string;
  setSmtpUser: (v: string) => void;
  smtpPass: string;
  setSmtpPass: (v: string) => void;
  smtpFrom: string;
  setSmtpFrom: (v: string) => void;
}

export function GeneralSection({
  retention, setRetention,
  track,
  userRole,
  onRunArchiving,
  isArchiving,
  senderId, setSenderId,
  receiverId, setReceiverId,
  meddraVersion, setMeddraVersion,
  meddraVersions,
  smtpHost, setSmtpHost,
  smtpPort, setSmtpPort,
  smtpUser, setSmtpUser,
  smtpPass, setSmtpPass,
  smtpFrom, setSmtpFrom,
}: GeneralSectionProps) {
  return (
    <>
      {userRole === "super_admin" && (
        <SettingsCard title="E2B XML Regulatory Info" icon={Database}>
          <RowItem label="Sender ID" desc="Your organization's registered ClinSolution ID">
            <Input value={senderId} onChange={(e) => track(() => setSenderId(e.target.value))} size="sm" w="220px" bg="white" />
          </RowItem>
          <RowItem label="Receiver ID" desc="The Regulatory Agency's registered ID">
            <Input value={receiverId} onChange={(e) => track(() => setReceiverId(e.target.value))} size="sm" w="220px" bg="white" />
          </RowItem>
          <RowItem label="MedDRA Version" desc="Active MedDRA version for clinical report coding">
            <select
              title="Select MedDRA version"
              value={meddraVersion}
              onChange={(e) => track(() => setMeddraVersion(e.target.value))}
            >
              {meddraVersions.length > 0 ? (
                meddraVersions.map(v => (
                  <option key={v} value={v}>Version {v}</option>
                ))
              ) : (
                <option value={meddraVersion}>{meddraVersion} (Current)</option>
              )}
            </select>
          </RowItem>
        </SettingsCard>
      )}

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
        </SettingsCard>
      )}

      {userRole === "super_admin" && (
        <SettingsCard title="SMTP Configuration (Notification Email)" icon={Database}>
          <RowItem label="SMTP Host" desc="The hostname of your email provider (e.g., smtp.gmail.com)">
            <Input value={smtpHost} onChange={(e) => track(() => setSmtpHost(e.target.value))} size="sm" w="220px" bg="white" placeholder="e.g. smtp.gmail.com" />
          </RowItem>
          <RowItem label="SMTP Port" desc="The port used for SMTP (e.g., 587 or 465)">
            <Input value={smtpPort} onChange={(e) => track(() => setSmtpPort(e.target.value))} size="sm" w="220px" bg="white" placeholder="587" />
          </RowItem>
          <RowItem label="SMTP Username" desc="The user account for SMTP authentication">
            <Input value={smtpUser} onChange={(e) => track(() => setSmtpUser(e.target.value))} size="sm" w="220px" bg="white" placeholder="your-email@gmail.com" />
          </RowItem>
          <RowItem label="SMTP Password" desc="The password or App Password for SMTP authentication">
            <Input type="password" value={smtpPass} onChange={(e) => track(() => setSmtpPass(e.target.value))} size="sm" w="220px" bg="white" />
          </RowItem>
          <RowItem label="Sender Email (From)" desc="The email address that will appear in the 'From' field">
            <Input value={smtpFrom} onChange={(e) => track(() => setSmtpFrom(e.target.value))} size="sm" w="220px" bg="white" placeholder="no-reply@clinsolutions.com" />
          </RowItem>
        </SettingsCard>
      )}
    </>
  );
}