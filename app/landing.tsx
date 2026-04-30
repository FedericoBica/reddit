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
    <div className="dash" aria-label="RedProwl product preview">
      <div className="dash-sticker a">live demo</div>
      <div className="dash-sticker b">try it</div>

      <div className="dash-frame">
        <div className="dash-top">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="dash-title">prowl.redprowl.app / workspace - acme inc.</div>
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

function HighlightTitle({
  before,
  highlight,
  after = "",
}: {
  before: string;
  highlight: string;
  after?: string;
}) {
  return (
    <>
      {before}
      <mark>{highlight}</mark>
      {after}
    </>
  );
}

function IdealCustomers({ t }: { t: Translations }) {
  const [tab, setTab] = useState<CustomerTab>("saas");
  const data: Record<
    CustomerTab,
    { sub: string; before: string; highlight: string; after?: string; score: number }[]
  > = {
    saas: [
      { sub: "r/startups", before: "Best ", highlight: "project management tool", after: " for a remote team of 12?", score: 96 },
      { sub: "r/SaaS", before: "Anyone replaced Intercom with something ", highlight: "cheaper", after: " that still works?", score: 91 },
      { sub: "r/webdev", before: "Recommendations for ", highlight: "error tracking", after: " that does not cost a kidney", score: 84 },
    ],
    consumer: [
      { sub: "r/apps", before: "Looking for a ", highlight: "habit tracker", after: " that is not subscription-only", score: 93 },
      { sub: "r/productivity", before: "Best ", highlight: "pomodoro timer", after: " for ADHD brains?", score: 88 },
      { sub: "r/selfhosted", before: "Alternative to Notion for ", highlight: "personal wiki", after: "?", score: 79 },
    ],
    ecom: [
      { sub: "r/SkincareAddiction", before: "Looking for a good ", highlight: "vitamin C serum", after: " under $30", score: 96 },
      { sub: "r/BuyItForLife", before: "What is the best ", highlight: "sustainable water bottle", after: "?", score: 92 },
      { sub: "r/Fitness", before: "Protein powder ", highlight: "without all the artificial junk", after: "?", score: 88 },
    ],
    agency: [
      { sub: "r/marketing", before: "Freelance ", highlight: "SEO consultant", after: " recommendations for e-com?", score: 94 },
      { sub: "r/Entrepreneur", before: "Looking to hire a ", highlight: "growth agency", after: ". Who do you trust?", score: 89 },
      { sub: "r/smallbusiness", before: "Best agencies for ", highlight: "Meta ads", after: " under $5k/mo budget?", score: 81 },
    ],
    local: [
      { sub: "r/AskNYC", before: "Trustworthy ", highlight: "accountant", after: " for a small LLC in Brooklyn?", score: 87 },
      { sub: "r/Austin", before: "Reliable ", highlight: "HVAC company", after: " that will not rip me off?", score: 84 },
      { sub: "r/SFBay", before: "Looking for a good ", highlight: "dog groomer", after: " in the Mission", score: 78 },
    ],
  };

  const tc = t.idealCustomers;
  const tabs: { id: CustomerTab; label: string }[] = [
    { id: "saas", label: tc.tabSaas },
    { id: "consumer", label: tc.tabConsumer },
    { id: "ecom", label: tc.tabEcom },
    { id: "agency", label: tc.tabAgency },
    { id: "local", label: tc.tabLocal },
  ];

  return (
    <section className="section-pad">
      <div className="wrap centered">
        <h2 className="h-section">
          {tc.h2_1}<em>{tc.h2_em}</em>{tc.h2_2}
        </h2>
        <p className="sub">{tc.sub}</p>

        <div className="customer-panel">
          <div className="customer-tabs">
            {tabs.map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="customer-grid">
            {data[tab].map((thread) => (
              <div key={`${thread.sub}-${thread.score}`} className="customer-card">
                <div className="customer-sub"><span />{thread.sub}</div>
                <div className="customer-title">
                  <HighlightTitle before={thread.before} highlight={thread.highlight} after={thread.after} />
                </div>
                <div className="customer-score">
                  <span>{tc.relevanceLabel}</span>
                  <b>{thread.score}/100</b>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="closing-line">
          <b>RedProwl</b>{tc.closingLine}<em>{tc.closingLineAuto}</em>
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
            <h3>{tc.prowlTitle} <span>RedProwl</span></h3>
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

function HowItWorks({ t }: { t: Translations }) {
  const th = t.howItWorks;
  const steps = [
    { n: th.step1n, t: th.step1t, d: th.step1d },
    { n: th.step2n, t: th.step2t, d: th.step2d },
    { n: th.step3n, t: th.step3t, d: th.step3d },
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
      inbound: [tp.tier1In1, tp.tier1In2, tp.tier1In3, tp.tier1In4, tp.tier1In5],
      outbound: [tp.tier1Out1],
    },
    {
      name: tp.tier2Name,
      monthly: 39,
      yearly: 31,
      desc: tp.tier2Desc,
      featured: true,
      inbound: [tp.tier2In1, tp.tier2In2, tp.tier2In3, tp.tier2In4, tp.tier2In5],
      outbound: [tp.tier2Out1],
    },
    {
      name: tp.tier3Name,
      monthly: 79,
      yearly: 63,
      desc: tp.tier3Desc,
      inbound: [tp.tier3In1, tp.tier3In2, tp.tier3In3, tp.tier3In4, tp.tier3In5],
      outbound: [tp.tier3Out1, tp.tier3Out2],
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
              <div className="price-section">{tp.inboundLabel}</div>
              <ul className="price-list">
                {tier.inbound.map((feature) => (
                  <li key={feature}><span className="price-check">✓</span><span>{feature}</span></li>
                ))}
              </ul>
              <div className="price-section">{tp.outboundLabel}</div>
              <ul className="price-list">
                {tier.outbound.map((feature) => (
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
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
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

function LangSwitcher({ locale }: { locale: Locale }) {
  return (
    <div className="lang-switcher" aria-label="Language switcher">
      <Link
        href="/en"
        className={`lang-btn${locale === "en" ? " active" : ""}`}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </Link>
      <Link
        href="/es"
        className={`lang-btn${locale === "es" ? " active" : ""}`}
        aria-current={locale === "es" ? "true" : undefined}
      >
        ES
      </Link>
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
            <Link href="/login">{t.nav.login}</Link>
            <LangSwitcher locale={locale} />
            <Link className="btn primary sm" href="/signup">{t.nav.startFree}</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 className="h-display">
              {t.hero.h1_1}<em>{t.hero.h1_em}</em>{t.hero.h1_2}
            </h1>
            <p className="lede">{t.hero.lede}</p>
            <div className="cta-row">
              <Link className="btn primary lg" href="/signup">{t.hero.ctaPrimary}</Link>
              <a className="btn lg" href="#features">{t.hero.ctaSecondary}</a>
            </div>
            <div className="hero-meta">
              <span><b>12k+</b> {t.hero.stat1}</span>
              <span><b>24%</b> {t.hero.stat2}</span>
              <span><b>{t.hero.stat3}</b></span>
            </div>
          </div>
          <HeroDashboard td={t.dashboard} />
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
      <HowItWorks t={t} />
      <TwoWays t={t} />
      <Features t={t} />
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
