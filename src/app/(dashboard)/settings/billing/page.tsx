import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { BillingSettings } from "@/components/settings/billing-settings";
import { getWorkspaceBilling } from "@/lib/data/subscription";
import { canAddLead, canAddMember } from "@/lib/limits";
import { getCurrentMembership, getCurrentWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Cobrança · PipeFlow CRM",
};

export default async function BillingPage() {
  const workspace = await getCurrentWorkspace();
  const [billing, role, leadUsage, memberUsage] = await Promise.all([
    getWorkspaceBilling(),
    getCurrentMembership(),
    canAddLead(workspace),
    canAddMember(workspace),
  ]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/settings">
          <ArrowLeft className="h-4 w-4" />
          Configurações
        </Link>
      </Button>

      <PageHeader
        title="Plano & cobrança"
        description="Compare os planos e gerencie a assinatura do workspace."
      />

      {billing && (
        <BillingSettings
          billing={billing}
          isAdmin={role === "admin"}
          leadUsage={leadUsage}
          memberUsage={memberUsage}
        />
      )}
    </div>
  );
}
