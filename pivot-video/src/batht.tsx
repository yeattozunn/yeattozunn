import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { BH_CAPTIONS } from "./bhCaptions";

// Half-time flash: Batrakov's two goals v Stuttgart (3 Nov 2026), ESPN live data. Cuts follow BH_CAPTIONS.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const GS_RED = "#c8102e";
export const BH_TOTAL = 830;

const Crest: React.FC<{ f: string; size: number }> = ({ f, size }) => (
  <Img src={staticFile(`crest/${f}.png`)} style={{ width: size, height: size, objectFit: "contain" }} />
);

const Model: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = interpolate(frame, [30, 40], [0, 1], clamp);
  return (
    <Stage light={1.2}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
        <div style={{ ...mono(30), color: C.ice }}>Maç önü · 50.000 simülasyon</div>
        <div style={{ position: "relative" }}>
          <div style={{ ...display(380), color: C.white, opacity: 1 - 0.5 * cut }}>%20</div>
          <div style={{ position: "absolute", left: -20, top: "50%", height: 22, width: `${cut * 110}%`, background: GOLD, transform: "rotate(-8deg)" }} />
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Crest f="galatasaray" size={90} />
          <div style={{ ...display(60), color: C.white }}>kazanır</div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Hero: React.FC = () => (
  <AbsoluteFill>
    <Photo src="bat-shot.png" pos="50% 30%" zoom={[1.0, 1.15]} dim={0.6} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560, gap: 14 }}>
      <Chip color={GOLD}>12' · 15'</Chip>
      <Drop size={170} delay={4} lines={[{ text: "Batrakov." }, { text: "15 dakika.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

// Half-pitch, goal at top; shot line drawn from the spot ESPN describes to the corner it went in.
const Goal: React.FC<{ min: string; score: string; from: [number, number]; to: number; where: string }> = ({ min, score, from, to, where }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const X0 = 90;
  const Y0 = 420;
  const W = 900;
  const H = 820;
  const a = { x: X0 + from[0] * W, y: Y0 + from[1] * H };
  const b = { x: X0 + to * W, y: Y0 + 6 };
  const k = interpolate(frame - 18, [0, 14], [0, 1], { ...clamp, easing: (x) => x * x });
  const net = frame > 32;
  const pop = spring({ frame: frame - 32, fps, config: { damping: 8, mass: 0.6 } });
  return (
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 220 }}>
        <Meta left={`Gol · ${min}`} right={where} />
      </div>
      <div style={{ position: "absolute", left: X0, top: Y0, width: W, height: H, border: "3px solid rgba(201,220,234,0.35)", borderRadius: 10, background: "linear-gradient(180deg,#0f1a14,#0c1410)" }}>
        <div style={{ position: "absolute", left: W * 0.2, top: 0, width: W * 0.6, height: H * 0.4, border: "3px solid rgba(201,220,234,0.35)", borderTop: "none" }} />
        <div style={{ position: "absolute", left: W * 0.36, top: 0, width: W * 0.28, height: H * 0.14, border: "3px solid rgba(201,220,234,0.35)", borderTop: "none" }} />
        <div style={{ position: "absolute", left: W * 0.39, top: -18, width: W * 0.22, height: 18, background: net ? GOLD : C.white }} />
      </div>
      <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
        <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * k} y2={a.y + (b.y - a.y) * k} stroke={GOLD} strokeWidth={10} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: a.x - 40, top: a.y - 40, width: 80, height: 80, borderRadius: 40, background: GS_RED, border: `4px solid ${GOLD}`, boxShadow: `0 0 30px ${GOLD}` }} />
      <div style={{ position: "absolute", left: a.x - 70, top: a.y + 48, ...mono(26), color: GOLD }}>Batrakov</div>
      <div style={{ position: "absolute", left: a.x + (b.x - a.x) * k - 16, top: a.y + (b.y - a.y) * k - 16, width: 32, height: 32, borderRadius: 16, background: C.white, boxShadow: "0 0 18px #fff" }} />
      {net ? (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 640 }}>
          <div style={{ ...display(200), color: C.white, transform: `scale(${pop})`, textShadow: "0 8px 40px #000" }}>{score}</div>
        </AbsoluteFill>
      ) : null}
      <div style={{ position: "absolute", left: PAD, top: Y0 + H + 14, ...mono(20), color: C.ice, opacity: 0.6 }}>Şut yeri ESPN maç anlatımına göre çizildi</div>
    </Stage>
  );
};
const G1: React.FC = () => <Goal min="12'" score="1–0" from={[0.5, 0.3]} to={0.59} where="Ortadan · sağ üst köşe" />;
const G2: React.FC = () => <Goal min="15'" score="2–0" from={[0.74, 0.26]} to={0.5} where="Sağdan · kalenin ortası" />;

const Stat: React.FC = () => {
  const frame = useCurrentFrame();
  const cells = [
    ["3", "Şut"],
    ["3", "İsabet"],
    ["2", "Gol"],
  ];
  return (
    <Stage light={1.3}>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 24 }}>
        <Meta left="Batrakov · ilk yarı" right="ESPN" />
        <div style={{ display: "flex", gap: 20 }}>
          {cells.map(([v, l], i) => {
            const k = interpolate(frame - i * 6, [0, 8], [0, 1], clamp);
            return (
              <div key={l} style={{ flex: 1, border: `3px solid ${i === 2 ? GOLD : "rgba(241,239,234,0.3)"}`, borderRadius: 18, padding: "30px 0", textAlign: "center", opacity: k, transform: `scale(${0.8 + 0.2 * k})` }}>
                <div style={{ ...display(200), color: i === 2 ? GOLD : C.white }}>{v}</div>
                <div style={{ ...mono(28), color: C.ice }}>{l}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Dots: React.FC<{ title: string; total: number; on: number; color: string; label: string; foot: string }> = ({ title, total, on, color, label, foot }) => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 40 }}>
        <Meta left={title} right="İlk yarı" />
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {[...Array(total)].map((_, i) => {
            const k = interpolate(frame - 6 - i * 6, [0, 8], [0, 1], clamp);
            const hit = i < on;
            return <div key={i} style={{ width: 130, height: 130, borderRadius: 65, background: hit ? color : "transparent", border: `4px solid ${hit ? color : "rgba(241,239,234,0.35)"}`, opacity: k, transform: `scale(${k})` }} />;
          })}
        </div>
        <div style={{ ...display(110), color: C.white }}>{label}</div>
        <div style={{ ...mono(28), color: C.ice }}>{foot}</div>
      </AbsoluteFill>
    </Stage>
  );
};
const GsShots: React.FC = () => <Dots title="Galatasaray · isabetli şut" total={3} on={3} color={GOLD} label="3'ü de Batrakov." foot="Takımın 7 şutu · 3 isabet" />;
const VfbShots: React.FC = () => <Dots title="Stuttgart · şut" total={5} on={0} color="#e3221a" label="0 isabet." foot="5 şut · hiçbiri kalede değil" />;

const Half: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 3, fps, config: { damping: 9, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.05, 1.2]} dim={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ ...mono(32), color: C.ice }}>Devre arası · RAMS Park</div>
        <div style={{ display: "flex", alignItems: "center", gap: 40, transform: `scale(${s})` }}>
          <Crest f="galatasaray" size={170} />
          <div style={{ ...display(280), color: C.white }}>2–0</div>
          <Crest f="stuttgart" size={170} />
        </div>
        <div style={{ ...display(80), color: GOLD, opacity: interpolate(frame, [50, 60], [0, 1], clamp) }}>45 dakika daha.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 10, fps, config: { damping: 11, mass: 0.8 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Drop size={120} align="center" lines={[{ text: "Model mi," }, { text: "Aslan mı?", color: GOLD }]} />
        <PivotMark size={150} angle={interpolate(rot, [0, 1], [0, -36])} />
        <div style={{ ...display(120), color: C.white }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 40, fontWeight: 600, color: C.white, opacity: interpolate(frame, [18, 28], [0, 1], clamp) }}>Maç sonu skorunu yaz 👇</div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 55, Model],
  [55, 136, Hero],
  [136, 263, G1],
  [263, 340, G2],
  [340, 382, Stat],
  [382, 507, GsShots],
  [507, 602, VfbShots],
  [602, 693, Half],
  [693, 830, End],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = BH_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const BatHtReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-bh.wav")} volume={0.24} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-bh.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
