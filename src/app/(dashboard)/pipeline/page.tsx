import type { Metadata } from "next";

import { DealsView } from "@/components/deals/deals-view";

export const metadata: Metadata = {
  title: "Pipeline · PipeFlow CRM",
};

export default function PipelinePage() {
  return <DealsView />;
}
