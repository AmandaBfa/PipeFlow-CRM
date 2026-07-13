import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

// O usuário chega aqui pelo link do e-mail de recuperação, já com a sessão de
// recuperação criada no /callback (exchangeCodeForSession).
export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma nova senha para a sua conta.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
