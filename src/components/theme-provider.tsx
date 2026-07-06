"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Provider de tema (claro/escuro) baseado no next-themes.
// A configuração (tema padrão, atributo, etc.) é passada no root layout.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
