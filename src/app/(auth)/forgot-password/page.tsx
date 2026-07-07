import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Esqueceu a senha?
        </h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail e enviaremos um link para redefinir a senha.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
