"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLink } from "@/app/components/logo";

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

function HeroDashboard() {
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
    if (reply.trim().length < 40) return "Reply is too short. Add specifics.";
    if (/\b(buy|sign ?up|check out my|link in bio)\b/i.test(reply)) {
      return "Sounds promotional. Subreddits will flag this.";
    }
    return "";
  }, [reply, replyTouched]);

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
            ["threads", "Threads", THREADS.length],
            ["leads", "Leads", LEADS.length],
            ["replies", "Replies", REPLIES.length],
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
                <span className="lbl">Tracking</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} />
                <span className="chip">
                  <span className="dot" />
                  live
                </span>
              </div>

              <div className="chart-wrap">
                <div className="chart">
                  <div className="chart-head">
                    <div>
                      <div className="ttl">High-intent threads / day</div>
                      <div className="val">
                        {Math.round(chartPoints[chartPoints.length - 1])}
                        <span className="delta"> +24%</span>
                      </div>
                    </div>
                    <div className="mini-meta">last 14 days</div>
                  </div>
                  <Spark points={chartPoints} />
                </div>
                <div className="stat-col">
                  <div className="stat">
                    <div className="lbl">Match score</div>
                    <div className="n">
                      {thread.score}
                      <span>/100</span>
                    </div>
                    <div className="subtext">for selected thread</div>
                  </div>
                  <div className="stat">
                    <div className="lbl">Est. reach</div>
                    <div className="n">{(thread.upv * 11).toLocaleString()}</div>
                    <div className="subtext">readers, 48h</div>
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
                      <div className="mini-meta">{item.band === "hot" ? "reply now" : "worth watching"}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="composer">
                <div className="composer-head">
                  <div className="ttl">AI reply draft - {thread.sub}</div>
                  <div className="meta">tone: helpful - length: 58 words</div>
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
                    <span className="chip">regenerate</span>
                    <span className="chip">tone: casual</span>
                    {replyError ? <span className="err-msg">{replyError}</span> : null}
                    <span className={`ok-msg ${sent ? "show" : ""}`}>queued for review in r/startups</span>
                  </div>
                  <button className="btn primary sm" onClick={sendReply}>
                    Send reply
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === "leads" && (
            <>
              <div className="query-row">
                <span className="lbl">Filter</span>
                <input defaultValue="karma > 500 - active this week - matches ICP" />
                <span className="chip">
                  <span className="dot" />
                  {LEADS.length} leads
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
                    <button className="btn sm">Draft DM</button>
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
                      Reply to <b>{item.to}</b> in <b>{item.sub}</b>
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

function IdealCustomers() {
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
  const tabs: { id: CustomerTab; label: string }[] = [
    { id: "saas", label: "SaaS" },
    { id: "consumer", label: "Consumer Apps" },
    { id: "ecom", label: "E-Commerce" },
    { id: "agency", label: "Agency" },
    { id: "local", label: "Local Biz" },
  ];

  return (
    <section className="section-pad">
      <div className="wrap centered">
        <h2 className="h-section">
          Thousands of <em>potential customers</em> are asking for help on Reddit every day.
        </h2>
        <p className="sub">One helpful reply can do more than you think.</p>

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
                  <span>Relevance</span>
                  <b>{thread.score}/100</b>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="closing-line">
          <b>RedProwl</b> finds them for you. <em>Automatically.</em>
        </p>
      </div>
    </section>
  );
}

function TwoWays() {
  const cards = [
    {
      tag: "Inbound",
      title: "Public Reddit posts",
      desc: "Engage in Reddit threads and mention your product to build brand authority and drive organic traffic.",
      feats: ["AI finds relevant discussions to join", "Get high-quality AI-assisted replies", "Creates SEO and AI search visibility"],
      cta: "Learn More About RedProwl Inbound",
      tone: "inbound",
    },
    {
      tag: "Outbound",
      title: "Private Reddit DMs",
      desc: "Automatically send targeted messages to dozens of Reddit users at once and close deals.",
      feats: ["Bulk-send DMs without detection", "Track responses via integrated CRM", "Find leads via targeting specific threads or subreddits"],
      cta: "Learn More About RedProwl Outbound",
      tone: "outbound",
    },
  ];

  return (
    <section className="section-pad banded">
      <div className="wrap centered">
        <span className="eyebrow">From threads to DMs</span>
        <h2 className="h-section"><em>Two ways</em> to win Reddit.</h2>
        <p className="sub">
          Public replies build authority and rank on Google plus AI search. Private DMs convert that authority into booked calls.
        </p>

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

function Comparison() {
  const manual = [
    "Do keyword research manually (1-2 hours)",
    "Skim hundreds of Google search results (2-3 hours)",
    "Find high-ranking Reddit posts manually (1-2 hours)",
    "Pay for expensive SEO tools ($120+/month minimum)",
    "Read through hundreds of irrelevant posts (2-3 hours)",
    "Write authentic replies manually (1-2 hours)",
    "Miss time-sensitive opportunities (daily)",
    "Can't track posts you already replied to (ongoing confusion)",
  ];
  const prowl = [
    ["Create your project in 2 minutes", "Simply add your website & competitors. Redreach AI automatically finds the most relevant keywords for your business and niche."],
    ["Get high-ranking Reddit opportunities", "AI tracks search engine indexed Reddit posts and brand mentions inside Reddit comments to surface highly-ranking Reddit posts to engage with. You'll be alerted for new time-sensitive opportunities."],
    ["Invest just 20 minutes a day", "Review curated opportunities and engage authentically. Highly effective marketing with minimal time investment."],
  ];

  return (
    <section className="section-pad">
      <div className="wrap centered">
        <span className="eyebrow">Why RedProwl</span>
        <h2 className="h-section">
          Finding customers feels too hard?<br />
          <em>RedProwl is the better way.</em>
        </h2>
        <p className="sub">Stop wasting hours searching customers on Reddit manually and start finding high-intent conversations that actually convert. RedProwl is your Reddit Marketing OS.</p>

        <div className="comparison-grid">
          <div className="comparison-card manual">
            <h3>Finding customers manually</h3>
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
              2-3 hours daily plus expensive tooling
            </div>
          </div>
          <div className="comparison-card prowl">
            <h3>With <span>RedProwl</span></h3>
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
              Effective growth marketing in 20 min/day
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HonestTruth() {
  const risks = [
    "Reddit detects bots via IPs, fingerprints, and behavior",
    "Comments get shadow-removed before you notice",
    "Accounts you do not own get banned and take your marketing with them",
    "Retroactive purges can wipe months of paid comments overnight",
  ];
  const workflow = [
    "RedProwl AI finds the right conversations for your product",
    "Relevance filtering shows you only high-intent threads",
    "RedProwl AI suggests authentic, context-aware replies",
    "You post from your account. Comments stick.",
  ];

  return (
    <section className="section-pad banded">
      <div className="wrap truth-wrap">
        <div className="centered">
          <span className="eyebrow">The honest truth about Reddit automation</span>
          <h2 className="h-section">Why can&apos;t I just <em>fully automate</em> it?</h2>
          <p className="sub">We get asked this a lot. Here is what nobody else will tell you.</p>
        </div>

        <div className="truth-card">
          <p><b>We understand you.</b> You want to fully automate and save time. Autopilot sounds great in theory.</p>
          <p><b>Here is what actually happens:</b> Reddit&apos;s anti-spam systems keep getting better at finding automated posting patterns.</p>

          <div className="risk-box">
            <div>Why fully automated posting breaks</div>
            <div>
              {risks.map((risk) => (
                <span key={risk}>× {risk}</span>
              ))}
            </div>
          </div>

          <div className="truth-split">
            <div className="mono">So what actually works?</div>
            <h3>Automate the 90%. <em>You do the 10% that matters.</em></h3>
            <p>
              RedProwl handles everything up to the last mile: finding conversations, scoring intent, and drafting replies. You handle the final step from your real account.
            </p>
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

function SeoAiSearch() {
  return (
    <section className="section-pad">
      <div className="wrap seo-grid">
        <div className="search-preview">
          <div className="search-preview-top">
            <span className="chip">Google Search</span>
            <span className="chip success">DA 91/100 boost</span>
          </div>
          <div className="search-result">
            <div className="mono">best email marketing software for startups</div>
            <b>reddit.com / r/marketing</b>
            <strong>Best email marketing tool for startups in 2026?</strong>
            <p>I have tried MailChimp but it is too expensive. What do you recommend for...</p>
            <blockquote><b>Your Comment:</b> We switched to YourProduct last month and it has been great.</blockquote>
          </div>
          <div className="search-result ai">
            <div className="mono">AI Search / ChatGPT</div>
            <p>Based on recent Reddit discussions, many users recommend <b>YourProduct</b> as a cost-effective alternative.</p>
            <small>SOURCES: reddit.com</small>
          </div>
        </div>
        <div>
          <span className="chip">🎯 AI SEO & Parasite SEO</span>
          <h2 className="h-section">Rank on Google & Influence AI Search <em>with Reddit</em>.</h2>
          <p className="sub">
            Stop fighting for backlinks. Piggyback on Reddit&apos;s Domain Authority to rank #1 on Google and become the cited source for ChatGPT and Perplexity.
          </p>
          <ul className="seo-list">
            <li><span>✓</span>Find Reddit threads already ranking on Google&apos;s first page</li>
            <li><span>✓</span>Influence AI models where Reddit is cited as source material</li>
            <li><span>✓</span>Get high-intent traffic without ads or a single blog post</li>
          </ul>
          <Link className="btn primary lg" href="/signup">Get customers from Reddit</Link>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="section-pad">
      <div className="wrap">
        <div className="section-heading">
          <span className="eyebrow">What it does</span>
          <h2 className="h-section">Four things, done embarrassingly well.</h2>
          <p className="sub">
            No kitchen sink. Find the thread, write the reply, keep the account alive, measure what returned.
          </p>
        </div>

        <div className="features-grid">
          <div className="feat big">
            <div className="icon">S</div>
            <h3>Signal, not scraping.</h3>
            <p>Every new thread across Reddit scored for intent, fit, and timing.</p>
            <div className="vis"><FeatSignal /></div>
          </div>
          <div className="feat sm">
            <div className="icon">R</div>
            <h3>Replies that do not read like a bot wrote them.</h3>
            <p>Trained on your voice and top-voted comments in each sub.</p>
            <div className="vis"><FeatCompose /></div>
          </div>
          <div className="feat sm">
            <div className="icon">I</div>
            <h3>Shared inbox for your team.</h3>
            <p>Assign, review, approve. Nobody double-replies. Nobody misses a lead.</p>
            <div className="vis"><FeatInbox /></div>
          </div>
          <div className="feat big">
            <div className="icon">G</div>
            <h3>Built-in guardrails so you do not get banned.</h3>
            <p>We read subreddit rules, enforce cadence, and flag language moderators remove.</p>
            <div className="vis"><FeatGuard /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Add your website",
      d: "We analyze your website and identify highly relevant keywords and topics.",
    },
    {
      n: "02",
      t: "Add your top 3 competitors",
      d: "Your top 3 competitors will help us drill even deeper and identify hidden opportunities to sneak into your competitors' audience.",
    },
    {
      n: "03",
      t: "Get highly relevant posts",
      d: "Get a list of the most relevant Reddit posts where you can comment your business. The posts are actually being read by your target audience and not just random guesses.",
    },
  ];

  return (
    <section id="how" className="section-pad banded">
      <div className="wrap">
        <div className="section-heading">
          <span className="eyebrow">How it works</span>
          <h2 className="h-section">
            Get more <em>customers</em> in 3 simple steps.
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

function Pricing() {
  const [yearly, setYearly] = useState(false);
  const tiers = [
    {
      name: "Startup",
      monthly: 19,
      yearly: 15,
      desc: "Start generating leads and revenue from Reddit.",
      inbound: ["3 tracked competitors", "20 tracked keywords", "100 AI-guided replies", "Weekly lead opportunities", "Analytics dashboard"],
      outbound: ["30 daily auto DMs"],
    },
    {
      name: "Growth",
      monthly: 39,
      yearly: 31,
      desc: "Convert more Reddit leads with daily insights and expanded tracking.",
      featured: true,
      inbound: ["6 tracked competitors", "40 tracked keywords", "300 AI-guided replies", "Daily lead opportunities", "Monthly SEO opportunities"],
      outbound: ["100 daily auto DMs"],
    },
    {
      name: "Professional",
      monthly: 79,
      yearly: 63,
      desc: "Maximize revenue potential across multiple brands.",
      inbound: ["8 tracked competitors", "60 tracked keywords", "500 AI-guided replies", "Daily competitor tracking", "Analytics dashboard"],
      outbound: ["500 daily auto DMs", "CRM for private DM outreach"],
    },
  ];

  return (
    <section id="pricing" className="section-pad">
      <div className="wrap pricing-wrap">
        <span className="eyebrow">Pricing</span>
        <h2 className="h-section">Pricing that <em>pays for itself</em>.</h2>
        <p className="sub">
          RedProwl surfaces hidden Reddit opportunities and drives organic growth for a fraction of paid ads.
        </p>

        <div className="billing-toggle">
          <div className="seg">
            <button className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>Monthly</button>
            <button className={yearly ? "active" : ""} onClick={() => setYearly(true)}>Yearly</button>
          </div>
          <span className="mono">Save 20% with yearly billing</span>
        </div>

        <div className="pricing">
          {tiers.map((tier) => (
            <div key={tier.name} className={`price ${tier.featured ? "featured" : ""}`}>
              {tier.featured ? <span className="recommend">Recommended</span> : null}
              <span className="price-name">{tier.name}</span>
              <div className="price-num">${yearly ? tier.yearly : tier.monthly}<small> /month</small></div>
              <div className="price-desc">{tier.desc}</div>
              <div className="price-section">Inbound</div>
              <ul className="price-list">
                {tier.inbound.map((feature) => (
                  <li key={feature}><span className="price-check">✓</span><span>{feature}</span></li>
                ))}
              </ul>
              <div className="price-section">Outbound</div>
              <ul className="price-list">
                {tier.outbound.map((feature) => (
                  <li key={feature}><span className="price-check">✓</span><span>{feature}</span></li>
                ))}
              </ul>
              <Link className="btn" href="/signup">Get customers from Reddit</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    ["Is this going to get my account banned?", "The opposite is the goal. Guardrails enforce subreddit rules, cadence, and self-promo ratios."],
    ["How is this different from F5Bot or Brand24?", "Those tools alert you when a keyword appears. RedProwl scores intent, drafts replies, and gives your team a shared workflow."],
    ["Do you use my data to train models?", "No. Replies, threads, and ICPs stay in your workspace unless you explicitly opt in."],
    ["Can I use this for cold DMs?", "Yes, but public replies consistently convert better and keep your account healthier."],
  ];

  return (
    <section id="faq" className="section-pad-sm">
      <div className="wrap faq-wrap">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 className="h-section">Questions we get a lot.</h2>
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

function FinalCTA() {
  return (
    <section className="section-pad-sm">
      <div className="wrap">
        <div className="cta-block">
          <div>
            <span className="eyebrow">Ready?</span>
            <h2 className="h-section">Your next 10 customers are already posting about you.</h2>
            <p className="sub">Start the 7-day trial. No card. Cancel in two clicks.</p>
            <div className="cta-row">
              <Link className="btn primary lg" href="/signup">Start free trial</Link>
              <Link className="btn lg ghost-on-dark" href="/login">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <BrandLink href="/" logoSize={34} wordmarkSize={24} />
            <p>Reddit lead-gen for founders who would rather ship than lurk.</p>
          </div>
          <div className="foot-col">
            <h5>Product</h5>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="foot-col">
            <h5>Company</h5>
            <Link href="/about">About</Link>
            <a href="#">Customers</a>
            <a href="#">Contact</a>
          </div>
          <div className="foot-col">
            <h5>Legal</h5>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 RedProwl, Inc. Not affiliated with Reddit, Inc.</span>
          <span className="mono">all systems operational</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="nav">
        <div className="wrap nav-inner">
          <BrandLink href="/" logoSize={46} wordmarkSize={28} />
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how">How it works</a>
            <Link href="/about">About</Link>
            <Link href="/login">Log in</Link>
            <Link className="btn primary sm" href="/signup">Start free</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Reddit lead generation</span>
            <h1 className="h-display">
              Find buyers on Reddit <em>before</em> they pick a vendor.
            </h1>
            <p className="lede">
              RedProwl watches high-intent conversations, scores fit, drafts human replies, and keeps your team inside Reddit&apos;s rules.
            </p>
            <div className="cta-row">
              <Link className="btn primary lg" href="/signup">Start free trial</Link>
              <a className="btn lg" href="#features">See how it works</a>
            </div>
            <div className="hero-meta">
              <span><b>12k+</b> subreddits monitored</span>
              <span><b>24%</b> more qualified threads</span>
              <span><b>No card</b> required</span>
            </div>
          </div>
          <HeroDashboard />
        </div>
      </section>

      <section className="logobar">
        <div className="wrap logobar-inner">
          <div className="logobar-label">Built for teams growing from Reddit</div>
          <div className="logobar-logos">
            <span>Acme SaaS</span>
            <span>Northstar</span>
            <span>FounderOps</span>
            <span>SignalWorks</span>
          </div>
        </div>
      </section>

      <IdealCustomers />
      <HowItWorks />
      <TwoWays />
      <Features />
      <Comparison />
      <HonestTruth />
      <SeoAiSearch />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
