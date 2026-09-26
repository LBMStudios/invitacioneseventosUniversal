import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const MetricsSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });

  const count = Math.round(
    interpolate(frame, [20, 70], [0, 240], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const metrics = [
    { value: `+${count}`, label: "Líderes Reunidos", detail: "Sala completa en Movie", color: "#ffffff" },
    { value: "0 Filas", label: "Acceso Instantáneo", detail: "Acreditación ágil QR", color: "#00C4DF" },
    { value: "Canal 4", label: "Prime Time", detail: "Informativo Central", color: "#ffffff" },
    { value: "100%", label: "Digital & Sin Papel", detail: "Experiencia sustentable", color: "#00E676" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
        color: "#ffffff",
        padding: "0 100px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
          opacity: titleSpring,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 20px",
          backgroundColor: "rgba(0, 82, 143, 0.25)",
          border: "1px solid rgba(0, 196, 223, 0.35)",
          borderRadius: "999px",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "3px",
          color: "#00C4DF", // UA Cyan Accent
          textTransform: "uppercase",
          marginBottom: "20px",
        }}
      >
        EL BALANCE DE UNA NOCHE ÚNICA
      </div>

      <h2
        style={{
          fontSize: "54px",
          fontWeight: 700,
          letterSpacing: "-1.5px",
          lineHeight: 1.15,
          margin: "0 0 50px 0",
          background: "linear-gradient(180deg, #ffffff 40%, #c4d7e8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        El éxito de proteger y conectar momentos que importan.
      </h2>

      {/* Modern UA Glassmorphic KPI Cards */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        {metrics.map((m, i) => {
          const itemSpring = spring({
            frame: frame - (15 + i * 10),
            fps,
            config: { damping: 14 },
          });

          return (
            <div
              key={i}
              style={{
                transform: `translateY(${interpolate(Math.max(0, itemSpring), [0, 1], [30, 0])}px)`,
                opacity: Math.max(0, itemSpring),
                flex: 1,
                backgroundColor: "rgba(0, 36, 71, 0.5)", // UA Deep Navy
                border: "1px solid rgba(0, 196, 223, 0.25)",
                borderRadius: "24px",
                padding: "36px 20px",
                backdropFilter: "blur(18px)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "58px",
                  fontWeight: 800,
                  letterSpacing: "-2px",
                  color: m.color,
                  lineHeight: 1,
                  marginBottom: "12px",
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                  marginBottom: "6px",
                }}
              >
                {m.label}
              </div>
              <div style={{ fontSize: "14px", color: "#8fa3b5" }}>{m.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
