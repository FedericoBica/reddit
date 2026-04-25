"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type TutorialCardProps = {
  projectId: string;
};

const steps = [
  {
    eyebrow: "Welcome · You&apos;re in",
    title: "Welcome to",
    titleEm: "RedProwl.",
    copy: "RedProwl scans Reddit for buying intent, recommendation requests and competitor comparisons that match your company.",
    detail: "Your Searchbox ranks posts by intent so you can focus on conversations worth answering.",
  },
  {
    eyebrow: "Tutorial · Step 2",
    title: "Start with the",
    titleEm: "Searchbox.",
    copy: "Open a post, read the context, and use the generated reply as a starting point.",
    detail: "Battlecards, intent scores and reply generation are ready from the dashboard.",
  },
];

export function TutorialCard({ projectId }: TutorialCardProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <>
      <section className="signup-wizard-main">
        <div className="signup-tutorial-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <span
              className={index <= step ? "signup-tutorial-progress-active" : undefined}
              key={item.titleEm}
            />
          ))}
        </div>
        <div className="sw-eyebrow" style={{ marginTop: 8 }}>
          <span className="sw-eyebrow-dot" />
          <span dangerouslySetInnerHTML={{ __html: current.eyebrow }} />
        </div>
        <h1 className="signup-wizard-title">
          {current.title}<br /><em>{current.titleEm}</em>
        </h1>
        <p className="signup-wizard-copy">{current.copy}</p>
        <p className="signup-wizard-copy" style={{ marginBottom: 0 }}>{current.detail}</p>

        <ul className="sw-checklist" style={{ marginTop: 22 }}>
          <li>
            <span className="sw-ch-icon">✓</span>
            <div>
              <div className="sw-ch-title">Open a high-intent post</div>
              <div className="sw-ch-desc">Use the suggested reply as a starting point — edit, then post.</div>
            </div>
          </li>
          <li>
            <span className="sw-ch-icon">✓</span>
            <div>
              <div className="sw-ch-title">Battlecards on tap</div>
              <div className="sw-ch-desc">Hover any competitor mention to see your one-line answer.</div>
            </div>
          </li>
        </ul>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          {isLast ? (
            <Button
              asChild
              className="sw-btn-primary w-full"
            >
              <a href={`/dashboard?projectId=${projectId}`}>Open my dashboard →</a>
            </Button>
          ) : (
            <Button
              className="sw-btn-primary w-full"
              type="button"
              onClick={() => setStep((v) => v + 1)}
            >
              Continue →
            </Button>
          )}
        </div>
      </section>

      <aside className="signup-wizard-visual">
        {step === 0 ? <TutorialFeedPanel /> : <TutorialReplyPanel />}
      </aside>
    </>
  );
}

/* ── Step 0: Animated thread feed ─────────────────────── */

const FEED_POOL = [
  { sub: "r/startups", title: "Best CRM for a bootstrapped SaaS?", score: 94 },
  { sub: "r/SaaS", title: "Replaced Intercom last month — worth it", score: 88 },
  { sub: "r/Entrepreneur", title: "How do you monitor Reddit for buyer signals?", score: 96 },
  { sub: "r/marketing", title: "Any F5Bot alternatives that actually work?", score: 82 },
  { sub: "r/webdev", title: "Looking for lightweight user feedback tools", score: 79 },
  { sub: "r/growthHacking", title: "Reddit organic strategy that converts", score: 91 },
];

type FeedItem = (typeof FEED_POOL)[0] & { uid: number };

function TutorialFeedPanel() {
  const counter = useRef(FEED_POOL.length);
  const [stack, setStack] = useState<FeedItem[]>(
    FEED_POOL.slice(0, 3).map((t, i) => ({ ...t, uid: i }))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const idx = counter.current % FEED_POOL.length;
      const uid = counter.current;
      counter.current += 1;
      setStack((prev) => [{ ...FEED_POOL[idx], uid }, ...prev.slice(0, 2)]);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tutorial-visual-panel">
      <div className="sw-pane-eyebrow">
        <span className="sw-live-tag">
          <span className="sw-pulse" />
          Your first lead
        </span>
        <span className="sw-pane-meta">Demo</span>
      </div>
      {stack.map((thread, i) => (
        <TutorialFeedCard key={thread.uid} thread={thread} fresh={i === 0} dim={i === 2} />
      ))}
    </div>
  );
}

function TutorialFeedCard({
  thread,
  fresh,
  dim,
}: {
  thread: FeedItem;
  fresh: boolean;
  dim: boolean;
}) {
  const [score, setScore] = useState(fresh ? 0 : thread.score);

  useEffect(() => {
    if (!fresh) return;
    let raf: number;
    let current = 0;
    const target = thread.score;
    const tick = () => {
      current = Math.min(current + 3, target);
      setScore(current);
      if (current < target) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, 80);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [fresh, thread.score]);

  return (
    <div
      className={`sw-radar-row${fresh ? " sw-radar-row-fresh" : ""}${dim ? " sw-radar-row-muted" : ""}`}
      style={{ transition: "opacity 300ms ease" }}
    >
      <div>
        <div className="sw-radar-sub">{thread.sub}</div>
        <div className="sw-radar-post">{thread.title}</div>
      </div>
      <div className="sw-radar-score">{score}</div>
    </div>
  );
}

/* ── Step 1: Animated reply editor ────────────────────── */

const REPLY_TEXT =
  "Hey! I went through the same decision last year. We ended up switching to a lighter stack and it saved us a ton of overhead. Happy to share what worked — feel free to DM me.";

function TutorialReplyPanel() {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    let currentIndex = 0;
    indexRef.current = 0;
    const timer = setInterval(() => {
      currentIndex += 1;
      indexRef.current = currentIndex;
      setDisplayed(REPLY_TEXT.slice(0, currentIndex));
      if (currentIndex >= REPLY_TEXT.length) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tutorial-visual-panel">
      <div className="sw-pane-eyebrow">
        <span style={{ color: "oklch(0.58 0.18 38)", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Generated reply</span>
        <span className="sw-pane-meta">Demo</span>
      </div>
      <div className="tutorial-thread-card" style={{ opacity: 0.7 }}>
        <div className="tutorial-thread-meta">
          <span>r/SaaS · 14m ago</span>
          <span className="tutorial-thread-score">91</span>
        </div>
        <p className="tutorial-thread-title">
          Any lightweight alternatives to Salesforce for a 5-person team?
        </p>
      </div>

      <div className="tutorial-reply-editor">
        <div className="tutorial-reply-header">Generated reply</div>
        <div className="tutorial-reply-body">
          {displayed}
          {displayed.length < REPLY_TEXT.length && (
            <span className="tutorial-reply-cursor" aria-hidden="true" />
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 7, alignItems: "center", fontSize: 11, color: "oklch(0.6 0.02 55)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em" }}>
        <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "oklch(0.55 0.1 150)", flexShrink: 0 }} />
        Tone: friendly · 0 spam flags
      </div>
    </div>
  );
}
