import { SidebarContent } from "./sidebar-content";

// Sidebar fixa do desktop. No mobile fica oculta (ver MobileSidebar).
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border bg-muted/40 md:block">
      <SidebarContent />
    </aside>
  );
}
