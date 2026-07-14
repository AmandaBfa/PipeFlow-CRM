"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameWorkspace } from "@/lib/actions/member";

export function WorkspaceSettings({
  name,
  isAdmin,
}: {
  name: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(name);
  const [pending, setPending] = React.useState(false);

  const unchanged = value.trim() === name.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (unchanged) return;
    setPending(true);
    const result = await renameWorkspace(value);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível renomear.");
      return;
    }
    toast.success("Workspace renomeado.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspace</CardTitle>
        <CardDescription>
          Nome exibido na barra lateral e nos convites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ws-name">Nome</Label>
            <Input
              id="ws-name"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={!isAdmin || pending}
            />
          </div>
          {isAdmin && (
            <Button type="submit" disabled={pending || unchanged}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          )}
        </form>
        {!isAdmin && (
          <p className="mt-2 text-xs text-muted-foreground">
            Apenas administradores podem renomear o workspace.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
