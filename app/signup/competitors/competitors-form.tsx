"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CompetitorsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  projectId: string;
};

export function CompetitorsForm({ action, projectId }: CompetitorsFormProps) {
  const [values, setValues] = useState(["", "", ""]);
  const states = useMemo(() => values.map(getUrlState), [values]);

  return (
    <form action={action} className="signup-form">
      <input type="hidden" name="projectId" value={projectId} />
      {[0, 1, 2].map((index) => (
        <label className="field-group signup-url-field" key={index}>
          <span className="field-label">{index + 1}. Competitor website</span>
          <Input
            className="h-11 rounded-[8px] bg-white px-3 text-sm"
            name="competitorUrl"
            type="url"
            placeholder="https://competitor.com"
            required={index === 0}
            value={values[index]}
            onChange={(event) => {
              const next = [...values];
              next[index] = event.target.value;
              setValues(next);
            }}
          />
          {states[index] === "valid" && (
            <span className="signup-url-valid">Website is valid and ready to check.</span>
          )}
          {states[index] === "invalid" && (
            <span className="signup-url-invalid">Enter a valid website URL.</span>
          )}
        </label>
      ))}
      <span className="field-hint">
        Add at least one. The more, the better. We verify accessibility when you continue.
      </span>
      <CompetitorSubmitButton />
    </form>
  );
}

function CompetitorSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-11 rounded-[8px] font-extrabold"
      disabled={pending}
      type="submit"
    >
      {pending ? "Checking websites..." : "Next"}
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
