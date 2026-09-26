import React from "react";
import { Composition } from "remotion";
import { CaseStudyVideo } from "./CaseStudyVideo";
import { CaseStudyVerticalVideo } from "./CaseStudyVerticalVideo";
import { FPS } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Master Landscape Composition (16:9 / 1920x1080) - 46s Apple Keynote Experience */}
      <Composition
        id="CaseStudy"
        component={CaseStudyVideo}
        durationInFrames={1380}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* Vertical Composition (9:16 / 1080x1920) for Reels and TikTok */}
      <Composition
        id="CaseStudyVertical"
        component={CaseStudyVerticalVideo}
        durationInFrames={600}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
