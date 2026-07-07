"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Botões de login social — apenas UI nesta aula. A integração real (OAuth via
// Supabase) entra na aula de wiring; por ora avisam via toast.
export function OAuthButtons() {
  function handleSoon(provider: string) {
    toast.info(
      `Login com ${provider} será habilitado quando o Supabase estiver conectado.`
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="outline" onClick={() => handleSoon("Google")}>
        <GoogleIcon />
        Google
      </Button>
      <Button type="button" variant="outline" onClick={() => handleSoon("GitHub")}>
        <GitHubIcon />
        GitHub
      </Button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1C5.92 1 1 5.92 1 12c0 4.87 3.16 9 7.54 10.45.55.1.75-.24.75-.53v-2.06c-3.07.67-3.72-1.3-3.72-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.98 1.69 2.58 1.2 3.21.92.1-.71.39-1.2.7-1.48-2.45-.28-5.03-1.23-5.03-5.46 0-1.2.43-2.19 1.14-2.96-.11-.28-.5-1.4.11-2.92 0 0 .93-.3 3.05 1.13a10.6 10.6 0 0 1 5.55 0c2.12-1.43 3.05-1.13 3.05-1.13.61 1.52.22 2.64.11 2.92.71.77 1.14 1.76 1.14 2.96 0 4.24-2.58 5.18-5.04 5.45.4.34.75 1.01.75 2.04v3.03c0 .29.2.64.76.53C19.84 21 23 16.87 23 12c0-6.08-4.92-11-11-11Z" />
    </svg>
  );
}
