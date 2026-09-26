import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface SceneTransitionProps {
  children: React.ReactNode;
  durationInFrames: number;
  transitionFrames?: number;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  children,
  durationInFrames,
  transitionFrames = 20,
}) => {
  const frame = useCurrentFrame();

  // Entrance: scale from 1.05 to 1.0, blur from 8px to 0px, fade from 0 to 1
  const enterOpacity = interpolate(frame, [0, transitionFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterScale = interpolate(frame, [0, transitionFrames], [1.04, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterBlur = interpolate(frame, [0, transitionFrames], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit: scale from 1.0 to 0.96, blur from 0px to 8px, fade from 1 to 0
  const exitStart = durationInFrames - transitionFrames;
  const exitOpacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitScale = interpolate(frame, [exitStart, durationInFrames], [1.0, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitBlur = interpolate(frame, [exitStart, durationInFrames], [0, 8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = enterOpacity * exitOpacity;
  const scale = enterScale * exitScale;
  const blur = Math.max(enterBlur, exitBlur);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity,
        transform: `scale(${scale})`,
        filter: blur > 0.2 ? `blur(${blur}px)` : "none",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {children}
    </div>
  );
};
