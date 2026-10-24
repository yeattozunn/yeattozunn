import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Count, Crest, Drop, FadeIn, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo, Whip } from "./derby";
import { C, display, F, mono } from "./theme";
import { LILLE2_CAPTIONS } from "./lille2Captions";
import { MATCH, SIM } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const VO_OFFSET = 0.4;
const LOSC = "#d23b4a";

// Scene boundaries (frames), cut to the narration. scripts/lille2_cues.json mirrors them in seconds.
export const L2 = {
  hook: { from: 0, dur: 81 },
  stats: { from: 81, dur: 171 },
  reveal: { from: 252, dur: 101 },
  yunus: { from: 353, dur: 129 },
  lille: { from: 482, dur: 252 },
  batrakov: { from: 734, dur: 142 },
  second: { from: 876, dur: 266 },
  sim: { from: 1142, dur: 250 },
  chances: { from: 1392, dur: 104 },
  outro: { from: 1496, dur: 196 },
};
export const L2_TOTAL = 1692;

/* ---------- tactics board primitives ---------- */
// Vertical pitch. Galatasaray attack the top goal (Lille's), Lille attack the bottom goal.
export const PX = 90;
export const PY = 520;
export const PW = 900;
export const PH = 830;
export type Pt = [number, number];
export const P = ([x, y]: Pt) => ({ x: PX + x * PW, y: PY + y * PH });

// Catmull-Rom through the points, sampled as a polyline (pitch units).
const spline = (pts: Pt[], n = 48): Pt[] => {
  if (pts.length < 3) {
    const out: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]);
    }
    return out;
  }
  const out: Pt[] = [];
  const segs = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * segs;
    const k = Math.min(segs - 1, Math.floor(u));
    const t = u - k;
    const p0 = pts[Math.max(0, k - 1)];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[Math.min(pts.length - 1, k + 2)];
    const f = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
};

// zoom: camera push toward one goal ("top" = Lille's goal, "bottom" = Galatasaray's), starting at frame `from`.
export const Pitch: React.FC<{ children?: React.ReactNode; zoom?: number; anchor?: "top" | "bottom"; from?: number }> = ({
  children,
  zoom = 1,
  anchor = "top",
  from = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [0, 20], [1, 0], clamp);
  const z = 1 + (zoom - 1) * spring({ frame: frame - from, fps, config: { damping: 200, mass: 1.2 } });
  const ay = anchor === "top" ? PY : PY + PH;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(540 ${ay}) scale(${z}) translate(-540 ${-ay})`}>
      <g fill="none" stroke={C.white} strokeOpacity={0.22} strokeWidth={2} strokeDasharray="4000" strokeDashoffset={4000 * draw}>
        <rect x={PX} y={PY} width={PW} height={PH} />
        <line x1={PX} y1={PY + PH / 2} x2={PX + PW} y2={PY + PH / 2} />
        <circle cx={PX + PW / 2} cy={PY + PH / 2} r={80} />
        <rect x={PX + PW * 0.22} y={PY} width={PW * 0.56} height={PH * 0.17} />
        <rect x={PX + PW * 0.36} y={PY} width={PW * 0.28} height={PH * 0.06} />
        <rect x={PX + PW * 0.22} y={PY + PH * 0.83} width={PW * 0.56} height={PH * 0.17} />
        <rect x={PX + PW * 0.36} y={PY + PH * 0.94} width={PW * 0.28} height={PH * 0.06} />
      </g>
      <g stroke={C.white} strokeOpacity={0.5} strokeWidth={3} fill="none">
        <rect x={PX + PW * 0.42} y={PY - 16} width={PW * 0.16} height={16} />
        <rect x={PX + PW * 0.42} y={PY + PH} width={PW * 0.16} height={16} />
      </g>
      {children}
      </g>
    </svg>
  );
};

export const Dot: React.FC<{ at: Pt; label?: string; color?: string; ring?: boolean; from?: number; glow?: boolean; labelBelow?: boolean }> = ({
  at,
  label,
  color = C.white,
  ring,
  from = 0,
  glow,
  labelBelow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - from, fps, config: { damping: 14, mass: 0.5 } });
  const q = P(at);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.35);
  return (
    <g transform={`translate(${q.x} ${q.y}) scale(${s})`}>
      {glow ? <circle r={34 + 6 * pulse} fill={`rgba(201,220,234,0.22)`} /> : null}
      {ring ? <circle r={17} fill="none" stroke={color} strokeWidth={4} /> : <circle r={17} fill={color} />}
      {label ? (
        <text y={labelBelow ? 50 : -32} textAnchor="middle" style={{ ...display(34, 700) }} fill={color}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

// A move drawn over time: pass, run or shot. Dashed = player run, solid = ball.
export const Move: React.FC<{ pts: Pt[]; from: number; dur: number; color?: string; dashed?: boolean; ball?: boolean; width?: number }> = ({
  pts,
  from,
  dur,
  color = C.ice,
  dashed,
  ball,
  width = 5,
}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2) });
  if (k <= 0) return null;
  const line = spline(pts).map((p) => P(p));
  const upto = Math.max(2, Math.round(k * (line.length - 1)) + 1);
  const shown = line.slice(0, upto);
  const tip = shown[shown.length - 1];
  const prev = shown[shown.length - 2];
  const ang = (Math.atan2(tip.y - prev.y, tip.x - prev.x) * 180) / Math.PI;
  const d = shown.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "12 12" : undefined} opacity={0.95} />
      {k < 1 && ball ? <circle cx={tip.x} cy={tip.y} r={10} fill={C.white} stroke={C.bg0} strokeWidth={3} /> : null}
      {!ball || k >= 1 ? <path d="M 0 -11 L 20 0 L 0 11 Z" fill={color} transform={`translate(${tip.x} ${tip.y}) rotate(${ang})`} /> : null}
    </g>
  );
};

export const NetFlash: React.FC<{ at: number; top: boolean; color?: string }> = ({ at, top, color = C.ice }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 3, at + 22], [0, 1, 0], clamp);
  const y = top ? PY - 16 : PY + PH;
  return <rect x={PX + PW * 0.42 - 20} y={y - 20} width={PW * 0.16 + 40} height={56} fill={color} opacity={o * 0.8} rx={8} />;
};

// Header for goal scenes: minute + scorer + running score.
export const GoalHead: React.FC<{
  minute: string;
  who: string;
  how: string;
  prev: string;
  score: string;
  scoreAt: number;
  team: string;
  delay?: number;
  home?: string;
  away?: string;
  label?: string;
  colors?: Record<string, string>;
}> = ({
  home = "lille",
  away = "gs",
  label = "Lille · Galatasaray",
  colors = { gs: C.ice, lille: LOSC },
  minute,
  who,
  how,
  prev,
  score,
  scoreAt,
  team,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const bump = interpolate(frame, [scoreAt, scoreAt + 4, scoreAt + 14], [1, 1.25, 1], clamp);
  const lit = frame >= scoreAt;
  return (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 200, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: 0.95 }}>
        <Crest team={home} size={50} />
        <span style={{ ...display(58), transform: `scale(${bump})`, color: lit ? C.ice : C.white }}>{lit ? score : prev}</span>
        <Crest team={away} size={50} />
        <span style={{ ...mono(22), color: C.dim, marginLeft: "auto" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 26 }}>
        <Drop size={190} delay={delay} lines={[{ text: minute, color: colors[team] ?? C.white }]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 20 }}>
          <Drop size={84} delay={delay + 4} lines={[{ text: who }]} />
          <FadeIn at={delay + 10}>
            <span style={{ ...mono(24), color: C.white, opacity: 0.7 }}>{how}</span>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

/* ---------- 1 · hook ---------- */
const Hook: React.FC = () => (
  <AbsoluteFill>
    <Photo src="lille-stad.jpg" pos="45% 50%" zoom={[1.25, 1.45]} drift={[-20, 0]} dim={0.62} />
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 30 }}>
      <Meta left="Şampiyonlar Ligi · 3. hafta" right="Pierre-Mauroy" />
      <Drop size={160} delay={4} lines={[{ text: "Lille'de" }, { text: "altı gollü" }, { text: "bir gece.", color: C.ice, weight: 300 }]} />
    </div>
  </AbsoluteFill>
);

/* ---------- 2 · Lille ahead on every number ---------- */
export const Row: React.FC<{ at: number; label: string; l: number; g: number; max: number; dec?: number; prefix?: string; lColor?: string; gColor?: string }> = ({
  at,
  label,
  l,
  g,
  max,
  dec = 0,
  prefix = "",
  lColor = LOSC,
  gColor = C.steel,
}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 20], [0, 1], clamp);
  const e = 1 - Math.pow(1 - k, 3);
  return (
    <FadeIn at={at}>
      <div style={{ ...mono(22), color: C.dim, textAlign: "center", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Count to={l} start={at} dur={20} decimals={dec} prefix={prefix} style={{ ...display(120), color: C.white, width: 220 }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ height: 14, width: (300 * l * e) / max, background: lColor }} />
        </div>
        <div style={{ width: 2, height: 60, background: C.faint }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: (300 * g * e) / max, background: gColor }} />
        </div>
        <Count to={g} start={at} dur={20} decimals={dec} prefix={prefix} style={{ ...display(120), color: C.dim, width: 220, textAlign: "right" }} />
      </div>
    </FadeIn>
  );
};

const Stats: React.FC = () => (
  <Whip>
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Crest team="lille" size={80} />
          <span style={{ ...mono(24), color: C.dim }}>Maç istatistiği</span>
          <Crest team="gs" size={80} />
        </div>
        <Drop size={150} lines={[{ text: "Topa Lille" }, { text: "sahip oldu.", color: C.ice, weight: 300 }]} />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 740, display: "flex", flexDirection: "column", gap: 50 }}>
        <Row at={42} label="Topa sahip olma" l={MATCH.possession[0]} g={MATCH.possession[1]} max={56} prefix="%" />
        <Row at={80} label="Şut" l={MATCH.shots[0]} g={MATCH.shots[1]} max={15} />
        <Row at={114} label="Beklenen gol (xG)" l={MATCH.xg[0]} g={MATCH.xg[1]} max={1.88} dec={2} />
      </div>
    </Stage>
  </Whip>
);

/* ---------- 3 · but the score ---------- */
const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const HIT = 32;
  const f = frame - HIT;
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });
  const shake = f >= 0 && f < 10 ? Math.sin(f * 2.7) * (10 - f) * 1.6 : 0;
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.18);
  return (
    <Stage light={f >= 0 ? 1.25 : 0.6}>
      {f < 0 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <Drop size={220} align="center" delay={2} lines={[{ text: "Ama skor:" }]} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
          <div style={{ position: "absolute", top: 440, left: PAD, right: PAD, display: "flex", justifyContent: "space-between" }}>
            <Crest team="lille" size={210} style={{ transform: `scale(${s(0)})` }} />
            <Crest team="gs" size={210} style={{ transform: `scale(${s(4)})` }} />
          </div>
          <div style={{ position: "absolute", top: 700, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <span style={{ ...display(560), color: C.dim, transform: `translateY(${(1 - s(2)) * -300}px)` }}>2</span>
            <span style={{ ...display(240, 300), color: C.faint }}>–</span>
            <span style={{ ...display(560), color: C.ice, transform: `translateY(${(1 - s(10)) * -300}px)`, textShadow: `0 0 ${60 + 50 * glow}px rgba(201,220,234,${0.35 + 0.25 * glow})` }}>4</span>
          </div>
        </AbsoluteFill>
      )}
      <Flash at={HIT} />
    </Stage>
  );
};

/* ---------- 4 · 2' Yunus ---------- */
const Yunus: React.FC = () => (
  <Whip dir={-1}>
    <Stage light={0.8}>
      <GoalHead minute="2'" who="Yunus Akgün" how="Ceza sahası göbeği · sol ayak" prev="0–0" score="0–1" scoreAt={70} team="gs" />
      <Pitch zoom={1.35} anchor="top" from={20}>
        <Dot at={[0.38, 0.1]} ring color={LOSC} from={8} />
        <Dot at={[0.62, 0.1]} ring color={LOSC} from={10} />
        <Dot at={[0.5, 0.03]} ring color={LOSC} from={12} />
        <Dot at={[0.47, 0.2]} label="Yunus" color={C.ice} from={16} glow />
        <Move pts={[[0.47, 0.2], [0.49, 0.1], [0.52, -0.01]]} from={50} dur={16} ball width={6} />
        <NetFlash at={66} top />
      </Pitch>
      <Flash at={66} />
    </Stage>
  </Whip>
);

/* ---------- 5 · Diaoune twice, Lille's first half ---------- */
const LilleHalf: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = frame < 95 ? 0 : frame < 136 ? 1 : 2;
  const press = interpolate(frame, [140, 175], [0, 1], clamp);
  const scoreAt = phase === 0 ? 72 : 118;
  return (
    <Whip>
      <Stage light={0.8}>
        {phase < 2 ? (
          <GoalHead
            key={phase}
            minute={phase === 0 ? "7'" : "39'"}
            who="Diaoune"
            how={phase === 0 ? "Sol çapraz · alçak vuruş" : "Ceza sahasında seken top"}
            prev={phase === 0 ? "0–1" : "1–1"}
            score={phase === 0 ? "1–1" : "2–1"}
            scoreAt={phase === 0 ? 72 : 118}
            team="lille"
            delay={phase === 0 ? 2 : 96}
          />
        ) : (
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 200, display: "flex", flexDirection: "column", gap: 14 }}>
            <Meta left="İlk 30 dakika" right="Lille 2–1" />
            <Drop size={120} delay={137} lines={[{ text: "İlk yarım saat" }, { text: "Lille'in.", color: LOSC }]} />
          </div>
        )}
        <Pitch zoom={phase < 2 ? 1.3 : 1} anchor="bottom" from={phase === 0 ? 14 : 100}>
          {phase === 0 ? (
            <>
              <Dot at={[0.5, 0.97]} ring color={C.ice} from={6} />
              <Dot at={[0.4, 0.9]} ring color={C.ice} from={8} />
              <Dot at={[0.7, 0.84]} label="Diaoune" color={LOSC} from={10} glow />
              <Move pts={[[0.86, 0.6], [0.78, 0.74], [0.7, 0.84]]} from={20} dur={24} dashed color={LOSC} />
              <Move pts={[[0.7, 0.84], [0.62, 0.93], [0.55, 1.01]]} from={56} dur={14} ball color={LOSC} width={6} />
              <NetFlash at={70} top={false} color={LOSC} />
            </>
          ) : phase === 1 ? (
            <>
              <Dot at={[0.5, 0.97]} ring color={C.ice} from={96} />
              <Dot at={[0.42, 0.88]} ring color={C.ice} from={97} />
              <Dot at={[0.6, 0.88]} ring color={C.ice} from={98} />
              <Dot at={[0.5, 0.86]} label="Diaoune" color={LOSC} from={100} glow />
              <Move pts={[[0.36, 0.84], [0.44, 0.9], [0.5, 0.86]]} from={100} dur={10} ball color={C.dim} width={4} />
              <Move pts={[[0.5, 0.86], [0.51, 0.94], [0.5, 1.01]]} from={108} dur={10} ball color={LOSC} width={6} />
              <NetFlash at={118} top={false} color={LOSC} />
            </>
          ) : (
            <g opacity={press}>
              {[
                [0.2, 0.5, 0.25, 0.72],
                [0.5, 0.45, 0.48, 0.7],
                [0.8, 0.5, 0.75, 0.72],
                [0.35, 0.55, 0.38, 0.78],
                [0.65, 0.55, 0.62, 0.78],
              ].map(([x0, y0, x1, y1], i) => (
                <Move key={i} pts={[[x0, y0], [x1, y1]]} from={142 + i * 4} dur={18} color={LOSC} dashed width={5} />
              ))}
              <rect x={PX} y={PY + PH * 0.5} width={PW} height={PH * 0.5} fill={LOSC} opacity={0.08 + 0.05 * Math.sin(frame * 0.2)} />
            </g>
          )}
          {phase < 2 ? <NetFlash at={scoreAt} top={false} color={LOSC} /> : null}
        </Pitch>
        {phase === 2 ? (
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 1000, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
            <FadeIn at={182}><Chip color={LOSC}>Önde baskı</Chip></FadeIn>
            <FadeIn at={192}><Chip>Korner üstüne korner</Chip></FadeIn>
          </div>
        ) : null}
      </Stage>
    </Whip>
  );
};

/* ---------- 6 · 44' Batrakov ---------- */
const Batrakov: React.FC = () => (
  <Whip dir={-1}>
    <Stage light={0.8}>
      <GoalHead minute="44'" who="Batrakov" how="Sallai'nin ortası · kafa" prev="2–1" score="2–2" scoreAt={112} team="gs" />
      <Pitch zoom={1.25} anchor="top" from={30}>
        <Dot at={[0.4, 0.1]} ring color={LOSC} from={6} />
        <Dot at={[0.6, 0.1]} ring color={LOSC} from={8} />
        <Dot at={[0.5, 0.03]} ring color={LOSC} from={10} />
        <Dot at={[0.9, 0.24]} label="Sallai" color={C.white} from={12} />
        <Dot at={[0.47, 0.09]} label="Batrakov" color={C.ice} from={14} glow labelBelow={false} />
        <Move pts={[[0.45, 0.3], [0.46, 0.18], [0.47, 0.1]]} from={20} dur={30} dashed color={C.ice} width={4} />
        <Move pts={[[0.9, 0.24], [0.75, 0.08], [0.55, 0.06], [0.47, 0.09]]} from={42} dur={26} ball color={C.white} width={5} />
        <Move pts={[[0.47, 0.09], [0.49, 0.04], [0.5, -0.01]]} from={76} dur={10} ball width={6} />
        <NetFlash at={86} top />
      </Pitch>
      <Flash at={86} />
    </Stage>
  </Whip>
);

/* ---------- 7 · second half: 52' corner, 61' counter ---------- */
const Second: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = frame < 60 ? 0 : frame < 148 ? 1 : 2;
  const osi = spring({ frame: frame - 218, fps, config: { damping: 14 } });
  return (
    <Whip>
      {phase === 0 ? (
        <AbsoluteFill>
          <Photo src="buruk.jpg" pos="45% 22%" zoom={[1.08, 1.2]} dim={0.5} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 900 }}>
            <Meta left="İkinci yarı" right="Okan Buruk" />
            <div style={{ height: 24 }} />
            <Drop size={150} delay={4} lines={[{ text: "Başka" }, { text: "bir maç.", color: C.ice, weight: 300 }]} />
          </div>
        </AbsoluteFill>
      ) : (
        <Stage light={0.8}>
          {phase === 1 ? (
            <GoalHead key="52" minute="52'" who="Kendi kalesine" how="Sara'nın kornerinden" prev="2–2" score="2–3" scoreAt={124} team="gs" delay={62} />
          ) : (
            <GoalHead key="61" minute="61'" who="Osimhen" how="Kontra · Barış Alper'in pası" prev="2–3" score="2–4" scoreAt={239} team="gs" delay={150} />
          )}
          <Pitch zoom={1} anchor="top">
            {phase === 1 ? (
              <>
                <Dot at={[0.45, 0.07]} ring color={LOSC} from={64} />
                <Dot at={[0.58, 0.09]} ring color={LOSC} from={65} />
                <Dot at={[0.5, 0.02]} ring color={LOSC} from={66} />
                <Dot at={[0.52, 0.12]} color={C.ice} from={67} />
                <Dot at={[0.4, 0.13]} color={C.ice} from={68} />
                <Dot at={[0.97, 0.0]} label="Sara" color={C.white} from={70} labelBelow />
                <Move pts={[[0.99, 0.0], [0.8, -0.04], [0.62, 0.02], [0.56, 0.06]]} from={78} dur={26} ball color={C.white} width={5} />
                <Move pts={[[0.56, 0.06], [0.53, 0.02], [0.52, -0.01]]} from={112} dur={10} ball color={C.ice} width={6} />
                <NetFlash at={122} top />
              </>
            ) : (
              <>
                <Dot at={[0.2, 0.74]} label="Barış Alper" color={C.white} from={150} />
                <Dot at={[0.52, 0.55]} label="Osimhen" color={C.ice} from={152} glow labelBelow={false} />
                <Dot at={[0.42, 0.3]} ring color={LOSC} from={154} />
                <Dot at={[0.62, 0.3]} ring color={LOSC} from={155} />
                <Dot at={[0.5, 0.03]} ring color={LOSC} from={156} />
                <Move pts={[[0.2, 0.74], [0.2, 0.55], [0.24, 0.35]]} from={160} dur={34} dashed color={C.white} width={4} />
                <Move pts={[[0.52, 0.55], [0.54, 0.38], [0.5, 0.2]]} from={166} dur={36} dashed color={C.ice} width={4} />
                <Move pts={[[0.24, 0.35], [0.38, 0.27], [0.5, 0.2]]} from={200} dur={12} ball color={C.white} width={5} />
                <Move pts={[[0.5, 0.2], [0.5, 0.1], [0.5, -0.01]]} from={214} dur={12} ball width={6} />
                <NetFlash at={226} top />
              </>
            )}
          </Pitch>
          {phase === 2 ? (
            <div
              style={{
                position: "absolute",
                right: PAD - 10,
                top: 900,
                width: 320,
                height: 420,
                borderRadius: 14,
                overflow: "hidden",
                border: `2px solid ${C.ice}`,
                transform: `translateX(${(1 - osi) * 480}px) rotate(${(1 - osi) * 6}deg)`,
                boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
              }}
            >
              <Img src={staticFile("photos/osimhen.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 8%", filter: "grayscale(0.4) contrast(1.1) brightness(0.85)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "40px 18px 16px", background: "linear-gradient(transparent, rgba(8,9,11,0.95))" }}>
                <div style={{ ...display(56), color: C.white }}>Osimhen</div>
                <div style={{ ...mono(18), color: C.ice }}>61' · 4–2</div>
              </div>
            </div>
          ) : null}
          <Flash at={phase === 1 ? 122 : 226} />
        </Stage>
      )}
    </Whip>
  );
};

/* ---------- 8 · 50,000 simulations ---------- */
const COLS = 40;
const ROWS = 25;
const DOTS = COLS * ROWS;
const nLille = Math.round(SIM.lille * DOTS);
const nDraw = Math.round(SIM.draw * DOTS);
const nExact = Math.round((SIM.exact24 / SIM.n) * DOTS);
const shuffled = (() => {
  const a = Array.from({ length: DOTS }, (_, i) => i);
  let seed = 2026;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();
const cat = (k: number) => (k < nLille ? "lille" : k < nLille + nDraw ? "draw" : k >= DOTS - nExact ? "exact" : "gs");

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cell = 22;
  const sort = spring({ frame: frame - 60, fps, config: { damping: 200, mass: 1.4 } });
  const shown = interpolate(frame, [52, 84], [0, DOTS], clamp);
  const focus = interpolate(frame, [176, 190], [0, 1], clamp);
  const gx = (1080 - COLS * cell) / 2;
  const gy = 640;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.3);
  const colour = (c: string) => (c === "lille" ? LOSC : c === "draw" ? "rgba(241,239,234,0.3)" : C.ice);
  return (
    <Whip dir={-1}>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 12 }}>
          <Meta left="Maçın xG'si ile" right="Poisson simülasyonu" />
          <Count to={50000} start={44} dur={30} style={{ ...display(220), color: C.white }} />
          <div style={{ ...display(70, 300), color: C.ice, marginTop: -6 }}>kez oynattık.</div>
        </div>
        <div style={{ position: "absolute", left: gx, top: gy, width: COLS * cell, height: ROWS * cell }}>
          {Array.from({ length: DOTS }, (_, k) => {
            const startCell = shuffled[k];
            if (startCell > shown) return null;
            const tc = Math.floor(k / ROWS);
            const tr = k % ROWS;
            const sx = (startCell % COLS) * cell;
            const sy = Math.floor(startCell / COLS) * cell;
            const x = sx + (tc * cell - sx) * sort;
            const y = sy + (tr * cell - sy) * sort;
            const c = cat(k);
            const isExact = c === "exact";
            const size = isExact ? 15 + focus * (8 + 4 * pulse) : 15;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: x + (cell - size) / 2,
                  top: y + (cell - size) / 2,
                  width: size,
                  height: size,
                  borderRadius: size,
                  background: isExact && focus > 0 ? C.white : colour(c),
                  opacity: isExact ? 1 : 1 - 0.85 * focus,
                  boxShadow: isExact && focus > 0 ? `0 0 ${16 + 14 * pulse}px rgba(201,220,234,0.9)` : undefined,
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: gx, width: COLS * cell, top: gy + ROWS * cell + 30, display: "flex", opacity: 1 - focus }}>
          {[
            { at: 112, w: SIM.lille, label: "Lille", v: 44, c: LOSC },
            { at: 120, w: SIM.draw, label: "Beraberlik", v: 22, c: C.white },
            { at: 94, w: SIM.gs, label: "Galatasaray", v: 34, c: C.ice },
          ].map((b) => (
            <div key={b.label} style={{ width: `${b.w * 100}%`, paddingRight: 10, boxSizing: "border-box" }}>
              <FadeIn at={b.at}>
                <Count to={b.v} start={b.at} dur={16} prefix="%" style={{ ...display(110), color: b.c }} />
                <div style={{ ...mono(19), letterSpacing: "0.08em", color: C.white, marginTop: 4 }}>{b.label}</div>
              </FadeIn>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 860, height: 330, opacity: focus, background: "radial-gradient(60% 50% at 50% 50%, rgba(11,12,14,0.92) 30%, transparent 100%)" }} />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 900, opacity: focus, textAlign: "center" }}>
          <div style={{ ...display(200), color: C.white }}>2–4: %1,5</div>
          <div style={{ ...mono(28), color: C.ice, marginTop: 18 }}>50.000 maçta sadece 767 kez</div>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 9 · big chances ---------- */
export const Ring: React.FC<{ at: number; fillAt?: number; size: number }> = ({ at, fillAt, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, mass: 0.6 } });
  const goal = fillAt !== undefined && frame >= fillAt;
  const fill = fillAt === undefined ? 0 : spring({ frame: frame - fillAt, fps, config: { damping: 14, mass: 0.5 } });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        border: `4px solid ${fillAt !== undefined ? C.ice : C.dim}`,
        background: `rgba(201,220,234,${0.9 * fill})`,
        display: "grid",
        placeItems: "center",
        transform: `scale(${(0.85 + 0.15 * s) * s})`,
        boxShadow: goal ? `0 0 ${50 * fill}px rgba(201,220,234,0.5)` : undefined,
      }}
    >
      <span style={{ ...display(size * 0.3), color: goal ? C.bg0 : C.dim, opacity: goal ? fill : fillAt === undefined ? s : 0 }}>{goal ? "Gol" : "—"}</span>
    </div>
  );
};

const Chances: React.FC = () => (
  <Whip>
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 26 }}>
        <Meta left="Büyük fırsatlar" right="Galatasaray" />
        <Drop size={150} lines={[{ text: "Peki fark" }, { text: "nerede?", color: C.ice, weight: 300 }]} />
      </div>
      <div style={{ position: "absolute", top: 720, left: PAD, right: PAD }}>
        <FadeIn at={42}>
          <div style={{ ...display(110), color: C.white }}>4 büyük fırsat</div>
        </FadeIn>
        <div style={{ display: "flex", gap: 26, marginTop: 40 }}>
          <Ring at={45} fillAt={78} size={200} />
          <Ring at={49} fillAt={83} size={200} />
          <Ring at={53} fillAt={88} size={200} />
          <Ring at={57} size={200} />
        </div>
        <FadeIn at={92}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 46 }}>
            <span style={{ ...display(170), color: C.ice }}>%75</span>
            <span style={{ ...mono(26), color: C.white }}>dönüşüm · Lille: 2 büyük fırsat</span>
          </div>
        </FadeIn>
      </div>
    </Stage>
  </Whip>
);

/* ---------- 10 · verdict, derby teaser, logo ---------- */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - 124;
  const rot = spring({ frame: lf - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: lf - 12, fps, config: { damping: 200 } });
  const derby = frame >= 72 && frame < 124;
  return (
    <Whip dir={-1}>
      {frame < 72 ? (
        <Stage>
          <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
            <Drop size={176} stagger={5} delay={2} lines={[{ text: "Bitiricilik," }, { text: "istatistiği" }, { text: "yener.", color: C.ice, weight: 300 }]} />
          </AbsoluteFill>
        </Stage>
      ) : derby ? (
        <AbsoluteFill>
          <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.25]} dim={0.55} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 300 }}>
            <Meta left="Sıradaki durak" right="Pazartesi · 21:30" />
            <div style={{ height: 30 }} />
            <Drop size={230} delay={74} lines={[{ text: "Derbi." }]} />
            <FadeIn at={84}>
              <div style={{ ...display(80, 300), color: C.ice, marginTop: 10 }}>Galatasaray – Fenerbahçe</div>
            </FadeIn>
          </div>
        </AbsoluteFill>
      ) : (
        <Stage light={0.7}>
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
            <div style={{ transform: `scale(${0.6 + 0.4 * word})` }}>
              <PivotMark size={240} angle={interpolate(rot, [0, 1], [0, -36])} />
            </div>
            <div style={{ ...display(210), color: C.white, opacity: word }}>Pivot</div>
            <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(lf, [20, 32], [0, 1], clamp) }}>
              Derbi analizi yakında.
            </div>
            <div style={{ ...mono(24), color: C.ice, opacity: interpolate(lf, [30, 42], [0, 1], clamp) }}>Takip et · her maç, sayılarla</div>
          </AbsoluteFill>
          <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 330, ...mono(17), letterSpacing: "0.06em", lineHeight: 1.6, color: C.dim, textAlign: "center" }}>
            Fotoğraflar: Wikimedia Commons · Liondartois, Zafer, Antoloji (CC BY-SA 4.0 / CC BY 4.0), Ottomanor (CC0)
            <br />
            Veri: SofaScore · FotMob · Gol çizimleri temsilidir
          </div>
        </Stage>
      )}
    </Whip>
  );
};

/* ---------- reel ---------- */
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = LILLE2_CAPTIONS.find((p) => t >= p.words[0].s - 0.12 && t < p.words[p.words.length - 1].e + 0.3);
  if (!c) return null;
  const from = c.words[0].s - 0.12;
  const to = c.words[c.words.length - 1].e + 0.3;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const Lille2Reel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    <Sequence from={L2.hook.from} durationInFrames={L2.hook.dur}><Hook /></Sequence>
    <Sequence from={L2.stats.from} durationInFrames={L2.stats.dur}><Stats /></Sequence>
    <Sequence from={L2.reveal.from} durationInFrames={L2.reveal.dur}><Reveal /></Sequence>
    <Sequence from={L2.yunus.from} durationInFrames={L2.yunus.dur}><Yunus /></Sequence>
    <Sequence from={L2.lille.from} durationInFrames={L2.lille.dur}><LilleHalf /></Sequence>
    <Sequence from={L2.batrakov.from} durationInFrames={L2.batrakov.dur}><Batrakov /></Sequence>
    <Sequence from={L2.second.from} durationInFrames={L2.second.dur}><Second /></Sequence>
    <Sequence from={L2.sim.from} durationInFrames={L2.sim.dur}><Sim /></Sequence>
    <Sequence from={L2.chances.from} durationInFrames={L2.chances.dur}><Chances /></Sequence>
    <Sequence from={L2.outro.from} durationInFrames={L2.outro.dur}><Outro /></Sequence>
    <Captions />
    <Grain />
    <Audio src={staticFile("score-lille2.wav")} volume={0.45} />
    <Sequence from={Math.round(VO_OFFSET * FPS)}>
      <Audio src={staticFile("voice-lille2.mp3")} />
    </Sequence>
  </AbsoluteFill>
);
