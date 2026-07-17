import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MembersManager } from "@/components/settings/members-manager";
import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { canAddMember } from "@/lib/limits";
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
  const workspace = await getCurrentWorkspace();
  const [role, members, invites, user, memberUsage] = await Promise.all([
    getCurrentMembership(),
    getWorkspaceMembers(),
    getWorkspaceInvites(),
    getSessionUser(),
    canAddMember(workspace),
  ]);

  const isAdmin = role === "admin";
  const isPro = workspace?.plan === "pro";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Workspace, membros, plano e colaboração."
      />

      {workspace && <WorkspaceSettings name={workspace.name} isAdmin={isAdmin} />}

      {workspace && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plano & cobrança</CardTitle>
            <CardDescription>
              Assinatura, limites de uso e comparação de planos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Plano atual:</span>
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? "Pro" : "Grátis"}
              </Badge>
            </div>
            <Button variant="outline" asChild>
              <Link href="/settings/billing">
                <CreditCard className="h-4 w-4" />
                Gerenciar cobrança
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {workspace && user && (
        <MembersManager
          members={members}
          invites={invites}
          currentUserId={user.id}
          isAdmin={isAdmin}
          memberUsage={memberUsage}
        />
      )}
    </div>
  );
}
