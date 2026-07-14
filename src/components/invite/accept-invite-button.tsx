"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/actions/member";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleAccept() {
    setPending(true);
    const result = await acceptInvite(token);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível aceitar o convite.");
      return;
    }

    toast.success("Convite aceito! Bem-vindo ao time. 🎉");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button onClick={handleAccept} disabled={pending} className="w-full">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Aceitar convite
    </Button>
  );
}
