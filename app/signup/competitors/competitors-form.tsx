"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CompetitorsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  projectId: string;
};

export function CompetitorsForm({ action, projectId }: CompetitorsFormProps) {
  const t = useTranslations("signup.competitorsForm");
  const [values, setValues] = useState(["", "", ""]);
  const states = useMemo(() => values.map(getUrlState), [values]);

  return (
    <form action={action} className="signup-form">
      <input type="hidden" name="projectId" value={projectId} />
      {[0, 1, 2].map((index) => (
        <label className="field-group signup-url-field" key={index}>
          <span className="field-label">{t("competitor", { index: index + 1 })}</span>
          <Input
            className="h-11 rounded-[8px] bg-white px-3 text-sm"
            name="competitorUrl"
            type="url"
            placeholder={t("placeholder")}
            required={index === 0}
            value={values[index]}
            onChange={(event) => {
              const next = [...values];
              next[index] = event.target.value;
              setValues(next);
            }}
          />
          {states[index] === "valid" && (
            <span className="signup-url-valid">{t("valid")}</span>
          )}
          {states[index] === "invalid" && (
            <span className="signup-url-invalid">{t("invalid")}</span>
          )}
        </label>
      ))}
      <span className="field-hint">
        {t("hint")}
      </span>
      <CompetitorSubmitButton label={t("submit")} pendingLabel={t("pending")} />
    </form>
  );
}

function CompetitorSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="sw-btn-primary"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

function getUrlState(value: string) {
  const text = value.trim();
  if (!text) return "empty";

  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".")
      ? "valid"
      : "invalid";
  } catch {
    return "invalid";
  }
}
