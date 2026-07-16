import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { BillingSettings } from "@/components/settings/billing-settings";
import { MembersManager } from "@/components/settings/members-manager";
import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { getWorkspaceBilling } from "@/lib/data/subscription";
import { getSessionUser } from "@/lib/session";
import {
  getCurrentMembership,
  getCurrentWorkspace,
  getWorkspaceInvites,
  getWorkspaceMembers,
} from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Configurações · PipeFlow CRM",
};

export default async function SettingsPage() {
  const [workspace, role, members, invites, user, billing] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
    getWorkspaceMembers(),
    getWorkspaceInvites(),
    getSessionUser(),
    getWorkspaceBilling(),
  ]);

  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Workspace, membros, plano e colaboração."
      />

      {workspace && <WorkspaceSettings name={workspace.name} isAdmin={isAdmin} />}

      {billing && <BillingSettings billing={billing} isAdmin={isAdmin} />}

      {workspace && user && (
        <MembersManager
          members={members}
          invites={invites}
          currentUserId={user.id}
          isAdmin={isAdmin}
          plan={workspace.plan}
        />
      )}
    </div>
  );
}
