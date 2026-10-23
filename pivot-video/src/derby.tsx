import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption, Count, Crest, Drop, FadeIn, Grain, Meta, PivotMark, Stage } from "./parts";
import { C, display, F, mono } from "./theme";
import { DERBY_CAPTIONS } from "./derbyCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GS_RED = "#c23a3f";
const FB_YEL = "#e2bb45";

// Scene boundaries (frames), cut to the narration. scripts/derby_cues.json mirrors them in seconds.
export const DERBY = {
  hook: { from: 0, dur: 216 },
  table: { from: 216, dur: 219 },
  numbers: { from: 435, dur: 225 },
  tactics: { from: 660, dur: 220 },
  kerem: { from: 880, dur: 149 },
  sim: { from: 1029, dur: 255 },
  sure: { from: 1284, dur: 126 },
  outro: { from: 1410, dur: 225 },
};
export const DERBY_TOTAL = 1635;

// Galatasaray – Fenerbahçe, 26 Oct 2026: 50,000 Poisson sims (scripts/sim_derby.py)
const SIM = { fb: 0.45, draw: 0.23, gs: 0.32, oneOne: 0.101, totals: [0.036, 0.115, 0.197, 0.221, 0.184, 0.124, 0.124] };

/* ---------- shared pieces ---------- */

// Graded photo with a slow Ken Burns move: desaturated, crushed, cooled toward the PİVOT ice.
export const Photo: React.FC<{
  src: string;
  pos?: string;
  zoom?: [number, number];
  drift?: [number, number];
  dim?: number;
  style?: React.CSSProperties;
}> = ({ src, pos = "50% 40%", zoom = [1.04, 1.16], drift = [0, 0], dim = 0.55, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = frame / durationInFrames;
  const s = interpolate(k, [0, 1], zoom);
  const x = interpolate(k, [0, 1], [0, drift[0]]);
  const y = interpolate(k, [0, 1], [0, drift[1]]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <Img
        src={staticFile(`photos/${src}`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: pos,
          transform: `scale(${s}) translate(${x}px, ${y}px)`,
          filter: `grayscale(0.72) contrast(1.18) brightness(${dim})`,
        }}
      />
      <AbsoluteFill style={{ background: C.ice, mixBlendMode: "soft-light", opacity: 0.28 }} />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(8,9,11,0.75) 0%, rgba(8,9,11,0.05) 30%, rgba(8,9,11,0.1) 60%, rgba(8,9,11,0.9) 100%)" }}
      />
    </AbsoluteFill>
  );
};

// Whip-in: each scene enters with a short sideways smear.
export const Whip: React.FC<{ children: React.ReactNode; dir?: 1 | -1 }> = ({ children, dir = 1 }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, 7], [1, 0], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  return (
    <AbsoluteFill style={{ transform: `translateX(${dir * k * 160}px)`, filter: `blur(${k * 18}px)`, opacity: 1 - k * 0.4 }}>
      {children}
    </AbsoluteFill>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.white }) => (
  <span
    style={{
      ...mono(24),
      color,
      border: `1.5px solid ${color}`,
      padding: "10px 16px",
      borderRadius: 6,
      background: "rgba(8,9,11,0.55)",
      display: "inline-block",
    }}
  >
    {children}
  </span>
);

export const Flash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + 9], [0, 0.85, 0], clamp);
  return <AbsoluteFill style={{ background: C.white, opacity: o, pointerEvents: "none" }} />;
};

/* ---------- 1 · hook ---------- */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const darken = interpolate(frame, [92, 104], [0, 0.55], clamp);
  const shake = frame > 190 && frame < 200 ? Math.sin(frame * 3.1) * (200 - frame) * 1.5 : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.0, 1.22]} drift={[0, 30]} dim={0.62} />
      <AbsoluteFill style={{ background: "#08090b", opacity: darken }} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 30 }}>
        <Meta left="Süper Lig · 9. hafta" right="26 Ekim · 21:30" />
        {frame < 99 ? (
          <Drop size={170} delay={14} lines={[{ text: "Pazartesi" }, { text: "gecesi." }, { text: "RAMS Park.", color: C.ice, weight: 300 }]} />
        ) : (
          <div>
            <Count to={50000} start={100} dur={34} style={{ ...display(250), color: C.white }} />
            <FadeIn at={110}>
              <div style={{ ...display(90, 300), color: C.ice, marginTop: -10 }}>kez oynandı.</div>
            </FadeIn>
          </div>
        )}
      </div>
      {frame >= 160 ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 900 }}>
          <Drop size={130} delay={163} lines={[{ text: "Sonuç" }, { text: "şaşırtacak.", color: C.ice }]} />
        </div>
      ) : null}
      <Flash at={190} />
    </AbsoluteFill>
  );
};

/* ---------- 2 · table + the coaches ---------- */
const Lower: React.FC<{ team: "gs" | "lille" | "fb"; rank: string; name: string; pts: string; at: number }> = ({ team, rank, name, pts, at }) => (
  <FadeIn at={at} y={30}>
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      {team === "fb" ? (
        <div style={{ width: 84, height: 84, borderRadius: 84, background: "#13244f", border: `4px solid ${FB_YEL}`, display: "grid", placeItems: "center", ...display(30), color: FB_YEL }}>FB</div>
      ) : (
        <Crest team="gs" size={84} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ ...mono(24), color: C.ice }}>{rank}</span>
        <span style={{ ...display(84), color: C.white }}>{name}</span>
      </div>
      <span style={{ ...display(110), color: C.white, marginLeft: "auto" }}>{pts}</span>
    </div>
  </FadeIn>
);

const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ex = spring({ frame: frame - 131, fps, config: { damping: 200, mass: 0.9 } });
  const topH = 960 * (1 - ex);
  return (
    <Whip>
      <AbsoluteFill style={{ background: "#08090b" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: topH, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960 }}>
            <Photo src="buruk.jpg" pos="45% 22%" zoom={[1.05, 1.15]} dim={0.6} />
            <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 70 }}>
              <Lower team="gs" rank="1. sıra · Okan Buruk" name="Galatasaray" pts="19" at={4} />
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: topH, height: 1920 - topH, overflow: "hidden" }}>
          <Photo src="kartal.jpg" pos="52% 30%" zoom={[1.08, 1.2]} dim={0.6} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: interpolate(ex, [0, 1], [60, 1010]) }}>
            <Lower team="fb" rank="3. sıra · İsmail Kartal" name="Fenerbahçe" pts="16" at={70} />
          </div>
          {frame >= 176 ? (
            <div style={{ position: "absolute", left: PAD, right: PAD, top: 230 + 0 }}>
              <Meta left="İsmail Kartal" right="Derbi" />
              <div style={{ height: 30 }} />
              <Drop size={150} delay={181} lines={[{ text: "Bir maçtan" }, { text: "fazlası.", color: C.ice, weight: 300 }]} />
            </div>
          ) : null}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: topH - 1, height: 2, background: C.ice, opacity: 1 - ex }} />
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 3 · numbers ---------- */
const TeamNums: React.FC<{ team: "gs" | "fb"; at: number; gf: number; ga: number; hiGa?: number }> = ({ team, at, gf, ga, hiGa }) => {
  const frame = useCurrentFrame();
  const glow = hiGa !== undefined ? interpolate(frame, [hiGa, hiGa + 10], [0, 1], clamp) : 0;
  return (
    <FadeIn at={at} y={40}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 18 }}>
        {team === "gs" ? (
          <Crest team="gs" size={70} />
        ) : (
          <div style={{ width: 70, height: 70, borderRadius: 70, background: "#13244f", border: `3px solid ${FB_YEL}`, display: "grid", placeItems: "center", ...display(26), color: FB_YEL }}>FB</div>
        )}
        <span style={{ ...display(70), color: C.white }}>{team === "gs" ? "Galatasaray" : "Fenerbahçe"}</span>
        <span style={{ ...mono(22), color: C.dim, marginLeft: "auto" }}>8 maç</span>
      </div>
      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1, borderTop: `2px solid ${C.faint}`, paddingTop: 14 }}>
          <div style={{ ...mono(22), color: C.dim }}>Attığı</div>
          <Count to={gf} start={at + 2} dur={20} style={{ ...display(230), color: C.white }} />
        </div>
        <div style={{ flex: 1, borderTop: `2px solid ${glow ? C.ice : C.faint}`, paddingTop: 14 }}>
          <div style={{ ...mono(22), color: glow ? C.ice : C.dim }}>Yediği</div>
          <Count
            to={ga}
            start={at + 8}
            dur={20}
            style={{ ...display(230), color: glow ? C.ice : C.white, textShadow: `0 0 ${70 * glow}px rgba(201,220,234,${0.6 * glow})` }}
          />
        </div>
      </div>
    </FadeIn>
  );
};

const Numbers: React.FC = () => (
  <Whip dir={-1}>
    <Stage>
      <AbsoluteFill style={{ opacity: 0.35 }}>
        <Photo src="derbi.jpg" pos="50% 30%" dim={0.35} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 28 }}>
        <Meta left="Süper Lig · 8 hafta" right="Gol" />
        <Drop size={150} lines={[{ text: "Rakamlara" }, { text: "bak.", color: C.ice, weight: 300 }]} />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 640, display: "flex", flexDirection: "column", gap: 56 }}>
        <TeamNums team="gs" at={30} gf={17} ga={11} />
        <TeamNums team="fb" at={136} gf={22} ga={6} hiGa={190} />
      </div>
    </Stage>
  </Whip>
);

/* ---------- 4 · tactics board ---------- */
const PX = 90;
const PY = 430;
const PW = 900;
const PH = 930;
const P = (x: number, y: number) => ({ x: PX + x * PW, y: PY + y * PH });

const GS_XI: { n: string; x: number; y: number }[] = [
  { n: "Uğurcan", x: 0.5, y: 0.95 },
  { n: "Jakobs", x: 0.13, y: 0.79 },
  { n: "Abdülkerim", x: 0.37, y: 0.83 },
  { n: "Davinson", x: 0.63, y: 0.83 },
  { n: "Sallai", x: 0.87, y: 0.79 },
  { n: "Torreira", x: 0.38, y: 0.68 },
  { n: "Sara", x: 0.62, y: 0.68 },
  { n: "Barış Alper", x: 0.14, y: 0.53 },
  { n: "Batrakov", x: 0.5, y: 0.55 },
  { n: "Yunus", x: 0.86, y: 0.53 },
  { n: "Osimhen", x: 0.5, y: 0.41 },
];

const Tactics: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [0, 24], [1, 0], clamp);
  const fbIn = spring({ frame: frame - 78, fps, config: { damping: 200 } });
  const ake = spring({ frame: frame - 109, fps, config: { damping: 12 } });
  const pair = spring({ frame: frame - 130, fps, config: { damping: 200 } });
  const osi = spring({ frame: frame - 167, fps, config: { damping: 14 } });
  const run = interpolate(frame, [172, 196], [1, 0], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.35);
  const o = P(0.5, 0.41);
  const gap = P(0.5, 0.17);
  const goal = P(0.5, 0.02);
  const head =
    frame < 130
      ? { a: "Lille'yi yıkan", b: "kadro bozulmuyor." }
      : { a: "Hedef:", b: "yeni stoper ikilisi." };
  return (
    <Whip>
      <Stage light={0.8}>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 200, display: "flex", flexDirection: "column", gap: 18 }}>
          <Meta left="Galatasaray · muhtemel 11" right="4-2-3-1" />
          <div key={head.a}>
            <Drop size={84} delay={frame < 130 ? 4 : 130} lines={[{ text: head.a }, { text: head.b, color: C.ice, weight: 300 }]} />
          </div>
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g fill="none" stroke={C.white} strokeOpacity={0.24} strokeWidth={2} strokeDasharray="4000" strokeDashoffset={4000 * draw}>
            <rect x={PX} y={PY} width={PW} height={PH} />
            <line x1={PX} y1={PY + PH / 2} x2={PX + PW} y2={PY + PH / 2} />
            <circle cx={PX + PW / 2} cy={PY + PH / 2} r={90} />
            <rect x={PX + PW * 0.22} y={PY} width={PW * 0.56} height={PH * 0.16} />
            <rect x={PX + PW * 0.22} y={PY + PH * 0.84} width={PW * 0.56} height={PH * 0.16} />
            <rect x={PX + PW * 0.38} y={PY - 14} width={PW * 0.24} height={14} />
          </g>
          {/* Fenerbahçe back line */}
          <g opacity={fbIn}>
            {[
              [0.14, 0.22],
              [0.86, 0.22],
            ].map(([x, y], i) => (
              <circle key={i} cx={P(x, y).x} cy={P(x, y).y} r={20} fill="none" stroke={FB_YEL} strokeWidth={4} />
            ))}
            <circle cx={P(0.6, 0.17).x} cy={P(0.6, 0.17).y} r={20} fill="none" stroke={FB_YEL} strokeWidth={4} />
            <circle cx={P(0.4, 0.17).x} cy={P(0.4, 0.17).y} r={20} fill="none" stroke={FB_YEL} strokeWidth={4} strokeDasharray={ake > 0.5 ? "6 6" : undefined} />
            <text x={P(0.86, 0.22).x} y={P(0.86, 0.22).y - 34} textAnchor="middle" style={{ ...mono(20) }} fill={FB_YEL}>FB</text>
          </g>
          {/* Ake crossed out */}
          <g opacity={ake} transform={`translate(${P(0.4, 0.17).x} ${P(0.4, 0.17).y})`}>
            <line x1={-26} y1={-26} x2={26} y2={26} stroke={GS_RED} strokeWidth={6} strokeLinecap="round" />
            <line x1={26} y1={-26} x2={-26} y2={26} stroke={GS_RED} strokeWidth={6} strokeLinecap="round" />
            <text x={0} y={-40} textAnchor="middle" style={{ ...display(34) }} fill={C.white}>AKE YOK</text>
          </g>
          {/* new centre-back pair bracket */}
          <g opacity={pair}>
            <path
              d={`M ${P(0.36, 0.17).x} ${P(0.36, 0.17).y + 34} V ${P(0.36, 0.17).y + 50} H ${P(0.64, 0.17).x} V ${P(0.64, 0.17).y + 34}`}
              fill="none"
              stroke={C.ice}
              strokeWidth={3}
            />
            <text x={P(0.5, 0.17).x} y={P(0.5, 0.17).y + 88} textAnchor="middle" style={{ ...mono(22) }} fill={C.ice}>YENİ İKİLİ</text>
            <ellipse cx={gap.x} cy={gap.y} rx={70 + 10 * pulse} ry={36 + 6 * pulse} fill={`rgba(201,220,234,${0.08 + 0.1 * pulse})`} />
          </g>
          {/* Galatasaray XI */}
          {GS_XI.map((p, i) => {
            const s = spring({ frame: frame - 6 - i * 3, fps, config: { damping: 14, mass: 0.5 } });
            const q = P(p.x, p.y);
            const isO = p.n === "Osimhen";
            return (
              <g key={p.n} transform={`translate(${q.x} ${q.y}) scale(${s})`}>
                {isO ? <circle r={34 + 8 * osi * pulse} fill={`rgba(201,220,234,${0.25 * osi})`} /> : null}
                <circle r={17} fill={isO && osi > 0.1 ? C.ice : C.white} />
                <text y={44} textAnchor="middle" style={{ ...display(30, 600) }} fill={isO && osi > 0.1 ? C.ice : C.dim}>
                  {p.n}
                </text>
              </g>
            );
          })}
          {/* Osimhen's run into the gap */}
          <path
            d={`M ${o.x} ${o.y - 24} C ${o.x + 80} ${o.y - 140}, ${gap.x + 40} ${gap.y + 80}, ${gap.x} ${gap.y} S ${goal.x} ${goal.y + 30}, ${goal.x} ${goal.y + 10}`}
            fill="none"
            stroke={C.ice}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="900"
            strokeDashoffset={900 * run}
            opacity={osi}
          />
        </svg>
        {/* Osimhen card */}
        <div
          style={{
            position: "absolute",
            right: PAD - 10,
            top: 880,
            width: 330,
            height: 440,
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
            <div style={{ ...mono(18), color: C.ice }}>Hedef: stoper arası</div>
          </div>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 5 · Kerem ---------- */
const Kerem: React.FC = () => (
  <Whip dir={-1}>
    <AbsoluteFill>
      <Photo src="kerem.jpg" pos="50% 25%" zoom={[1.12, 1.28]} drift={[0, 20]} dim={0.72} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
        <Meta left="Fenerbahçe'nin cevabı" right="Kerem Aktürkoğlu" />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 920 }}>
        <Drop size={280} delay={45} lines={[{ text: "Kerem." }]} />
        <div style={{ height: 14 }} />
        <Drop size={92} delay={62} lines={[{ text: "Eski takımına karşı.", color: C.ice, weight: 300 }]} />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 260 + 70, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        <FadeIn at={100}><Chip color={C.ice}>Hocasından son şans</Chip></FadeIn>
        <FadeIn at={110}><Chip>Sezonun ilk golü: Alanyaspor</Chip></FadeIn>
      </div>
    </AbsoluteFill>
  </Whip>
);

/* ---------- 6 · simulation ---------- */
const COLS = 40;
const ROWS = 25;
const DOTS = COLS * ROWS;
const nFb = Math.round(SIM.fb * DOTS);
const nDraw = Math.round(SIM.draw * DOTS);
const shuffled = (() => {
  const a = Array.from({ length: DOTS }, (_, i) => i);
  let seed = 2610;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();
// dot k: category by k, random start cell shuffled[k], sorted target cell k
const cat = (k: number) => (k < nFb ? "fb" : k < nFb + nDraw ? "draw" : "gs");

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cell = 22;
  const sort = spring({ frame: frame - 52, fps, config: { damping: 200, mass: 1.4 } });
  const shown = interpolate(frame, [8, 46], [0, DOTS], clamp);
  const focus = interpolate(frame, [204, 216], [0, 1], clamp);
  const gx = (1080 - COLS * cell) / 2;
  const gy = 640;
  const colour = (c: string) => (c === "fb" ? FB_YEL : c === "gs" ? GS_RED : "rgba(241,239,234,0.3)");
  return (
    <Whip>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 12 }}>
          <Meta left="Poisson simülasyonu" right="Sezon gol verisi" />
          <Count to={50000} start={2} dur={30} style={{ ...display(220), color: C.white }} />
          <div style={{ ...display(70, 300), color: C.ice, marginTop: -6 }}>simülasyon.</div>
        </div>
        <div style={{ position: "absolute", left: gx, top: gy, width: COLS * cell, height: ROWS * cell, opacity: 1 - 0.85 * focus }}>
          {Array.from({ length: DOTS }, (_, k) => {
            const startCell = shuffled[k];
            if (startCell > shown) return null;
            // sorted order fills column-major so the three blocks read left → right
            const tc = Math.floor(k / ROWS);
            const tr = k % ROWS;
            const sx = (startCell % COLS) * cell;
            const sy = Math.floor(startCell / COLS) * cell;
            const x = sx + (tc * cell - sx) * sort;
            const y = sy + (tr * cell - sy) * sort;
            return (
              <div
                key={k}
                style={{ position: "absolute", left: x + 3.5, top: y + 3.5, width: 15, height: 15, borderRadius: 15, background: sort > 0.02 || frame > 46 ? colour(cat(k)) : C.dim }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: gx, width: COLS * cell, top: gy + ROWS * cell + 30, display: "flex", opacity: 1 - focus }}>
          {[
            { at: 55, w: SIM.fb, label: "Fenerbahçe", v: 45, c: FB_YEL },
            { at: 155, w: SIM.draw, label: "Beraberlik", v: 23, c: C.white },
            { at: 106, w: SIM.gs, label: "Galatasaray", v: 32, c: GS_RED },
          ].map((b) => (
            <div key={b.label} style={{ width: `${b.w * 100}%`, paddingRight: 10, boxSizing: "border-box" }}>
              <FadeIn at={b.at}>
                <Count to={b.v} start={b.at} dur={16} prefix="%" style={{ ...display(110), color: b.c }} />
                <div style={{ ...mono(19), letterSpacing: "0.08em", color: C.white, marginTop: 4 }}>{b.label}</div>
              </FadeIn>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", opacity: focus, transform: `scale(${0.9 + 0.1 * focus})` }}>
          <div style={{ ...mono(26), color: C.ice }}>En olası skor</div>
          <div style={{ ...display(400), color: C.white, marginTop: 10 }}>1–1</div>
          <div style={{ ...mono(26), color: C.dim, marginTop: 10 }}>50.000 maçın %10'u</div>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 7 · surest pick ---------- */
const Sure: React.FC = () => {
  const frame = useCurrentFrame();
  const hi = interpolate(frame, [44, 56], [0, 1], clamp);
  const max = 0.221;
  return (
    <Whip dir={-1}>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 26 }}>
          <Meta left="En emin tahmin" right="Toplam gol" />
          <Drop size={150} lines={[{ text: "En emin" }, { text: "tahmin?", color: C.ice, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 720, height: 420, display: "flex", alignItems: "flex-end", gap: 18 }}>
          {SIM.totals.map((v, i) => {
            const grow = interpolate(frame, [10 + i * 3, 30 + i * 3], [0, 1], clamp);
            const on = i >= 2;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <span style={{ ...mono(20), letterSpacing: "0.04em", color: C.dim, opacity: grow }}>%{Math.round(v * 100)}</span>
                <div
                  style={{
                    width: "100%",
                    height: (360 * v * grow) / max,
                    background: on ? `rgba(201,220,234,${0.35 + 0.65 * hi})` : C.steel,
                    boxShadow: on && hi ? `0 0 40px rgba(201,220,234,${0.3 * hi})` : undefined,
                  }}
                />
                <span style={{ ...display(54), color: on && hi ? C.ice : C.dim }}>{i === 6 ? "6+" : i}</span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: PAD + 230, right: PAD, top: 1200, height: 3, background: C.ice, opacity: hi, transformOrigin: "left", transform: `scaleX(${hi})` }} />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1220, display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 24, opacity: hi }}>
          <span style={{ ...display(84), color: C.white }}>En az 2 gol</span>
          <Count to={85} start={88} dur={16} prefix="%" style={{ ...display(150), color: C.ice }} />
        </div>
        <Flash at={91} />
      </Stage>
    </Whip>
  );
};

/* ---------- 8 · outro ---------- */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - 150;
  const rot = spring({ frame: lf - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: lf - 12, fps, config: { damping: 200 } });
  const logo = frame >= 150;
  return (
    <Whip>
      <AbsoluteFill>
        <Photo src="derbi.jpg" pos="50% 35%" zoom={[1.15, 1.35]} dim={logo ? 0.25 : 0.55} />
        {!logo ? (
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 300, display: "flex", flexDirection: "column", gap: 50 }}>
            <Drop size={140} delay={3} lines={[{ text: "Lider" }, { text: "evinde." }]} />
            <Drop size={140} delay={37} lines={[{ text: "İstatistik", color: C.ice, weight: 300 }, { text: "deplasmanda.", color: C.ice, weight: 300 }]} />
          </div>
        ) : null}
        {!logo && frame >= 84 ? (
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 1170 }}>
            <Drop size={104} delay={86} lines={[{ text: "Kim haklı çıkacak?" }]} />
          </div>
        ) : null}
        {logo ? (
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
            <div style={{ transform: `scale(${0.6 + 0.4 * word})` }}>
              <PivotMark size={240} angle={interpolate(rot, [0, 1], [0, -36])} />
            </div>
            <div style={{ ...display(210), color: C.white, opacity: word }}>Pivot</div>
            <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(lf, [20, 32], [0, 1], clamp) }}>
              Tahminini yorumlara yaz.
            </div>
            <div style={{ ...mono(24), color: C.ice, opacity: interpolate(lf, [30, 42], [0, 1], clamp) }}>Takip et · her maç, sayılarla</div>
          </AbsoluteFill>
        ) : null}
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 330, ...mono(17), letterSpacing: "0.06em", lineHeight: 1.6, color: C.dim, textAlign: "center", opacity: logo ? 1 : 0 }}>
          Fotoğraflar: Wikimedia Commons · Zafer (CC BY 4.0 / CC BY-SA 4.0), Antoloji (CC BY-SA 4.0), Ottomanor, senolsengul (CC0)
          <br />
          Model: sezon gol ortalamalarına dayalı Poisson simülasyonu · kesin sonuç değildir
        </div>
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- reel ---------- */
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = DERBY_CAPTIONS.find((p) => t >= p.words[0].s - 0.12 && t < p.words[p.words.length - 1].e + 0.3);
  if (!c) return null;
  const from = c.words[0].s - 0.12;
  const to = c.words[c.words.length - 1].e + 0.3;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const DerbyReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    <Sequence from={DERBY.hook.from} durationInFrames={DERBY.hook.dur}><Hook /></Sequence>
    <Sequence from={DERBY.table.from} durationInFrames={DERBY.table.dur}><Table /></Sequence>
    <Sequence from={DERBY.numbers.from} durationInFrames={DERBY.numbers.dur}><Numbers /></Sequence>
    <Sequence from={DERBY.tactics.from} durationInFrames={DERBY.tactics.dur}><Tactics /></Sequence>
    <Sequence from={DERBY.kerem.from} durationInFrames={DERBY.kerem.dur}><Kerem /></Sequence>
    <Sequence from={DERBY.sim.from} durationInFrames={DERBY.sim.dur}><Sim /></Sequence>
    <Sequence from={DERBY.sure.from} durationInFrames={DERBY.sure.dur}><Sure /></Sequence>
    <Sequence from={DERBY.outro.from} durationInFrames={DERBY.outro.dur}><Outro /></Sequence>
    <Captions />
    <Grain />
    <Audio src={staticFile("score-derby.wav")} volume={0.45} />
    {/* voice-derby-fit.wav already carries the VO offset: each phrase sits at its caption time (scripts/fit_voice.py) */}
    <Audio src={staticFile("voice-derby-fit.wav")} />
  </AbsoluteFill>
);
