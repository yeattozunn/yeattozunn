import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Crest, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { T_CAPTIONS } from "./teaserCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const FB_YEL = "#e2bb45";

// Derby-eve teaser (GS – FB, 26 Oct 2026 21:30). Cuts follow T_CAPTIONS.
export const TZ_TOTAL = 420;

const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const left = 24 * 3600 - Math.floor(frame * 37);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <Stage light={1.2}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
        <div style={{ ...mono(28), color: C.ice }}>Derbiye kalan</div>
        <div style={{ ...display(230), color: C.white, fontVariantNumeric: "tabular-nums" }}>
          {p(h)}:{p(m)}:{p(s)}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Ball: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile("wan/derby-ball.mp4")} startFrom={45} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) contrast(1.15)" }} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
      <Drop size={220} delay={2} lines={[{ text: "Bir" }, { text: "derbi.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const FaceOff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = spring({ frame, fps, config: { damping: 200 } });
  const r = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const vs = spring({ frame: frame - 14, fps, config: { damping: 9, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: "#08090b" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, overflow: "hidden", transform: `translateX(${(1 - l) * -540}px)` }}>
        <Img src={staticFile("photos/osi-close.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", filter: "contrast(1.1)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 60%, rgba(200,16,46,0.45))" }} />
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, width: 540, height: 1920, overflow: "hidden", transform: `translateX(${(1 - r) * 540}px)` }}>
        <Img src={staticFile("photos/kerem2.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 30%", filter: "contrast(1.1)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(270deg, transparent 60%, rgba(19,36,79,0.6))" }} />
      </div>
      <div style={{ position: "absolute", left: 538, top: 0, width: 4, height: 1920, background: C.white }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...display(240), color: C.white, transform: `scale(${vs})`, textShadow: "0 0 60px rgba(0,0,0,0.9)" }}>VS</div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 40, bottom: 600, ...display(90), color: C.white }}>Osimhen</div>
      <div style={{ position: "absolute", right: 40, bottom: 600, ...display(90), color: FB_YEL }}>Kerem</div>
    </AbsoluteFill>
  );
};

const Leader: React.FC = () => (
  <AbsoluteFill>
    <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.25]} dim={0.55} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
      <Crest team="gs" size={240} />
      <Drop size={170} align="center" delay={2} lines={[{ text: "Lider" }, { text: "evinde.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Stats: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 10 }}>
      <Meta left="50.000 simülasyon" right="FB kazanır" />
      <div style={{ ...display(420), color: FB_YEL }}>%45</div>
      <Drop size={110} delay={2} lines={[{ text: "İstatistik" }, { text: "deplasmanda.", color: C.ice, weight: 300 }]} />
    </AbsoluteFill>
  </Stage>
);

const When: React.FC = () => (
  <Stage light={1.1}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
      <div style={{ ...mono(30), color: C.ice }}>26 Ekim · Pazartesi · RAMS Park</div>
      <Drop size={330} align="center" delay={2} lines={[{ text: "21:30" }]} />
    </AbsoluteFill>
  </Stage>
);

const Who: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile("wan/rams-flares.mp4")} startFrom={30} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
      <Drop size={210} delay={2} lines={[{ text: "Kim" }, { text: "kazanır?", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
        <div style={{ transform: `scale(${0.6 + 0.4 * word})` }}>
          <PivotMark size={240} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(210), color: C.white, opacity: word }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(frame, [24, 36], [0, 1], clamp) }}>
          Derin analiz profilde.
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 45, Clock],
  [45, 70, Ball],
  [70, 112, FaceOff],
  [112, 145, Leader],
  [145, 195, Stats],
  [195, 258, When],
  [258, 300, Who],
  [300, 420, Logo],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = T_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const TeaserReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-teaser.wav")} volume={0.55} />
    <Sequence from={Math.round(0.3 * FPS)}>
      <Audio src={staticFile("voice-teaser.wav")} />
    </Sequence>
  </AbsoluteFill>
);
