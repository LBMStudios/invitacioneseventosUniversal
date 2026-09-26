import React from "react";
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BrandBackground } from "./components/BrandBackground";
import { SceneTransition } from "./components/SceneTransition";
import { UniversalHeader } from "./components/UniversalHeader";
import { IntroSequence } from "./components/IntroSequence";
import { ChallengeSequence } from "./components/ChallengeSequence";
import { PreviaTechSequence } from "./components/PreviaTechSequence";
import { OnSiteTechSequence } from "./components/OnSiteTechSequence";
import { MediaPRSequence } from "./components/MediaPRSequence";
import { MetricsSequence } from "./components/MetricsSequence";
import { OutroSequence } from "./components/OutroSequence";

export const CaseStudyVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Overlapping scene timings with 20 frames (0.66s) Apple-style blur cross-dissolve:
  const introDuration = 180;
  const challengeDuration = 180;
  const previaDuration = 230;
  const onSiteDuration = 240;
  const mediaDuration = 240;
  const metricsDuration = 230;
  const outroDuration = 200;

  const overlap = 20;

  const t0 = 0;
  const t1 = t0 + introDuration - overlap;          // 160
  const t2 = t1 + challengeDuration - overlap;      // 320
  const t3 = t2 + previaDuration - overlap;         // 530
  const t4 = t3 + onSiteDuration - overlap;         // 750
  const t5 = t4 + mediaDuration - overlap;          // 970
  const t6 = t5 + metricsDuration - overlap;        // 1180
  const totalFrames = 1380;                         // 46.0 seconds

  // Dynamic header chapter title based on current sequence
  let currentChapter = "GALA EXCLUSIVA · EL REENCUENTRO";
  if (frame >= t2 && frame < t3) {
    currentChapter = "INVITACIÓN DIGITAL · EXPERIENCIA VIP";
  } else if (frame >= t3 && frame < t4) {
    currentChapter = "HOSPITALIDAD & NETWORKING · FOYER MOVIE";
  } else if (frame >= t4 && frame < t5) {
    currentChapter = "COBERTURA MEDIÁTICA · PRIME TIME CANAL 4";
  } else if (frame >= t5) {
    currentChapter = "IMPACTO INSTITUCIONAL · COMUNIDAD UA";
  }

  // Header fade-in after Intro (160..185) and fade-out before Outro (1155..1180)
  const headerOpacity = interpolate(
    frame,
    [160, 185, 1150, 1180],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Cinematic end fade out to black (frames 1340 to 1378, reaching 100% black at end)
  const endFadeOutOpacity = interpolate(
    frame,
    [1340, 1378],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#000000",
      }}
    >
      {/* Master Soundtrack with Captain Airplane Announcement, Ducking, and End Fade-Out */}
      <Audio src={staticFile("master-soundtrack.wav")} volume={0.9} />

      {/* Atmospheric Ambient Background */}
      <BrandBackground />

      {/* Persistent Glassmorphic Universal Assistance Brand Header */}
      {headerOpacity > 0 && (
        <UniversalHeader
          chapterTitle={currentChapter}
          style={{ opacity: headerOpacity }}
        />
      )}

      {/* Sequence 1: Intro */}
      <Sequence from={t0} durationInFrames={introDuration}>
        <SceneTransition durationInFrames={introDuration} transitionFrames={overlap}>
          <IntroSequence />
        </SceneTransition>
      </Sequence>

      {/* Sequence 2: Challenge & Storytelling */}
      <Sequence from={t1} durationInFrames={challengeDuration}>
        <SceneTransition durationInFrames={challengeDuration} transitionFrames={overlap}>
          <ChallengeSequence />
        </SceneTransition>
      </Sequence>

      {/* Sequence 3: Previa & E-Tickets VIP Boarding Pass */}
      <Sequence from={t2} durationInFrames={previaDuration}>
        <SceneTransition durationInFrames={previaDuration} transitionFrames={overlap}>
          <PreviaTechSequence />
        </SceneTransition>
      </Sequence>

      {/* Sequence 4: On-Site Experience & Networking */}
      <Sequence from={t3} durationInFrames={onSiteDuration}>
        <SceneTransition durationInFrames={onSiteDuration} transitionFrames={overlap}>
          <OnSiteTechSequence />
        </SceneTransition>
      </Sequence>

      {/* Sequence 5: Media PR & Canal 4 */}
      <Sequence from={t4} durationInFrames={mediaDuration}>
        <SceneTransition durationInFrames={mediaDuration} transitionFrames={overlap}>
          <MediaPRSequence />
        </SceneTransition>
      </Sequence>

      {/* Sequence 6: Results & Metrics */}
      <Sequence from={t5} durationInFrames={metricsDuration}>
        <SceneTransition durationInFrames={metricsDuration} transitionFrames={overlap}>
          <MetricsSequence />
        </SceneTransition>
      </Sequence>

      {/* Sequence 7: Outro Finale */}
      <Sequence from={t6} durationInFrames={outroDuration}>
        <SceneTransition durationInFrames={outroDuration} transitionFrames={overlap}>
          <OutroSequence />
        </SceneTransition>
      </Sequence>

      {/* Final Cinematic Fade-out to Black */}
      {endFadeOutOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#000000",
            opacity: endFadeOutOpacity,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
