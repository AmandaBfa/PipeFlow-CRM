import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova a sessão do Supabase a cada request (refresh do token de acesso) e
// propaga os cookies atualizados para a resposta.
//
// Degradação graciosa: sem as chaves no .env.local, faz no-op — o app segue
// funcionando com a UI (dados fake) sem quebrar.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANTE: não remover. `getUser()` revalida o token com o Supabase e
  // dispara o refresh quando necessário.
  // (A proteção de rota — redirect de deslogado — entra na próxima aula de auth.)
  await supabase.auth.getUser();

  return response;
}
