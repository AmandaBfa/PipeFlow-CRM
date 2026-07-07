import { NextResponse } from "next/server";

// Stub do callback de autenticação (OAuth / magic link). Será implementado com
// o Supabase na aula de wiring (troca do "code" da URL por uma sessão). Por ora
// apenas redireciona para o login para a rota não ficar quebrada.
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}
