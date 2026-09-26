import React from "react";
import { Img, staticFile } from "remotion";

export const Canal4Badge: React.FC<{ height?: number }> = ({ height = 40 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <svg
        width={height}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
      >
        <rect width="100" height="100" rx="20" fill="#061224" />
        {/* Facets */}
        <path d="M 20 18 L 50 18 L 50 50 L 16 50 L 16 22 A 4 4 0 0 1 20 18 Z" fill="#E52421" />
        <path d="M 50 18 L 80 18 A 4 4 0 0 1 84 22 L 84 50 L 50 50 Z" fill="#F37023" />
        <path d="M 16 50 L 50 50 L 50 84 L 20 84 A 4 4 0 0 1 16 80 Z" fill="#00528F" />
        <path d="M 50 50 L 84 50 L 84 80 A 4 4 0 0 1 80 84 L 50 84 Z" fill="#00C4DF" />
        {/* Bold White Number '4' */}
        <path
          d="M 60 28 L 36 60 L 64 60 M 60 28 L 60 74"
          stroke="#ffffff"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="miter"
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
        <span style={{ fontSize: "17px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px", lineHeight: 1 }}>
          CANAL 4
        </span>
        <span style={{ fontSize: "10px", fontWeight: 600, color: "#86868b", letterSpacing: "1.5px", marginTop: "3px" }}>
          MEDIA PARTNER
        </span>
      </div>
    </div>
  );
};

export const PartnerLogos: React.FC<{ style?: React.CSSProperties; logoHeight?: number }> = ({
  style,
  logoHeight = 36,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "48px",
        padding: "14px 36px",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "999px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        ...style,
      }}
    >
      {/* 1. Universal Assistance */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Img
          src={staticFile("logos/logo-ua-white.png")}
          style={{ height: `${logoHeight}px`, width: "auto", objectFit: "contain" }}
        />
      </div>

      <div style={{ width: "1px", height: "30px", backgroundColor: "rgba(255, 255, 255, 0.18)" }} />

      {/* 2. Movie */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Img
          src={staticFile("logos/movie.svg")}
          style={{ height: `${logoHeight * 0.95}px`, width: "auto", objectFit: "contain" }}
        />
      </div>

      <div style={{ width: "1px", height: "30px", backgroundColor: "rgba(255, 255, 255, 0.18)" }} />

      {/* 3. Canal 4 */}
      <Canal4Badge height={logoHeight * 1.05} />
    </div>
  );
};
