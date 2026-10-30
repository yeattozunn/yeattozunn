import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { KI_CAPTIONS } from "./kiCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const GS_RED = "#c8102e";
const KONYA = "#2e9e4f";

// Konyaspor – Galatasaray line-ups (30 Oct 2026; Başka Gazete). Shape on the board is our reading of the XI.
export const KI_TOTAL = 1450;

// pitch box (vertical, GS attacking up)
const X0 = 90;
const Y0 = 300;
const PWD = 900;
const PHT = 990;
const at = (x: number, y: number) => ({ left: X0 + x * PWD, top: Y0 + y * PHT });

type Pl = { n: string; x: number; y: number; g?: string };
const GS: Pl[] = [
  { n: "Uğurcan", x: 0.5, y: 0.93, g: "gk" },
  { n: "Sallai", x: 0.88, y: 0.64, g: "back" },
  { n: "Singo", x: 0.64, y: 0.73, g: "back" },
  { n: "Sanchez", x: 0.36, y: 0.73, g: "back" },
  { n: "Eren", x: 0.12, y: 0.64, g: "back" },
  { n: "Torreira", x: 0.38, y: 0.56, g: "mid" },
  { n: "Sara", x: 0.62, y: 0.56, g: "mid" },
  { n: "Leao", x: 0.13, y: 0.3, g: "att" },
  { n: "Batrakov", x: 0.5, y: 0.4, g: "att" },
  { n: "Yunus", x: 0.87, y: 0.3, g: "att" },
  { n: "Osimhen", x: 0.5, y: 0.22, g: "att" },
];
const KO: Pl[] = [
  { n: "Bahadır", x: 0.5, y: 0.04 },
  { n: "", x: 0.15, y: 0.15, g: "fb" },
  { n: "", x: 0.38, y: 0.13 },
  { n: "", x: 0.62, y: 0.13 },
  { n: "", x: 0.85, y: 0.15, g: "fb" },
  { n: "", x: 0.36, y: 0.26 },
  { n: "", x: 0.64, y: 0.26 },
  { n: "Dompe", x: 0.2, y: 0.36, g: "am" },
  { n: "Toth", x: 0.5, y: 0.31, g: "am" },
  { n: "", x: 0.8, y: 0.36 },
  { n: "Muleka", x: 0.5, y: 0.48, g: "st" },
];

const Dot: React.FC<{ p: Pl; color: string; on: boolean; dim: boolean; show: number }> = ({ p, color, on, dim, show }) => {
  const { left, top } = at(p.x, p.y);
  return (
    <div style={{ position: "absolute", left: left - 34, top: top - 34, width: 68, display: "flex", flexDirection: "column", alignItems: "center", opacity: show * (dim ? 0.35 : 1), transform: `scale(${0.5 + 0.5 * show})` }}>
      <div style={{ width: 68, height: 68, borderRadius: 34, background: color, border: `4px solid ${on ? GOLD : "rgba(255,255,255,0.85)"}`, boxShadow: on ? `0 0 34px ${GOLD}` : "0 6px 14px rgba(0,0,0,0.5)" }} />
      {p.n ? <div style={{ ...mono(22), color: on ? GOLD : C.white, marginTop: 6, whiteSpace: "nowrap", textShadow: "0 2px 6px #000" }}>{p.n}</div> : null}
    </div>
  );
};

const Arrow: React.FC<{ from: [number, number]; to: [number, number]; color: string; k: number; dash?: boolean }> = ({ from, to, color, k, dash }) => {
  const a = at(...from);
  const b = at(...to);
  const x2 = a.left + (b.left - a.left) * k;
  const y2 = a.top + (b.top - a.top) * k;
  const ang = Math.atan2(y2 - a.top, x2 - a.left);
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <line x1={a.left} y1={a.top} x2={x2} y2={y2} stroke={color} strokeWidth={9} strokeLinecap="round" strokeDasharray={dash ? "18 16" : undefined} opacity={k > 0 ? 1 : 0} />
      {k > 0.95 ? (
        <polygon
          points={`${x2},${y2} ${x2 - 34 * Math.cos(ang - 0.45)},${y2 - 34 * Math.sin(ang - 0.45)} ${x2 - 34 * Math.cos(ang + 0.45)},${y2 - 34 * Math.sin(ang + 0.45)}`}
          fill={color}
        />
      ) : null}
    </svg>
  );
};

const Pitch: React.FC = () => (
  <div style={{ position: "absolute", left: X0, top: Y0, width: PWD, height: PHT, border: "3px solid rgba(201,220,234,0.35)", borderRadius: 10, background: "linear-gradient(180deg, #0f1a14, #0c1410)" }}>
    {[...Array(8)].map((_, i) => (
      <div key={i} style={{ position: "absolute", left: 0, right: 0, top: (i * PHT) / 8, height: PHT / 8, background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }} />
    ))}
    <div style={{ position: "absolute", left: 0, right: 0, top: PHT / 2, height: 3, background: "rgba(201,220,234,0.35)" }} />
    <div style={{ position: "absolute", left: PWD / 2 - 110, top: PHT / 2 - 110, width: 220, height: 220, borderRadius: 110, border: "3px solid rgba(201,220,234,0.35)" }} />
    <div style={{ position: "absolute", left: PWD * 0.22, top: 0, width: PWD * 0.56, height: PHT * 0.15, border: "3px solid rgba(201,220,234,0.35)", borderTop: "none" }} />
    <div style={{ position: "absolute", left: PWD * 0.22, bottom: 0, width: PWD * 0.56, height: PHT * 0.15, border: "3px solid rgba(201,220,234,0.35)", borderBottom: "none" }} />
  </div>
);

// One continuous tactics board; `f` is the global frame so highlights follow the narration.
const BOARD_FROM = 57;
const Board: React.FC = () => {
  const local = useCurrentFrame();
  const f = local + BOARD_FROM;
  const ph = (a: number, b: number) => f >= a && f < b;
  const ramp = (a: number, d = 18) => interpolate(f - a, [0, d], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const gsOn = (p: Pl) =>
    (ph(112, 277) && p.g === "att") || (ph(277, 360) && p.g === "mid") || (ph(360, 477) && p.g === "back") || (ph(1028, 1200) && p.g === "mid") || (ph(900, 1028) && p.n === "Osimhen") || (ph(870, 900) && (p.n === "Leao" || p.n === "Yunus"));
  const koOn = (p: Pl) => (ph(477, 567) && p.g === "st") || (ph(567, 626) && p.g === "am") || (ph(900, 1028) && p.g === "fb") || (ph(1028, 1200) && p.g === "st");
  const focus = ph(112, 626) || ph(870, 1200);
  const koShow = ramp(477, 24);
  const label =
    f < 112 ? ["Galatasaray", "4-2-3-1"] : f < 277 ? ["Hücum", "4 isim"] : f < 360 ? ["Orta saha", "Denge"] : f < 477 ? ["Savunma", "Ake yok"] : f < 626 ? ["Konyaspor", "Kontra planı"] : f < 825 ? ["Konya", "Derin blok"] : f < 1028 ? ["Anahtar", "Kanatlar"] : ["Risk", "Kontra atak"];
  return (
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 200 }}>
        <Meta left={label[0]} right={label[1]} />
      </div>
      <Pitch />
      {/* Konya low block band */}
      <div style={{ position: "absolute", left: X0, width: PWD, top: Y0, height: PHT * 0.4, background: KONYA, opacity: 0.16 * ramp(626) * (f < 870 ? 1 : 0.4) }} />
      {f >= 725 && f < 870 ? (
        <div style={{ position: "absolute", right: PAD, top: 236, opacity: ramp(725, 10) }}>
          <Chip color={KONYA}>9 maç · sadece 9 gol yedi</Chip>
        </div>
      ) : null}
      {/* space behind advancing fullbacks */}
      {f >= 925 && f < 1028
        ? [0.12, 0.88].map((x) => (
            <div key={x} style={{ position: "absolute", ...at(x - 0.11, 0.05), width: PWD * 0.22, height: PHT * 0.14, borderRadius: 14, background: GOLD, opacity: 0.25 * ramp(925, 10) }} />
          ))
        : null}
      {f >= 870 && f < 1028 ? (
        <>
          <Arrow from={[0.13, 0.3]} to={[0.13, 0.12]} color={GOLD} k={ramp(870)} />
          <Arrow from={[0.87, 0.3]} to={[0.87, 0.12]} color={GOLD} k={ramp(870)} />
          <Arrow from={[0.15, 0.15]} to={[0.15, 0.27]} color={KONYA} k={ramp(905)} dash />
          <Arrow from={[0.85, 0.15]} to={[0.85, 0.27]} color={KONYA} k={ramp(905)} dash />
          <Arrow from={[0.5, 0.22]} to={[0.22, 0.1]} color={C.white} k={ramp(950)} />
        </>
      ) : null}
      {f >= 1028 ? (
        <>
          <div style={{ position: "absolute", ...at(0.2, 0.47), width: PWD * 0.6, height: PHT * 0.22, borderRadius: 16, border: `3px dashed #ff4d57`, background: "rgba(255,77,87,0.12)", opacity: ramp(1105, 12) }} />
          <Arrow from={[0.5, 0.48]} to={[0.5, 0.8]} color="#ff4d57" k={ramp(1045, 26)} />
        </>
      ) : null}
      {GS.map((p) => (
        <Dot key={p.n} p={p} color={GS_RED} on={gsOn(p)} dim={focus && !gsOn(p) && !koOn(p)} show={ramp(BOARD_FROM + GS.indexOf(p) * 2, 12)} />
      ))}
      {KO.map((p, i) => (
        <Dot key={i} p={p} color={KONYA} on={koOn(p)} dim={focus && !koOn(p) && !gsOn(p)} show={koShow} />
      ))}
      <div style={{ position: "absolute", left: PAD, top: Y0 + PHT + 14, ...mono(20), color: C.ice, opacity: 0.6 }}>Diziliş PİVOT yorumudur · kadro: resmi ilk 11</div>
    </Stage>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 12, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <Photo src="osi-mask.jpg" pos="45% 30%" zoom={[1.15, 1.0]} dim={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ display: "flex", gap: 40, alignItems: "center", transform: `scale(${s})` }}>
          <Img src={staticFile("crest/konyaspor.png")} style={{ width: 170, height: 170 }} />
          <div style={{ ...display(80), color: C.white }}>vs</div>
          <Img src={staticFile("crest/galatasaray.png")} style={{ width: 170, height: 170 }} />
        </div>
        <Drop size={210} align="center" delay={8} lines={[{ text: "İlk 11'ler", color: GOLD }]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [
    { label: "Galatasaray", v: 49, c: GS_RED },
    { label: "Beraberlik", v: 32, c: "rgba(241,239,234,0.55)" },
    { label: "Konyaspor", v: 19, c: KONYA },
  ];
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
        <Meta left="50.000 simülasyon" right="Maç önü" />
        {bars.map((b, i) => {
          const k = interpolate(frame - 6 - i * 8, [0, 18], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          return (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...display(80), color: C.white }}>
                <span>{b.label}</span>
                <span>%{Math.round(b.v * k)}</span>
              </div>
              <div style={{ height: 34, borderRadius: 6, background: "rgba(241,239,234,0.08)" }}>
                <div style={{ height: "100%", width: `${b.v * 2 * k}%`, background: b.c, borderRadius: 6 }} />
              </div>
            </div>
          );
        })}
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
          <Img src={staticFile("crest/konyaspor.png")} style={{ width: 170, height: 170 }} />
          <div style={{ ...display(300), color: C.white }}>0–1</div>
          <Img src={staticFile("crest/galatasaray.png")} style={{ width: 170, height: 170 }} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Drop size={110} align="center" lines={[{ text: "Bu kadro" }, { text: "yeterli mi?", color: GOLD }]} />
        <div style={{ transform: `scale(${0.6 + 0.4 * word})`, marginTop: 30 }}>
          <PivotMark size={180} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(150), color: C.white, opacity: word }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 42, fontWeight: 600, color: C.white, opacity: interpolate(frame, [16, 26], [0, 1], clamp) }}>Yorumlara yaz 👇</div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 57, Intro],
  [57, 1200, Board],
  [1200, 1305, Sim],
  [1305, 1372, Score],
  [1372, 1450, Outro],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = KI_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const KadroReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-ki.wav")} volume={0.25} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-ki.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
