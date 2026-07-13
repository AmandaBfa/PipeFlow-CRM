import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { WorkspaceProvider } from "@/components/layout/workspace-provider";
import { getSessionUser } from "@/lib/session";
import { getCurrentWorkspace, getWorkspaces } from "@/lib/workspace";

// Shell do app autenticado: sidebar (desktop) + barra superior + conteúdo.
// Proteção server-side (defesa em profundidade além do middleware): sem sessão,
// redireciona para /login. Também hidrata o WorkspaceProvider com dados reais.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const workspaces = await getWorkspaces();
  const current = await getCurrentWorkspace(workspaces);

  return (
    <WorkspaceProvider
      workspaces={workspaces}
      activeId={current?.id ?? null}
      user={user}
    >
      <div className="flex min-h-svh bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
