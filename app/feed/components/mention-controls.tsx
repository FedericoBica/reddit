import Link from "next/link";
import type { BrandMentionSentiment, KeywordDTO } from "@/db/schemas/domain";
import { buildMentionHref } from "../feed-utils";
import { getSentimentConfig, Chevron, COMPETITOR_COLORS } from "./feed-ui";

export function MentionControls({
  projectId,
  companyName,
  competitors,
  selectedTarget,
  selectedSentiment,
  selectedSort,
  stats,
  totalCount,
  selectedItemId,
  copy,
}: {
  projectId: string;
  companyName: string;
  competitors: KeywordDTO[];
  selectedTarget: string;
  selectedSentiment: BrandMentionSentiment | "all";
  selectedSort: string;
  stats: Record<string, number>;
  totalCount: number;
  selectedItemId?: string;
  copy: Record<string, string>;
}) {
  const isCompanySelected = selectedTarget === companyName;
  const companyHref = buildMentionHref({
    projectId,
    target: companyName,
    sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
    sort: selectedSort === "relevant" ? undefined : selectedSort,
    itemId: selectedItemId,
  });

  const competitorTargets = [
    { id: "all", label: copy.allMentions },
    ...competitors.map((c) => ({ id: c.term, label: c.term })),
  ];
  const dropdownSelectedLabel =
    competitorTargets.find((t) => t.id === selectedTarget)?.label ?? copy.allMentions;

  const sortToggleHref = buildMentionHref({
    projectId,
    target: selectedTarget === "all" ? undefined : selectedTarget,
    sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
    sort: selectedSort === "recent" ? undefined : "recent",
    itemId: selectedItemId,
  });

  const sentimentOptions: Array<{ value: BrandMentionSentiment | "all"; label: string }> = [
    { value: "all", label: copy.allMentions },
    { value: "positive", label: copy.positive },
    { value: "neutral", label: copy.neutral },
    { value: "negative", label: copy.negative },
  ];

  return (
    <div className="mention-controls">
      <div className="mc-pills-row">

        {/* Sentiment filter pill */}
        <details className="mc-ctrl-details">
          <summary className={`mc-ctrl-summary filter-pill${selectedSentiment !== "all" ? " filter-pill-active" : ""}`}>
            <span className="mc-pill-text">{selectedSentiment === "all" ? copy.sentiment : getSentimentConfig(copy)[selectedSentiment].label}</span>
            <Chevron />
          </summary>
          <div className="mc-ctrl-dropdown">
            {sentimentOptions.map((opt) => {
              const isActive = selectedSentiment === opt.value;
              const href = buildMentionHref({
                projectId,
                target: selectedTarget === "all" ? undefined : selectedTarget,
                sentiment: opt.value === "all" ? undefined : opt.value,
                sort: selectedSort === "relevant" ? undefined : selectedSort,
                itemId: selectedItemId,
              });
              return (
                <Link key={opt.value} href={href} className={`mc-ctrl-option${isActive ? " mc-ctrl-option-active" : ""}`}>
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </details>

        {/* My Company toggle pill */}
        <Link href={companyHref} className={`filter-pill${isCompanySelected ? " filter-pill-active" : ""}`}>
          <span className="mc-pill-text">{copy.myCompany}</span>
        </Link>

        {/* Competitor dropdown pill */}
        {competitors.length > 0 && (
          <details className="mc-ctrl-details">
            <summary className={`mc-ctrl-summary filter-pill${selectedTarget !== "all" && !isCompanySelected ? " filter-pill-active" : ""}`}>
              <span className="mc-pill-text">{dropdownSelectedLabel}</span>
              <Chevron />
            </summary>
            <div className="mc-ctrl-dropdown">
              {competitorTargets.map((t, i) => {
                const isActive = selectedTarget === t.id;
                const href = buildMentionHref({
                  projectId,
                  target: t.id === "all" ? undefined : t.id,
                  sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
                  sort: selectedSort === "relevant" ? undefined : selectedSort,
                  itemId: selectedItemId,
                });
                return (
                  <Link key={t.id} href={href} className={`mc-ctrl-option${isActive ? " mc-ctrl-option-active" : ""}`}>
                    {t.id !== "all" && (
                      <span className="mc-ctrl-option-dot" style={{ background: COMPETITOR_COLORS[(i - 1) % COMPETITOR_COLORS.length] }} />
                    )}
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </details>
        )}

        {/* Sort pill — right-aligned, fixed width */}
        <Link href={sortToggleHref} className="filter-pill mc-sort-pill">
          <span className="mc-pill-text">{selectedSort === "recent" ? copy.sortByRecent : copy.sortByActivity}</span>
          <Chevron />
        </Link>

      </div>

      <div className="feed-col-meta">
        <span>{totalCount} {copy.postsFound}</span>
      </div>
    </div>
  );
}

export function TargetDropdown({
  projectId,
  companyName,
  competitors,
  selectedTarget,
  sentiment,
  sort,
  selectedItemId,
}: {
  projectId: string;
  companyName: string;
  competitors: KeywordDTO[];
  selectedTarget: string;
  sentiment: BrandMentionSentiment | "all";
  sort: string;
  selectedItemId?: string;
}) {
  const targets = [
    { id: "all", label: "All mentions" },
    { id: companyName, label: companyName },
    ...competitors.map((c) => ({ id: c.term, label: c.term })),
  ];

  const selectedLabel = targets.find((t) => t.id === selectedTarget)?.label ?? "All mentions";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 700, flexShrink: 0 }}>Target</span>
      <details style={{ position: "relative" }}>
        <summary
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px 4px 12px",
            borderRadius: 20,
            border: "1px solid #DAE0E6",
            background: selectedTarget !== "all" ? "#FFF3EC" : "#fff",
            color: selectedTarget !== "all" ? "#E03D00" : "#1A1A1B",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            listStyle: "none",
            userSelect: "none",
          }}
        >
          {selectedLabel}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </summary>
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          {targets.map((t) => {
            const active = selectedTarget === t.id;
            const href = buildMentionHref({
              projectId,
              target: t.id === "all" ? undefined : t.id,
              sentiment: sentiment === "all" ? undefined : sentiment,
              sort: sort === "relevant" ? undefined : sort,
              itemId: selectedItemId,
            });
            return (
              <Link
                key={t.id}
                href={href}
                style={{
                  display: "block",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  color: active ? "#FF4500" : "#1A1A1B",
                  background: active ? "#FFF3EC" : "transparent",
                  textDecoration: "none",
                  borderBottom: "1px solid #F5F5F5",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}

export function SortControl({
  projectId,
  target,
  sentiment,
  selectedSort,
}: {
  projectId: string;
  target: string;
  sentiment: BrandMentionSentiment | "all";
  selectedSort: string;
}) {
  const options = [
    { value: "relevant", label: "Most discussed" },
    { value: "recent",   label: "Most recent" },
  ] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 700 }}>Sort</span>
      <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 6, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {options.map((opt, i) => {
          const active = selectedSort === opt.value;
          const href = buildMentionHref({
            projectId,
            target: target === "all" ? undefined : target,
            sentiment: sentiment === "all" ? undefined : sentiment,
            sort: opt.value === "relevant" ? undefined : opt.value,
          });
          return (
            <Link
              key={opt.value}
              href={href}
              style={{
                display: "inline-block",
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: active ? "#fff" : "#6B7280",
                background: active ? "#1A1A1B" : "transparent",
                textDecoration: "none",
                borderLeft: i > 0 ? "1px solid #E5E7EB" : "none",
                transition: "background 0.1s",
              }}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SentimentBar({
  projectId,
  target,
  selectedSentiment,
  selectedSort,
  stats,
}: {
  projectId: string;
  target: string;
  selectedSentiment: BrandMentionSentiment | "all";
  selectedSort: string;
  stats: Record<string, number>;
}) {
  const items: Array<{ value: BrandMentionSentiment | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "positive", label: "Positive" },
    { value: "neutral", label: "Neutral" },
    { value: "negative", label: "Negative" },
  ];

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {items.map((item) => {
        const count = item.value === "all" ? stats.all : (stats[item.value] ?? 0);
        const active = selectedSentiment === item.value;
        const cfg = item.value !== "all"
          ? {
              positive: { color: "#059669", bg: "#ECFDF5" },
              neutral: { color: "#7C7C83", bg: "#F8F8F7" },
              negative: { color: "#DC2626", bg: "#FEF2F2" },
            }[item.value]
          : null;
        return (
          <Link
            key={item.value}
            href={buildMentionHref({ projectId, target: target === "all" ? undefined : target, sentiment: item.value === "all" ? undefined : item.value, sort: selectedSort === "relevant" ? undefined : selectedSort })}
            className={`filter-pill${active ? " filter-pill-active" : ""}`}
            style={active && cfg ? { borderColor: cfg.color, color: cfg.color, background: cfg.bg } : {}}
          >
            {item.label} <span style={{ fontWeight: 700, opacity: 0.7 }}>({count})</span>
          </Link>
        );
      })}
    </div>
  );
}
