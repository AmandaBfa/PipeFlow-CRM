"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelInvite,
  changeMemberRole,
  inviteMember,
  removeMember,
} from "@/lib/actions/member";
import type {
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from "@/lib/workspace";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  admin: "Administrador",
  member: "Membro",
};

const FREE_LIMIT = 2;

export function MembersManager({
  members,
  invites,
  currentUserId,
  isAdmin,
  plan,
}: {
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  currentUserId: string;
  isAdmin: boolean;
  plan: "free" | "pro";
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<WorkspaceRole>("member");
  const [inviting, setInviting] = React.useState(false);
  const [lastLink, setLastLink] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const atLimit = plan === "free" && members.length + invites.length >= FREE_LIMIT;

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setInviting(true);
    const result = await inviteMember(email.trim(), role);
    setInviting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível convidar.");
      return;
    }
    toast.success(
      result.emailSent
        ? "Convite enviado por e-mail."
        : "Convite criado — copie o link abaixo."
    );
    setLastLink(result.inviteUrl ?? null);
    setEmail("");
    router.refresh();
  }

  async function runMemberAction(
    id: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string
  ) {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Ação não concluída.");
      return;
    }
    toast.success(successMsg);
    router.refresh();
  }

  function copyLink(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => toast.success("Link copiado."),
      () => toast.error("Não foi possível copiar.")
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Membros</CardTitle>
        <CardDescription>
          {plan === "free" ? "Plano Free: até 2 membros. " : ""}
          Convide colaboradores e gerencie papéis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdmin && (
          <form
            onSubmit={handleInvite}
            className="space-y-3 rounded-lg border bg-muted/30 p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs">
                  Convidar por e-mail
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="colega@empresa.com"
                  disabled={inviting || atLimit}
                />
              </div>
              <div className="space-y-1.5 sm:w-40">
                <Label htmlFor="invite-role" className="text-xs">
                  Papel
                </Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as WorkspaceRole)}
                  disabled={inviting || atLimit}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviting || atLimit || !email.trim()}>
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Convidar
              </Button>
            </div>
            {atLimit && (
              <p className="text-xs text-warning">
                Limite do plano Free atingido. Faça upgrade para o Pro para
                convidar mais.
              </p>
            )}
            {lastLink && (
              <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                <Input
                  readOnly
                  value={lastLink}
                  className="h-8 text-xs"
                  onFocus={(event) => event.currentTarget.select()}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyLink(lastLink)}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copiar link do convite</span>
                </Button>
              </div>
            )}
          </form>
        )}

        <ul className="divide-y">
          {members.map((member) => {
            const isSelf = member.id === currentUserId;
            return (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {isSelf && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        (você)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                {isAdmin && !isSelf ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        runMemberAction(
                          member.id,
                          () => changeMemberRole(member.id, value as WorkspaceRole),
                          "Papel atualizado."
                        )
                      }
                      disabled={busyId === member.id}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={busyId === member.id}
                      onClick={() =>
                        runMemberAction(
                          member.id,
                          () => removeMember(member.id),
                          `${member.name} removido do workspace.`
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover membro</span>
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
                )}
              </li>
            );
          })}
        </ul>

        {isAdmin && invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Convites pendentes
            </p>
            <ul className="divide-y rounded-lg border">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {invite.email}
                  </p>
                  <Badge variant="outline">{ROLE_LABEL[invite.role]}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === invite.id}
                    onClick={() =>
                      runMemberAction(
                        invite.id,
                        () => cancelInvite(invite.id),
                        "Convite cancelado."
                      )
                    }
                  >
                    Cancelar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
