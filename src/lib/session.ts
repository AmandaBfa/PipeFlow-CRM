import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

// Usuário logado, no formato que a UI do shell consome (nome/e-mail/iniciais).
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

// Resolve o usuário autenticado a partir da sessão do Supabase (server).
// Retorna null se não houver sessão válida.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email ?? "";
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
  const name = fullName && fullName.length > 0 ? fullName : email.split("@")[0] || "Usuário";

  return {
    id: user.id,
    name,
    email,
    initials: getInitials(name || email),
  };
}
