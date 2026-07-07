import { DealsProvider } from "@/components/deals/deals-provider";

// Envolve o pipeline no DealsProvider para o estado (dados fake em memória)
// sobreviver à navegação.
export default function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DealsProvider>{children}</DealsProvider>;
}
