import Link from "next/link";
import { KanbanSquare } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./sidebar-nav";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { UserMenu } from "./user-menu";

interface SidebarContentProps {
  // Repassado à navegação para fechar o drawer no mobile ao clicar num link.
  onNavigate?: () => void;
}

// Conteúdo interno da sidebar, compartilhado entre desktop (Sidebar) e
// mobile (MobileSidebar/Sheet).
export function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Marca */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2 px-2 py-1"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <KanbanSquare className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">PipeFlow</span>
      </Link>

      {/* Seletor de workspace */}
      <WorkspaceSwitcher />

      <Separator />

      {/* Navegação principal */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <Separator />

      {/* Menu do usuário */}
      <UserMenu />
    </div>
  );
}
