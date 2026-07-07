"use client";

import Link from "next/link";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { getMember } from "@/lib/placeholder-data";
import { getInitials } from "@/lib/utils";
import { LeadStatusBadge } from "./lead-status-badge";
import { useLeads, type Lead } from "./leads-provider";

interface LeadsTableProps {
  onCreate: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadsTable({ onCreate, onEdit, onDelete }: LeadsTableProps) {
  const { leads, filteredLeads, hasActiveFilters, clearFilters } = useLeads();

  // Nenhum lead cadastrado no workspace.
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum lead ainda"
        description="Cadastre seu primeiro contato para começar a organizar seu funil."
      >
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </EmptyState>
    );
  }

  // Há leads, mas nenhum bate com a busca/filtros atuais.
  if (filteredLeads.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nenhum lead encontrado"
        description="Ajuste a busca ou os filtros para ver mais resultados."
      >
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </EmptyState>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead className="hidden lg:table-cell">Empresa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Responsável</TableHead>
            <TableHead className="w-[52px]">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead) => {
            const owner = getMember(lead.ownerId);
            return (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium group-hover:text-primary">
                        {lead.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground lg:hidden">
                        {lead.company}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">{lead.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead.phone || "—"}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="text-sm">{lead.company || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead.position || "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {owner?.initials ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm text-muted-foreground">
                      {owner?.name ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir ações do lead</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild className="gap-2">
                        <Link href={`/leads/${lead.id}`}>
                          <Eye className="h-4 w-4" />
                          Ver detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={() => onEdit(lead)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        onSelect={() => onDelete(lead)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
