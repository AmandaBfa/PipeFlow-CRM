"use client";

import * as React from "react";

import {
  activeWorkspace,
  placeholderWorkspaces,
  type PlaceholderWorkspace,
} from "@/lib/placeholder-data";

interface WorkspaceContextValue {
  workspaces: PlaceholderWorkspace[];
  selected: PlaceholderWorkspace;
  setSelected: (workspace: PlaceholderWorkspace) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

// Estado do workspace ativo compartilhado por todo o shell (sidebar desktop e
// drawer mobile). Com dados fake na aula 2.1; no Milestone 2 é hidratado do
// servidor (cookie/preferência) e passa a persistir via RLS.
export function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] =
    React.useState<PlaceholderWorkspace>(activeWorkspace);

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({ workspaces: placeholderWorkspaces, selected, setSelected }),
    [selected]
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
