import { CalendarClock } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDueDate } from "@/lib/format";
import { getUpcomingDeals } from "@/lib/metrics";

// Negócios abertos com prazo mais próximo (server component, dados do banco).
export async function UpcomingDeals() {
  const deals = await getUpcomingDeals(5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Prazos próximos</CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum negócio com prazo definido.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negócio</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div className="font-medium leading-tight">{deal.title}</div>
                    {deal.leadLabel && (
                      <div className="truncate text-xs text-muted-foreground">
                        {deal.leadLabel}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(deal.value)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDueDate(deal.dueDate)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {deal.ownerInitials ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-muted-foreground">
                        {deal.ownerName ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
