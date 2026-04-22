"use client";

import { useEffect, useRef, useState } from "react";

const POOL = [
  { sub: "r/startups", title: "Best CRM for a bootstrapped SaaS in 2026?", score: 94 },
  { sub: "r/SaaS", title: "Replaced Intercom last month — totally worth it", score: 88 },
  { sub: "r/Entrepreneur", title: "How do you monitor Reddit for buyer signals?", score: 96 },
  { sub: "r/marketing", title: "Anyone tried F5Bot alternatives recently?", score: 82 },
  { sub: "r/webdev", title: "Looking for lightweight user feedback tools", score: 79 },
  { sub: "r/growthHacking", title: "Reddit organic strategy that actually converts", score: 91 },
  { sub: "r/smallbusiness", title: "What tools replaced your Salesforce stack?", score: 85 },
];

type ThreadItem = (typeof POOL)[0] & { uid: number };

export function ValuePanel() {
  const counter = useRef(POOL.length);
  const [stack, setStack] = useState<ThreadItem[]>(
    POOL.slice(0, 3).map((t, i) => ({ ...t, uid: i }))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const idx = counter.current % POOL.length;
      const uid = counter.current;
      counter.current += 1;
      setStack((prev) => [{ ...POOL[idx], uid }, ...prev.slice(0, 2)]);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="value-live-panel">
      <div className="value-live-header">
        <span className="value-live-dot" />
        <span>Live radar</span>
        <span className="value-live-stat">142 threads today</span>
      </div>
      <div className="value-live-feed">
        {stack.map((thread, i) => (
          <ValueCard key={thread.uid} thread={thread} fresh={i === 0} dim={i === 2} />
        ))}
      </div>
    </div>
  );
}

function ValueCard({
  thread,
  fresh,
  dim,
}: {
  thread: ThreadItem;
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
      className={`value-thread-card${fresh ? " value-thread-card-enter" : ""}`}
      style={{ opacity: dim ? 0.38 : 1 }}
    >
      <div className="value-thread-row">
        <span className="value-thread-sub">{thread.sub}</span>
        <span
          className="value-thread-badge"
          style={{ color, borderColor: `${color}40`, background: `${color}14` }}
        >
          {score}
        </span>
      </div>
      <p className="value-thread-title">{thread.title}</p>
      <div className="value-thread-track">
        <div className="value-thread-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}
