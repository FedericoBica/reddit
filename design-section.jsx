/* global React */
const { useState } = React;

// ===== Feature visualizations (inline mini mocks) =====
function FeatSignal() {
  return (
    <div style={{display:'grid', gap:8}}>
      {[
        ['r/startups', 94, 'hot'],
        ['r/SaaS', 81, 'hot'],
        ['r/marketing', 62, 'warm'],
        ['r/ecommerce', 34, 'cold'],
      ].map(([sub, n, band]) => (
        <div key={sub} style={{display:'grid', gridTemplateColumns:'100px 1fr auto', gap:10, alignItems:'center'}}>
          <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{sub}</span>
          <div style={{height:6, background:'var(--line-2)', borderRadius:999, overflow:'hidden'}}>
            <div style={{
              width: `${n}%`, height:'100%',
              background: band==='hot'?'var(--accent)':band==='warm'?'var(--butter)':'var(--line)'
            }}/>
          </div>
          <span className={`score-pill ${band}`}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function FeatCompose() {
  return (
    <div style={{display:'grid', gap:8}}>
      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
        {['helpful','casual','founder-voice','no-pitch','cite-data'].map(t => (
          <span key={t} className="chip" style={{fontSize:11}}>{t}</span>
        ))}
      </div>
      <div style={{
        border:'1px solid var(--line)', borderRadius:12, padding:12,
        background:'var(--paper)', fontSize:13, lineHeight:1.5, color:'var(--ink-2)'
      }}>
        <span style={{color:'var(--ink)'}}>Honestly, been there at $8k MRR.</span> The thing
        that actually helped was <mark style={{background:'var(--butter)', padding:'0 2px', borderRadius:3}}>routing Reddit into the same inbox as product-adjacent subs</mark> with intent tagging…
        <span style={{display:'inline-block', width:6, height:14, background:'var(--accent)', marginLeft:2, verticalAlign:'middle', animation:'blink 1s infinite'}}/>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </div>
  );
}

function FeatInbox() {
  return (
    <div style={{display:'grid', gap:6}}>
      {[
        ['SF','u/scrappy_founder','needs reply','var(--accent)'],
        ['DD','u/dtc_dave','queued','var(--butter)'],
        ['GC','u/growth_chloe','sent','oklch(0.88 0.08 150)'],
      ].map(([ini,name,status,c]) => (
        <div key={name} style={{
          display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center',
          padding:'8px 10px', background:'var(--paper)', border:'1px solid var(--line)', borderRadius:10
        }}>
          <div className="avatar" style={{width:26, height:26, fontSize:10}}>{ini}</div>
          <span style={{fontSize:13}}>{name}</span>
          <span style={{background:c, padding:'2px 8px', borderRadius:999, fontSize:10, fontFamily:'Geist Mono, monospace', color:'var(--ink)'}}>{status}</span>
        </div>
      ))}
    </div>
  );
}

function FeatGuard() {
  return (
    <div style={{display:'grid', gap:8}}>
      {[
        ['✓','No two replies per subreddit per 24h','ok'],
        ['✓','Self-promo ratio: 1 in 10 comments','ok'],
        ['!','r/marketing: read wiki before posting','warn'],
        ['✓','Account karma threshold met','ok'],
      ].map(([sym,txt,state],i) => (
        <div key={i} style={{display:'flex', gap:10, alignItems:'center', fontSize:13, color:'var(--ink-2)'}}>
          <span style={{
            width:20, height:20, display:'grid', placeItems:'center', borderRadius:6,
            background: state==='ok'?'oklch(0.92 0.08 150)':'var(--butter)',
            color: state==='ok'?'oklch(0.38 0.1 150)':'oklch(0.45 0.12 80)',
            fontWeight:700, fontSize:11
          }}>{sym}</span>
          {txt}
        </div>
      ))}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="section-pad">
      <div className="wrap">
        <div style={{maxWidth: 720, marginBottom: 56}}>
          <span className="eyebrow">What it does</span>
          <h2 className="h-section" style={{marginTop: 16}}>Four things, done embarrassingly well.</h2>
          <p className="sub">No kitchen sink. Find the thread, write the reply, keep the account alive, measure what returned. That's the job.</p>
        </div>

        <div className="features-grid">
          <div className="feat big">
            <div className="icon">◉</div>
            <h3>Signal, not scraping.</h3>
            <p>Every new thread across Reddit scored for intent, fit, and timing. We ignore the <em>"Best CRM?"</em> noise and surface the ones actually shopping.</p>
            <div className="vis"><FeatSignal/></div>
          </div>

          <div className="feat sm">
            <div className="icon">✎</div>
            <h3>Replies that don't read like a bot wrote them.</h3>
            <p>Trained on your own voice and top-voted comments in each sub. Drafts you'd actually send.</p>
            <div className="vis"><FeatCompose/></div>
          </div>

          <div className="feat sm">
            <div className="icon">⟟</div>
            <h3>Shared inbox for your team.</h3>
            <p>Assign, review, approve. Nobody double-replies. Nobody misses a lead because it was 11pm.</p>
            <div className="vis"><FeatInbox/></div>
          </div>

          <div className="feat big">
            <div className="icon">⛨</div>
            <h3>Built-in guardrails so you don't get banned.</h3>
            <p>We read every subreddit's rules, enforce posting cadence, watch your self-promo ratio, and flag language that moderators historically remove.</p>
            <div className="vis"><FeatGuard/></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Describe who you sell to.', d: 'Plain English works. "B2B founders frustrated with Intercom" is enough. We translate it into intent vectors across 12,000+ subs.' },
    { n: '02', t: 'Prowl does the reading.', d: 'We scan Reddit continuously, score new threads for fit, and queue only the ones worth your time — usually 5–15 per day.' },
    { n: '03', t: 'You ship the reply.', d: 'Draft, edit, approve, or schedule. We handle account hygiene so you can stay out of the spam filter and in the conversation.' },
  ];
  return (
    <section id="how" className="section-pad" style={{background:'var(--bg-2)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
      <div className="wrap">
        <div style={{maxWidth: 720, marginBottom: 56}}>
          <span className="eyebrow">How it works</span>
          <h2 className="h-section" style={{marginTop: 16}}>From <em className="serif" style={{fontStyle:'italic', color:'var(--accent-ink)'}}>"huh, interesting"</em> to booked call, in three moves.</h2>
        </div>
        <div className="steps">
          {steps.map(s => (
            <div key={s.n} className="step">
              <div className="num">{s.n}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
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
      name: 'Startup', monthly: 19, yearly: 15, desc: 'Start generating leads and revenue from Reddit with our entry-level plan for businesses new to Reddit marketing.',
      inbound: ['3 Tracked Competitors','20 Custom Tracked Keywords','100 AI-Guided Reply Suggestions','Weekly New Lead Opportunities','Weekly Competitor Tracking','Analytics Insight Dashboard'],
      outbound: ['30 Daily Auto DMs'],
    },
    {
      name: 'Growth', monthly: 39, yearly: 31, desc: 'Convert more Reddit leads into paying customers with daily insights and expanded tracking to maximize your ROI.', featured: true,
      inbound: ['6 Tracked Competitors','40 Custom Tracked Keywords','300 AI-Guided Reply Suggestions','Daily New Lead Opportunities','Daily Competitor Tracking','Monthly SEO Opportunities','Analytics Insight Dashboard'],
      outbound: ['100 Daily Auto DMs'],
    },
    {
      name: 'Professional', monthly: 79, yearly: 63, desc: 'Maximize revenue potential across multiple brands with our most powerful Reddit lead generation.',
      inbound: ['8 Tracked Competitors','60 Custom Tracked Keywords','500 AI-Guided Reply Suggestions','Daily New Lead Opportunities','Daily Competitor Tracking','Monthly SEO Opportunities','Analytics Insight Dashboard'],
      outbound: ['500 Daily Auto DMs','CRM for private DM outreach'],
    },
  ];
  return (
    <section id="pricing" className="section-pad">
      <div className="wrap" style={{textAlign:'center'}}>
        <span className="eyebrow" style={{margin:'0 auto'}}>Pricing</span>
        <h2 className="h-section" style={{marginTop: 16, maxWidth:900, marginLeft:'auto', marginRight:'auto'}}>Pricing that <em style={{fontStyle:'italic', color:'var(--accent-ink)'}}>pays for itself</em>.</h2>
        <p className="sub" style={{margin:'0 auto 28px'}}>Ads can cost you thousands. RedProwl surfaces hidden Reddit opportunities and drives organic growth for a fraction of the cost — it pays for itself from a single new customer.</p>

        <div style={{display:'inline-flex', alignItems:'center', gap:12, marginBottom:10}}>
          <div style={{
            display:'inline-flex', background:'var(--paper)', border:'1.5px solid var(--ink)', borderRadius:999, padding:3,
            boxShadow:'var(--shadow-sticker-sm)'
          }}>
            <button onClick={() => setYearly(false)} style={{
              padding:'8px 20px', borderRadius:999, fontSize:13, fontWeight:600,
              background: !yearly ? 'var(--accent)' : 'transparent',
              color: !yearly ? 'var(--paper)' : 'var(--ink-2)', cursor:'pointer'
            }}>Monthly</button>
            <button onClick={() => setYearly(true)} style={{
              padding:'8px 20px', borderRadius:999, fontSize:13, fontWeight:600,
              background: yearly ? 'var(--accent)' : 'transparent',
              color: yearly ? 'var(--paper)' : 'var(--ink-2)', cursor:'pointer'
            }}>Yearly</button>
          </div>
          <span className="mono" style={{fontSize:12, color:'var(--accent-ink)'}}>→ Save 20% with yearly billing</span>
        </div>
        <div style={{marginBottom:48}}></div>
        <div className="pricing" style={{textAlign:'left'}}>
          {tiers.map(t => (
            <div key={t.name} className={`price ${t.featured?'featured':''}`} style={t.featured?{position:'relative'}:{}}>
              {t.featured && <span style={{position:'absolute', top:-12, right:20, background:'var(--accent)', color:'var(--paper)', fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:999, fontFamily:'Geist Mono, monospace', letterSpacing:'0.04em'}}>RECOMMENDED</span>}
              <span className="price-name" style={{fontFamily:'Instrument Serif, serif', fontSize:24, textTransform:'none', letterSpacing:'-0.01em', fontWeight:400}}>{t.name}</span>
              <div className="price-num">${yearly?t.yearly:t.monthly}<small> /month</small></div>
              <div className="price-desc">{t.desc}</div>
              <div className="mono" style={{fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase', color: t.featured?'oklch(0.75 0.04 60)':'var(--ink-3)', margin:'4px 0 10px', fontWeight:600, display:'flex', alignItems:'center', gap:6}}><span>📥</span> Inbound</div>
              <ul className="price-list" style={{marginBottom:12}}>
                {t.inbound.map(f => (
                  <li key={f}><span className="price-check">✓</span><span>{f}</span></li>
                ))}
              </ul>
              <div className="mono" style={{fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase', color: t.featured?'oklch(0.75 0.04 60)':'var(--ink-3)', margin:'4px 0 10px', fontWeight:600, display:'flex', alignItems:'center', gap:6}}><span>📤</span> Outbound</div>
              <ul className="price-list">
                {t.outbound.map(f => (
                  <li key={f}><span className="price-check">✓</span><span>{f}</span></li>
                ))}
              </ul>
              <button className="btn" style={t.featured?{background:'var(--accent)', color:'var(--paper)', borderColor:'var(--accent)', justifyContent:'center'}:{justifyContent:'center'}}>Get customers from Reddit →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    ['Is this going to get my account banned?', 'The opposite is the goal. Every plan includes guardrails that enforce per-subreddit rules, cadence, and self-promo ratios. Accounts that follow our defaults have a <0.4% ban rate — below the Reddit baseline.'],
    ['How is this different from F5Bot or Brand24?', 'Those tools alert you when a keyword appears. RedProwl also scores intent, drafts the reply in your voice, enforces account hygiene, and gives your team a shared inbox. It\'s the whole workflow, not just the tripwire.'],
    ['Do you use my data to train models?', 'No. Your replies, threads, and ICPs stay in your workspace. We fine-tune on anonymized, opted-in data only, and you can opt out at onboarding.'],
    ['Can I use this for cold DMs?', 'Technically yes, but we actively discourage it — Reddit DMs at scale get accounts nuked fast. Public replies consistently convert 4-8x better anyway.'],
    ['What happens if Reddit changes their API?', 'We\'ve built with that in mind. We use authenticated API access under each workspace\'s own credentials, and we maintain a fallback scraping layer. Pricing is also inclusive of API fees.'],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section-pad-sm">
      <div className="wrap" style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap: 48}}>
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 className="h-section" style={{marginTop: 16}}>Questions we get a lot.</h2>
          <p className="sub">Don't see yours? <a href="#" style={{color:'var(--accent-ink)', textDecoration:'underline'}}>Ask us directly</a>.</p>
        </div>
        <div className="faq-list">
          {items.map(([q,a], i) => (
            <div key={i} className={`faq-item ${open===i?'open':''}`}>
              <button className="faq-q" onClick={() => setOpen(open===i?-1:i)}>
                <span>{q}</span>
                <span className="faq-toggle">+</span>
              </button>
              {open===i && <div className="faq-a">{a}</div>}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #faq .wrap { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section-pad-sm">
      <div className="wrap">
        <div className="cta-block">
          <div style={{position:'relative', zIndex:1, maxWidth: 720}}>
            <span className="eyebrow" style={{color:'var(--paper)'}}>Ready?</span>
            <h2 className="h-section" style={{marginTop: 16, color:'var(--paper)'}}>Your next 10 customers are<br/>already posting about you.</h2>
            <p className="sub" style={{color:'oklch(0.96 0.03 60)', marginBottom: 32}}>Start the 7-day trial. No card. Cancel in two clicks. If you don't close at least one lead, we'll send you a handwritten apology.</p>
            <div className="cta-row">
              <button className="btn primary lg">Start free trial →</button>
              <button className="btn lg" style={{background:'transparent', color:'var(--paper)', borderColor:'var(--paper)'}}>Watch 90-sec demo</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="brand" style={{marginBottom: 16}}>
              <div className="brand-mark">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.3"/><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>
              </div>
              RedProwl
            </div>
            <p style={{color:'var(--ink-2)', fontSize:14, maxWidth: 300, lineHeight: 1.55, margin:0}}>
              Reddit lead-gen for founders who'd rather ship than lurk.
            </p>
          </div>
          <div className="foot-col">
            <h5>Product</h5>
            <a href="#">Features</a><a href="#">Pricing</a><a href="#">Changelog</a><a href="#">Integrations</a>
          </div>
          <div className="foot-col">
            <h5>Company</h5>
            <a href="#">About</a><a href="#">Customers</a><a href="#">Blog</a><a href="#">Contact</a>
          </div>
          <div className="foot-col">
            <h5>Legal</h5>
            <a href="#">Terms</a><a href="#">Privacy</a><a href="#">Responsible use</a><a href="#">DMCA</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 RedProwl, Inc. Not affiliated with Reddit, Inc.</span>
          <span className="mono">v4.2.1 · all systems operational</span>
        </div>
      </div>
    </footer>
  );
}

window.Features = Features;
window.HowItWorks = HowItWorks;
window.Pricing = Pricing;
window.FAQ = FAQ;
window.FinalCTA = FinalCTA;
window.Footer = Footer;
