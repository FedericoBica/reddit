"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLink } from "@/app/components/logo";
import { TRANSLATIONS, type Locale, type Translations } from "./landing-i18n";

const THREADS = [
  {
    id: 1,
    sub: "r/startups",
    age: "2h",
    upv: 342,
    comments: 87,
    title:
      "We just hit $10k MRR and I am still doing customer support at 2am",
    snippet:
      "Looking for tools that understand SaaS conversations, not just ticket routing. Current stack is Intercom plus Zendesk and it is bleeding money.",
    score: 94,
    band: "hot",
    author: "u/scrappy_founder",
  },
  {
    id: 2,
    sub: "r/SaaS",
    age: "5h",
    upv: 128,
    comments: 41,
    title: "Best way to monitor Reddit for mentions without losing my mind?",
    snippet:
      "Tried F5Bot but the signal-to-noise ratio is awful. Half the mentions are unrelated. What is working for you?",
    score: 88,
    band: "hot",
    author: "u/dtc_dave",
  },
  {
    id: 3,
    sub: "r/marketing",
    age: "8h",
    upv: 76,
    comments: 23,
    title: "Has anyone done organic Reddit growth without getting banned?",
    snippet:
      "Mod tools are unforgiving. I have been shadowbanned twice. Need a workflow that respects subreddit rules.",
    score: 71,
    band: "warm",
    author: "u/growth_chloe",
  },
];

const LEADS = [
  { ini: "SF", name: "u/scrappy_founder", meta: "r/startups - 4.2k karma", tag: "Founder - SaaS", fit: 94 },
  { ini: "DD", name: "u/dtc_dave", meta: "r/SaaS - 8.1k karma", tag: "DTC - Shopify", fit: 88 },
  { ini: "GC", name: "u/growth_chloe", meta: "r/marketing - 2.3k", tag: "Growth - B2B", fit: 82 },
  { ini: "NN", name: "u/numbers_nick", meta: "r/Entrepreneur - 11k", tag: "Bootstrap", fit: 76 },
];

const REPLIES = [
  {
    status: "sent",
    to: "u/scrappy_founder",
    sub: "r/startups",
    time: "12m ago",
    body:
      "Been there. We scaled past founder support by routing Reddit plus Intercom into one inbox with intent tagging. It cut response time by 60%.",
    upv: 12,
    replies: 3,
  },
  {
    status: "queued",
    to: "u/dtc_dave",
    sub: "r/SaaS",
    time: "sends in 8m",
    body:
      "F5Bot's noise problem is real. We tuned matching on semantic intent instead of keywords and got mentions worth replying to down from 400 a week to 40.",
    upv: 0,
    replies: 0,
  },
  {
    status: "draft",
    to: "u/growth_chloe",
    sub: "r/marketing",
    time: "needs review",
    body:
      "Shadowbans usually come from too much self-promo in a short window. The rule that worked for us: 9 helpful comments for every 1 that links back.",
    upv: 0,
    replies: 0,
  },
];

function Spark({
  points,
  color = "var(--accent)",
}: {
  points: number[];
  color?: string;
}) {
  const w = 400;
  const h = 90;
  const pad = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [
    pad + i * step,
    h - pad - ((p - min) / range) * (h - pad * 2),
  ]);
  const d = coords
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
  const area = `${d} L${coords[coords.length - 1][0]},${h} L${coords[0][0]},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-g)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 0} fill={color} />
      ))}
    </svg>
  );
}

function HeroDashboard({ td }: { td: Translations["dashboard"] }) {
  const [tab, setTab] = useState<"threads" | "leads" | "replies">("threads");
  const [selected, setSelected] = useState(1);
  const [query, setQuery] = useState(
    "SaaS support tools, founder-led support, Intercom alternatives"
  );
  const [reply, setReply] = useState(
    "Hey, we ran into exactly this at about $8k MRR. What actually worked was routing Reddit DMs and product-adjacent subs into one queue with intent tagging. Happy to share the setup if it helps."
  );
  const [replyTouched, setReplyTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [chartPoints, setChartPoints] = useState([
    12, 18, 14, 22, 19, 28, 24, 34, 31, 42, 38, 51, 47, 58,
  ]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setChartPoints((points) => [
        ...points.slice(1),
        Math.max(20, points[points.length - 1] + (Math.random() - 0.4) * 8),
      ]);
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  const thread = THREADS.find((item) => item.id === selected) ?? THREADS[0];

  const replyError = useMemo(() => {
    if (!replyTouched) return "";
    if (reply.trim().length < 40) return td.errorTooShort;
    if (/\b(buy|sign ?up|check out my|link in bio)\b/i.test(reply)) {
      return td.errorPromo;
    }
    return "";
  }, [reply, replyTouched, td]);

  function sendReply() {
    setReplyTouched(true);
    if (reply.trim().length < 40) return;
    if (/\b(buy|sign ?up|check out my|link in bio)\b/i.test(reply)) return;
    setSent(true);
    window.setTimeout(() => setSent(false), 2600);
  }

  return (
    <div className="dash" aria-label="Prowlit product preview">
      <div className="dash-sticker a">live demo</div>
      <div className="dash-sticker b">try it</div>

      <div className="dash-frame">
        <div className="dash-top">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="dash-title">prowl.prowlit.app / workspace - acme inc.</div>
        </div>

        <div className="dash-tabs">
          {[
            ["threads", td.tabThreads, THREADS.length],
            ["leads", td.tabLeads, LEADS.length],
            ["replies", td.tabReplies, REPLIES.length],
          ].map(([id, label, count]) => (
            <button
              key={id}
              className={`dash-tab ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id as "threads" | "leads" | "replies")}
            >
              {label}
              <span className="count">{count}</span>
            </button>
          ))}
        </div>

        <div className="dash-body">
          {tab === "threads" && (
            <>
              <div className="query-row">
                <span className="lbl">{td.trackingLabel}</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} />
                <span className="chip">
                  <span className="dot" />
                  {td.liveChip}
                </span>
              </div>

              <div className="chart-wrap">
                <div className="chart">
                  <div className="chart-head">
                    <div>
                      <div className="ttl">{td.chartTitle}</div>
                      <div className="val">
                        {Math.round(chartPoints[chartPoints.length - 1])}
                        <span className="delta"> {td.chartDelta}</span>
                      </div>
                    </div>
                    <div className="mini-meta">{td.chartMeta}</div>
                  </div>
                  <Spark points={chartPoints} />
                </div>
                <div className="stat-col">
                  <div className="stat">
                    <div className="lbl">{td.statMatchScore}</div>
                    <div className="n">
                      {thread.score}
                      <span>/100</span>
                    </div>
                    <div className="subtext">{td.statMatchSub}</div>
                  </div>
                  <div className="stat">
                    <div className="lbl">{td.statReachLabel}</div>
                    <div className="n">{(thread.upv * 11).toLocaleString()}</div>
                    <div className="subtext">{td.statReachSub}</div>
                  </div>
                </div>
              </div>

              <div className="thread-list">
                {THREADS.map((item) => (
                  <button
                    key={item.id}
                    className={`thread ${selected === item.id ? "selected" : ""}`}
                    onClick={() => setSelected(item.id)}
                  >
                    <div className="upv">
                      <span className="arr">▲</span>
                      <span className="n">{item.upv}</span>
                      <span className="lbl">upv</span>
                    </div>
                    <div className="thread-main">
                      <div className="subline">
                        <b>{item.sub}</b> - {item.author} - {item.age} - {item.comments} comments
                      </div>
                      <div className="title">{item.title}</div>
                      <div className="snippet">{item.snippet}</div>
                    </div>
                    <div className="thread-score">
                      <div className={`score-pill ${item.band}`}>{item.score}</div>
                      <div className="mini-meta">{item.band === "hot" ? td.replyNow : td.worthWatching}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="composer">
                <div className="composer-head">
                  <div className="ttl">{td.aiDraftTitle} - {thread.sub}</div>
                  <div className="meta">{td.composerTone} - {td.composerLen}</div>
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    setReplyTouched(true);
                  }}
                  className={replyError ? "invalid" : ""}
                />
                <div className="composer-foot">
                  <div className="lefty">
                    <span className="chip">{td.regenerate}</span>
                    <span className="chip">{td.toneLabel}</span>
                    {replyError ? <span className="err-msg">{replyError}</span> : null}
                    <span className={`ok-msg ${sent ? "show" : ""}`}>{td.queuedMsg}</span>
                  </div>
                  <button className="btn primary sm" onClick={sendReply}>
                    {td.sendReply}
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === "leads" && (
            <>
              <div className="query-row">
                <span className="lbl">{td.filterLabel}</span>
                <input defaultValue={td.filterPlaceholder} />
                <span className="chip">
                  <span className="dot" />
                  {LEADS.length} {td.leadsCount}
                </span>
              </div>
              <div className="leads-table">
                {LEADS.map((lead) => (
                  <div className="lead-row" key={lead.name}>
                    <div className="avatar">{lead.ini}</div>
                    <div>
                      <div className="lead-name">{lead.name}</div>
                      <div className="lead-sub">{lead.meta}</div>
                    </div>
                    <span className="chip">{lead.tag}</span>
                    <div className="score-pill hot">{lead.fit}</div>
                    <button className="btn sm">{td.draftDm}</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "replies" && (
            <div className="reply-list">
              {REPLIES.map((item) => (
                <div className="reply-card" key={`${item.to}-${item.status}`}>
                  <div className="hd">
                    <span>
                      {td.replyTo} <b>{item.to}</b> in <b>{item.sub}</b>
                    </span>
                    <span className={`reply-status ${item.status}`}>{item.status}</span>
                  </div>
                  <div className="body">{item.body}</div>
                  <div className="foot">
                    <span>{item.time}</span>
                    {item.status === "sent" ? (
                      <>
                        <span>-</span>
                        <span>{item.upv} upvotes</span>
                        <span>-</span>
                        <span>{item.replies} replies</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatSignal() {
  return (
    <div className="feat-signal">
      {[
        ["r/startups", 94, "hot"],
        ["r/SaaS", 81, "hot"],
        ["r/marketing", 62, "warm"],
        ["r/ecommerce", 34, "cold"],
      ].map(([sub, score, band]) => (
        <div key={sub} className="signal-row">
          <span className="mono">{sub}</span>
          <div className="signal-bar">
            <div className={String(band)} style={{ width: `${score}%` }} />
          </div>
          <span className={`score-pill ${band}`}>{score}</span>
        </div>
      ))}
    </div>
  );
}

function FeatCompose() {
  return (
    <div className="feat-compose">
      <div className="chip-row">
        {["helpful", "casual", "founder voice", "no pitch", "cite data"].map((tag) => (
          <span key={tag} className="chip">{tag}</span>
        ))}
      </div>
      <div className="mini-reply">
        <b>Honestly, been there at $8k MRR.</b> The thing that helped was routing Reddit into the same inbox as product-adjacent subs with intent tagging.
      </div>
    </div>
  );
}

function FeatInbox() {
  return (
    <div className="feat-inbox">
      {[
        ["SF", "u/scrappy_founder", "needs reply"],
        ["DD", "u/dtc_dave", "queued"],
        ["GC", "u/growth_chloe", "sent"],
      ].map(([ini, name, status]) => (
        <div key={name} className="mini-inbox-row">
          <div className="avatar">{ini}</div>
          <span>{name}</span>
          <span className="mini-status">{status}</span>
        </div>
      ))}
    </div>
  );
}

function FeatGuard() {
  return (
    <div className="feat-guard">
      {[
        ["OK", "No two replies per subreddit per 24h"],
        ["OK", "Self-promo ratio: 1 in 10 comments"],
        ["Warn", "r/marketing: read wiki before posting"],
        ["OK", "Account karma threshold met"],
      ].map(([state, text]) => (
        <div key={text} className="guard-row">
          <span className={state === "OK" ? "ok" : "warn"}>{state}</span>
          {text}
        </div>
      ))}
    </div>
  );
}

type CustomerTab = "saas" | "consumer" | "ecom" | "agency" | "local";

const IDEAL_DATA: Record<CustomerTab, { p: "r" | "x"; sub: string; t: string; s: number }[]> = {
  saas: [
    { p: "r", sub: "r/startups", t: "Best <mark>project management tool</mark> for a remote team of 12?", s: 96 },
    { p: "x", sub: "@growthmind", t: "Anyone know a good <mark>Intercom alternative</mark> that's cheaper?", s: 93 },
    { p: "r", sub: "r/SaaS", t: "Anyone replaced Intercom with something <mark>cheaper</mark>?", s: 91 },
    { p: "x", sub: "@b2bcoach", t: "Looking for <mark>error tracking</mark> recs that don't cost a fortune", s: 84 },
  ],
  consumer: [
    { p: "r", sub: "r/apps", t: "Looking for a <mark>habit tracker</mark> that isn't subscription-only", s: 93 },
    { p: "x", sub: "@adhd_dev", t: "Best <mark>pomodoro timer</mark> for ADHD brains?", s: 88 },
    { p: "r", sub: "r/productivity", t: "Best <mark>focus app</mark> that actually works?", s: 86 },
    { p: "x", sub: "@notes_nerd", t: "Alternative to Notion for a <mark>personal wiki</mark>?", s: 79 },
  ],
  ecom: [
    { p: "r", sub: "r/SkincareAddiction", t: "Looking for a good <mark>vitamin C serum</mark> under $30", s: 96 },
    { p: "x", sub: "@ecofinds", t: "Best <mark>sustainable water bottle</mark> recs?", s: 92 },
    { p: "r", sub: "r/BuyItForLife", t: "Best <mark>everyday backpack</mark> that lasts?", s: 89 },
    { p: "x", sub: "@cleanfit", t: "Protein powder <mark>without the artificial junk</mark>?", s: 88 },
  ],
  agency: [
    { p: "x", sub: "@growthmind", t: "Growth consultant for <mark>content-based businesses</mark>?", s: 96 },
    { p: "x", sub: "@b2bcoach", t: "Need help improving <mark>B2B sales process</mark>", s: 90 },
    { p: "r", sub: "r/Entrepreneur", t: "Any consultants here for early-stage <mark>SaaS pricing</mark>?", s: 89 },
    { p: "r", sub: "r/startups", t: "Looking for a <mark>startup mentor</mark> or consultant", s: 88 },
  ],
  local: [
    { p: "r", sub: "r/AskNYC", t: "Trustworthy <mark>accountant</mark> for a small LLC in Brooklyn?", s: 87 },
    { p: "x", sub: "@atxlocals", t: "Reliable <mark>HVAC company</mark> in Austin that won't rip me off?", s: 84 },
    { p: "r", sub: "r/SFBay", t: "Looking for a good <mark>dog groomer</mark> in the Mission", s: 80 },
    { p: "x", sub: "@bayareadm", t: "Recs for a <mark>handyman</mark> in the East Bay?", s: 76 },
  ],
};

const IDEAL_TABS_CONFIG: { id: CustomerTab; icon: string }[] = [
  { id: "saas", icon: "◈" },
  { id: "agency", icon: "⟢" },
  { id: "consumer", icon: "◉" },
  { id: "ecom", icon: "▦" },
  { id: "local", icon: "⌂" },
];

function MarkText({ text }: { text: string }) {
  const parts = text.split(/(<mark>.*?<\/mark>)/);
  return (
    <>
      {parts.map((part, i) => {
        const inner = part.match(/^<mark>(.*)<\/mark>$/)?.[1];
        return inner ? <mark key={i}>{inner}</mark> : part;
      })}
    </>
  );
}

function IdealCustomers({ t }: { t: Translations }) {
  const [tab, setTab] = useState<CustomerTab>("saas");
  const tc = t.idealCustomers;
  const tabLabels: Record<CustomerTab, string> = {
    saas: tc.tabSaas,
    agency: tc.tabAgency,
    consumer: tc.tabConsumer,
    ecom: tc.tabEcom,
    local: tc.tabLocal,
  };

  return (
    <section className="section-pad">
      <div className="wrap centered">
        <h2 className="h-section">
          {tc.h2_1}<em>{tc.h2_em}</em>{tc.h2_2}
        </h2>
        <p className="sub">{tc.sub}</p>

        <div className="ideal-card">
          <div className="tab-row">
            {IDEAL_TABS_CONFIG.map(({ id, icon }) => (
              <button
                key={id}
                type="button"
                className={`tab-btn${tab === id ? " active" : ""}`}
                onClick={() => setTab(id)}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                {tabLabels[id]}
              </button>
            ))}
          </div>
          <div className="ideal-grid">
            {IDEAL_DATA[tab].map((item, i) => (
              <div key={i} className="ideal-item">
                <div className="sub-tag">
                  <span className={`plat ${item.p === "r" ? "plat-r" : "plat-x"}`}>
                    {item.p === "r" ? (
                      <svg viewBox="0 0 24 24" width="14" height="14"><path fill="#fff" d="M12 0a12 12 0 1012 12A12 12 0 0012 0zm5.01 13.18a3.43 3.43 0 01.04.5c0 2.55-2.96 4.62-6.62 4.62s-6.62-2.07-6.62-4.62a3.43 3.43 0 01.04-.5 1.5 1.5 0 11 2 -1.39 4.79 4.79 0 014.59-2.46l.78-3.66a.27.27 0 01.32-.21l2.55.54a1 1 0 11-.1.45l-2.28-.48-.7 3.29a4.79 4.79 0 014.5 2.53 1.5 1.5 0 11 1.5 1zm-9.05-.5a1 1 0 101 1 1 1 0 00-1-1zm6.08 0a1 1 0 101 1 1 1 0 00-1-1zm-.18 2.4a.4.4 0 00-.57 0 2.5 2.5 0 01-3.56 0 .4.4 0 10-.57.57 3.31 3.31 0 004.7 0 .4.4 0 000-.57z"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="11" height="11"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    )}
                  </span>
                  {item.sub}
                </div>
                <div className="tt">
                  <MarkText text={item.t} />
                </div>
                <div className="rel">
                  <span>{tc.relevanceLabel}</span>
                  <b>{item.s}/100</b>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="closing-line">
          <b>Prowlit</b>{tc.closingLine}<em>{tc.closingLineAuto}</em>
        </p>
      </div>
    </section>
  );
}

function TwoWays({ t }: { t: Translations }) {
  const tw = t.twoWays;
  const cards = [
    {
      tag: tw.inboundTag,
      title: tw.inboundTitle,
      desc: tw.inboundDesc,
      feats: [tw.inboundFeat1, tw.inboundFeat2, tw.inboundFeat3],
      cta: tw.inboundCta,
      tone: "inbound",
    },
    {
      tag: tw.outboundTag,
      title: tw.outboundTitle,
      desc: tw.outboundDesc,
      feats: [tw.outboundFeat1, tw.outboundFeat2, tw.outboundFeat3],
      cta: tw.outboundCta,
      tone: "outbound",
    },
  ];

  return (
    <section className="section-pad banded">
      <div className="wrap centered">
        <span className="eyebrow">{tw.eyebrow}</span>
        <h2 className="h-section"><em>{tw.h2_em}</em>{tw.h2_2}</h2>
        <p className="sub">{tw.sub}</p>

        <div className="two-way-grid">
          {cards.map((card) => (
            <div key={card.tag} className={`way-card ${card.tone}`}>
              <span className="chip"><span className="dot" />{card.tag}</span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <div className="way-visual" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <ul>
                {card.feats.map((feature) => (
                  <li key={feature}><span>✓</span>{feature}</li>
                ))}
              </ul>
              <Link href="/signup" className="btn">{card.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison({ t }: { t: Translations }) {
  const tc = t.comparison;
  const manual = [
    tc.manualItem1, tc.manualItem2, tc.manualItem3, tc.manualItem4,
    tc.manualItem5, tc.manualItem6, tc.manualItem7, tc.manualItem8,
  ];
  const prowl: [string, string][] = [
    [tc.prowl1Title, tc.prowl1Desc],
    [tc.prowl2Title, tc.prowl2Desc],
    [tc.prowl3Title, tc.prowl3Desc],
  ];

  return (
    <section className="section-pad">
      <div className="wrap centered">
        <span className="eyebrow">{tc.eyebrow}</span>
        <h2 className="h-section">
          {tc.h2_1}<br />
          <em>{tc.h2_em}</em>
        </h2>
        <p className="sub">{tc.sub}</p>

        <div className="comparison-grid">
          <div className="comparison-card manual">
            <h3>{tc.manualTitle}</h3>
            <ul>
              {manual.map((item) => (
                <li key={item}><span>×</span>{item}</li>
              ))}
            </ul>
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#B91C1C",
                fontWeight: 700,
              }}
            >
              {tc.manualSummary}
            </div>
          </div>
          <div className="comparison-card prowl">
            <h3>{tc.prowlTitle} <span>Prowlit</span></h3>
            <ul>
              {prowl.map(([title, desc]) => (
                <li key={title}>
                  <span>✓</span>
                  <div><b>{title}</b><small>{desc}</small></div>
                </li>
              ))}
            </ul>
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                color: "#166534",
                fontWeight: 700,
              }}
            >
              {tc.prowlSummary}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyReddit({ t }: { t: Translations }) {
  const tw = t.whyReddit;
  const points = [
    {
      num: "01",
      title: tw.point1Title,
      body: (
        <>
          {tw.point1Body1}<b>{tw.point1Body2}</b>{tw.point1Body3}
          <b>{tw.point1Body4}</b>{tw.point1Body5}
        </>
      ),
      source: tw.point1Source,
    },
    {
      num: "02",
      title: tw.point2Title,
      body: (
        <>
          {tw.point2Body1}<b>{tw.point2Body2}</b>{tw.point2Body3}
          <b>{tw.point2Body4}</b>{tw.point2Body5}
        </>
      ),
      source: tw.point2Source,
    },
    {
      num: "03",
      title: tw.point3Title,
      body: (
        <>
          {tw.point3Body1}<b>{tw.point3Body2}</b>{tw.point3Body3}
          <b>{tw.point3Body4}</b>{tw.point3Body5}
        </>
      ),
      source: tw.point3Source,
    },
  ];

  const chart = [
    { domain: "reddit.com",   pct: 9.8,  pctW: "98%", highlight: true },
    { domain: "linkedin.com", pct: 9.2,  pctW: "92%" },
    { domain: "wikipedia.org",pct: 7.5,  pctW: "75%" },
    { domain: "medium.com",   pct: 5.2,  pctW: "52%" },
    { domain: "youtube.com",  pct: 4.8,  pctW: "48%" },
    { domain: "google.com",   pct: 4.5,  pctW: "45%" },
    { domain: "nih.gov",      pct: 4.2,  pctW: "42%" },
    { domain: "forbes.com",   pct: 3.8,  pctW: "38%" },
  ];

  return (
    <section className="section-pad" id="why-reddit">
      <div className="wrap">
        <div className="why-header">
          <span className="chip why-chip">
            <span className="dot" /> {tw.chip}
          </span>
          <h2 className="h-section">
            {tw.h2_1}<em>{tw.h2_em}</em>
          </h2>
          <p className="sub">{tw.sub}</p>
        </div>

        <div className="why-reddit-grid">
          <div className="why-points">
            {points.map((point) => (
              <div className="why-point" key={point.num}>
                <div className="why-num mono">{point.num}</div>
                <div>
                  <h3 className="why-h">{point.title}</h3>
                  <p className="why-b">{point.body}</p>
                  <a href="#" className="why-src">
                    {point.source} <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <aside className="why-chart">
            <div>
              <h4 className="why-chart-title">{tw.chartTitle}</h4>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.04em" }}>
                ChatGPT, Google AI Mode, Perplexity · Oct 2025
              </div>
            </div>
            <div className="why-bars">
              {chart.map((row) => (
                <div className="why-row" key={row.domain}>
                  <span className={`why-dn${row.highlight ? " highlight" : ""}`}>{row.domain}</span>
                  <div className="why-bar">
                    <div className={`why-fill${row.highlight ? " highlight" : ""}`} style={{ width: row.pctW }} />
                  </div>
                  <span className="why-pct">{row.pct}%</span>
                </div>
              ))}
            </div>
            <div className="why-chart-foot">
              {tw.chartFoot}
            </div>
          </aside>
        </div>

        <p className="why-closing">
          {tw.closing1}{" "}
          <b>{tw.closing2}</b>
        </p>
      </div>
    </section>
  );
}

function WhyX({ t }: { t: Translations }) {
  const tw = t.whyX;

  const cards = [
    { tag: tw.card1tag, h: tw.card1h, b: tw.card1b },
    { tag: tw.card2tag, h: tw.card2h, b: tw.card2b },
    { tag: tw.card3tag, h: tw.card3h, b: tw.card3b },
    { tag: tw.card4tag, h: tw.card4h, b: tw.card4b },
  ];

  return (
    <section className="section-pad banded" id="why-x">
      <div className="wrap">
        <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto 56px" }}>
          <span className="eyebrow" style={{ margin: "0 auto" }}>
            <span className="dot" /> {tw.eyebrow}
          </span>
          <h2 className="h-section" style={{ margin: "18px 0 18px" }}>
            {tw.h2_1}<em>{tw.h2_em}</em>
          </h2>
          <p className="sub" style={{ margin: "0 auto", maxWidth: "62ch" }}>
            <b style={{ color: "var(--ink)" }}>{tw.subStat1}</b>{tw.subText1}
            <b style={{ color: "var(--ink)" }}>{tw.subStat2}</b>{tw.subText2}
          </p>
          <div className="mono" style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
            <span style={{ width: 24, height: 1, background: "var(--line)", display: "block" }} />
            {tw.thatMeans}
            <span style={{ width: 24, height: 1, background: "var(--line)", display: "block" }} />
          </div>
        </div>

        <div className="why-mon-grid">
          {cards.map((card) => (
            <article key={card.tag} className="x-post-card">
              <div className="x-post-top">
                <span className="x-post-tag mono">{card.tag}</span>
                <svg className="x-post-logo" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <h3 className="x-post-h">{card.h}</h3>
              <p className="x-post-body">{card.b}</p>
            </article>
          ))}
        </div>

        <div className="why-mon-foot">
          <div className="why-mon-foot-l">
            <div className="mono" style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
              {tw.fixLabel}
            </div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, lineHeight: 1.2, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              {tw.fixH}<em style={{ color: "var(--accent-ink)" }}>{tw.fixHem}</em>
            </div>
          </div>
          <Link href="/signup" className="btn" style={{ background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)", whiteSpace: "nowrap" }}>
            {tw.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

function HonestTruth({ t }: { t: Translations }) {
  const th = t.honestTruth;
  const risks = [th.risk1, th.risk2, th.risk3, th.risk4];
  const workflow = [th.workflow1, th.workflow2, th.workflow3, th.workflow4];

  return (
    <section className="section-pad banded">
      <div className="wrap truth-wrap">
        <div className="centered">
          <span className="eyebrow">{th.eyebrow}</span>
          <h2 className="h-section">{th.h2_1}<em>{th.h2_em}</em>{th.h2_2}</h2>
          <p className="sub">{th.sub}</p>
        </div>

        <div className="truth-card">
          <p><b>{th.p1}</b></p>
          <p><b>{th.p2}</b></p>

          <div className="risk-box">
            <div>{th.riskTitle}</div>
            <div>
              {risks.map((risk) => (
                <span key={risk}>× {risk}</span>
              ))}
            </div>
          </div>

          <div className="truth-split">
            <div className="mono">{th.soWhat}</div>
            <h3>{th.splitTitle1} <em>{th.splitTitle2}</em></h3>
            <p>{th.splitDesc}</p>
            <ol>
              {workflow.map((item, index) => (
                <li key={item} className={index === workflow.length - 1 ? "final" : ""}>
                  <span>{index + 1}</span>{item}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeoAiSearch({ t }: { t: Translations }) {
  const ts = t.seoAi;
  return (
    <section className="section-pad">
      <div className="wrap seo-grid">
        <div className="search-preview">
          <div className="search-preview-top">
            <span className="chip">{ts.searchChip}</span>
            <span className="chip success">{ts.boostChip}</span>
          </div>
          <div className="search-result">
            <div className="mono">best email marketing software for startups</div>
            <b>reddit.com / r/marketing</b>
            <strong>Best email marketing tool for startups in 2026?</strong>
            <p>I have tried MailChimp but it is too expensive. What do you recommend for...</p>
            <blockquote><b>Your Comment:</b> We switched to YourProduct last month and it has been great.</blockquote>
          </div>
          <div className="search-result ai">
            <div className="mono">{ts.aiChip}</div>
            <p>Based on recent Reddit discussions, many users recommend <b>YourProduct</b> as a cost-effective alternative.</p>
            <small>SOURCES: reddit.com</small>
          </div>
        </div>
        <div>
          <span className="chip">🎯 {ts.chip}</span>
          <h2 className="h-section">{ts.h2_1}<em>{ts.h2_em}</em>{ts.h2_2}</h2>
          <p className="sub">{ts.sub}</p>
          <ul className="seo-list">
            <li><span>✓</span>{ts.li1}</li>
            <li><span>✓</span>{ts.li2}</li>
            <li><span>✓</span>{ts.li3}</li>
          </ul>
          <Link className="btn primary lg" href="/signup">{ts.cta}</Link>
        </div>
      </div>
    </section>
  );
}

function Features({ t }: { t: Translations }) {
  const tf = t.features;
  return (
    <section id="features" className="section-pad">
      <div className="wrap">
        <div className="section-heading">
          <span className="eyebrow">{tf.eyebrow}</span>
          <h2 className="h-section">{tf.h2}</h2>
          <p className="sub">{tf.sub}</p>
        </div>

        <div className="features-grid">
          <div className="feat big">
            <div className="icon">{tf.feat1Icon}</div>
            <h3>{tf.feat1Title}</h3>
            <p>{tf.feat1Desc}</p>
            <div className="vis"><FeatSignal /></div>
          </div>
          <div className="feat sm">
            <div className="icon">{tf.feat2Icon}</div>
            <h3>{tf.feat2Title}</h3>
            <p>{tf.feat2Desc}</p>
            <div className="vis"><FeatCompose /></div>
          </div>
          <div className="feat sm">
            <div className="icon">{tf.feat3Icon}</div>
            <h3>{tf.feat3Title}</h3>
            <p>{tf.feat3Desc}</p>
            <div className="vis"><FeatInbox /></div>
          </div>
          <div className="feat big">
            <div className="icon">{tf.feat4Icon}</div>
            <h3>{tf.feat4Title}</h3>
            <p>{tf.feat4Desc}</p>
            <div className="vis"><FeatGuard /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepVis1() {
  return (
    <div className="step-vis">
      <div className="sv-browser">
        <div className="sv-browser-bar">
          <span /><span /><span />
          <div className="sv-url">yoursite.com</div>
        </div>
        <div className="sv-browser-body">
          {[75, 55, 88, 42].map((w, i) => (
            <div key={i} className="sv-line" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepVis2() {
  return (
    <div className="step-vis">
      <div className="sv-complist">
        {(["A", "B", "C"] as const).map((ini) => (
          <div key={ini} className="sv-comp-row">
            <div className="sv-comp-ini">{ini}</div>
            <span className="sv-comp-name">Competitor {ini}</span>
            <span className="sv-checkmark">✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepVis3() {
  const rows: [string, number, string][] = [
    ["r/startups", 94, "hot"],
    ["r/SaaS", 88, "hot"],
    ["r/marketing", 71, "warm"],
  ];
  return (
    <div className="step-vis">
      <div className="sv-posts">
        {rows.map(([sub, score, band]) => (
          <div key={sub} className="sv-post-row">
            <span className="sv-sub mono">{sub}</span>
            <div className="sv-post-bar">
              <div className={`sv-post-fill ${band}`} style={{ width: `${score}%` }} />
            </div>
            <span className="sv-post-score">{score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks({ t }: { t: Translations }) {
  const th = t.howItWorks;
  const steps = [
    { n: th.step1n, t: th.step1t, d: th.step1d, vis: <StepVis1 /> },
    { n: th.step2n, t: th.step2t, d: th.step2d, vis: <StepVis2 /> },
    { n: th.step3n, t: th.step3t, d: th.step3d, vis: <StepVis3 /> },
  ];

  return (
    <section id="how" className="section-pad banded">
      <div className="wrap">
        <div className="section-heading">
          <span className="eyebrow">{th.eyebrow}</span>
          <h2 className="h-section">
            {th.h2_1}<em>{th.h2_em}</em>{th.h2_2}
          </h2>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <div key={step.n} className="step">
              <div className="num">{step.n}</div>
              {step.vis}
              <h4>{step.t}</h4>
              <p>{step.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ t }: { t: Translations }) {
  const [yearly, setYearly] = useState(false);
  const tp = t.pricing;
  const tiers = [
    {
      name: tp.tier1Name,
      monthly: 19,
      yearly: 15,
      desc: tp.tier1Desc,
      features: [tp.tier1F1, tp.tier1F2, tp.tier1F3, tp.tier1F4, tp.tier1F5, tp.tier1F6, tp.tier1F7, tp.tier1F8],
    },
    {
      name: tp.tier2Name,
      monthly: 39,
      yearly: 31,
      desc: tp.tier2Desc,
      featured: true,
      features: [tp.tier2F1, tp.tier2F2, tp.tier2F3, tp.tier2F4, tp.tier2F5, tp.tier2F6, tp.tier2F7, tp.tier2F8, tp.tier2F9],
    },
    {
      name: tp.tier3Name,
      monthly: 79,
      yearly: 63,
      desc: tp.tier3Desc,
      features: [tp.tier3F1, tp.tier3F2, tp.tier3F3, tp.tier3F4, tp.tier3F5, tp.tier3F6, tp.tier3F7, tp.tier3F8, tp.tier3F9],
    },
  ];

  return (
    <section id="pricing" className="section-pad">
      <div className="wrap pricing-wrap">
        <span className="eyebrow">{tp.eyebrow}</span>
        <h2 className="h-section">{tp.h2_1}<em>{tp.h2_em}</em>{tp.h2_2}</h2>
        <p className="sub">{tp.sub}</p>

        <div className="billing-toggle">
          <div className="seg">
            <button className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>{tp.monthly}</button>
            <button className={yearly ? "active" : ""} onClick={() => setYearly(true)}>{tp.yearly}</button>
          </div>
          <span className="mono">{tp.saveLabel}</span>
        </div>

        <div className="pricing">
          {tiers.map((tier) => (
            <div key={tier.name} className={`price ${tier.featured ? "featured" : ""}`}>
              {tier.featured ? <span className="recommend">{tp.recommended}</span> : null}
              <span className="price-name">{tier.name}</span>
              <div className="price-num">${yearly ? tier.yearly : tier.monthly}<small> {tp.perMonth}</small></div>
              <div className="price-desc">{tier.desc}</div>
              <ul className="price-list">
                {tier.features.map((feature) => (
                  <li key={feature}><span className="price-check">✓</span><span>{feature}</span></li>
                ))}
              </ul>
              <Link className="btn" href="/signup">{tp.ctaBtn}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({ t }: { t: Translations }) {
  const [open, setOpen] = useState(0);
  const tf = t.faq;
  const items = [
    [tf.q1, tf.a1],
    [tf.q2, tf.a2],
    [tf.q3, tf.a3],
    [tf.q4, tf.a4],
  ];

  return (
    <section id="faq" className="section-pad-sm">
      <div className="wrap faq-wrap">
        <div>
          <span className="eyebrow">{tf.eyebrow}</span>
          <h2 className="h-section">{tf.h2}</h2>
        </div>
        <div className="faq-list">
          {items.map(([question, answer], i) => (
            <div key={question} className={`faq-item ${open === i ? "open" : ""}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{question}</span>
                <span className="faq-toggle">+</span>
              </button>
              {open === i ? <div className="faq-a">{answer}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ t }: { t: Translations }) {
  const tf = t.finalCta;
  return (
    <section className="section-pad-sm">
      <div className="wrap">
        <div className="cta-block">
          <div>
            <span className="eyebrow">{tf.eyebrow}</span>
            <h2 className="h-section">{tf.h2}</h2>
            <p className="sub">{tf.sub}</p>
            <div className="cta-row">
              <Link className="btn primary lg" href="/signup">{tf.ctaPrimary}</Link>
              <Link className="btn lg ghost-on-dark" href="/login">{tf.ctaLogin}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ t, locale }: { t: Translations; locale: Locale }) {
  const tf = t.footer;
  return (
    <footer className="landing-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <BrandLink href={`/${locale}`} logoSize={34} wordmarkSize={24} />
            <p>{tf.tagline}</p>
          </div>
          <div className="foot-col">
            <h5>{tf.productTitle}</h5>
            <a href="#features">{t.nav.features}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="foot-col">
            <h5>{tf.companyTitle}</h5>
            <Link href="/about">{t.nav.about}</Link>
            <a href="#">{tf.company}</a>
            <a href="#">Contact</a>
          </div>
          <div className="foot-col">
            <h5>{tf.legalTitle}</h5>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>{tf.copyright}</span>
          <span className="mono">all systems operational</span>
        </div>
      </div>
    </footer>
  );
}

const LANG_OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: "en", flag: "🇺🇸", label: "English" },
  { locale: "es", flag: "🇪🇸", label: "Español" },
  { locale: "pt", flag: "🇧🇷", label: "Português" },
];

function LangSwitcher({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const current = LANG_OPTIONS.find((o) => o.locale === locale)!;
  const others = LANG_OPTIONS.filter((o) => o.locale !== locale);

  return (
    <div className="lang-switcher" style={{ position: "relative" }}>
      <button
        className="lang-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        type="button"
      >
        <span className="lang-flag">{current.flag}</span>
        <svg className={`lang-chevron${open ? " open" : ""}`} width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="lang-backdrop" onClick={() => setOpen(false)} />
          <div className="lang-dropdown" role="listbox">
            {others.map((opt) => (
              <Link
                key={opt.locale}
                href={`/${opt.locale}`}
                className="lang-option"
                role="option"
                onClick={() => setOpen(false)}
              >
                <span className="lang-flag">{opt.flag}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LandingPage({ locale }: { locale: Locale }) {
  const t = TRANSLATIONS[locale];

  return (
    <main className="landing-page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <BrandLink href={`/${locale}`} logoSize={46} wordmarkSize={28} />
          <div className="nav-links">
            <a href="#features">{t.nav.features}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#how">{t.nav.howItWorks}</a>
            <Link href="/about">{t.nav.about}</Link>
            <Link className="btn dark sm" href="/login">{t.nav.login}</Link>
            <Link className="btn primary sm" href="/signup">{t.nav.startFree}</Link>
            <LangSwitcher locale={locale} />
          </div>
        </div>
      </nav>

      <section className="hero hero-center">
        <div className="wrap" style={{ textAlign: "center", maxWidth: 980, margin: "0 auto" }}>
          <span className="chip" style={{ marginBottom: 24 }}>
            <span className="dot" /> {t.hero.chip}
          </span>
          <h1 className="h-display hero-headline">
            <span className="hero-line">
              <span className="logo-sticker logo-x" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="32" height="32"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </span>
              {t.hero.h1_line1}
            </span>
            <span className="hero-line">
              <span className="logo-sticker logo-reddit" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="34" height="34"><path fill="currentColor" d="M12 0a12 12 0 1012 12A12 12 0 0012 0zm5.01 13.18a3.43 3.43 0 01.04.5c0 2.55-2.96 4.62-6.62 4.62s-6.62-2.07-6.62-4.62a3.43 3.43 0 01.04-.5 1.5 1.5 0 11 2 -1.39 4.79 4.79 0 014.59-2.46l.78-3.66a.27.27 0 01.32-.21l2.55.54a1 1 0 11-.1.45l-2.28-.48-.7 3.29a4.79 4.79 0 014.5 2.53 1.5 1.5 0 11 1.5 1zm-9.05-.5a1 1 0 101 1 1 1 0 00-1-1zm6.08 0a1 1 0 101 1 1 1 0 00-1-1zm-.18 2.4a.4.4 0 00-.57 0 2.5 2.5 0 01-3.56 0 .4.4 0 10-.57.57 3.31 3.31 0 004.7 0 .4.4 0 000-.57z"/></svg>
              </span>
              <span className="mark">{t.hero.h1_line2}</span>
            </span>
          </h1>
          <p className="lede" style={{ margin: "24px auto 32px", maxWidth: 640 }}>{t.hero.lede}</p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn dark lg" href="/signup">{t.hero.ctaPrimary}</Link>
            <a className="btn primary lg" href="#features">{t.hero.ctaSecondary}</a>
          </div>
          <div className="hero-meta" style={{ justifyContent: "center" }}>
            <span>{t.hero.stat1}</span>
            <span>{t.hero.stat2}</span>
          </div>
        </div>
      </section>

      <section className="logobar">
        <div className="wrap logobar-inner">
          <div className="logobar-label">{t.logobar.label}</div>
          <div className="logobar-logos">
            <span>Acme SaaS</span>
            <span>Northstar</span>
            <span>FounderOps</span>
            <span>SignalWorks</span>
          </div>
        </div>
      </section>

      <IdealCustomers t={t} />
      <WhyReddit t={t} />
      <WhyX t={t} />
      <HowItWorks t={t} />
      {/* <TwoWays t={t} /> */}
      {/* <Features t={t} /> */}
      <Comparison t={t} />
      <HonestTruth t={t} />
      <SeoAiSearch t={t} />
      <Pricing t={t} />
      <FAQ t={t} />
      <FinalCTA t={t} />
      <Footer t={t} locale={locale} />
    </main>
  );
}
