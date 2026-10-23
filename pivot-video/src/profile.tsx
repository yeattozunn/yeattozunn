import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { C, display } from "./theme";
import { useFonts } from "./Composition";

// Instagram profile picture: the pivot mark alone, sized for the circular crop (safe area ~70%).
const ProfilePic: React.FC<{ wordmark: boolean }> = ({ wordmark }) => {
  useFonts();
  return (
    <AbsoluteFill
      lang="tr"
      style={{
        background: `radial-gradient(75% 60% at 50% 0%, rgba(190,215,235,0.30) 0%, transparent 70%), linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
      }}
    >
      <svg width={wordmark ? 520 : 760} height={wordmark ? 520 : 760} viewBox="0 0 60 60">
        <line x1="8" y1="30" x2="52" y2="30" stroke={C.white} strokeWidth="1.6" opacity="0.3" />
        <line x1="8" y1="30" x2="52" y2="30" stroke={C.ice} strokeWidth="2.8" strokeLinecap="round" transform="rotate(-36 30 30)" />
        <circle cx="30" cy="30" r="6.2" fill={C.white} />
      </svg>
      {wordmark ? <div style={{ ...display(190), color: C.white, marginTop: -90 }}>Pivot</div> : null}
    </AbsoluteFill>
  );
};

export const ProfileCompositions: React.FC = () => (
  <>
    <Composition id="ProfileMark" component={ProfilePic} durationInFrames={1} fps={30} width={1080} height={1080} defaultProps={{ wordmark: false }} />
    <Composition id="ProfileWordmark" component={ProfilePic} durationInFrames={1} fps={30} width={1080} height={1080} defaultProps={{ wordmark: true }} />
  </>
);
