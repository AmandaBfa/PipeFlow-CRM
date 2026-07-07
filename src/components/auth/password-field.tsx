"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/form-messages";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  errors?: string[];
  // Mostra o medidor de força (usado no cadastro, não no login).
  showStrength?: boolean;
}

// Campo de senha controlado com botão de mostrar/ocultar e, opcionalmente,
// um medidor de força.
export function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  errors,
  showStrength = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={errors?.length ? true : undefined}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {showStrength && value.length > 0 && <PasswordStrength value={value} />}
      <FieldError errors={errors} />
    </div>
  );
}

const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Média", "Boa", "Forte"];
const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-500",
];

// Heurística simples: comprimento + variedade de caracteres (0 a 4).
function scorePassword(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

function PasswordStrength({ value }: { value: string }) {
  const score = scorePassword(value);

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? STRENGTH_COLORS[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Força: {STRENGTH_LABELS[score]}
      </p>
    </div>
  );
}
