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
  adminEmail: string;
  setAdminEmail: (v: string) => void;
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
  adminEmail, setAdminEmail,
}: GeneralSectionProps) {
  return (
    <>
      {userRole === "super_admin" && (
        <SettingsCard title="System Communication" icon={Database}>
          <RowItem label="Admin Email" desc="The organization's master contact email for system alerts">
            <Input value={adminEmail} onChange={(e) => track(() => setAdminEmail(e.target.value))} size="sm" w="220px" bg="white" />
          </RowItem>
        </SettingsCard>
      )}

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
    </>
  );
}