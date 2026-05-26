export default function FeedLoading() {
  return (
    <div className="searchbox-workspace">
      {/* Header skeleton */}
      <header className="feed-page-header">
        <div className="skel" style={{ width: 180, height: 22, borderRadius: 6 }} />
        <div className="skel" style={{ width: 440, height: 14, borderRadius: 6, marginTop: 10 }} />
      </header>

      <div className="searchbox-body">
        {/* List column */}
        <section className="opportunity-column">
          <div className="feed-col-header">
            <div className="skel" style={{ width: 80, height: 12, borderRadius: 4 }} />
          </div>
          <div className="opportunity-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px 12px 16px",
                  borderBottom: "1px solid #F0F0F3",
                  borderLeft: "3px solid transparent",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div className="skel" style={{ width: 6, height: 6, borderRadius: "50%" }} />
                  <div className="skel" style={{ width: 60, height: 10, borderRadius: 4 }} />
                  <div className="skel" style={{ width: 40, height: 10, borderRadius: 4 }} />
                </div>
                <div className="skel" style={{ width: "85%", height: 14, borderRadius: 5 }} />
                <div className="skel" style={{ width: "60%", height: 14, borderRadius: 5 }} />
                <div className="skel" style={{ width: 90, height: 10, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </section>

        {/* Detail column */}
        <div className="detail-col">
          <section className="detail-pane">
            <div
              className="detail-topbar"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px" }}
            >
              <div className="skel" style={{ width: 120, height: 12, borderRadius: 4 }} />
            </div>
            <div className="detail-content" style={{ padding: "24px 28px", display: "grid", gap: 14 }}>
              <div className="skel" style={{ width: "70%", height: 24, borderRadius: 7 }} />
              <div className="skel" style={{ width: "90%", height: 24, borderRadius: 7 }} />
              <div className="skel" style={{ width: "50%", height: 14, borderRadius: 5, marginTop: 4 }} />
              <div
                style={{ marginTop: 16, display: "grid", gap: 8 }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skel" style={{ width: `${85 - i * 8}%`, height: 13, borderRadius: 4 }} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .skel {
          background: linear-gradient(90deg, #F0F0F3 25%, #E8E8EC 50%, #F0F0F3 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes skel-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
