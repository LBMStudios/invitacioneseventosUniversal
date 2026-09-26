import React from "react";
import { Img, staticFile } from "remotion";

export const UniversalHeader: React.FC<{
  chapterTitle?: string;
  style?: React.CSSProperties;
}> = ({ chapterTitle = "GALA EXCLUSIVA · MOVIE MONTEVIDEO SHOPPING", style }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 36,
        left: 90,
        right: 90,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
        pointerEvents: "none",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
        ...style,
      }}
    >
      {/* Left: Official Universal Assistance Brand Lockup */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "8px 18px",
          backgroundColor: "rgba(0, 36, 71, 0.45)", // UA Deep Navy with blur
          border: "1px solid rgba(0, 196, 223, 0.2)", // Subtle UA Cyan border
          borderRadius: "999px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Img
          src={staticFile("logos/logo-ua-white.png")}
          style={{ height: "20px", width: "auto", objectFit: "contain" }}
        />
        <div style={{ width: "1px", height: "16px", backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "2.5px",
            color: "#00C4DF", // Official Cyan Accent
            textTransform: "uppercase",
          }}
        >
          A Company of Zurich
        </span>
      </div>

      {/* Right: Event Chapter Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 18px",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "999px",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: "#00E676", // UA Mint green live dot
            boxShadow: "0 0 10px #00E676",
          }}
        />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "2px",
            color: "#a1a1a6",
            textTransform: "uppercase",
          }}
        >
          {chapterTitle}
        </span>
      </div>
    </div>
  );
};
