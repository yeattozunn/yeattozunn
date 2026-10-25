import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  continueRender,
  delayRender,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Caption, Grain } from "./parts";
import { Chances, Goals, Possession, Reveal, Shots, Simulation, Outro } from "./scenes";
import { FPS, H, W } from "./theme";
import { SCENES, TOTAL } from "./timeline";
import { CAPTIONS, VO } from "./captions";
import { DERBY_TOTAL, DerbyReel } from "./derby";
import { L2_TOTAL, Lille2Reel } from "./lille2";
import { BJ_TOTAL, BjkReel } from "./bjk";
import { BT_TOTAL, BatrakovReel } from "./batrakov";
import { D2_TOTAL, Derby2Reel } from "./derby2";
import { TZ_TOTAL, TeaserReel } from "./teaser";

export const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 100px "Archivo Variable"'),
      document.fonts.load('300 100px "Archivo Variable"'),
      document.fonts.load('600 40px "Geist Variable"'),
      document.fonts.load('400 20px "Geist Mono Variable"'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = CAPTIONS.find((p) => t >= p.words[0].s - 0.12 && t < p.words[p.words.length - 1].e + 0.35);
  if (!c) return null;
  const from = c.words[0].s - 0.12;
  const to = c.words[c.words.length - 1].e + 0.35;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const PivotReel: React.FC<{ voice?: string }> = ({ voice }) => {
  useFonts();
  return (
    <AbsoluteFill lang="tr" style={{ background: "#0b0c0e" }}>
      <Sequence from={SCENES.possession.from} durationInFrames={SCENES.possession.dur}><Possession /></Sequence>
      <Sequence from={SCENES.shots.from} durationInFrames={SCENES.shots.dur}><Shots /></Sequence>
      <Sequence from={SCENES.reveal.from} durationInFrames={SCENES.reveal.dur}><Reveal /></Sequence>
      <Sequence from={SCENES.sim.from} durationInFrames={SCENES.sim.dur}><Simulation /></Sequence>
      <Sequence from={SCENES.goals.from} durationInFrames={SCENES.goals.dur}><Goals /></Sequence>
      <Sequence from={SCENES.chances.from} durationInFrames={SCENES.chances.dur}><Chances /></Sequence>
      <Sequence from={SCENES.outro.from} durationInFrames={SCENES.outro.dur}><Outro /></Sequence>
      <Captions />
      <Grain />
      <Audio src={staticFile("score.wav")} volume={voice ? 0.5 : 1} />
      {voice ? (
        <>
          <Sequence from={Math.round(VO.a * FPS)} durationInFrames={Math.round(VO.split * FPS)}>
            <Audio src={staticFile(voice)} />
          </Sequence>
          <Sequence from={Math.round((VO.split + VO.b) * FPS)}>
            <Audio src={staticFile(voice)} trimBefore={Math.round(VO.split * FPS)} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC = () => (
  <Composition
    id="PivotLilleGS"
    component={PivotReel}
    durationInFrames={TOTAL}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{ voice: "voice.mp3" as string | undefined }}
  />
);

const DerbyWithFonts: React.FC = () => {
  useFonts();
  return <DerbyReel />;
};

export const DerbyComposition: React.FC = () => (
  <Composition id="PivotDerbyGSFB" component={DerbyWithFonts} durationInFrames={DERBY_TOTAL} fps={FPS} width={W} height={H} />
);

const Lille2WithFonts: React.FC = () => {
  useFonts();
  return <Lille2Reel />;
};

export const Lille2Composition: React.FC = () => (
  <Composition id="PivotLilleGS2" component={Lille2WithFonts} durationInFrames={L2_TOTAL} fps={FPS} width={W} height={H} />
);

const BjkWithFonts: React.FC = () => {
  useFonts();
  return <BjkReel />;
};

export const BjkComposition: React.FC = () => (
  <Composition id="PivotBjkPalace" component={BjkWithFonts} durationInFrames={BJ_TOTAL} fps={FPS} width={W} height={H} />
);

const BatrakovWithFonts: React.FC<{ voice?: string }> = ({ voice }) => {
  useFonts();
  return <BatrakovReel voice={voice} />;
};

export const BatrakovComposition: React.FC = () => (
  <Composition
    id="PivotBatrakov"
    component={BatrakovWithFonts}
    durationInFrames={BT_TOTAL}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{ voice: "voice-batrakov-fit.wav" as string | undefined }}
  />
);

const Derby2WithFonts: React.FC = () => {
  useFonts();
  return <Derby2Reel />;
};

export const Derby2Composition: React.FC = () => (
  <Composition id="PivotDerbyDeep" component={Derby2WithFonts} durationInFrames={D2_TOTAL} fps={FPS} width={W} height={H} />
);

const TeaserWithFonts: React.FC = () => {
  useFonts();
  return <TeaserReel />;
};

export const TeaserComposition: React.FC = () => (
  <Composition id="PivotDerbyTeaser" component={TeaserWithFonts} durationInFrames={TZ_TOTAL} fps={FPS} width={W} height={H} />
);
