"use client";

import { useFormStatus } from "react-dom";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

export function NewProjectAnalyzeButton() {
  const { pending } = useFormStatus();
  const locale = useLocale();
  const copy =
    locale.startsWith("es")
      ? { pending: "Analizando...", idle: "Analizar sitio" }
      : locale.startsWith("pt")
      ? { pending: "Analisando...", idle: "Analisar site" }
      : { pending: "Analyzing...", idle: "Analyze website" };
  return (
    <Button className="h-11 rounded-[8px] font-extrabold" disabled={pending} type="submit">
      {pending ? copy.pending : copy.idle}
    </Button>
  );
}

export function NewProjectSubmitButton({ label = "Create project" }: { label?: string }) {
  const { pending } = useFormStatus();
  const locale = useLocale();
  const pendingLabel = locale.startsWith("es")
    ? "Creando proyecto..."
    : locale.startsWith("pt")
    ? "Criando projeto..."
    : "Creating project...";
  return (
    <Button className="h-11 rounded-[8px] font-extrabold" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function BootstrapSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const locale = useLocale();
  const pendingLabel = locale.startsWith("es")
    ? "Configurando..."
    : locale.startsWith("pt")
    ? "Configurando..."
    : "Setting up...";
  return (
    <Button className="h-11 rounded-[8px] font-extrabold" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}
