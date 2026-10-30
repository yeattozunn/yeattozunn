import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo, Whip } from "./derby";
import { C, display, F, mono } from "./theme";
import { KG_CAPTIONS } from "./kgCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const GS_RED = "#c8102e";
const KONYA = "#2e9e4f";

// Konyaspor – Galatasaray match-day reel (30 Oct 2026, 20:00). Sims: scripts/sim_week10.py. Cuts follow KG_CAPTIONS.
export const KG_TOTAL = 1200;

const Logo2: React.FC<{ f: string; size: number; style?: React.CSSProperties }> = ({ f, size, style }) => (
  <Img src={staticFile(`crest/${f}.png`)} style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.7))", ...style }} />
);

const Clip: React.FC<{ src: string; from?: number; dim?: number }> = ({ src, from = 0, dim = 0.55 }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(src)} startFrom={from} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: `brightness(${dim}) contrast(1.15) saturate(0.8)` }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,9,11,0.7) 0%, transparent 35%, transparent 60%, rgba(8,9,11,0.9) 100%)" }} />
  </AbsoluteFill>
);

const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = spring({ frame: frame - 8, fps, config: { damping: 12, mass: 0.7 } });
  const r = spring({ frame: frame - 14, fps, config: { damping: 12, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <Clip src="wan/rams-flares.mp4" from={20} dim={0.45} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div style={{ ...mono(30), color: C.ice }}>Süper Lig · 10. hafta · Maç günü</div>
        <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
          <Logo2 f="konyaspor" size={250} style={{ transform: `translateX(${(1 - l) * -400}px)`, opacity: l }} />
          <div style={{ ...display(90), color: C.white }}>vs</div>
          <Logo2 f="galatasaray" size={250} style={{ transform: `translateX(${(1 - r) * 400}px)`, opacity: r }} />
        </div>
        <Drop size={200} align="center" delay={20} lines={[{ text: "20:00", color: GOLD }]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Leader: React.FC = () => (
  <Whip>
    <Photo src="skor21.jpg" pos="40% 20%" zoom={[1.15, 1.0]} dim={0.55} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560, gap: 18 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <Chip color={GOLD}>Lider · 22 puan</Chip>
        <Chip>Derbi: 2–1</Chip>
      </div>
      <Drop size={130} delay={6} lines={[{ text: "Derbiden sonra" }, { text: "ilk sınav.", color: GOLD }]} />
    </AbsoluteFill>
  </Whip>
);

const Easy: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 24 }}>
      <Logo2 f="konyaspor" size={160} />
      <Meta left="Konyaspor" right="14. sıra · 8 puan" />
      <Drop size={150} delay={2} lines={[{ text: "Kâğıt üstünde" }, { text: "kolay.", color: C.ice, weight: 300 }]} />
    </AbsoluteFill>
  </Stage>
);

// League goals scored, Konya highlighted near the bottom.
const Attack: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    ["Fenerbahçe", 23],
    ["Trabzonspor", 22],
    ["Galatasaray", 19],
    ["Konyaspor", 6],
    ["Eyüpspor", 2],
  ] as const;
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
        <Meta left="Atılan gol · 9 maç" right="Lig" />
        <div style={{ ...display(300), color: KONYA, lineHeight: 0.9 }}>6</div>
        {rows.map(([n, g], i) => {
          const k = interpolate(frame - 10 - i * 5, [0, 20], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          const hi = n === "Konyaspor";
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 20, opacity: hi ? 1 : 0.55 }}>
              <div style={{ ...mono(26), color: C.white, width: 260 }}>{n}</div>
              <div style={{ flex: 1, height: 30, background: "rgba(241,239,234,0.08)", borderRadius: 5 }}>
                <div style={{ height: "100%", width: `${(g / 23) * 100 * k}%`, background: hi ? KONYA : "rgba(241,239,234,0.5)", borderRadius: 5 }} />
              </div>
              <div style={{ ...display(54), color: hi ? KONYA : C.white, width: 70, textAlign: "right" }}>{g}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};

const Warn: React.FC = () => {
  const frame = useCurrentFrame();
  const g = frame % 6 < 3 ? 8 : -8;
  return (
    <AbsoluteFill style={{ background: "#2a0508", justifyContent: "center", alignItems: "center" }}>
      <div style={{ ...display(240), color: "#ff4d57", transform: `translateX(${frame < 14 ? g : 0}px)`, textShadow: `${-g}px 0 #33d1ff` }}>Ama</div>
      <div style={{ ...display(240), color: C.white }}>dikkat.</div>
    </AbsoluteFill>
  );
};

const Defense: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    ["Fenerbahçe", 8],
    ["Trabzonspor", 8],
    ["Konyaspor", 9],
    ["Kasımpaşa", 9],
    ["Galatasaray", 12],
  ] as const;
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
        <Meta left="Yenilen gol · 9 maç" right="En az" />
        <div style={{ ...display(300), color: C.white, lineHeight: 0.9 }}>9</div>
        {rows.map(([n, g], i) => {
          const k = interpolate(frame - 10 - i * 5, [0, 20], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          const hi = n === "Konyaspor";
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 20, opacity: hi ? 1 : 0.55 }}>
              <div style={{ ...mono(26), color: hi ? KONYA : n === "Galatasaray" ? GS_RED : C.white, width: 260 }}>{n}</div>
              <div style={{ flex: 1, height: 30, background: "rgba(241,239,234,0.08)", borderRadius: 5 }}>
                <div style={{ height: "100%", width: `${(g / 12) * 100 * k}%`, background: hi ? KONYA : n === "Galatasaray" ? GS_RED : "rgba(241,239,234,0.5)", borderRadius: 5 }} />
              </div>
              <div style={{ ...display(54), color: hi ? KONYA : C.white, width: 70, textAlign: "right" }}>{g}</div>
            </div>
          );
        })}
        <div style={{ opacity: interpolate(frame, [60, 70], [0, 1], clamp) }}>
          <Chip color={KONYA}>Konya, liderden 3 gol az yedi</Chip>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

// Brick wall assembling over the ball clip.
const Wall: React.FC = () => {
  const frame = useCurrentFrame();
  const bricks = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      const k = interpolate(frame - (5 - r) * 4 - c * 1.5, [0, 10], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
      bricks.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: 80 + c * 186 + (r % 2 ? 93 : 0) - 93,
            top: 1060 - r * 92 - (1 - k) * 300,
            width: 180,
            height: 86,
            background: `linear-gradient(180deg, ${KONYA}, #1b6633)`,
            border: "2px solid rgba(0,0,0,0.4)",
            borderRadius: 6,
            opacity: k * 0.92,
          }}
        />,
      );
    }
  }
  return (
    <AbsoluteFill>
      <Clip src="wan/derby-ball.mp4" from={30} dim={0.5} />
      <AbsoluteFill style={{ overflow: "hidden" }}>{bricks}</AbsoluteFill>
      <AbsoluteFill style={{ padding: PAD, paddingTop: 260 }}>
        <Drop size={140} delay={10} lines={[{ text: "Osimhen'e karşı" }, { text: "bir duvar.", color: GOLD }]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Breaker: React.FC = () => (
  <AbsoluteFill>
    <Photo src="osi-head.jpg" pos="55% 40%" zoom={[1.0, 1.2]} dim={0.6} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560, gap: 16 }}>
      <Chip color={GOLD}>Derbide 2 gol</Chip>
      <Drop size={150} delay={8} lines={[{ text: "Duvarı" }, { text: "yıkar mı?", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

// 50,000 dots coloured by outcome, then the 1-X-2 bars land with the narration.
const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const DOTS = 250;
  const cols = 25;
  const outcome = (i: number) => {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const u = Math.abs(x);
    return u < 0.49 ? GS_RED : u < 0.81 ? "rgba(241,239,234,0.55)" : KONYA;
  };
  const bars = [
    { at: 45, label: "Galatasaray", v: 49, c: GS_RED },
    { at: 100, label: "Beraberlik", v: 32, c: "rgba(241,239,234,0.55)" },
    { at: 152, label: "Konyaspor", v: 19, c: KONYA },
  ];
  const n = Math.round(interpolate(frame, [0, 40], [0, 50000], clamp));
  return (
    <Stage>
      <AbsoluteFill style={{ padding: PAD, paddingTop: 200, gap: 26 }}>
        <Meta left="Poisson simülasyonu" right={`${n.toLocaleString("tr-TR")} maç`} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
          {Array.from({ length: DOTS }).map((_, i) => (
            <div key={i} style={{ aspectRatio: "1", borderRadius: "50%", background: frame > i / 6 ? outcome(i) : "rgba(241,239,234,0.08)" }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}>
          {bars.map((b) => {
            const k = interpolate(frame - b.at, [0, 18], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
            return (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 20, opacity: k }}>
                <div style={{ ...mono(26), color: C.white, width: 240 }}>{b.label}</div>
                <div style={{ flex: 1, height: 40, background: "rgba(241,239,234,0.08)", borderRadius: 6 }}>
                  <div style={{ height: "100%", width: `${b.v * 2 * k}%`, background: b.c, borderRadius: 6 }} />
                </div>
                <div style={{ ...display(72), color: C.white, width: 150, textAlign: "right" }}>%{Math.round(b.v * k)}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Score: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 3, fps, config: { damping: 9, mass: 0.7 } });
  return (
    <Stage light={1.3}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ ...mono(30), color: C.ice }}>En olası skor · %21</div>
        <div style={{ display: "flex", alignItems: "center", gap: 40, transform: `scale(${s})` }}>
          <Logo2 f="konyaspor" size={170} />
          <div style={{ ...display(300), color: C.white }}>0–1</div>
          <Logo2 f="galatasaray" size={170} />
        </div>
        <div style={{ ...mono(26), color: C.white, opacity: interpolate(frame, [20, 30], [0, 0.7], clamp) }}>2. olasılık 0–0 · %18</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Low: React.FC = () => (
  <AbsoluteFill>
    <Photo src="osi-mask.jpg" pos="45% 30%" zoom={[1.05, 1.2]} dim={0.4} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 10 }}>
      <Meta left="Toplam gol 0, 1 ya da 2" right="50.000 maç" />
      <div style={{ ...display(380), color: GOLD, lineHeight: 0.9 }}>%76</div>
      <Drop size={110} delay={6} lines={[{ text: "Az gollü maç.", color: C.white }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const One: React.FC = () => {
  const frame = useCurrentFrame();
  const sh = frame > 30 && frame < 52 ? Math.sin(frame * 2.9) * (52 - frame) * 0.9 : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${sh}px, ${sh * 0.4}px)` }}>
      <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.25]} dim={0.45} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 10 }}>
        <div style={{ ...display(420), color: C.white, lineHeight: 0.9 }}>1</div>
        <Drop size={120} align="center" delay={6} lines={[{ text: "gol." }, { text: "Liderlik.", color: GOLD }]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          <Logo2 f="konyaspor" size={110} />
          <div style={{ ...display(90), color: C.white }}>?–?</div>
          <Logo2 f="galatasaray" size={110} />
        </div>
        <div style={{ transform: `scale(${0.6 + 0.4 * word})`, marginTop: 30 }}>
          <PivotMark size={200} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(170), color: C.white, opacity: word }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(frame, [20, 32], [0, 1], clamp) }}>
          Skor tahminin? Yorumlara 👇
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 69, Open],
  [69, 172, Leader],
  [172, 222, Easy],
  [222, 321, Attack],
  [321, 355, Warn],
  [355, 465, Defense],
  [465, 550, Wall],
  [550, 646, Breaker],
  [646, 843, Sim],
  [843, 902, Score],
  [902, 998, Low],
  [998, 1076, One],
  [1076, 1200, Logo],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = KG_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const KgReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-kg.wav")} volume={0.28} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-kg.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
