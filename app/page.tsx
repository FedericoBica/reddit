"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BrandLink } from "@/app/components/logo";

function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = Date.now();
          const tick = () => {
            const p = Math.min((Date.now() - t0) / 2000, 1);
            setCount(Math.round((1 - Math.pow(1 - p, 3)) * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="9" cy="9" r="9" fill="#E07000" opacity="0.12" />
      <path
        d="M5.5 9.5L7.5 11.5L12.5 6.5"
        stroke="#E07000"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  { icon: "🎯", title: "Intent Scoring IA", desc: "Score 1-100 de intención de compra. Dejá de leer posts irrelevantes." },
  { icon: "✍️", title: "Reply Generator", desc: "3 tonos + custom. Respuestas que pasan el filtro humano de Reddit." },
  { icon: "💬", title: "Ghostwriter", desc: "Monitorea el hilo y sugiere la siguiente respuesta hasta el DM." },
  { icon: "⚔️", title: "Battlecards", desc: "Cuando mencionan un competidor, ves 3 puntos de ataque automáticos." },
  { icon: "🛡️", title: "Account Protection", desc: "Warm-up, cooldown y anti-shadowban integrados automáticamente." },
  { icon: "📊", title: "Analytics de ROI", desc: "Pipeline New → Replied → Won. Sabé cuánto vale cada lead." },
  { icon: "🔬", title: "Content Lab", desc: "Posts proactivos que te posicionan como experto. Trend spotting + SEO." },
  { icon: "🌲", title: "Evergreen Monitoring", desc: "Hilos viejos que rankean en Google. Los comentarios nuevos son oro." },
  { icon: "🗣️", title: "Voice Profile", desc: "Cada cuenta tiene su personalidad. Consistencia de tono para evitar bans." },
];

const STEPS = [
  { n: "01", t: "Ingresá tu URL", d: "El sistema analiza tu producto y genera keywords + subreddits. Mientras configurás, ya ves leads reales (Modo Discovery).", highlight: true },
  { n: "02", t: "Revisá tu Searchbox", d: "Leads ordenados por intención. High Intent arriba. Contexto completo y comentarios." },
  { n: "03", t: "Generá respuestas con IA", d: "Elegí tono, editá, Copy & Open. Se copia, Reddit se abre, lead marcado." },
  { n: "04", t: "Seguí la conversación", d: "El Ghostwriter monitorea si te responden y sugiere el siguiente mensaje. Inbox Zero para leads." },
];

const MOCK_LEADS = [
  { title: "Best CRM for bootstrapped startups?", sub: "r/SaaS", score: 94, time: "8m" },
  { title: "Switching from HubSpot — alternatives?", sub: "r/startups", score: 87, time: "22m", tag: "COMPETITOR" },
  { title: "Need a tool for tracking Reddit leads", sub: "r/growthhacking", score: 81, time: "1h" },
  { title: "How do you find customers organically?", sub: "r/Entrepreneur", score: 72, time: "2h" },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(true);
  const [email, setEmail] = useState("");

  const plans = [
    {
      name: "Starter",
      desc: "Para validar Reddit como canal",
      price: annual ? 24 : 29,
      period: annual ? "/mes (anual)" : "/mes",
      popular: false,
      features: ["10 keywords", "3 competidores", "1 proyecto", "Scan cada 12hs", "100 AI replies/mes", "5 Ghostwriter threads", "Account Protection básico", "Battlecards", "Soporte email"],
    },
    {
      name: "Growth",
      desc: "Para escalar tu presencia",
      price: annual ? 66 : 79,
      period: annual ? "/mes (anual)" : "/mes",
      popular: true,
      features: ["25 keywords", "6 competidores", "3 proyectos", "Scan cada 4hs", "400 AI replies/mes", "20 Ghostwriter threads", "DM Assistant", "Slack + Telegram + Webhooks", "2 cuentas Reddit", "3 team members", "Soporte prioritario"],
    },
    {
      name: "Enterprise",
      desc: "Para equipos que van en serio",
      price: annual ? 166 : 199,
      period: annual ? "/mes (anual)" : "/mes",
      popular: false,
      features: ["50 keywords", "10 competidores", "Proyectos ilimitados", "Scan cada 1h", "1000 AI replies/mes", "Ghostwriter ilimitado", "Collision Detection", "CRM + Zapier + API", "5 cuentas Reddit", "Team members ilimitados", "Slack dedicado + onboarding"],
    },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "#1C1C1E", background: "#FAFAF8" }}>
      <style>{`
        @keyframes lp-fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(224,112,0,0.22); }
          50%       { box-shadow: 0 8px 24px rgba(224,112,0,0.22), 0 0 0 10px rgba(224,112,0,0); }
        }
        @keyframes lp-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .lp-fu  { animation: lp-fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) both; }
        .lp-fu1 { animation-delay: .08s; }
        .lp-fu2 { animation-delay: .18s; }
        .lp-fu3 { animation-delay: .28s; }
        .lp-fu4 { animation-delay: .38s; }
        .lp-cta { transition: transform 0.2s, box-shadow 0.2s; }
        .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(224,112,0,0.32) !important; }
        .lp-quiet:hover { box-shadow: 0 6px 22px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .lp-feature { transition: transform 0.25s, box-shadow 0.25s; }
        .lp-feature:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important; }
        .lp-price { transition: transform 0.25s, box-shadow 0.25s; }
        .lp-price:hover { transform: translateY(-4px); box-shadow: 0 18px 52px rgba(0,0,0,0.1) !important; }
        .lp-nav-link { transition: color 0.2s; }
        .lp-nav-link:hover { color: #E07000 !important; }
        .lp-lead-row { transition: background 0.15s; }
        .lp-lead-row:hover { background: #FAFAF8 !important; cursor: pointer; }
        .lp-dot { animation: lp-dot 2.2s ease-in-out infinite; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(250,250,248,0.9)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid #F0F0EE",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "13px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <BrandLink logoSize={26} wordmarkSize={18} />
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#features" className="lp-nav-link" style={{ fontSize: 13, fontWeight: 500, color: "#6B6B6E", textDecoration: "none" }}>Features</a>
            <a href="#pricing"  className="lp-nav-link" style={{ fontSize: 13, fontWeight: 500, color: "#6B6B6E", textDecoration: "none" }}>Pricing</a>
            <a href="#how-it-works" className="lp-nav-link" style={{ fontSize: 13, fontWeight: 500, color: "#6B6B6E", textDecoration: "none" }}>Cómo funciona</a>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6E", textDecoration: "none", transition: "color 0.2s" }}>Entrar</Link>
            <Link
              href="/signup"
              className="lp-cta"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FFF",
                background: "#E07000",
                padding: "8px 20px",
                borderRadius: 10,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(224,112,0,0.24)",
              }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ paddingTop: 158, paddingBottom: 88, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: -240,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(224,112,0,0.055) 0%, transparent 68%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 28px", position: "relative" }}>
          {/* Eyebrow */}
          <div
            className="lp-fu lp-fu1"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#FFF3E8",
              padding: "5px 14px 5px 10px",
              borderRadius: 20,
              marginBottom: 30,
              border: "1px solid rgba(224,112,0,0.18)",
            }}
          >
            <span className="lp-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#E07000", display: "block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#C96500" }}>Leads de Reddit en piloto automático</span>
          </div>

          <h1
            className="lp-fu lp-fu2"
            style={{
              fontSize: "clamp(48px, 7.5vw, 70px)",
              fontWeight: 900,
              lineHeight: 1.01,
              letterSpacing: "-0.048em",
              marginBottom: 26,
            }}
          >
            Encontrá clientes donde
            <br />
            <span style={{ color: "#E07000" }}>ya están pidiendo</span>
            <br />
            tu producto
          </h1>

          <p
            className="lp-fu lp-fu3"
            style={{
              fontSize: 19,
              lineHeight: 1.68,
              color: "#6B6B6E",
              maxWidth: 540,
              margin: "0 auto 40px",
              fontWeight: 400,
            }}
          >
            ReddProwl detecta intención de compra en Reddit, genera respuestas que suenan humanas, y te ayuda a cerrar ventas sin hacer spam.
          </p>

          <div className="lp-fu lp-fu4" style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/signup"
              className="lp-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#E07000",
                color: "#FFF",
                padding: "14px 32px",
                borderRadius: 13,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
                animation: "lp-pulse 3.2s infinite",
                boxShadow: "0 8px 24px rgba(224,112,0,0.22)",
              }}
            >
              Empezar gratis — 3 días
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M2.5 7.5h10M9 3.5l4 4-4 4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="lp-quiet"
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#FFF",
                color: "#1C1C1E",
                padding: "14px 24px",
                borderRadius: 13,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid #E5E5EA",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="lp-fu lp-fu4" style={{ fontSize: 12, color: "#AEAEB2", marginTop: 18 }}>
            Sin tarjeta de crédito · Trial del plan Growth completo
          </p>
        </div>
      </section>

      {/* ── APP PREVIEW ─────────────────────────────────────── */}
      <section style={{ padding: "0 28px 92px" }}>
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            background: "#FFF",
            borderRadius: 22,
            boxShadow: "0 2px 0 #F0F0EE, 0 24px 72px rgba(0,0,0,0.065)",
            overflow: "hidden",
            border: "1px solid #EBEBEA",
          }}
        >
          {/* Chrome */}
          <div style={{ padding: "10px 18px", borderBottom: "1px solid #F0F0EE", display: "flex", alignItems: "center", gap: 8, background: "#FCFCFB" }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#FF5F57", "#FFBD2E", "#28C840"].map((c) => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.85 }} />
              ))}
            </div>
            <div style={{ flex: 1, background: "#EFEFED", borderRadius: 6, padding: "4px 14px", fontSize: 11, color: "#AEAEB2", textAlign: "center", maxWidth: 320, margin: "0 auto" }}>
              app.reddprowl.com/dashboard
            </div>
          </div>

          <div style={{ display: "flex", minHeight: 380 }}>
            {/* Sidebar */}
            <div style={{ width: 190, background: "#F7F7F5", padding: "14px 8px", borderRight: "1px solid #F0F0EE", flexShrink: 0 }}>
              <BrandLink logoSize={18} wordmarkSize={12} style={{ gap: 6, padding: "0 7px 14px" }} />
              <div style={{ padding: "0 7px 10px" }}>
                <div style={{ padding: "6px 9px", background: "#FFF", borderRadius: 7, border: "1px solid #F0F0EE", fontSize: 11, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Mi SaaS B2B
                </div>
              </div>
              {[
                { icon: "📥", label: "Searchbox", active: true, badge: "8" },
                { icon: "💬", label: "Threads", badge: "2" },
                { icon: "📡", label: "Mentions" },
                { icon: "📊", label: "Analytics" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 9px",
                    borderRadius: 7,
                    marginBottom: 1,
                    background: item.active ? "#EEEEED" : "transparent",
                    fontSize: 12,
                    fontWeight: item.active ? 700 : 400,
                    color: item.active ? "#1C1C1E" : "#8E8E93",
                  }}
                >
                  <span>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Lead list */}
            <div style={{ width: 340, padding: "14px 16px", borderRight: "1px solid #F0F0EE", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>Searchbox</div>
                  <div style={{ fontSize: 10, color: "#AEAEB2", marginTop: 1 }}>8 leads · por intención</div>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {["All", "High Intent"].map((t, i) => (
                    <span key={i} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: i === 0 ? "#E07000" : "transparent", color: i === 0 ? "#FFF" : "#AEAEB2" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {MOCK_LEADS.map((lead, i) => (
                <div
                  key={i}
                  className="lp-lead-row"
                  style={{
                    padding: "9px 11px",
                    borderRadius: 8,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    border: "1px solid #F0F0EE",
                    background: i === 0 ? "#FFFDFB" : "#FFF",
                    borderLeft: `3px solid ${lead.score >= 80 ? "#E07000" : "#E5E5EA"}`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.title}</span>
                      {lead.tag && (
                        <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 3px", borderRadius: 3, background: "#FDEAEA", color: "#D42B2B", flexShrink: 0 }}>{lead.tag}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: "#AEAEB2" }}>{lead.sub} · {lead.time} ago</span>
                  </div>
                  <span
                    style={{
                      background: lead.score >= 80 ? "#E07000" : "#8E8E93",
                      color: "#FFF",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 5,
                      minWidth: 28,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {lead.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Detail pane */}
            <div style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#AEAEB2", letterSpacing: "0.02em", marginBottom: 7 }}>r/SaaS · 8m ago · u/bootstrap_dev</div>
                <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.01em", marginBottom: 10, color: "#1C1C1E" }}>
                  Best CRM for bootstrapped startups?
                </div>
                <p style={{ fontSize: 11, lineHeight: 1.65, color: "#6B6B6E" }}>
                  We&apos;re a small B2B SaaS team of 3. HubSpot feels overkill. What are you using for CRM + pipeline tracking at early stage?
                </p>
              </div>

              <div style={{ borderTop: "1px solid #F0F0EE", paddingTop: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#E07000", letterSpacing: "0.08em", marginBottom: 8 }}>REPLY GENERATOR</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {["Directo", "Consultivo", "Storytelling"].map((t, i) => (
                    <span key={i} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700, background: i === 0 ? "#FFF3E8" : "#F5F5F3", color: i === 0 ? "#E07000" : "#8E8E93", border: i === 0 ? "1px solid rgba(224,112,0,0.2)" : "1px solid transparent" }}>
                      {t}
                    </span>
                  ))}
                </div>
                <div style={{ background: "#FBFBFA", border: "1px solid #F0F0EE", borderRadius: 8, padding: "9px 11px", fontSize: 10.5, lineHeight: 1.6, color: "#444", marginBottom: 10 }}>
                  Hemos probado varios — lo que mejor nos funcionó a escala similar fue Attio. Mucho más ágil que HubSpot sin sacrificar el pipeline...
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "6px 12px", borderRadius: 6, textAlign: "center" }}>
                    Copiar y abrir Reddit →
                  </div>
                  <div style={{ background: "#1C1C1E", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "6px 12px", borderRadius: 6, textAlign: "center", flexShrink: 0 }}>
                    Ver post
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section style={{ padding: "56px 28px", borderTop: "1px solid #F0F0EE", borderBottom: "1px solid #F0F0EE" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-around", textAlign: "center", gap: 24, flexWrap: "wrap" }}>
          {[
            { v: 92, s: "%", l: "leads detectados relevantes" },
            { v: 3, s: "x", l: "más rápido que manual" },
            { v: 60, s: "s", l: "para ver tu primer lead" },
            { v: 5, s: "min", l: "de setup en onboarding" },
          ].map((x, i) => (
            <div key={i} style={{ minWidth: 130 }}>
              <div style={{ fontSize: 50, fontWeight: 900, color: "#E07000", letterSpacing: "-0.05em", lineHeight: 1 }}>
                <Counter end={x.v} suffix={x.s} />
              </div>
              <div style={{ fontSize: 13, color: "#6B6B6E", marginTop: 8, maxWidth: 140, margin: "8px auto 0" }}>{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 28px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 62 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textTransform: "uppercase", letterSpacing: "0.13em" }}>Features</span>
            <h2 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.043em", marginTop: 12, lineHeight: 1.03 }}>
              Todo el ciclo de venta
              <br />
              en una sola herramienta
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="lp-feature"
                style={{ background: "#FFF", borderRadius: 16, padding: "28px 24px", border: "1px solid #F0F0EE" }}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#6B6B6E" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "96px 28px", background: "#FFF", borderTop: "1px solid #F0F0EE", borderBottom: "1px solid #F0F0EE" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 62 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textTransform: "uppercase", letterSpacing: "0.13em" }}>Cómo funciona</span>
            <h2 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.043em", marginTop: 12, lineHeight: 1.03 }}>
              De cero a leads
              <br />
              en 5 minutos
            </h2>
          </div>

          {STEPS.map((x, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 28,
                alignItems: "flex-start",
                padding: "32px 0",
                borderBottom: i < STEPS.length - 1 ? "1px solid #F0F0EE" : "none",
              }}
            >
              <div style={{ fontSize: 46, fontWeight: 900, color: x.highlight ? "#E07000" : "#EBEBEB", lineHeight: 1, minWidth: 74, letterSpacing: "-0.048em" }}>
                {x.n}
              </div>
              <div>
                <h3 style={{ fontSize: 21, fontWeight: 800, marginBottom: 7, letterSpacing: "-0.02em" }}>{x.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "#6B6B6E" }}>{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "96px 28px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textTransform: "uppercase", letterSpacing: "0.13em" }}>Pricing</span>
            <h2 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.043em", marginTop: 12 }}>Simple y transparente</h2>
            <p style={{ fontSize: 15, color: "#6B6B6E", marginTop: 10 }}>3 días gratis del plan Growth. Sin tarjeta.</p>

            {/* Toggle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#FFF",
                padding: "5px 6px",
                borderRadius: 12,
                marginTop: 24,
                border: "1px solid #F0F0EE",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <button
                onClick={() => setAnnual(false)}
                style={{ padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: !annual ? "#1C1C1E" : "transparent", color: !annual ? "#FFF" : "#AEAEB2", transition: "all 0.2s" }}
              >
                Mensual
              </button>
              <button
                onClick={() => setAnnual(true)}
                style={{ padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: annual ? "#1C1C1E" : "transparent", color: annual ? "#FFF" : "#AEAEB2", transition: "all 0.2s" }}
              >
                Anual{" "}
                <span style={{ background: "#E07000", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4, marginLeft: 4 }}>-17%</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <div
                key={i}
                className="lp-price"
                style={{
                  background: "#FFF",
                  borderRadius: 20,
                  padding: "32px 28px",
                  border: plan.popular ? "2px solid #E07000" : "1px solid #F0F0EE",
                  position: "relative",
                  boxShadow: plan.popular ? "0 8px 32px rgba(224,112,0,0.10)" : "none",
                }}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#E07000", color: "#FFF", fontSize: 10, fontWeight: 800, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    Más popular
                  </div>
                )}
                <h3 style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.025em" }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: "#AEAEB2", marginTop: 4, marginBottom: 22 }}>{plan.desc}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 50, fontWeight: 900, letterSpacing: "-0.048em", lineHeight: 1 }}>${plan.price}</span>
                  <span style={{ fontSize: 13, color: "#AEAEB2", marginLeft: 4 }}>{plan.period}</span>
                </div>
                <Link
                  href="/signup"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 0",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    textDecoration: "none",
                    background: plan.popular ? "#E07000" : "#1C1C1E",
                    color: "#FFF",
                    marginBottom: 24,
                    transition: "opacity 0.2s",
                  }}
                >
                  Empezar gratis
                </Link>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckIcon />
                      <span style={{ fontSize: 12.5, color: "#6B6B6E", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section style={{ padding: "96px 28px", background: "#1C1C1E", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(34px, 5vw, 48px)",
              fontWeight: 900,
              color: "#F5F5F5",
              letterSpacing: "-0.043em",
              lineHeight: 1.03,
              marginBottom: 18,
            }}
          >
            Tus próximos clientes ya
            <br />
            están en Reddit.
          </h2>
          <p style={{ fontSize: 17, color: "#9A9A9D", marginBottom: 40, lineHeight: 1.68 }}>
            Cada día se pierden oportunidades. Empezá a prowlear hoy.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              background: "#252527",
              borderRadius: 14,
              padding: 5,
              maxWidth: 450,
              margin: "0 auto",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "12px 18px",
                fontSize: 15,
                color: "#F5F5F5",
                fontFamily: "inherit",
              }}
            />
            <Link
              href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              style={{
                background: "#E07000",
                color: "#FFF",
                padding: "11px 22px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
              }}
            >
              Start Free Trial
            </Link>
          </div>
          <p style={{ fontSize: 11, color: "#494949", marginTop: 16 }}>Sin tarjeta · 3 días Growth · Cancelá cuando quieras</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ padding: "40px 28px", borderTop: "1px solid #F0F0EE", background: "#FAFAF8" }}>
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <BrandLink logoSize={20} wordmarkSize={14} style={{ gap: 7 }} />
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
            {["Privacidad", "Términos"].map((x) => (
              <a key={x} href="#" style={{ fontSize: 13, color: "#AEAEB2", textDecoration: "none" }}>{x}</a>
            ))}
            <span style={{ fontSize: 12, color: "#AEAEB2" }}>© 2026 ReddProwl. Prowling Reddit for your next customer.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
