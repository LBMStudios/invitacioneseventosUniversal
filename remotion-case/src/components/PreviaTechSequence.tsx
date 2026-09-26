import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const PreviaTechSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const cardSpring = spring({ frame: frame - 16, fps, config: { damping: 14 } });

  // Dynamic QR laser scan animation
  const scanProgress = interpolate(frame % 90, [0, 45, 90], [0, 160, 0]);

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
        padding: "0 140px",
        boxSizing: "border-box",
      }}
    >
      {/* Left Column: Story & Concept */}
      <div style={{ flex: 1.15, paddingRight: "60px" }}>
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
            marginBottom: "20px",
          }}
        >
          EXPERIENCIA DIGITAL & FLUIDA
        </div>

        <h2
          style={{
            fontSize: "54px",
            fontWeight: 700,
            letterSpacing: "-1.5px",
            lineHeight: 1.14,
            margin: "0 0 22px 0",
            background: "linear-gradient(180deg, #ffffff 40%, #c4d7e8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Todo comenzó en la palma de su mano.
        </h2>

        <p
          style={{
            fontSize: "21px",
            lineHeight: 1.6,
            color: "#8fa3b5",
            margin: "0 0 32px 0",
            maxWidth: "580px",
          }}
        >
          Una invitación personalizada para cada socio y directivo. Un solo toque para confirmar asistencia y la de su acompañante, generando al instante su pase de embarque VIP intransferible.
        </p>

        <div style={{ display: "flex", gap: "28px" }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>Confirmación RSVP en 1-Tap</div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "3px" }}>Asignación de butacas en tiempo real</div>
          </div>
          <div style={{ width: "1px", height: "42px", backgroundColor: "rgba(255,255,255,0.15)" }} />
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#00C4DF" }}>Pase VIP Inteligente</div>
            <div style={{ fontSize: "14px", color: "#8fa3b5", marginTop: "3px" }}>Código QR intransferible y dinámico</div>
          </div>
        </div>
      </div>

      {/* Right Column: Universal Assistance VIP Boarding Pass Card */}
      <div
        style={{
          flex: 0.85,
          display: "flex",
          justifyContent: "center",
          transform: `scale(${Math.max(0, cardSpring)}) translateY(${interpolate(
            Math.max(0, cardSpring),
            [0, 1],
            [40, 0]
          )}px)`,
          opacity: Math.max(0, cardSpring),
        }}
      >
        <div
          style={{
            width: "370px",
            backgroundColor: "rgba(0, 30, 61, 0.85)", // UA Deep Navy
            borderRadius: "30px",
            border: "1px solid rgba(0, 196, 223, 0.35)",
            boxShadow: "0 35px 90px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 196, 223, 0.2)",
            padding: "28px 24px",
            backdropFilter: "blur(20px)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Card Top Brand Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <Img
              src={staticFile("logos/logo-ua-white.png")}
              style={{ height: "22px", width: "auto", objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "2px",
                color: "#00C4DF",
                textTransform: "uppercase",
              }}
            >
              A Company of Zurich
            </span>
          </div>

          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "#8fa3b5",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Pase de Acceso Exclusivo
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "18px",
              letterSpacing: "-0.5px",
            }}
          >
            Función Especial Movie
          </div>

          {/* QR Code Container with Animated Laser Scanner */}
          <div
            style={{
              width: "180px",
              height: "180px",
              margin: "0 auto 18px auto",
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              position: "relative",
              overflow: "hidden",
              padding: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* SVG High-Tech QR Pattern */}
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {/* Corner markers */}
              <rect x="0" y="0" width="30" height="30" rx="6" fill="#001E3D" />
              <rect x="6" y="6" width="18" height="18" rx="3" fill="#ffffff" />
              <rect x="10" y="10" width="10" height="10" rx="2" fill="#001E3D" />

              <rect x="70" y="0" width="30" height="30" rx="6" fill="#001E3D" />
              <rect x="76" y="6" width="18" height="18" rx="3" fill="#ffffff" />
              <rect x="80" y="10" width="10" height="10" rx="2" fill="#001E3D" />

              <rect x="0" y="70" width="30" height="30" rx="6" fill="#001E3D" />
              <rect x="6" y="76" width="18" height="18" rx="3" fill="#ffffff" />
              <rect x="10" y="80" width="10" height="10" rx="2" fill="#001E3D" />

              {/* Data matrix dots */}
              <rect x="36" y="10" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="48" y="10" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="36" y="24" width="8" height="8" rx="2" fill="#00528F" />
              <rect x="52" y="24" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="12" y="38" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="24" y="38" width="8" height="8" rx="2" fill="#00528F" />
              <rect x="40" y="38" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="52" y="38" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="68" y="38" width="8" height="8" rx="2" fill="#00528F" />
              <rect x="80" y="38" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="36" y="52" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="48" y="52" width="8" height="8" rx="2" fill="#00528F" />
              <rect x="64" y="52" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="36" y="66" width="8" height="8" rx="2" fill="#00528F" />
              <rect x="48" y="66" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="70" y="66" width="8" height="8" rx="2" fill="#001E3D" />
              <rect x="82" y="80" width="8" height="8" rx="2" fill="#00528F" />
            </svg>

            {/* Glowing Laser Scan Line */}
            <div
              style={{
                position: "absolute",
                top: `${scanProgress}px`,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent 0%, #00C4DF 50%, transparent 100%)",
                boxShadow: "0 0 12px #00C4DF, 0 0 24px #00C4DF",
              }}
            />
          </div>

          <div style={{ fontSize: "15px", color: "#ffffff", fontWeight: 700, marginBottom: "4px" }}>
            Movie Montevideo Shopping
          </div>
          <div style={{ fontSize: "13px", color: "#8fa3b5", marginBottom: "16px" }}>
            Sala Exclusiva · 2 Butacas VIP
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              backgroundColor: "rgba(0, 230, 118, 0.15)",
              border: "1px solid rgba(0, 230, 118, 0.4)",
              borderRadius: "999px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#00E676",
                boxShadow: "0 0 8px #00E676",
              }}
            />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#00E676", letterSpacing: "1.5px" }}>
              CONFIRMADO · ACCESO SIN FILAS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
