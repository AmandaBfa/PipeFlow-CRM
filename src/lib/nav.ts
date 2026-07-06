import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

// Itens de navegação da sidebar. Reaproveitado por desktop e mobile.
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { title: "Configurações", href: "/settings", icon: Settings },
];
