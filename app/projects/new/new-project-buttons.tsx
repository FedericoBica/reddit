"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function NewProjectAnalyzeButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="h-11 rounded-[8px] font-extrabold" disabled={pending} type="submit">
      {pending ? "Analyzing..." : "Analyze website"}
    </Button>
  );
}

export function NewProjectSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="h-11 rounded-[8px] font-extrabold" disabled={pending} type="submit">
      {pending ? "Creating project..." : "Create project"}
    </Button>
  );
}
