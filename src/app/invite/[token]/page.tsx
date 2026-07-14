import Link from "next/link";
import { KanbanSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteButton } from "@/components/invite/accept-invite-button";
import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Convite · PipeFlow CRM" };

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_invite_by_token", {
    invite_token: params.token,
  });
  const invite = data?.[0];
  const user = await getSessionUser();

  const roleLabel = invite?.role === "admin" ? "administrador" : "membro";
  const nextParam = encodeURIComponent(`/invite/${params.token}`);
  const emailMatches =
    user && invite && user.email.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <KanbanSquare className="h-6 w-6" />
          </div>
          {!invite ? (
            <>
              <CardTitle className="text-xl">Convite inválido</CardTitle>
              <CardDescription>
                Este convite não existe ou já foi utilizado.
              </CardDescription>
            </>
          ) : invite.expired ? (
            <>
              <CardTitle className="text-xl">Convite expirado</CardTitle>
              <CardDescription>
                Peça um novo convite ao administrador do workspace.
              </CardDescription>
            </>
          ) : emailMatches ? (
            <>
              <CardTitle className="text-xl">
                Entrar em {invite.workspace_name}
              </CardTitle>
              <CardDescription>
                Você foi convidado como <strong>{roleLabel}</strong>.
              </CardDescription>
            </>
          ) : user ? (
            <>
              <CardTitle className="text-xl">Convite para outro e-mail</CardTitle>
              <CardDescription>
                Este convite é para <strong>{invite.email}</strong>, mas você
                está logado como <strong>{user.email}</strong>.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl">Você foi convidado! 👋</CardTitle>
              <CardDescription>
                Junte-se a <strong>{invite.workspace_name}</strong> como{" "}
                <strong>{roleLabel}</strong>. Entre ou crie uma conta com{" "}
                <strong>{invite.email}</strong> para aceitar.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {!invite || invite.expired ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Ir para o início</Link>
            </Button>
          ) : emailMatches ? (
            <AcceptInviteButton token={params.token} />
          ) : user ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Voltar ao painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link href={`/login?next=${nextParam}`}>Entrar para aceitar</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/signup?next=${nextParam}`}>Criar conta</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
