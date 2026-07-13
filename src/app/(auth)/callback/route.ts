import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/utils";

// Callback de autenticação: troca o `code` da URL por uma sessão. Serve
// confirmação de e-mail, link de redefinição de senha e (futuro) OAuth.
// Rota pública (o usuário ainda não tem sessão ao chegar aqui).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Sem code ou troca falhou: volta ao login sinalizando o erro.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
