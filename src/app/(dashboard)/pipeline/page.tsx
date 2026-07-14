import type { Metadata } from "next";

import { DealsProvider } from "@/components/deals/deals-provider";
import { DealsView } from "@/components/deals/deals-view";
import { getDeals } from "@/lib/data/deals";
import { getLeadOptions } from "@/lib/data/leads";
import { getWorkspaceMembers } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Pipeline · PipeFlow CRM",
};

// Busca (título) e filtro por responsável vêm da URL (?q=&owner=) e são
// aplicados NO BANCO. Também carrega leads (p/ o seletor) e membros.
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: { q?: string; owner?: string };
}) {
  const q = searchParams.q ?? "";
  const owner = searchParams.owner ?? "all";

  const [deals, leadOptions, members] = await Promise.all([
    getDeals({ q, owner }),
    getLeadOptions(),
    getWorkspaceMembers(),
  ]);

  return (
    <DealsProvider
      deals={deals}
      members={members}
      leadOptions={leadOptions}
      search={q}
      ownerFilter={owner}
    >
      <DealsView />
    </DealsProvider>
  );
}
