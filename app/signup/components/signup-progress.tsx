const STEP_LABELS = ["Company", "Competitors", "Why Reddit", "Plan"];

export function SignupProgress({ active }: { active: number }) {
  return (
    <div className="sw-progress" role="list" aria-label="Signup steps">
      {STEP_LABELS.map((label, i) => {
        const done = i < active;
        const current = i === active;
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
