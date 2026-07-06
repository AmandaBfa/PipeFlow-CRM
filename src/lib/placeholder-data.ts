// Dados fake para o esqueleto visual (aula 2.1).
// Serão substituídos por dados reais do Supabase a partir do Milestone 2.

export interface PlaceholderWorkspace {
  id: string;
  name: string;
  plan: "free" | "pro";
  // Iniciais exibidas no "avatar" quadrado do workspace.
  initials: string;
}

export const placeholderWorkspaces: PlaceholderWorkspace[] = [
  { id: "ws_1", name: "Acme Vendas", plan: "pro", initials: "AV" },
  { id: "ws_2", name: "Consultoria Silva", plan: "free", initials: "CS" },
  { id: "ws_3", name: "Studio Freela", plan: "free", initials: "SF" },
];

// Workspace ativo (fake). No Milestone 2 vem de cookie/preferência.
export const activeWorkspace: PlaceholderWorkspace = placeholderWorkspaces[0];

export interface PlaceholderUser {
  name: string;
  email: string;
  initials: string;
}

export const placeholderUser: PlaceholderUser = {
  name: "Pedro Lima",
  email: "pedro@acme.com",
  initials: "PL",
};
