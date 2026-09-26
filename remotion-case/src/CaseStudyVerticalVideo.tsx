import React from "react";
import { Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandBackground } from "./components/BrandBackground";
import { BRAND, DURATIONS } from "./constants";

// Vertical components tailored for 1080x1920 (Reels / TikTok / Stories)
const VerticalIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeSpring = spring({ frame, fps, config: { damping: 14 } });
  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 12 } });

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
        padding: "0 60px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Poppins', sans-serif",
        color: BRAND.white,
      }}
    >
      <div
        style={{
          transform: `scale(${badgeSpring})`,
          opacity: badgeSpring,
          display: "inline-block",
          padding: "10px 24px",
          borderRadius: "999px",
          backgroundColor: "rgba(0, 196, 223, 0.15)",
          border: `1.5px solid ${BRAND.cyan}`,
          color: BRAND.cyan,
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "3px",
          textTransform: "uppercase",
          marginBottom: "30px",
        }}
      >
        ⚡ LBM STUDIOS PRESENTA
      </div>
      <h1
        style={{
          transform: `scale(${Math.max(0, titleSpring)})`,
          opacity: Math.max(0, titleSpring),
          fontSize: "68px",
          fontWeight: 900,
          letterSpacing: "2px",
          margin: "0 0 20px 0",
          background: `linear-gradient(135deg, #fff 30%, ${BRAND.cyan} 90%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        UNIVERSAL ASSISTANCE
      </h1>
      <div style={{ fontSize: "22px", fontWeight: 700, color: "#94a3b8", letterSpacing: "3px", marginBottom: "30px" }}>
        A COMPANY OF ZURICH
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: BRAND.pink,
          border: `2px solid ${BRAND.pink}`,
          borderRadius: "16px",
          padding: "14px 28px",
          backgroundColor: "rgba(255, 67, 110, 0.1)",
        }}
      >
        CASE STUDY · CINEMA EXPERIENCE
      </div>
    </div>
  );
};

const VerticalChallenge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 12 } });

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
        padding: "0 60px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Poppins', sans-serif",
        color: BRAND.white,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 22px",
          borderRadius: "999px",
          backgroundColor: "rgba(255, 67, 110, 0.15)",
          border: `1.5px solid ${BRAND.pink}`,
          color: BRAND.pink,
          fontSize: "18px",
          fontWeight: 800,
          letterSpacing: "3px",
          marginBottom: "30px",
        }}
      >
        01 · EL DESAFÍO
      </div>
      <h2
        style={{
          transform: `translateY(${interpolate(Math.max(0, titleSpring), [0, 1], [30, 0])}px)`,
          opacity: Math.max(0, titleSpring),
          fontSize: "52px",
          fontWeight: 900,
          lineHeight: 1.25,
          margin: "0 0 50px 0",
        }}
      >
        ¿Cómo recibir a más de{" "}
        <span style={{ color: BRAND.cyan }}>240 líderes B2B</span> sin filas ni listas en papel?
      </h2>
      <div
        style={{
          backgroundColor: "rgba(0, 196, 223, 0.1)",
          border: `2px solid ${BRAND.cyan}`,
          borderRadius: "24px",
          padding: "36px",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "left",
        }}
      >
        <div style={{ color: BRAND.cyan, fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
          ✓ SOLUCIÓN PHYGITAL
        </div>
        <div style={{ fontSize: "24px", color: "#fff", lineHeight: "1.6" }}>
          Desarrollo de plataforma propietaria con invitaciones interactivas, confirmación RSVP y e-tickets con QR individual.
        </div>
      </div>
    </div>
  );
};

const VerticalResults: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [15, 60], [0, 240], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

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
        padding: "0 60px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Poppins', sans-serif",
        color: BRAND.white,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 22px",
          borderRadius: "999px",
          backgroundColor: "rgba(0, 196, 223, 0.15)",
          border: `1.5px solid ${BRAND.cyan}`,
          color: BRAND.cyan,
          fontSize: "18px",
          fontWeight: 800,
          letterSpacing: "3px",
          marginBottom: "40px",
        }}
      >
        LOS RESULTADOS
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
        <div
          style={{
            backgroundColor: "rgba(11, 33, 73, 0.9)",
            border: `2px solid ${BRAND.cyan}`,
            borderRadius: "24px",
            padding: "28px",
          }}
        >
          <div style={{ fontSize: "56px", fontWeight: 900, color: BRAND.cyan }}>+{count}</div>
          <div style={{ fontSize: "20px", fontWeight: 800 }}>ASISTENTES ACREDITADOS</div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(11, 33, 73, 0.9)",
            border: `2px solid ${BRAND.pink}`,
            borderRadius: "24px",
            padding: "28px",
          }}
        >
          <div style={{ fontSize: "56px", fontWeight: 900, color: BRAND.pink }}>CANAL 4</div>
          <div style={{ fontSize: "20px", fontWeight: 800 }}>INFORMATIVO CENTRAL (PRIME TIME)</div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(11, 33, 73, 0.9)",
            border: `2px solid ${BRAND.mint}`,
            borderRadius: "24px",
            padding: "28px",
          }}
        >
          <div style={{ fontSize: "56px", fontWeight: 900, color: BRAND.mint }}>0 FILAS</div>
          <div style={{ fontSize: "20px", fontWeight: 800 }}>ACCESO ÁGIL POR INVITADO</div>
        </div>
      </div>
    </div>
  );
};

export const CaseStudyVerticalVideo: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: BRAND.bg,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("master-soundtrack.wav")} volume={0.8} />
      <BrandBackground />
      <Sequence from={0} durationInFrames={180}>
        <VerticalIntro />
      </Sequence>
      <Sequence from={180} durationInFrames={200}>
        <VerticalChallenge />
      </Sequence>
      <Sequence from={380} durationInFrames={220}>
        <VerticalResults />
      </Sequence>
    </div>
  );
};
