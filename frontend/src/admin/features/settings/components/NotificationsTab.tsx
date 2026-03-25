import { Switch } from "@chakra-ui/react";
import { Bell } from "lucide-react";
import { RowItem } from "./Settingsrow";
import { SettingsCard } from "./SettingsCard";

interface NotificationsTabProps {
  urgentAlerts: boolean;
  setUrgentAlerts: (v: boolean) => void;
  alertThreshold: string;
  setAlertThreshold: (v: string) => void;
  notifyOnApproval: boolean;
  setNotifyOnApproval: (v: boolean) => void;
  track: (fn: () => void) => void;
}

export function NotificationsTab({
  urgentAlerts, setUrgentAlerts,
  alertThreshold, setAlertThreshold,
  notifyOnApproval, setNotifyOnApproval,
  track,
}: NotificationsTabProps) {
  return (
    <SettingsCard title="Alert Rules" icon={Bell}>
      <RowItem label="Urgent Case Alerts" desc="Send immediate alerts when a report is flagged as Critical or Urgent">
        <Switch colorScheme="red" isChecked={urgentAlerts} onChange={(e) => track(() => setUrgentAlerts(e.target.checked))} />
      </RowItem>
      <RowItem label="Alert Threshold" desc="Minimum severity level to trigger an alert">
        <select aria-label="Alert threshold" value={alertThreshold} onChange={(e) => track(() => setAlertThreshold(e.target.value))}>
          {["All Severities", "Critical & High", "Critical Only"].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </RowItem>
      <RowItem label="Notify on Approval" desc="Send notification when a report is approved or closed">
        <Switch colorScheme="red" isChecked={notifyOnApproval} onChange={(e) => track(() => setNotifyOnApproval(e.target.checked))} />
      </RowItem>
    </SettingsCard>
  );
}