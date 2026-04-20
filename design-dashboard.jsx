/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ===== mock data =====
const THREADS = [
  {
    id: 1,
    sub: "r/startups",
    age: "2h",
    upv: 342,
    comments: 87,
    title: "We just hit $10k MRR and I'm still doing customer support at 2am — how do you scale past founder-led support?",
    snippet: "Looking for tools that actually understand SaaS conversations, not just ticket routing. Current stack is Intercom + Zendesk and it's <mark>bleeding money</mark>.",
    score: 94, band: "hot",
    author: "u/scrappy_founder",
  },
  {
    id: 2,
    sub: "r/SaaS",
    age: "5h",
    upv: 128,
    comments: 41,
    title: "Best way to monitor Reddit for mentions of our product without losing my mind?",
    snippet: "Tried F5Bot but the <mark>signal-to-noise ratio</mark> is awful. Half the mentions are unrelated. What's working for you?",
    score: 88, band: "hot",
    author: "u/dtc_dave",
  },
  {
    id: 3,
    sub: "r/marketing",
    age: "8h",
    upv: 76,
    comments: 23,
    title: "Has anyone successfully done <mark>organic Reddit growth</mark> without getting banned?",
    snippet: "Mod tools are unforgiving. I've been shadowbanned twice. Need a workflow that respects subreddit rules.",
    score: 71, band: "warm",
    author: "u/growth_chloe",
  },
  {
    id: 4,
    sub: "r/Entrepreneur",
    age: "11h",
    upv: 54,
    comments: 19,
    title: "What's your CAC for Reddit leads vs. Google?",
    snippet: "Running the numbers — Reddit converts 3x higher for us but we spend more hours finding <mark>the right threads</mark>.",
    score: 63, band: "warm",
    author: "u/numbers_nick",
  },
  {
    id: 5,
    sub: "r/smallbusiness",
    age: "1d",
    upv: 22,
    comments: 8,
    title: "Reddit ads are a scam right? Am I doing it wrong?",
    snippet: "$400 spent, zero conversions. Meanwhile a single good comment got us 12 signups.",
    score: 48, band: "cold",
    author: "u/bistro_brad",
  },
];

const LEADS = [
  { ini: "SF", name: "u/scrappy_founder", meta: "r/startups · 4.2k karma", tag: "Founder · SaaS", fit: 94 },
  { ini: "DD", name: "u/dtc_dave",        meta: "r/SaaS · 8.1k karma",    tag: "DTC · Shopify",  fit: 88 },
  { ini: "GC", name: "u/growth_chloe",    meta: "r/marketing · 2.3k",    tag: "Growth · B2B",    fit: 82 },
  { ini: "NN", name: "u/numbers_nick",    meta: "r/Entrepreneur · 11k",  tag: "Bootstrap",       fit: 76 },
  { ini: "BB", name: "u/bistro_brad",     meta: "r/smallbusiness · 890", tag: "SMB · Local",     fit: 61 },
];

const REPLIES = [
  {
    status: "sent", to: "u/scrappy_founder", sub: "r/startups", time: "12m ago",
    body: "Been there. We scaled past founder support by routing Reddit + Intercom into one inbox with intent tagging — cut response time by 60%. Happy to share the exact setup if useful.",
    upv: 12, replies: 3,
  },
  {
    status: "queued", to: "u/dtc_dave", sub: "r/SaaS", time: "sends in 8m",
    body: "F5Bot's noise problem is real — we tuned our matching on semantic intent instead of keywords and got mentions worth replying to down from ~400/wk to ~40. DM if you want the filter logic.",
    upv: 0, replies: 0,
  },
  {
    status: "draft", to: "u/growth_chloe", sub: "r/marketing", time: "needs review",
    body: "Shadowbans usually come from too much self-promo in a short window. The rule of thumb that worked for us: 9 helpful comments for every 1 that links back. Also read each sub's wiki.",
    upv: 0, replies: 0,
  },
];

// ===== tiny sparkline =====
function Spark({ points, color = "var(--accent)" }) {
  const w = 400, h = 90, pad = 6;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [pad + i * step, h - pad - ((p - min) / range) * (h - pad * 2)]);
  const d = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${d} L${coords[coords.length - 1][0]},${h} L${coords[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-g)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 0} fill={color} />
      ))}
    </svg>
  );
}

// ===== main =====
function HeroDashboard() {
  const [tab, setTab] = useState("threads");
  const [selected, setSelected] = useState(1);
  const [query, setQuery] = useState("SaaS support tools, founder-led support, Intercom alternatives");
  const [reply, setReply] = useState(
    "Hey — we ran into exactly this at ~$8k MRR. What actually worked was routing Reddit DMs and product-adjacent subs into one queue with intent tagging. Happy to share the setup if it helps."
  );
  const [replyTouched, setReplyTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [chartPoints, setChartPoints] = useState([12, 18, 14, 22, 19, 28, 24, 34, 31, 42, 38, 51, 47, 58]);

  // animate the chart subtly
  useEffect(() => {
    const t = setInterval(() => {
      setChartPoints((p) => {
        const next = [...p.slice(1), Math.max(20, p[p.length - 1] + (Math.random() - 0.4) * 8)];
        return next;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const thread = THREADS.find((t) => t.id === selected) || THREADS[0];

  const replyError = useMemo(() => {
    if (!replyTouched) return "";
    if (reply.trim().length < 40) return "Reply is too short — add specifics.";
    if (/\b(buy|sign ?up|check out my|link in bio)\b/i.test(reply)) return "Sounds promotional — subreddits will flag this.";
    return "";
  }, [reply, replyTouched]);

  const send = () => {
    setReplyTouched(true);
    if (reply.trim().length < 40) return;
    if (/\b(buy|sign ?up|check out my|link in bio)\b/i.test(reply)) return;
    setSent(true);
    setTimeout(() => setSent(false), 2600);
  };

  const counts = { threads: THREADS.length, leads: LEADS.length, replies: REPLIES.length };

  return (
    <div className="dash">
      <div className="dash-sticker a">live demo ↓</div>
      <div className="dash-sticker b">try it</div>

      <div className="dash-frame">
        <div className="dash-top">
          <div className="dots"><i/><i/><i/></div>
          <div className="dash-title">prowl.redprowl.app / workspace — acme inc.</div>
        </div>

        <div className="dash-tabs">
          {[
            { id: "threads", label: "Threads" },
            { id: "leads", label: "Leads" },
            { id: "replies", label: "Replies" },
          ].map((t) => (
            <button key={t.id} className={`dash-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}<span className="count">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div className="dash-body">
          {tab === "threads" && (
            <>
              <div className="query-row">
                <span className="lbl">TRACKING</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="keywords, intent, subreddits…" />
                <span className="chip"><span className="dot"/>live</span>
              </div>

              <div className="chart-wrap">
                <div className="chart">
                  <div className="chart-head">
                    <div>
                      <div className="ttl">High-intent threads / day</div>
                      <div className="val">
                        {Math.round(chartPoints[chartPoints.length - 1])}
                        <span className="delta"> ↑ 24%</span>
                      </div>
                    </div>
                    <div className="mini-meta">last 14 days</div>
                  </div>
                  <Spark points={chartPoints} />
                </div>
                <div className="stat-col">
                  <div className="stat">
                    <div className="lbl">Match score</div>
                    <div className="n">{thread.score}<span style={{fontSize:14,color:'var(--ink-3)'}}>/100</span></div>
                    <div className="sub">for selected thread</div>
                  </div>
                  <div className="stat">
                    <div className="lbl">Est. reach</div>
                    <div className="n">{(thread.upv * 11).toLocaleString()}</div>
                    <div className="sub">readers, 48h</div>
                  </div>
                </div>
              </div>

              <div style={{display:'grid', gap: 10}}>
                {THREADS.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className={`thread ${selected === t.id ? "selected" : ""}`}
                    onClick={() => setSelected(t.id)}
                  >
                    <div className="upv">
                      <span className="arr">▲</span>
                      <span className="n">{t.upv}</span>
                      <span className="lbl">upv</span>
                    </div>
                    <div className="thread-main">
                      <div className="sub">
                        <b>{t.sub}</b> · {t.author} · {t.age} · {t.comments} comments
                      </div>
                      <div className="title">{t.title}</div>
                      <div className="snippet" dangerouslySetInnerHTML={{ __html: t.snippet }} />
                    </div>
                    <div className="thread-score">
                      <div className={`score-pill ${t.band}`}>{t.score}</div>
                      <div className="mini-meta">{t.band === 'hot' ? 'reply now' : t.band === 'warm' ? 'worth watching' : 'low fit'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="composer">
                <div className="composer-head">
                  <div className="ttl">AI reply draft · {thread.sub}</div>
                  <div className="meta">tone: helpful · length: 58 words</div>
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => { setReply(e.target.value); setReplyTouched(true); }}
                  className={replyError ? "invalid" : ""}
                  placeholder="Write a reply…"
                />
                <div className="composer-foot">
                  <div className="lefty">
                    <span className="chip">↻ regenerate</span>
                    <span className="chip">tone: casual</span>
                    {replyError && <span className="err-msg">{replyError}</span>}
                    <span className={`ok-msg ${sent ? 'show' : ''}`}>✓ queued for review in r/startups</span>
                  </div>
                  <button className="btn primary sm" onClick={send}>Send reply →</button>
                </div>
              </div>
            </>
          )}

          {tab === "leads" && (
            <>
              <div className="query-row">
                <span className="lbl">FILTER</span>
                <input defaultValue="karma > 500 · active this week · matches ICP" />
                <span className="chip"><span className="dot"/>{LEADS.length} leads</span>
              </div>
              <div className="leads-table">
                {LEADS.map((l) => (
                  <div className="lead-row" key={l.name}>
                    <div className="avatar">{l.ini}</div>
                    <div>
                      <div className="lead-name">{l.name}</div>
                      <div className="lead-sub">{l.meta}</div>
                    </div>
                    <span className="chip">{l.tag}</span>
                    <div className="score-pill hot" style={l.fit < 70 ? {background:'var(--butter)', color:'oklch(0.4 0.1 80)', borderColor:'oklch(0.8 0.1 85)'} : {}}>{l.fit}</div>
                    <button className="btn sm">Draft DM</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "replies" && (
            <div style={{display:'grid', gap: 10}}>
              {REPLIES.map((r, i) => (
                <div className="reply-card" key={i}>
                  <div className="hd">
                    <span>Reply to <b style={{color:'var(--ink)'}}>{r.to}</b> in <b style={{color:'var(--ink)'}}>{r.sub}</b></span>
                    <span className={`reply-status ${r.status}`}>{r.status}</span>
                  </div>
                  <div className="body">{r.body}</div>
                  <div className="foot">
                    <span>{r.time}</span>
                    {r.status === 'sent' && <><span>·</span><span>▲ <b>{r.upv}</b> upvotes</span><span>·</span><span><b>{r.replies}</b> replies</span></>}
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

window.HeroDashboard = HeroDashboard;
