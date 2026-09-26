import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const MediaPRSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const cardSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const statsSpring = spring({ frame: frame - 28, fps, config: { damping: 14 } });

  const photoScale = interpolate(frame, [0, 240], [1.06, 1]);

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
        padding: "0 130px",
        boxSizing: "border-box",
      }}
    >
      {/* Left Column: Photo & Canal 4 Badge */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          transform: `scale(${Math.max(0, cardSpring)})`,
          opacity: Math.max(0, cardSpring),
        }}
      >
        <div
          style={{
            width: "500px",
            height: "330px",
            borderRadius: "28px",
            overflow: "hidden",
            border: "1px solid rgba(0, 196, 223, 0.3)",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 82, 143, 0.2)",
            position: "relative",
          }}
        >
          <Img
            src={staticFile("photos/photo_005.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${photoScale})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: "16px 22px",
              background: "linear-gradient(180deg, transparent 0%, rgba(0, 24, 51, 0.95) 100%)",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#00C4DF", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Universal Assistance · Cobertura Especial
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginTop: "2px" }}>
              Conducción digital y notas en el foyer de Movie
            </div>
          </div>
        </div>

        {/* Small sub-photo preview */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            backgroundColor: "rgba(0, 36, 71, 0.5)",
            border: "1px solid rgba(0, 196, 223, 0.25)",
            padding: "8px 20px",
            borderRadius: "14px",
            backdropFilter: "blur(16px)",
          }}
        >
          <div style={{ fontSize: "18px" }}>📺</div>
          <div style={{ fontSize: "14px", color: "#8fa3b5" }}>
            Media Partner Oficial: <strong style={{ color: "#ffffff" }}>Canal 4 (@canal4_uy)</strong>
          </div>
        </div>
      </div>

      {/* Right Column: Media Narrative & Concrete Numbers */}
      <div style={{ flex: 1.1, paddingLeft: "50px" }}>
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
          AMPLIFICACIÓN INSTITUCIONAL
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
          Universal Assistance en horario central y medios masivos.
        </h2>

        <p
          style={{
            fontSize: "19px",
            lineHeight: 1.6,
            color: "#8fa3b5",
            margin: "0 0 28px 0",
            maxWidth: "520px",
          }}
        >
          Salida estelar en el <strong style={{ color: "#ffffff" }}>Informativo Central (Telenoche)</strong> de Canal 4 en el segmento de empresas y turismo, complementada con cobertura digital y entrevistas exclusivas en redes sociales.
        </p>

        {/* Concrete Numbers Row */}
        <div
          style={{
            transform: `translateY(${interpolate(Math.max(0, statsSpring), [0, 1], [20, 0])}px)`,
            opacity: Math.max(0, statsSpring),
            display: "flex",
            gap: "28px",
          }}
        >
          <div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#ffffff", letterSpacing: "-1px" }}>
              Canal 4
            </div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "2px" }}>
              Prime Time Telenoche
            </div>
          </div>

          <div style={{ width: "1px", height: "50px", backgroundColor: "rgba(255,255,255,0.15)" }} />

          <div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#00C4DF", letterSpacing: "-1px" }}>
              515K+
            </div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "2px" }}>
              Audiencia Redes (@canal4_uy)
            </div>
          </div>

          <div style={{ width: "1px", height: "50px", backgroundColor: "rgba(255,255,255,0.15)" }} />

          <div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#00E676", letterSpacing: "-1px" }}>
              En Vivo
            </div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "2px" }}>
              Digital Host & Reels
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
