import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const BrandBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Gentle, slow atmospheric breathing light (Apple keynote style)
  const glowOpacity = interpolate(frame, [0, 750, 1500], [0.25, 0.45, 0.25]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Top subtle blue ambient light */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1400px",
          height: "800px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(0, 82, 143, 0.45) 0%, rgba(0, 0, 0, 0) 70%)",
          opacity: glowOpacity,
          filter: "blur(120px)",
        }}
      />

      {/* Subtle bottom-right warm cyan tint */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "900px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 196, 223, 0.15) 0%, rgba(0, 0, 0, 0) 65%)",
          filter: "blur(140px)",
        }}
      />
    </div>
  );
};
