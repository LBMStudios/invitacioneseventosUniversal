import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const ChallengeSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const subSpring = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  const blockSpring = spring({ frame: frame - 36, fps, config: { damping: 14 } });

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
        padding: "0 120px",
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
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "3px",
          color: "#00C4DF", // Official UA Cyan Accent
          textTransform: "uppercase",
          marginBottom: "26px",
        }}
      >
        <span>REENCUENTRO & HOSPITALIDAD</span>
      </div>

      <h2
        style={{
          transform: `translateY(${interpolate(Math.max(0, subSpring), [0, 1], [30, 0])}px)`,
          opacity: Math.max(0, subSpring),
          fontSize: "58px",
          fontWeight: 700,
          letterSpacing: "-1.5px",
          lineHeight: 1.15,
          margin: "0 0 24px 0",
          maxWidth: "1160px",
          background: "linear-gradient(180deg, #ffffff 50%, #c4d7e8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        La mejor tecnología es la que cuida cada detalle para que lo humano sea protagonista.
      </h2>

      <p
        style={{
          transform: `translateY(${interpolate(Math.max(0, subSpring), [0, 1], [20, 0])}px)`,
          opacity: Math.max(0, subSpring),
          fontSize: "22px",
          lineHeight: 1.6,
          color: "#8fa3b5",
          maxWidth: "920px",
          margin: "0 auto 44px auto",
        }}
      >
        Universal Assistance reunió a la comunidad de agencias de viajes y corporativos de Uruguay para una noche inolvidable en Movie, con un acceso ágil, seguro y 100% libre de fricciones.
      </p>

      <div
        style={{
          transform: `translateY(${interpolate(Math.max(0, blockSpring), [0, 1], [20, 0])}px)`,
          opacity: Math.max(0, blockSpring),
          display: "flex",
          gap: "64px",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px 48px",
          backgroundColor: "rgba(0, 36, 71, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          backdropFilter: "blur(16px)",
        }}
      >
        <div>
          <div style={{ fontSize: "44px", fontWeight: 700, color: "#ffffff", letterSpacing: "-1px" }}>
            +240
          </div>
          <div style={{ fontSize: "15px", color: "#8fa3b5", marginTop: "4px", fontWeight: 500 }}>
            Líderes y Partners convocados
          </div>
        </div>

        <div style={{ width: "1px", height: "60px", backgroundColor: "rgba(255,255,255,0.15)" }} />

        <div>
          <div style={{ fontSize: "44px", fontWeight: 700, color: "#00C4DF", letterSpacing: "-1px" }}>
            0 Filas
          </div>
          <div style={{ fontSize: "15px", color: "#8fa3b5", marginTop: "4px", fontWeight: 500 }}>
            Acreditación ágil e instantánea
          </div>
        </div>

        <div style={{ width: "1px", height: "60px", backgroundColor: "rgba(255,255,255,0.15)" }} />

        <div>
          <div style={{ fontSize: "44px", fontWeight: 700, color: "#00E676", letterSpacing: "-1px" }}>
            100%
          </div>
          <div style={{ fontSize: "15px", color: "#8fa3b5", marginTop: "4px", fontWeight: 500 }}>
            Protección & Hospitalidad
          </div>
        </div>
      </div>
    </div>
  );
};
