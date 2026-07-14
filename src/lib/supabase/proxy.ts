import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Proxy de requisições do app (chamado pelo middleware.ts a cada request):
//  1) Renova a sessão do Supabase (refresh do token) e propaga os cookies.
//  2) Protege as rotas — deslogado em rota privada vai para /login; logado em
//     /login|/signup vai para /dashboard.
//
// Degradação graciosa: sem as chaves no .env.local, faz no-op (o app segue com
// a UI de dados fake sem quebrar).

// Rotas acessíveis sem sessão. O resto (dashboard, leads, pipeline, settings,
// onboarding) exige usuário autenticado.
const PUBLIC_PATHS = new Set([
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/callback",
]);

function isPublicPath(pathname: string): boolean {
  // `/invite/<token>` é público: o convidado (às vezes deslogado) precisa ver o
  // convite antes de entrar/cadastrar.
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/invite/");
}

export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
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
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANTE: não remover. `getUser()` revalida o token com o Supabase e
  // dispara o refresh quando necessário.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Deslogado tentando rota privada → login, guardando o destino em ?next.
  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `next=${encodeURIComponent(pathname)}`;
    return copyCookies(response, NextResponse.redirect(redirectUrl));
  }

  // Logado tentando login/cadastro → dashboard.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return copyCookies(response, NextResponse.redirect(redirectUrl));
  }

  return response;
}

// Preserva os cookies de sessão (eventual refresh) numa resposta de redirect.
function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}
