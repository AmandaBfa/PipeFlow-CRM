import { Resend } from "resend";

// Cliente Resend (singleton preguiçoso). Degradação graciosa: sem
// RESEND_API_KEY, `sendInvitationEmail` retorna false e o app segue mostrando
// o link copiável do convite.
let cached: Resend | null | undefined;

function getClient(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  cached = key ? new Resend(key) : null;
  return cached;
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

export function inviteUrl(token: string): string {
  return `${appUrl()}/invite/${token}`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string
  );
}

interface InvitationEmailParams {
  to: string;
  workspaceName: string;
  inviterName: string;
  token: string;
}

// Envia o e-mail de convite. Em dev usamos o remetente compartilhado do Resend
// (`onboarding@resend.dev`), que entrega apenas para o e-mail da própria conta.
export async function sendInvitationEmail(
  params: InvitationEmailParams
): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;

  const url = inviteUrl(params.token);
  try {
    const { error } = await resend.emails.send({
      from: "PipeFlow CRM <onboarding@resend.dev>",
      to: params.to,
      subject: `Convite para o workspace ${params.workspaceName} no PipeFlow`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
          <h2 style="margin:0 0 12px">Você foi convidado! 👋</h2>
          <p><strong>${escapeHtml(params.inviterName)}</strong> convidou você para o workspace
          <strong>${escapeHtml(params.workspaceName)}</strong> no PipeFlow CRM.</p>
          <p style="margin:24px 0">
            <a href="${url}" style="display:inline-block;background:#4F46E5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Aceitar convite</a>
          </p>
          <p style="color:#64748b;font-size:12px">Ou copie o link: ${url}</p>
        </div>
      `,
    });
    return !error;
  } catch {
    return false;
  }
}
