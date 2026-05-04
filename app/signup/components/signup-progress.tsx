import { useTranslations } from "next-intl";

const STEP_LABELS = ["Plan", "Company", "Competitors"];

export function SignupProgress({ active }: { active: number }) {
  const t = useTranslations("signup.progress");
  const labels = [t("plan"), t("company"), t("competitors")];

  return (
    <div className="sw-progress" role="list" aria-label={t("ariaLabel")}>
      {STEP_LABELS.map((_, i) => {
        const done = i < active;
        const current = i === active;
        const label = labels[i];
        return (
          <div
            key={label}
            className={`sw-step${done ? " sw-step-done" : current ? " sw-step-active" : ""}`}
            role="listitem"
          >
            <div className="sw-step-num">
              {done ? <span aria-hidden="true">✓</span> : <span>{String(i + 1).padStart(2, "0")}</span>}
            </div>
            <div className="sw-step-label">{label}</div>
            {i < STEP_LABELS.length - 1 && (
              <div className="sw-step-bar">
                <div className={`sw-step-bar-fill${done ? " sw-step-bar-fill-done" : ""}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
