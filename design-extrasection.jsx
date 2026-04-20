/* global React */
const { useState } = React;

// ===== Industry tabs / buying-signal section =====
function IdealCustomers() {
  const [tab, setTab] = useState('saas');
  const data = {
    saas: [
      { sub: 'r/startups', title: 'Best <mark>project management tool</mark> for a remote team of 12?', score: 96 },
      { sub: 'r/SaaS', title: 'Anyone replaced Intercom with something <mark>cheaper</mark> that still works?', score: 91 },
      { sub: 'r/webdev', title: 'Recommendations for <mark>error tracking</mark> that doesn\'t cost a kidney', score: 84 },
    ],
    consumer: [
      { sub: 'r/apps', title: 'Looking for a <mark>habit tracker</mark> that isn\'t subscription-only', score: 93 },
      { sub: 'r/productivity', title: 'Best <mark>pomodoro timer</mark> for ADHD brains?', score: 88 },
      { sub: 'r/selfhosted', title: 'Alternative to Notion for <mark>personal wiki</mark>?', score: 79 },
    ],
    ecom: [
      { sub: 'r/SkincareAddiction', title: 'Looking for a good <mark>vitamin C serum</mark> under $30', score: 96 },
      { sub: 'r/BuyItForLife', title: 'What\'s the best <mark>sustainable water bottle</mark>?', score: 92 },
      { sub: 'r/Fitness', title: 'Protein powder <mark>without all the artificial junk</mark>?', score: 88 },
    ],
    agency: [
      { sub: 'r/marketing', title: 'Freelance <mark>SEO consultant</mark> recommendations for e-com?', score: 94 },
      { sub: 'r/Entrepreneur', title: 'Looking to hire a <mark>growth agency</mark> — who do you trust?', score: 89 },
      { sub: 'r/smallbusiness', title: 'Best agencies for <mark>Meta ads</mark> under $5k/mo budget?', score: 81 },
    ],
    local: [
      { sub: 'r/AskNYC', title: 'Trustworthy <mark>accountant</mark> for a small LLC in Brooklyn?', score: 87 },
      { sub: 'r/Austin', title: 'Reliable <mark>HVAC company</mark> that won\'t rip me off?', score: 84 },
      { sub: 'r/SFBay', title: 'Looking for a good <mark>dog groomer</mark> in the Mission', score: 78 },
    ],
  };
  const tabs = [
    ['saas', 'SaaS', '◈'],
    ['consumer', 'Consumer Apps', '◉'],
    ['ecom', 'E-Commerce', '▦'],
    ['agency', 'Agency', '⟢'],
    ['local', 'Local Biz', '⌂'],
  ];
  return (
    <section className="section-pad">
      <div className="wrap" style={{textAlign:'center'}}>
        <h2 className="h-section" style={{marginBottom:16, maxWidth:900, marginLeft:'auto', marginRight:'auto'}}>
          Thousands of <em style={{fontStyle:'italic', color:'var(--accent-ink)'}}>ideal customers</em> are asking for help on Reddit every day.
        </h2>
        <p className="sub" style={{margin:'0 auto 40px'}}>Every question is a buying signal. Every thread is an opportunity.</p>

        <div style={{
          background:'var(--paper)', border:'1.5px solid var(--ink)', borderRadius:'var(--radius-lg)',
          boxShadow:'var(--shadow-sticker)', padding:20, maxWidth: 900, margin: '0 auto', textAlign:'left'
        }}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:16, justifyContent:'center'}}>
            {tabs.map(([id, label, icon]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding:'10px 14px', borderRadius:999,
                border: tab===id ? '1.5px solid var(--ink)' : '1px solid var(--line)',
                background: tab===id ? 'var(--accent-soft)' : 'var(--bg-2)',
                color: tab===id ? 'var(--accent-ink)' : 'var(--ink-2)',
                fontSize:13, fontWeight: tab===id ? 600 : 500,
                display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer'
              }}>
                <span style={{fontSize:14}}>{icon}</span>{label}
              </button>
            ))}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
            {data[tab].map((t, i) => (
              <div key={i} style={{
                border:'1px solid var(--line)', borderRadius:12, padding:14, background:'var(--bg)'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8, fontFamily:'Geist Mono, monospace', fontSize:11, color:'var(--ink-3)'}}>
                  <span style={{width:14, height:14, borderRadius:'50%', background:'var(--accent)', display:'inline-block'}}></span>
                  {t.sub}
                </div>
                <div style={{fontSize:14, fontWeight:500, lineHeight:1.4, color:'var(--ink)', marginBottom:10}} dangerouslySetInnerHTML={{__html: t.title}} />
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'Geist Mono, monospace', fontSize:11, color:'var(--ink-3)'}}>
                  <span>Relevance</span>
                  <span style={{color:'var(--accent-ink)', fontWeight:700}}>{t.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{marginTop:40, fontFamily:'Instrument Serif, serif', fontSize:28, color:'var(--ink-2)'}}>
          <b style={{color:'var(--ink)'}}>RedProwl</b> finds them for you. <em style={{color:'var(--accent-ink)'}}>Automatically.</em>
        </p>
      </div>
    </section>
  );
}

// ===== Two Ways to Win =====
function TwoWays() {
  return (
    <section className="section-pad" style={{background:'var(--bg-2)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
      <div className="wrap" style={{textAlign:'center'}}>
        <span className="eyebrow" style={{margin:'0 auto'}}>From threads to DMs</span>
        <h2 className="h-section" style={{marginTop:16, maxWidth:800, marginLeft:'auto', marginRight:'auto'}}>
          <em style={{fontStyle:'italic', color:'var(--accent-ink)'}}>Two ways</em> to win Reddit.
        </h2>
        <p className="sub" style={{margin:'0 auto 48px'}}>
          Public replies build authority and rank on Google + AI search. Private DMs convert that authority into booked calls. RedProwl handles both.
        </p>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:24, maxWidth:1000, margin:'0 auto', textAlign:'left'}}>
          {[
            {
              tag: 'Inbound', color: 'var(--accent)', colorInk:'var(--accent-ink)', colorSoft:'var(--accent-soft)',
              title: 'Public Reddit posts',
              desc: 'Engage in Reddit threads and mention your product to build brand authority and drive organic traffic.',
              feats: ['AI finds relevant discussions to join', 'Get high-quality AI-assisted replies', 'Creates SEO + AI search visibility'],
              cta: 'Learn about Inbound',
            },
            {
              tag: 'Outbound', color: 'oklch(0.58 0.18 295)', colorInk:'oklch(0.38 0.17 295)', colorSoft:'oklch(0.95 0.04 295)',
              title: 'Private Reddit DMs',
              desc: 'Automatically send targeted messages to dozens of Reddit users at once and close deals.',
              feats: ['Bulk-send DMs without detection flags', 'Track responses via integrated CRM', 'Target by subreddit, karma, and activity'],
              cta: 'Learn about Outbound',
            },
          ].map((c, i) => (
            <div key={i} className="card" style={{padding:28, background:'var(--paper)'}}>
              <span className="chip" style={{background:c.colorSoft, borderColor:'transparent', color:c.colorInk, fontWeight:600, marginBottom:16}}>
                <span className="dot" style={{background:c.color}}/>{c.tag}
              </span>
              <h3 style={{fontFamily:'Instrument Serif, serif', fontSize:34, margin:'8px 0 10px', letterSpacing:'-0.01em'}}>{c.title}</h3>
              <p style={{color:'var(--ink-2)', lineHeight:1.55, margin:'0 0 20px'}}>{c.desc}</p>

              <div style={{
                minHeight:140, borderRadius:14, background:c.colorSoft, padding:16,
                border:'1px solid var(--line)', marginBottom:20, display:'grid', gap:8
              }}>
                {i===0 ? (
                  <>
                    <div style={{height:8, width:'70%', background:c.color, borderRadius:99, opacity:0.7}}/>
                    <div style={{height:8, width:'45%', background:c.color, borderRadius:99, opacity:0.4}}/>
                    <div style={{height:8, width:'60%', background:c.color, borderRadius:99, opacity:0.5}}/>
                    <div style={{marginTop:8, display:'flex', alignItems:'center', gap:8}}>
                      <span style={{width:24, height:24, borderRadius:'50%', background:c.color}}/>
                      <div style={{height:6, width:120, background:c.color, borderRadius:99, opacity:0.5}}/>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <div style={{width:30, height:30, borderRadius:'50%', background:c.color, opacity:0.3}}/>
                      <div style={{background:'var(--paper)', borderRadius:12, padding:'6px 10px', fontSize:11, color:'var(--ink-2)'}}>Hey, saw your post…</div>
                    </div>
                    <div style={{display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end'}}>
                      <div style={{background:c.color, color:'var(--paper)', borderRadius:12, padding:'6px 10px', fontSize:11}}>Thanks — interested!</div>
                    </div>
                    <div style={{display:'inline-flex', alignItems:'center', gap:6, alignSelf:'center', fontFamily:'Geist Mono, monospace', fontSize:10, color:c.colorInk, background:'var(--paper)', padding:'3px 8px', borderRadius:999, border:'1px solid var(--line)', width:'fit-content', margin:'4px auto'}}>⚡ AUTOMATED</div>
                  </>
                )}
              </div>

              <ul style={{listStyle:'none', padding:0, margin:'0 0 20px', display:'grid', gap:8}}>
                {c.feats.map(f => (
                  <li key={f} style={{display:'flex', gap:10, alignItems:'center', fontSize:14, color:'var(--ink-2)'}}>
                    <span style={{width:18, height:18, borderRadius:'50%', background:'oklch(0.92 0.08 150)', color:'oklch(0.38 0.1 150)', display:'grid', placeItems:'center', fontSize:10, fontWeight:700, flexShrink:0}}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button className="btn" style={{background:c.color, color:'var(--paper)', borderColor:c.color, width:'100%', justifyContent:'center'}}>{c.cta} →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Manual vs RedProwl comparison =====
function Comparison() {
  const manual = [
    'Do keyword research manually (1–2 hours)',
    'Skim hundreds of Google results (2–3 hours)',
    'Hunt high-ranking Reddit posts by hand (1–2 hours)',
    'Pay for Ahrefs/SEMrush ($120+/mo minimum)',
    'Read through dozens of possibly-irrelevant posts (2–3 hours)',
    'Write authentic replies from scratch (1–2 hours)',
    'Miss time-sensitive opportunities daily',
    "Can't remember which posts you already replied to",
  ];
  const prowl = [
    ['Set up your project (2 minutes)', 'Drop your website URL. Our AI extracts your ICP, keywords, and niche automatically.'],
    ['Get high-intent opportunities', 'AI tracks indexed Reddit posts and brand mentions. You get alerted the moment something high-fit goes live.'],
    ['Invest 20 minutes a day', 'Review the curated queue and reply. Effective growth with minimal time.'],
  ];
  return (
    <section className="section-pad">
      <div className="wrap" style={{textAlign:'center'}}>
        <span className="eyebrow" style={{margin:'0 auto'}}>Why RedProwl</span>
        <h2 className="h-section" style={{marginTop:16, maxWidth:900, marginLeft:'auto', marginRight:'auto'}}>
          Finding customers feels too hard?<br/>
          <em style={{fontStyle:'italic', color:'var(--accent-ink)'}}>RedProwl is the better way.</em>
        </h2>
        <p className="sub" style={{margin:'0 auto 48px'}}>Stop burning hours on Reddit searches. Start joining high-intent conversations that actually convert.</p>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth: 1000, margin:'0 auto', textAlign:'left'}}>
          <div className="card soft" style={{padding:28, background:'oklch(0.99 0.005 20)', borderColor:'oklch(0.88 0.04 25)'}}>
            <h3 style={{fontFamily:'Instrument Serif, serif', fontSize:28, margin:'0 0 20px', color:'var(--ink-3)'}}>Finding customers manually</h3>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:10}}>
              {manual.map(m => (
                <li key={m} style={{display:'flex', gap:10, alignItems:'flex-start', fontSize:14, color:'var(--ink-3)', lineHeight:1.4}}>
                  <span style={{width:18, height:18, borderRadius:'50%', background:'oklch(0.94 0.06 25)', color:'oklch(0.5 0.18 25)', display:'grid', placeItems:'center', fontSize:10, fontWeight:700, flexShrink:0, marginTop:1}}>✕</span>{m}
                </li>
              ))}
            </ul>
            <div style={{marginTop:20, padding:'12px 14px', background:'oklch(0.96 0.04 25)', borderRadius:10, fontSize:13, color:'oklch(0.45 0.17 25)', fontWeight:500}}>
              ⏱ 2–3 hours daily · 💸 $120+/mo tooling
            </div>
          </div>

          <div className="card" style={{padding:28, background:'var(--paper)'}}>
            <h3 style={{fontFamily:'Instrument Serif, serif', fontSize:28, margin:'0 0 20px'}}>With <span style={{color:'var(--accent-ink)'}}>RedProwl</span></h3>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:16}}>
              {prowl.map(([t, d], i) => (
                <li key={i} style={{display:'grid', gap:4}}>
                  <div style={{display:'flex', gap:10, alignItems:'center', fontWeight:600, fontSize:15, color:'var(--ink)'}}>
                    <span style={{width:20, height:20, borderRadius:'50%', background:'oklch(0.92 0.08 150)', color:'oklch(0.38 0.1 150)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700}}>✓</span>{t}
                  </div>
                  <div style={{marginLeft:30, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.5}}>{d}</div>
                </li>
              ))}
            </ul>
            <div style={{marginTop:20, padding:'12px 14px', background:'oklch(0.94 0.07 150)', borderRadius:10, fontSize:13, color:'oklch(0.35 0.1 150)', fontWeight:500}}>
              ✓ Effective growth marketing in 20 min/day
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Honest truth: why not full auto =====
function HonestTruth() {
  return (
    <section className="section-pad" style={{background:'var(--bg-2)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
      <div className="wrap" style={{maxWidth:820, margin:'0 auto'}}>
        <div style={{textAlign:'center', marginBottom:40}}>
          <span className="eyebrow" style={{margin:'0 auto'}}>The honest truth about Reddit automation</span>
          <h2 className="h-section" style={{marginTop:16}}>"Why can't I just <em style={{fontStyle:'italic', color:'var(--accent-ink)'}}>fully automate</em> it?"</h2>
          <p className="sub" style={{margin:'0 auto'}}>We get asked this a lot. Here's what nobody else will tell you.</p>
        </div>

        <div className="card" style={{padding:32, background:'var(--paper)'}}>
          <p style={{fontSize:16, lineHeight:1.6, margin:'0 0 16px', color:'var(--ink-2)'}}>
            <b style={{color:'var(--ink)'}}>We understand you.</b> You want to fully automate and save time. You've probably seen someone pitch an "agent" that runs Reddit on autopilot. Sounds great in theory.
          </p>
          <p style={{fontSize:16, lineHeight:1.6, margin:'0 0 16px', color:'var(--ink-2)'}}>
            <b style={{color:'var(--ink)'}}>Here's what's actually happening:</b> Reddit's 2025 anti-spam update wiped roughly <b style={{color:'var(--ink)'}}>70% of automated posting accounts</b> across the platform. We watched competitors ship retroactive bans and shadow-removals that ate months of paid comments overnight.
          </p>
          <p style={{fontSize:16, lineHeight:1.6, margin:'0 0 20px', color:'var(--ink-2)'}}>
            Some of the biggest "auto-reply" tools had to <b style={{color:'var(--ink)'}}>publicly pause operations</b>. Their users had been paying for comments that were silently removed days after posting. Not great.
          </p>

          <div style={{
            background:'oklch(0.97 0.03 25)', borderRadius:14, padding:'18px 20px', border:'1px solid oklch(0.88 0.05 25)', marginBottom:24
          }}>
            <div style={{fontFamily:'Geist Mono, monospace', fontSize:11, letterSpacing:'0.05em', textTransform:'uppercase', color:'oklch(0.5 0.17 25)', marginBottom:12, fontWeight:600}}>⚠ Why fully-automated posting always breaks</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:13.5, color:'var(--ink-2)', lineHeight:1.45}}>
              {['Reddit detects bots via IPs, fingerprints, behavior','Comments get shadow-removed. You never see them go','Accounts you don\'t own get banned — taking your "marketing" with them','Retroactive purges wipe months of paid comments overnight'].map(x => <div key={x}>✕ {x}</div>)}
            </div>
          </div>

          <div style={{borderTop:'1px dashed var(--line)', paddingTop:24}}>
            <div className="mono" style={{fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-3)', marginBottom:12}}>So what actually works?</div>
            <h3 style={{fontFamily:'Instrument Serif, serif', fontSize:30, margin:'0 0 12px', letterSpacing:'-0.01em'}}>Automate the 90%. <em style={{color:'var(--accent-ink)'}}>You do the 10% that matters.</em></h3>
            <p style={{fontSize:15.5, lineHeight:1.6, color:'var(--ink-2)', margin:'0 0 20px'}}>
              RedProwl handles everything up to the last mile — finding conversations, scoring intent, drafting replies. You handle the final step: posting from your real account. That's not a limitation. That's your competitive edge.
            </p>
            <ol style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8, counterReset:'s'}}>
              {[
                'RedProwl AI finds the right conversations for your product',
                'Relevance filtering shows you only high-intent threads',
                'RedProwl AI suggests authentic, context-aware replies',
                'You post from your account. Comments stick. You make $$$.',
              ].map((x, i) => (
                <li key={i} style={{
                  display:'grid', gridTemplateColumns:'28px 1fr', gap:12, alignItems:'center',
                  padding:'12px 16px', background: i===3?'var(--accent-soft)':'oklch(0.97 0.04 150)', borderRadius:10,
                  border:'1px solid var(--line)'
                }}>
                  <span style={{
                    width:24, height:24, borderRadius:'50%',
                    background: i===3?'var(--accent)':'oklch(0.58 0.13 150)', color:'var(--paper)',
                    display:'grid', placeItems:'center', fontSize:12, fontWeight:700
                  }}>{i+1}</span>
                  <span style={{fontSize:14, color:'var(--ink)', fontWeight:500}}>{x}</span>
                </li>
              ))}
            </ol>
            <div style={{marginTop:20, padding:14, background:'var(--bg)', borderRadius:10, textAlign:'center', fontSize:14, color:'var(--ink-2)', fontFamily:'Instrument Serif, serif', fontStyle:'italic', fontSize:17}}>
              Automation that replaces humans dies when platforms decide it dies.<br/>
              <b style={{color:'var(--ink)'}}>Tools that assist humans compound forever.</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== SEO + AI Search angle =====
function SeoAiSearch() {
  return (
    <section className="section-pad">
      <div className="wrap" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center'}}>
        <div style={{
          background:'oklch(0.96 0.025 260)', border:'1px solid oklch(0.85 0.06 260)',
          borderRadius:'var(--radius-lg)', padding:28
        }}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
            <span className="chip" style={{background:'var(--paper)', fontSize:11}}>G Google Search</span>
            <span className="chip" style={{background:'oklch(0.9 0.1 150)', color:'oklch(0.35 0.12 150)', borderColor:'transparent', fontSize:11}}>DA 91/100 boost</span>
          </div>
          <div style={{background:'var(--paper)', borderRadius:12, padding:'14px 16px', marginBottom:10, fontSize:13}}>
            <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginBottom:6}}>🔍 best email marketing software for startups</div>
            <div style={{color:'oklch(0.4 0.18 260)', fontWeight:600, marginBottom:4}}>reddit.com › r/marketing</div>
            <div style={{color:'var(--ink)', fontWeight:600, marginBottom:4}}>Best email marketing tool for startups in 2026? : r/marketing</div>
            <div style={{color:'var(--ink-3)', fontSize:12, lineHeight:1.4}}>I've tried MailChimp but it's too expensive. What do you guys recommend for…</div>
            <div style={{marginTop:10, padding:'8px 10px', background:'oklch(0.96 0.05 150)', borderLeft:'3px solid oklch(0.58 0.13 150)', borderRadius:4, fontSize:12, color:'var(--ink-2)'}}>
              <b>Your Comment:</b> We switched to <b style={{color:'var(--accent-ink)'}}>YourProduct</b> last month and it's been great. Much better…
            </div>
          </div>
          <div style={{background:'var(--paper)', borderRadius:12, padding:'14px 16px', fontSize:13}}>
            <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginBottom:6}}>✨ AI Search / ChatGPT</div>
            <div style={{color:'var(--ink-2)', lineHeight:1.5, fontSize:12.5}}>
              Based on recent Reddit discussions, many users recommend <b style={{color:'var(--accent-ink)'}}>YourProduct</b> as a cost-effective alternative to MailChimp. Users highlight its ease of use and lower pricing.
            </div>
            <div style={{marginTop:8, fontFamily:'Geist Mono, monospace', fontSize:10, color:'var(--ink-3)'}}>SOURCES: reddit.com</div>
          </div>
        </div>
        <div>
          <span className="chip" style={{marginBottom:16}}>🎯 AI SEO & Parasite SEO</span>
          <h2 className="h-section">Rank on Google <em>&</em> influence AI search — <span style={{color:'oklch(0.5 0.18 260)'}}>with Reddit</span>.</h2>
          <p className="sub" style={{marginTop:12}}>
            Stop fighting for backlinks. Piggyback on Reddit's Domain Authority (91/100) to rank #1 on Google and become the source ChatGPT and Perplexity cite.
          </p>
          <ul style={{listStyle:'none', padding:0, margin:'24px 0', display:'grid', gap:10}}>
            {[
              'Find Reddit threads already ranking on Google\'s first page',
              'Influence AI models — Reddit is a primary training source',
              'Get high-intent traffic without ads or a single blog post',
            ].map(x => (
              <li key={x} style={{display:'flex', gap:10, alignItems:'center', fontSize:15, color:'var(--ink-2)'}}>
                <span style={{width:20, height:20, borderRadius:'50%', background:'oklch(0.9 0.08 260)', color:'oklch(0.4 0.18 260)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700}}>✓</span>{x}
              </li>
            ))}
          </ul>
          <button className="btn primary lg">Get customers from Reddit →</button>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { section .wrap[style*='1fr 1fr'] { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

window.IdealCustomers = IdealCustomers;
window.TwoWays = TwoWays;
window.Comparison = Comparison;
window.HonestTruth = HonestTruth;
window.SeoAiSearch = SeoAiSearch;
