import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PartnerLogos } from "./PartnerLogos";

export const OutroSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 15 } });
  const sloganSpring = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  const logosSpring = spring({ frame: frame - 38, fps, config: { damping: 14 } });

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
      {/* Universal Assistance Radiant Logo */}
      <div
        style={{
          transform: `scale(${Math.max(0, titleSpring)}) translateY(${interpolate(
            Math.max(0, titleSpring),
            [0, 1],
            [30, 0]
          )}px)`,
          opacity: Math.max(0, titleSpring),
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* Subtle cyan radiant aura behind logo */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "380px",
              height: "120px",
              background: "radial-gradient(ellipse, rgba(0, 196, 223, 0.4) 0%, rgba(0, 82, 143, 0) 70%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />
          <Img
            src={staticFile("logos/logo-ua-white.png")}
            style={{ height: "64px", width: "auto", objectFit: "contain", position: "relative", zIndex: 1 }}
          />
        </div>
      </div>

      {/* Official Slogan & Zurich Endorsement */}
      <div
        style={{
          transform: `translateY(${interpolate(Math.max(0, sloganSpring), [0, 1], [30, 0])}px)`,
          opacity: Math.max(0, sloganSpring),
          marginBottom: "46px",
        }}
      >
        <h2
          style={{
            fontSize: "42px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: "#ffffff",
            margin: "0 0 14px 0",
            textTransform: "uppercase",
            background: "linear-gradient(180deg, #ffffff 40%, #00C4DF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Tu viaje es tu viaje. Nosotros lo protegemos.
        </h2>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "4px",
            color: "#00C4DF", // UA Cyan
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          A Company of Zurich
        </div>
      </div>

      {/* Partner Logos Lockup (Universal Assistance, Movie, Canal 4) */}
      <div
        style={{
          transform: `scale(${Math.max(0, logosSpring)}) translateY(${interpolate(
            Math.max(0, logosSpring),
            [0, 1],
            [30, 0]
          )}px)`,
          opacity: Math.max(0, logosSpring),
        }}
      >
        <PartnerLogos logoHeight={40} />
      </div>
    </div>
  );
};
