"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { LEAD_STATUS_OPTIONS } from "@/lib/lead-status";
import { useLeads } from "./leads-provider";

export function LeadsToolbar() {
  const { search, statusFilter, ownerFilter, members, hasActiveFilters } =
    useLeads();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Valor imediato do input; a URL é atualizada com debounce (evita 1 fetch/tecla).
  const [term, setTerm] = React.useState(search);

  const updateParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (term.trim() !== search.trim()) updateParam("q", term.trim());
    }, 350);
    return () => clearTimeout(id);
    // Só reage ao que o usuário digita; incluir mais deps causaria re-fetch em loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function clearAll() {
    setTerm("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar por nome, empresa ou e-mail"
          className="pl-9"
          aria-label="Buscar leads"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => updateParam("status", value)}
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

        <Select
          value={ownerFilter}
          onValueChange={(value) => updateParam("owner", value)}
        >
          <SelectTrigger className="w-[170px]" aria-label="Filtrar por responsável">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos responsáveis</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearAll}>
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
