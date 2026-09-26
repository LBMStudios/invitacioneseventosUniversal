import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PartnerLogos } from "./PartnerLogos";

export const IntroSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandSpring = spring({ frame, fps, config: { damping: 16 } });
  const titleSpring = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  const subSpring = spring({ frame: frame - 36, fps, config: { damping: 14 } });
  const logosSpring = spring({ frame: frame - 52, fps, config: { damping: 14 } });

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
      }}
    >
      {/* Brand Header Pill */}
      <div
        style={{
          transform: `translateY(${interpolate(brandSpring, [0, 1], [20, 0])}px)`,
          opacity: brandSpring,
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 24px",
          backgroundColor: "rgba(0, 36, 71, 0.6)", // UA Deep Navy
          border: "1px solid rgba(0, 196, 223, 0.3)", // UA Cyan border
          borderRadius: "999px",
          boxShadow: "0 0 25px rgba(0, 196, 223, 0.15)",
          marginBottom: "26px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "#ffffff",
            textTransform: "uppercase",
          }}
        >
          Universal Assistance
        </span>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            color: "#00C4DF", // Official Cyan Accent
            textTransform: "uppercase",
          }}
        >
          A Company of Zurich
        </span>
      </div>

      {/* Main Statement */}
      <h1
        style={{
          transform: `translateY(${interpolate(Math.max(0, titleSpring), [0, 1], [30, 0])}px)`,
          opacity: Math.max(0, titleSpring),
          fontSize: "66px",
          fontWeight: 700,
          letterSpacing: "-1.5px",
          margin: "0 0 20px 0",
          lineHeight: 1.12,
          maxWidth: "1250px",
          background: "linear-gradient(180deg, #ffffff 40%, #c4d7e8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Bienvenidos a bordo de la experiencia Universal Assistance.
      </h1>

      <p
        style={{
          transform: `translateY(${interpolate(Math.max(0, subSpring), [0, 1], [25, 0])}px)`,
          opacity: Math.max(0, subSpring),
          fontSize: "26px",
          fontWeight: 400,
          color: "#99abbd",
          letterSpacing: "-0.5px",
          margin: "0 0 40px 0",
        }}
      >
        El reencuentro exclusivo de la comunidad turística y corporativa en Movie Montevideo Shopping.
      </p>

      {/* Partner Logos Lockup (Universal, Movie, Canal 4) */}
      <div
        style={{
          transform: `translateY(${interpolate(Math.max(0, logosSpring), [0, 1], [30, 0])}px) scale(${Math.max(
            0,
            logosSpring
          )})`,
          opacity: Math.max(0, logosSpring),
        }}
      >
        <PartnerLogos logoHeight={36} />
      </div>
    </div>
  );
};
