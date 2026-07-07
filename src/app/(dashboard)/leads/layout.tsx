import { LeadsProvider } from "@/components/leads/leads-provider";

// Envolve lista e detalhe no LeadsProvider para o estado (dados fake em memória)
// sobreviver à navegação entre /leads e /leads/[id].
export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LeadsProvider>{children}</LeadsProvider>;
}
