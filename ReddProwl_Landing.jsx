import React, { useState, useEffect, useRef } from "react";

const Logo = ({ size = 28, accent = "#E07000" }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <path d="M40 12 C52 22, 58 35, 58 48" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.15" />
    <path d="M40 12 C60 26, 68 42, 66 58" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.08" />
    <path d="M40 12 C48 18, 52 28, 52 40" stroke={accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.25" />
    <path d="M40 16 L54 36 L46 36 L46 62 L34 62 L34 36 L26 36 Z" fill={accent} />
    <circle cx="56" cy="30" r="3" fill={accent} opacity="0.7">
      <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const WM = ({ s = 20 }) => (
  <span style={{ display: "inline-flex", lineHeight: 1 }}>
    <span style={{ fontFamily: "var(--f)", fontSize: s, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.03em" }}>Redd</span>
    <span style={{ fontFamily: "var(--f)", fontSize: s, fontWeight: 800, color: "#E07000", letterSpacing: "-0.03em" }}>Prowl</span>
  </span>
);

const Counter = ({ end, suffix = "" }) => {
  const [c, setC] = useState(0);
  const ref = useRef(null);
  const go = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !go.current) {
        go.current = true;
        const s = Date.now();
        const t = () => { const p = Math.min((Date.now() - s) / 2000, 1); setC(Math.round((1 - Math.pow(1 - p, 3)) * end)); if (p < 1) requestAnimationFrame(t); };
        t();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{c}{suffix}</span>;
};

const Ck = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill="#E07000" opacity="0.1" />
    <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#E07000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Landing() {
  const [annual, setAnnual] = useState(true);
  const [email, setEmail] = useState("");

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    :root { --f: 'Outfit', sans-serif; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(224,112,0,0.25); } 50% { box-shadow: 0 0 0 10px rgba(224,112,0,0); } }
    .fu { animation: fadeUp 0.7s ease-out both; }
    .fu1 { animation-delay:.1s } .fu2 { animation-delay:.2s } .fu3 { animation-delay:.3s } .fu4 { animation-delay:.4s }
    .cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(224,112,0,0.28) !important; }
    .fc:hover { transform: translateY(-3px); box-shadow: 0 10px 36px rgba(0,0,0,0.06); }
    .pc:hover { transform: translateY(-3px); box-shadow: 0 14px 44px rgba(0,0,0,0.07); }
    .nl:hover { color: #E07000 !important; }
    .lc:hover { background: #F5F5F3 !important; }
  `;

  return (
    <div style={{ fontFamily: "var(--f)", color: "#1C1C1E", background: "#FAFAF8" }}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,250,248,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid #F0F0EE" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "12px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Logo size={26} /><WM s={18} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {["Features", "Pricing", "How it works"].map(x => (
              <a key={x} href={`#${x.toLowerCase().replace(/ /g, "-")}`} className="nl" style={{ fontSize: 13, fontWeight: 500, color: "#6B6B6E", textDecoration: "none", transition: "color 0.2s" }}>{x}</a>
            ))}
            <a href="#pricing" className="cta" style={{ fontSize: 13, fontWeight: 700, color: "#FFF", background: "#E07000", padding: "8px 18px", borderRadius: 10, textDecoration: "none", transition: "all 0.2s" }}>Start Free Trial</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 150, paddingBottom: 90, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -220, left: "50%", transform: "translateX(-50%)", width: 750, height: 750, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,112,0,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 28px", position: "relative" }}>
          <div className="fu fu1" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#FFF3E8", padding: "5px 14px", borderRadius: 18, marginBottom: 24 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#E07000" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E07000" }}>Leads de Reddit en piloto automático</span>
          </div>
          <h1 className="fu fu2" style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.04em", marginBottom: 22 }}>
            Encontrá clientes donde<br /><span style={{ color: "#E07000" }}>ya están pidiendo</span><br />tu producto
          </h1>
          <p className="fu fu3" style={{ fontSize: 19, lineHeight: 1.6, color: "#6B6B6E", maxWidth: 530, margin: "0 auto 36px", fontWeight: 400 }}>
            ReddProwl detecta intención de compra en Reddit, genera respuestas con IA que suenan humanas, y te ayuda a cerrar la venta sin hacer spam.
          </p>
          <div className="fu fu4" style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <a href="#pricing" className="cta" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#E07000", color: "#FFF", padding: "15px 32px", borderRadius: 13, fontSize: 16, fontWeight: 700, textDecoration: "none", transition: "all 0.25s", animation: "pulse 3s infinite" }}>
              Empezar gratis — 3 días
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", background: "#FFF", color: "#1C1C1E", padding: "15px 24px", borderRadius: 13, fontSize: 16, fontWeight: 600, textDecoration: "none", border: "1px solid #E5E5EA", transition: "all 0.2s" }}>
              Ver cómo funciona
            </a>
          </div>
          <p className="fu fu4" style={{ fontSize: 12, color: "#AEAEB2", marginTop: 18 }}>Sin tarjeta de crédito · Trial del plan Growth completo</p>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section style={{ padding: "0 28px 90px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", background: "#FFF", borderRadius: 18, boxShadow: "0 18px 50px rgba(0,0,0,0.055), 0 1px 3px rgba(0,0,0,0.03)", overflow: "hidden", border: "1px solid #F0F0EE" }}>
          <div style={{ padding: "10px 18px", borderBottom: "1px solid #F0F0EE", display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ display: "flex", gap: 5 }}>{["#FF5F57", "#FFBD2E", "#28C840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.75 }} />)}</div>
            <div style={{ flex: 1, background: "#F5F5F3", borderRadius: 5, padding: "5px 14px", fontSize: 11, color: "#AEAEB2", textAlign: "center" }}>app.reddprowl.com/searchbox</div>
          </div>
          <div style={{ display: "flex", minHeight: 340 }}>
            <div style={{ width: 180, background: "#F7F7F5", padding: "14px 8px", borderRight: "1px solid #F0F0EE", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 7px 14px" }}><Logo size={18} /><WM s={12} /></div>
              {[{ i: "📥", l: "Searchbox", a: true, b: "8" }, { i: "💬", l: "Threads", b: "2" }, { i: "📡", l: "Mentions" }, { i: "📊", l: "Analytics" }].map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 9px", borderRadius: 7, marginBottom: 1, background: x.a ? "#EEEEED" : "transparent", fontSize: 12, fontWeight: x.a ? 600 : 400, color: x.a ? "#1C1C1E" : "#8E8E93" }}>
                  <span style={{ fontSize: 12 }}>{x.i}</span><span style={{ flex: 1 }}>{x.l}</span>
                  {x.b && <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 5 }}>{x.b}</span>}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Searchbox</div>
                  <div style={{ fontSize: 11, color: "#AEAEB2", marginTop: 2 }}>8 leads · Inbox Zero</div>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {["All", "High Intent", "Trending"].map((t, i) => <span key={i} style={{ padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: i === 0 ? "#E07000" : "transparent", color: i === 0 ? "#FFF" : "#AEAEB2" }}>{t}</span>)}
                </div>
              </div>
              {[
                { t: "Best CRM for bootstrapped startups?", s: "r/SaaS", sc: 94, tm: "8m" },
                { t: "Switching from HubSpot — alternatives?", s: "r/startups", sc: 87, tm: "22m", tag: "COMPETITOR" },
                { t: "Need a tool for tracking Reddit leads", s: "r/growthhacking", sc: 81, tm: "1h" },
                { t: "How do you find customers organically?", s: "r/Entrepreneur", sc: 72, tm: "2h" },
              ].map((l, i) => (
                <div key={i} className="lc" style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 5, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #F0F0EE", cursor: "pointer", transition: "all 0.12s" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{l.t}</span>
                      {l.tag && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "#FDEAEA", color: "#D42B2B" }}>{l.tag}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: "#AEAEB2", marginTop: 2, display: "block" }}>{l.s} · {l.tm} ago</span>
                  </div>
                  <span style={{ background: l.sc > 80 ? "#E07000" : "#F5840C", color: "#FFF", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7, minWidth: 28, textAlign: "center" }}>{l.sc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "44px 28px", borderTop: "1px solid #F0F0EE", borderBottom: "1px solid #F0F0EE" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          {[{ v: 92, s: "%", l: "leads detectados relevantes" }, { v: 3, s: "x", l: "más rápido que manual" }, { v: 60, s: "s", l: "para ver tu primer lead" }, { v: 5, s: "min", l: "de setup en onboarding" }].map((x, i) => (
            <div key={i}>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#E07000", letterSpacing: "-0.04em", lineHeight: 1 }}><Counter end={x.v} suffix={x.s} /></div>
              <div style={{ fontSize: 13, color: "#6B6B6E", marginTop: 6, maxWidth: 140 }}>{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "90px 28px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#E07000", textTransform: "uppercase", letterSpacing: "0.1em" }}>Features</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginTop: 10, lineHeight: 1.1 }}>Todo el ciclo de venta<br />en una sola herramienta</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { i: "🎯", t: "Intent Scoring IA", d: "Score 1-100 de intención de compra. Dejá de leer posts irrelevantes." },
              { i: "✍️", t: "Reply Generator", d: "3 tonos + custom. Respuestas que pasan el filtro humano de Reddit." },
              { i: "💬", t: "Ghostwriter", d: "Monitorea el hilo completo y sugiere la siguiente respuesta hasta el DM." },
              { i: "⚔️", t: "Battlecards", d: "Cuando mencionan un competidor, ves 3 puntos de ataque automáticos." },
              { i: "🛡️", t: "Account Protection", d: "Protección automática: warm-up, cooldown y anti-shadowban integrados." },
              { i: "📊", t: "Analytics de ROI", d: "Pipeline New → Replied → Won. Sabé cuánto vale cada lead." },
              { i: "🔬", t: "Content Lab", d: "Posts proactivos que te posicionan como experto. Trend spotting + SEO." },
              { i: "🌲", t: "Evergreen Monitoring", d: "Hilos viejos que rankean en Google. Los comentarios nuevos son oro." },
              { i: "🗣️", t: "Voice Profile", d: "Cada cuenta tiene su personalidad. Consistencia de tono para evitar bans." },
            ].map((f, i) => (
              <div key={i} className="fc" style={{ background: "#FFF", borderRadius: 16, padding: "28px 24px", border: "1px solid #F0F0EE", transition: "all 0.25s", cursor: "default" }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.i}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.t}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "#6B6B6E" }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: "90px 28px", background: "#FFF", borderTop: "1px solid #F0F0EE", borderBottom: "1px solid #F0F0EE" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#E07000", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cómo funciona</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginTop: 10, lineHeight: 1.1 }}>De cero a leads<br />en 5 minutos</h2>
          </div>
          {[
            { n: "01", t: "Ingresá tu URL", d: "El sistema analiza tu producto y genera keywords + subreddits. Mientras configurás, ya ves leads reales (Modo Discovery).", a: true },
            { n: "02", t: "Revisá tu Searchbox", d: "Leads ordenados por intención. High Intent arriba. Contexto completo y comentarios." },
            { n: "03", t: "Generá respuestas con IA", d: "Elegí tono, editá, Copy & Open. Se copia, Reddit se abre, lead marcado." },
            { n: "04", t: "Seguí la conversación", d: "El Ghostwriter monitorea si te responden y sugiere el siguiente mensaje. Inbox Zero para leads." },
          ].map((x, i) => (
            <div key={i} style={{ display: "flex", gap: 28, alignItems: "flex-start", padding: "28px 0", borderBottom: i < 3 ? "1px solid #F0F0EE" : "none" }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: x.a ? "#E07000" : "#F0F0EE", lineHeight: 1, minWidth: 70, letterSpacing: "-0.04em" }}>{x.n}</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{x.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: "#6B6B6E" }}>{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "90px 28px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#E07000", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pricing</span>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginTop: 10 }}>Simple y transparente</h2>
            <p style={{ fontSize: 15, color: "#6B6B6E", marginTop: 10 }}>3 días gratis del plan Growth. Sin tarjeta.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#FFF", padding: "5px 6px", borderRadius: 11, marginTop: 20, border: "1px solid #F0F0EE" }}>
              <button onClick={() => setAnnual(false)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--f)", background: !annual ? "#1C1C1E" : "transparent", color: !annual ? "#FFF" : "#AEAEB2", transition: "all 0.2s" }}>Mensual</button>
              <button onClick={() => setAnnual(true)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--f)", background: annual ? "#1C1C1E" : "transparent", color: annual ? "#FFF" : "#AEAEB2", transition: "all 0.2s" }}>
                Anual <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4, marginLeft: 4 }}>-17%</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "start" }}>
            {[
              { n: "Starter", d: "Para validar Reddit como canal", p: annual ? 24 : 29, per: annual ? "/mes (anual)" : "/mes", pop: false, f: ["10 keywords", "3 competidores", "1 proyecto", "Scan cada 12hs", "100 AI replies/mes", "5 Ghostwriter threads", "Account Protection básico", "Battlecards", "Soporte email"] },
              { n: "Growth", d: "Para escalar tu presencia", p: annual ? 66 : 79, per: annual ? "/mes (anual)" : "/mes", pop: true, f: ["25 keywords", "6 competidores", "3 proyectos", "Scan cada 4hs", "400 AI replies/mes", "20 Ghostwriter threads", "DM Assistant", "Slack + Telegram + Webhooks", "2 cuentas Reddit", "3 team members", "Soporte prioritario"] },
              { n: "Enterprise", d: "Para equipos que van en serio", p: annual ? 166 : 199, per: annual ? "/mes (anual)" : "/mes", pop: false, f: ["50 keywords", "10 competidores", "Proyectos ilimitados", "Scan cada 1h", "1000 AI replies/mes", "Ghostwriter ilimitado", "Collision Detection", "CRM + Zapier + API", "5 cuentas Reddit", "Team members ilimitados", "Slack dedicado + onboarding"] },
            ].map((pl, i) => (
              <div key={i} className="pc" style={{ background: "#FFF", borderRadius: 18, padding: "32px 28px", border: pl.pop ? "2px solid #E07000" : "1px solid #F0F0EE", transition: "all 0.25s", position: "relative" }}>
                {pl.pop && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#E07000", color: "#FFF", fontSize: 10, fontWeight: 700, padding: "3px 14px", borderRadius: 18 }}>Más popular</div>}
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{pl.n}</h3>
                <p style={{ fontSize: 12, color: "#AEAEB2", marginTop: 3, marginBottom: 20 }}>{pl.d}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>${pl.p}</span>
                  <span style={{ fontSize: 13, color: "#AEAEB2", marginLeft: 3 }}>{pl.per}</span>
                </div>
                <a href="#" style={{ display: "block", textAlign: "center", padding: "12px 0", borderRadius: 11, fontSize: 14, fontWeight: 700, textDecoration: "none", background: pl.pop ? "#E07000" : "#1C1C1E", color: "#FFF", marginBottom: 24, transition: "all 0.2s" }}>Empezar gratis</a>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {pl.f.map((ft, j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}><Ck /><span style={{ fontSize: 12, color: "#6B6B6E" }}>{ft}</span></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "90px 28px", background: "#1C1C1E", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "#F5F5F5", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
            Tus próximos clientes ya<br />están en Reddit.
          </h2>
          <p style={{ fontSize: 17, color: "#9A9A9D", marginBottom: 36, lineHeight: 1.6 }}>Cada día se pierden oportunidades. Empezá a prowlear hoy.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 0, background: "#2A2A2C", borderRadius: 14, padding: 5, maxWidth: 430, margin: "0 auto" }}>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 18px", fontSize: 15, color: "#F5F5F5", fontFamily: "var(--f)" }} />
            <button style={{ background: "#E07000", color: "#FFF", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--f)", whiteSpace: "nowrap", transition: "all 0.2s" }}>Start Free Trial</button>
          </div>
          <p style={{ fontSize: 11, color: "#6B6B6E", marginTop: 14 }}>Sin tarjeta · 3 días Growth · Cancelá cuando quieras</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 28px", borderTop: "1px solid #F0F0EE" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Logo size={20} /><WM s={14} /></div>
          <span style={{ fontSize: 12, color: "#AEAEB2" }}>© 2026 ReddProwl. Prowling Reddit for your next customer.</span>
        </div>
      </footer>
    </div>
  );
}
