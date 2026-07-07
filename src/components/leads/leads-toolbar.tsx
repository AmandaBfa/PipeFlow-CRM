"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/lead-status";
import { placeholderMembers } from "@/lib/placeholder-data";
import { useLeads } from "./leads-provider";

export function LeadsToolbar() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    ownerFilter,
    setOwnerFilter,
    hasActiveFilters,
    clearFilters,
  } = useLeads();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, empresa ou e-mail"
          className="pl-9"
          aria-label="Buscar leads"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {LEAD_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[170px]" aria-label="Filtrar por responsável">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos responsáveis</SelectItem>
            {placeholderMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
