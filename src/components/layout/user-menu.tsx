"use client";

import { LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { placeholderUser } from "@/lib/placeholder-data";

// Menu do usuário (dados fake). Logout é placeholder até a aula de autenticação.
export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {placeholderUser.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {placeholderUser.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {placeholderUser.email}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <User className="h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Settings className="h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onSelect={() =>
            toast.info("Logout será implementado na aula de autenticação.")
          }
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
