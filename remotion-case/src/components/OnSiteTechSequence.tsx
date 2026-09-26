import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const OnSiteTechSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const photo1Spring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const photo2Spring = spring({ frame: frame - 28, fps, config: { damping: 14 } });

  const photo1Scale = interpolate(frame, [0, 240], [1, 1.05]);
  const photo2Scale = interpolate(frame, [0, 240], [1.05, 1]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
        color: "#ffffff",
        padding: "0 120px",
        boxSizing: "border-box",
      }}
    >
      {/* Left Column: Human Story */}
      <div style={{ flex: 0.9, paddingRight: "50px" }}>
        <div
          style={{
            transform: `translateY(${interpolate(titleSpring, [0, 1], [20, 0])}px)`,
            opacity: titleSpring,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 18px",
            backgroundColor: "rgba(0, 82, 143, 0.25)",
            border: "1px solid rgba(0, 196, 223, 0.35)",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "3px",
            color: "#00C4DF", // UA Cyan Accent
            textTransform: "uppercase",
            marginBottom: "18px",
          }}
        >
          HOSPITALIDAD & REENCUENTRO
        </div>

        <h2
          style={{
            fontSize: "50px",
            fontWeight: 700,
            letterSpacing: "-1.5px",
            lineHeight: 1.12,
            margin: "0 0 20px 0",
            background: "linear-gradient(180deg, #ffffff 40%, #c4d7e8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          La calidez de reencontrarnos cara a cara.
        </h2>

        <p
          style={{
            fontSize: "19px",
            lineHeight: 1.6,
            color: "#8fa3b5",
            margin: "0 0 28px 0",
            maxWidth: "480px",
          }}
        >
          Más de 240 sonrisas en el foyer de Movie. Pop y gaseosa cortesía de Universal Assistance, acreditación ágil sin esperas y un espacio distendido diseñado para celebrar a nuestra comunidad.
        </p>

        <div style={{ display: "flex", gap: "28px" }}>
          <div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#ffffff", letterSpacing: "-1px" }}>
              +240
            </div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "2px" }}>
              Invitados en sala Movie
            </div>
          </div>
          <div style={{ width: "1px", height: "50px", backgroundColor: "rgba(255,255,255,0.15)" }} />
          <div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#00C4DF", letterSpacing: "-1px" }}>
              0 Filas
            </div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "2px" }}>
              Acceso ágil e instantáneo
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Two Real Event Photos (Apple-style staggered cards) */}
      <div
        style={{
          flex: 1.1,
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Photo 1: Welcoming & Foyer */}
        <div
          style={{
            transform: `scale(${Math.max(0, photo1Spring)}) translateY(${interpolate(
              Math.max(0, photo1Spring),
              [0, 1],
              [30, -10]
            )}px)`,
            opacity: Math.max(0, photo1Spring),
            width: "320px",
            height: "400px",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1px solid rgba(0, 196, 223, 0.3)",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 82, 143, 0.2)",
            position: "relative",
          }}
        >
          <Img
            src={staticFile("photos/photo_001.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${photo1Scale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: "16px 18px",
              background: "linear-gradient(180deg, transparent 0%, rgba(0, 24, 51, 0.95) 100%)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#00C4DF", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Universal Assistance
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginTop: "2px" }}>
              Recepción y acreditación ágil
            </div>
          </div>
        </div>

        {/* Photo 2: Guests & Ambiance */}
        <div
          style={{
            transform: `scale(${Math.max(0, photo2Spring)}) translateY(${interpolate(
              Math.max(0, photo2Spring),
              [0, 1],
              [40, 10]
            )}px)`,
            opacity: Math.max(0, photo2Spring),
            width: "320px",
            height: "400px",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1px solid rgba(0, 196, 223, 0.3)",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 82, 143, 0.2)",
            position: "relative",
          }}
        >
          <Img
            src={staticFile("photos/photo_002.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${photo2Scale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: "16px 18px",
              background: "linear-gradient(180deg, transparent 0%, rgba(0, 24, 51, 0.95) 100%)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#00E676", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Comunidad de Agencias
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginTop: "2px" }}>
              Los rostros del reencuentro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
