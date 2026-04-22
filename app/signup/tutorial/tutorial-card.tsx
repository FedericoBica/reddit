"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type TutorialCardProps = {
  projectId: string;
};

const steps = [
  {
    title: "Welcome to ReddProwl",
    copy: "ReddProwl scans Reddit for buying intent, recommendation requests and competitor comparisons that match your company.",
    detail: "Your Searchbox ranks posts by intent so you can focus on conversations worth answering.",
  },
  {
    title: "Start with the Searchbox",
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
        <div
          className="signup-tutorial-progress"
          aria-label={`Step ${step + 1} of ${steps.length}`}
        >
          {steps.map((item, index) => (
            <span
              className={index <= step ? "signup-tutorial-progress-active" : undefined}
              key={item.title}
            />
          ))}
        </div>
        <p className="page-kicker">Tutorial</p>
        <h1 className="signup-wizard-title">{current.title}</h1>
        <p className="signup-wizard-copy">{current.copy}</p>
        <p className="signup-wizard-copy">{current.detail}</p>

        <div style={{ marginTop: 24 }}>
          {isLast ? (
            <Button
              asChild
              className="h-11 w-full rounded-[8px] font-extrabold text-sm"
            >
              <a href={`/dashboard?projectId=${projectId}`}>Go to dashboard →</a>
            </Button>
          ) : (
            <Button
              className="h-11 w-full rounded-[8px] font-extrabold text-sm"
              type="button"
              onClick={() => setStep((v) => v + 1)}
            >
              Next →
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
      <div className="value-live-header" style={{ marginBottom: 4 }}>
        <span className="value-live-dot" />
        <span>Live radar</span>
        <span className="value-live-stat">142 threads today</span>
      </div>
      {stack.map((thread, i) => (
        <TutorialFeedCard
          key={thread.uid}
          thread={thread}
          fresh={i === 0}
          dim={i === 2}
        />
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

  const color = score >= 90 ? "#E07000" : score >= 80 ? "#B45309" : "#8E8E93";

  return (
    <div
      className={`tutorial-thread-card${fresh ? " tutorial-thread-card-enter" : ""}`}
      style={{ opacity: dim ? 0.38 : 1, transition: "opacity 300ms ease" }}
    >
      <div className="tutorial-thread-meta">
        <span>{thread.sub}</span>
        <span className="tutorial-thread-score">{score}</span>
      </div>
      <p className="tutorial-thread-title">{thread.title}</p>
      <div className="value-thread-track">
        <div className="value-thread-fill" style={{ width: `${score}%`, background: color }} />
      </div>
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
    indexRef.current = 0;
    setDisplayed("");
    const timer = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(REPLY_TEXT.slice(0, indexRef.current));
      if (indexRef.current >= REPLY_TEXT.length) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tutorial-visual-panel">
      <div className="tutorial-thread-card" style={{ opacity: 0.7 }}>
        <div className="tutorial-thread-meta">
          <span>r/SaaS</span>
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
    </div>
  );
}
