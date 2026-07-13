"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { setActiveWorkspaceAction } from "@/lib/actions/workspace";
import type { SessionUser } from "@/lib/session";
import type { WorkspaceSummary } from "@/lib/workspace";

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[];
  selected: WorkspaceSummary | null;
  select: (workspace: WorkspaceSummary) => void;
  user: SessionUser;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

// Estado do shell autenticado (workspace ativo + usuário logado), hidratado do
// servidor. A troca de workspace é otimista na UI e persiste no cookie via
// Server Action; o `router.refresh()` recarrega os dados no novo contexto.
export function WorkspaceProvider({
  workspaces,
  activeId,
  user,
  children,
}: {
  workspaces: WorkspaceSummary[];
  activeId: string | null;
  user: SessionUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [selectedId, setSelectedId] = React.useState<string | null>(
    activeId ?? workspaces[0]?.id ?? null
  );

  // Ressincroniza se o servidor mudar a lista/ativo (ex.: após refresh).
  React.useEffect(() => {
    setSelectedId(activeId ?? workspaces[0]?.id ?? null);
  }, [activeId, workspaces]);

  const selected =
    workspaces.find((ws) => ws.id === selectedId) ?? workspaces[0] ?? null;

  const select = React.useCallback(
    (workspace: WorkspaceSummary) => {
      setSelectedId(workspace.id); // otimista
      startTransition(async () => {
        await setActiveWorkspaceAction(workspace.id);
        router.refresh();
      });
    },
    [router]
  );

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({ workspaces, selected, select, user }),
    [workspaces, selected, select, user]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace deve ser usado dentro de <WorkspaceProvider>");
  }
  return context;
}

// Atalho para o usuário logado (consumido pelo user-menu).
export function useSessionUser() {
  return useWorkspace().user;
}
