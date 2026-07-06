"use client";

import { usePathname } from "next/navigation";

import { navItems } from "@/lib/nav";

// Título da seção atual, derivado da rota. Usado na barra superior.
export function TopbarTitle() {
  const pathname = usePathname();
  const active = navItems.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <span className="text-sm font-semibold">{active?.title ?? "PipeFlow"}</span>
  );
}
