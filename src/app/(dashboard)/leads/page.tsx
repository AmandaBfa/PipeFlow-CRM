import type { Metadata } from "next";

import { LeadsProvider } from "@/components/leads/leads-provider";
import { LeadsView } from "@/components/leads/leads-view";
import { getLeads } from "@/lib/data/leads";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { getWorkspaceMembers } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Leads · PipeFlow CRM",
};

// Busca/filtros vêm da URL (?q=&status=&owner=) e são aplicados NO BANCO.
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; owner?: string };
}) {
  const q = searchParams.q ?? "";
  const status = searchParams.status ?? "all";
  const owner = searchParams.owner ?? "all";

  const [leads, members] = await Promise.all([
    getLeads({ q, status, owner }),
    getWorkspaceMembers(),
  ]);

  const statusFilter = (LEAD_STATUSES as readonly string[]).includes(status)
    ? (status as LeadStatus)
    : "all";

  return (
    <LeadsProvider
      leads={leads}
      members={members}
      search={q}
      statusFilter={statusFilter}
      ownerFilter={owner}
    >
      <LeadsView />
    </LeadsProvider>
  );
}
