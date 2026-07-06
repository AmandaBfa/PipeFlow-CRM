import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "./mobile-sidebar";
import { TopbarTitle } from "./topbar-title";

// Barra superior fixa: menu hambúrguer (mobile), título da seção e ações.
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MobileSidebar />
      <TopbarTitle />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}
