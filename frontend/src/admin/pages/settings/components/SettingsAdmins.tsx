import { Flex, Input, Button } from "@chakra-ui/react";
import { Users } from "lucide-react";
import { RowItem } from "./Settingsrow";
import { SettingsCard } from "./SettingsCard";

interface SettingsAdminsProps {
  adminUsers: any[];
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: "super_admin" | "admin" | "viewer";
  setInviteRole: (v: "super_admin" | "admin" | "viewer") => void;
  roleChanges: Record<string, "super_admin" | "admin" | "viewer">;
  setRoleChanges: (fn: (prev: any) => any) => void;
  track: (fn: () => void) => void;
  onInvite: () => void;
  isInviting: boolean;
  isUpdatingRole: boolean;
}

export function SettingsAdmins({
  adminUsers,
  inviteEmail, setInviteEmail,
  inviteRole, setInviteRole,
  roleChanges, setRoleChanges,
  track,
  onInvite,
  isInviting,
  isUpdatingRole,
}: SettingsAdminsProps) {
  return (
    <>
      <SettingsCard title="Invite New Admin" icon={Users}>
        <RowItem label="Send Invitation" desc="Invite a new user to the admin panel">
          <Flex gap={2}>
            <Input
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              size="sm"
              w="220px"
              bg="white"
            />
            <select
              aria-label="Invite role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button
              size="sm"
              colorScheme="red"
              bg="#CE0037"
              _hover={{ bg: "#9b0028" }}
              onClick={onInvite}
              isLoading={isInviting}
              isDisabled={!inviteEmail}
            >
              Invite
            </Button>
          </Flex>
        </RowItem>
      </SettingsCard>

      <SettingsCard title="Existing Admins" icon={Users}>
        {adminUsers?.map((admin: any) => (
          <RowItem
            key={admin.id}
            label={`${admin.firstName || "Unknown"} ${admin.lastName || ""} (${admin.email})`}
            desc={`Last active: ${admin.lastActiveAt ? new Date(admin.lastActiveAt).toLocaleString() : "Never"}`}
          >
            <select
              aria-label="Admin role"
              value={roleChanges[admin.id] || admin.role || "admin"}
              onChange={(e) => {
                const newRole = e.target.value as any;
                track(() => setRoleChanges(prev => ({ ...prev, [admin.id]: newRole })));
              }}
              disabled={isUpdatingRole}
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </RowItem>
        ))}
      </SettingsCard>
    </>
  );
}