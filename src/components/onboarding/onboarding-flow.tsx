"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 3;

// Fluxo de primeiro acesso. Nesta aula é apenas UI: coleta o nome do primeiro
// workspace e, ao concluir, redireciona ao dashboard. A criação real do
// workspace (persistência + RLS) entra no Milestone 2.
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = React.useState("");
  const [finishing, setFinishing] = React.useState(false);

  function handleWorkspaceNext() {
    if (workspaceName.trim().length < 2) {
      setNameError("Dê um nome com pelo menos 2 caracteres.");
      return;
    }
    setNameError(null);
    setStep(2);
  }

  function handleFinish() {
    setFinishing(true);
    // TODO(workspace): criar o workspace de verdade (Milestone 2). Fake por ora.
    toast.success(
      `Workspace "${workspaceName.trim()}" criado! Bem-vindo ao PipeFlow.`
    );
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <StepIndicator current={step} total={TOTAL_STEPS} />

      <Card>
        {step === 0 && (
          <>
            <CardHeader className="items-center text-center">
              <IconBadge>
                <Sparkles className="h-6 w-6" />
              </IconBadge>
              <CardTitle className="text-2xl">Bem-vindo ao PipeFlow! 👋</CardTitle>
              <CardDescription>
                Vamos deixar seu espaço pronto em dois passos rápidos.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => setStep(1)}>
                Começar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader className="items-center text-center">
              <IconBadge>
                <Building2 className="h-6 w-6" />
              </IconBadge>
              <CardTitle className="text-2xl">Crie seu workspace</CardTitle>
              <CardDescription>
                É o espaço da sua empresa ou time. Você pode mudar depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="workspaceName">Nome do workspace</Label>
              <Input
                id="workspaceName"
                value={workspaceName}
                autoFocus
                placeholder="Ex.: Acme Vendas"
                onChange={(event) => {
                  setWorkspaceName(event.target.value);
                  if (nameError) setNameError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleWorkspaceNext();
                }}
                aria-invalid={nameError ? true : undefined}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </CardContent>
            <CardFooter className="gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button className="flex-1" onClick={handleWorkspaceNext}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="items-center text-center">
              <IconBadge>
                <UserPlus className="h-6 w-6" />
              </IconBadge>
              <CardTitle className="text-2xl">Convide seu time</CardTitle>
              <CardDescription>
                Opcional — você pode convidar colaboradores agora ou depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="invite">E-mails (separados por vírgula)</Label>
              <Input
                id="invite"
                value={inviteEmails}
                placeholder="ana@empresa.com, joao@empresa.com"
                onChange={(event) => setInviteEmails(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O envio de convites entra na aula de colaboração.
              </p>
            </CardContent>
            <CardFooter className="gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={finishing}
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleFinish}
                disabled={finishing}
              >
                {finishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparando...
                  </>
                ) : (
                  <>
                    Concluir <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {step === 2 && (
        <button
          type="button"
          onClick={handleFinish}
          disabled={finishing}
          className="mx-auto block text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          Pular por agora
        </button>
      )}
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      {children}
    </div>
  );
}

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all",
            index === current
              ? "w-8 bg-primary"
              : index < current
                ? "w-8 bg-primary/40"
                : "w-4 bg-muted"
          )}
        />
      ))}
    </div>
  );
}
