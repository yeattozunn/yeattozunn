import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash } from "./derby";
import { C, display, F, mono } from "./theme";
import { E1_CAPTIONS } from "./e1Captions";
import { E2_CAPTIONS } from "./e2Captions";
import { E3_CAPTIONS } from "./e3Captions";

// EURO 2008 trilogy: "one penalty, two futures", "what would you do?", "what the scoreboard doesn't say".
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const TR = "#e30a17";
const MISS = "#e5484d";
const OK = "#2e9e4f";
type Cap = { words: { t: string; s: number; e: number }[] }[];

const Captions: React.FC<{ caps: Cap }> = ({ caps }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = caps.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

const Shell: React.FC<{ caps: Cap; voice: string; score: string; cuts: [number, number, React.FC][] }> = ({ caps, voice, score, cuts }) => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {cuts.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions caps={caps} />
    <Grain />
    <Audio src={staticFile(score)} volume={0.22} />
    <Sequence from={9}>
      <Audio src={staticFile(voice)} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);

// "Paused tape" overlay: scanlines, pause glyph, timecode.
const Freeze: React.FC<{ code: string }> = ({ code }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 5px)" }} />
      <div style={{ position: "absolute", left: PAD, top: 120, display: "flex", gap: 18, alignItems: "center", opacity: frame % 30 < 20 ? 1 : 0.3 }}>
        <div style={{ width: 16, height: 48, background: C.white }} />
        <div style={{ width: 16, height: 48, background: C.white }} />
        <div style={{ ...mono(30), color: C.white, marginLeft: 10 }}>DURAKLATILDI · {code}</div>
      </div>
    </AbsoluteFill>
  );
};

const EndQ: React.FC<{ lines: [string, string]; sub: string }> = ({ lines, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 14, fps, config: { damping: 11, mass: 0.8 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Drop size={110} align="center" lines={[{ text: lines[0] }, { text: lines[1], color: GOLD }]} />
        <div style={{ marginTop: 40 }}>
          <PivotMark size={150} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(120), color: C.white }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 40, fontWeight: 600, color: C.white, opacity: interpolate(frame, [20, 30], [0, 1], clamp) }}>{sub}</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Sepia: React.FC<{ src: string; from?: number }> = ({ src, from = 0 }) => (
  <OffthreadVideo src={staticFile(src)} startFrom={from} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.38) sepia(0.6) contrast(1.15)" }} />
);

/* ================= 1 · one penalty, two futures ================= */
export const E1_TOTAL = 990;

const E1Title: React.FC = () => (
  <AbsoluteFill>
    <Sepia src="wan/rams-flares.mp4" from={10} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 16 }}>
      <Meta left="EURO 2008 · Çeyrek final" right="Viyana" />
      <Drop size={190} delay={2} lines={[{ text: "20" }, { text: "Haziran" }, { text: "2008", color: GOLD }]} />
      <div style={{ ...display(70), color: C.white, opacity: 0.85 }}>Türkiye – Hırvatistan</div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const E1Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const dead = frame > 95;
  return (
    <Stage light={dead ? 0.5 : 1}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20, filter: dead ? "grayscale(1)" : "none" }}>
        <div style={{ ...mono(30), color: C.ice }}>Uzatma · Klasnić</div>
        <div style={{ ...display(330), color: C.white }}>119'</div>
        <div style={{ ...display(200), color: MISS }}>0–1</div>
        {dead ? <div style={{ ...display(110), color: C.white, opacity: interpolate(frame, [95, 105], [0, 1], clamp) }}>Bitti.</div> : null}
      </AbsoluteFill>
    </Stage>
  );
};

const E1Semih: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 30, fps, config: { damping: 8, mass: 0.6 } });
  const sh = frame > 30 && frame < 55 ? Math.sin(frame * 3) * (55 - frame) : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(80% 60% at 50% 45%, ${TR}66, #08090b)`, justifyContent: "center", alignItems: "center", gap: 10, transform: `translate(${sh}px, ${sh * 0.5}px)` }}>
      <div style={{ ...display(200), color: C.white }}>120+2'</div>
      <div style={{ ...display(220), color: GOLD, transform: `scale(${s})` }}>Semih!</div>
      <div style={{ ...display(260), color: C.white, opacity: interpolate(frame, [70, 78], [0, 1], clamp) }}>1–1</div>
    </AbsoluteFill>
  );
};

type Kick = { team: 0 | 1; who: string; ok: boolean; at: number; how: string };
const Tracker: React.FC<{ kicks: Kick[]; t: number; names: [string, string]; title: string }> = ({ kicks, t, names, title }) => {
  const done = kicks.filter((k) => t >= k.at);
  const score = [0, 1].map((tm) => done.filter((k) => k.team === tm && k.ok).length);
  const last = done[done.length - 1];
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 46 }}>
      <Meta left={title} right="Penaltılar" />
      {[1, 0].map((tm) => (
        <div key={tm} style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ ...display(68), color: tm === 0 ? GOLD : C.white, width: 330 }}>{names[tm]}</div>
          {[0, 1, 2, 3].map((slot) => {
            const k = kicks.filter((x) => x.team === tm)[slot];
            const shot = k && t >= k.at;
            return (
              <div key={slot} style={{ width: 90, height: 90, borderRadius: 45, border: "3px solid rgba(241,239,234,0.35)", background: shot ? (k.ok ? OK : MISS) : "transparent", display: "flex", alignItems: "center", justifyContent: "center", ...display(52), color: C.white }}>
                {shot ? (k.ok ? "✓" : "✕") : ""}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ ...display(280), color: C.white, textAlign: "center" }}>
        {score[0]}–{score[1]}
      </div>
      <div style={{ ...display(84), color: last ? (last.ok ? C.white : MISS) : C.ice, textAlign: "center", minHeight: 96 }}>{last ? `${last.who} · ${last.how}` : "Penaltılar"}</div>
    </AbsoluteFill>
  );
};

const E1_KICKS: Kick[] = [
  { team: 1, who: "Modrić", ok: false, at: 13.5, how: "dışarı" },
  { team: 0, who: "Arda", ok: true, at: 15.0, how: "gol" },
  { team: 1, who: "Srna", ok: true, at: 16.2, how: "gol" },
  { team: 0, who: "Semih", ok: true, at: 16.9, how: "gol" },
  { team: 1, who: "Rakitić", ok: false, at: 17.6, how: "auta" },
  { team: 0, who: "Hamit", ok: true, at: 18.9, how: "gol" },
  { team: 1, who: "Petrić", ok: false, at: 20.95, how: "Rüştü kurtardı" },
];

const E1Shoot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS + 12.5;
  const paused = t >= 20.3 && t < 20.95;
  const saved = t >= 20.95;
  return (
    <Stage light={saved ? 1.4 : 1}>
      <Tracker kicks={E1_KICKS} t={t} names={["Türkiye", "Hırvatistan"]} title="Ernst Happel · Viyana" />
      {paused ? <Freeze code="Petrić · 5. atış" /> : null}
      {saved ? <Sequence from={Math.round((20.95 - 12.5) * FPS)}><Flash at={0} /></Sequence> : null}
    </Stage>
  );
};

const E1Futures: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS + 22.45;
  const l = interpolate(t, [24.7, 25.1], [0, 1], clamp);
  const r = interpolate(t, [26.8, 27.2], [0, 1], clamp);
  return (
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 220 }}>
        <Drop size={100} lines={[{ text: "Bir penaltı," }, { text: "iki gelecek.", color: GOLD }]} />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 560, display: "flex", gap: 30 }}>
        <div style={{ flex: 1, border: "2px solid rgba(241,239,234,0.25)", borderRadius: 18, padding: 30, opacity: l, filter: r > 0 ? "grayscale(1) brightness(0.6)" : "none" }}>
          <div style={{ ...mono(26), color: C.ice }}>Girseydi</div>
          <div style={{ ...display(150), color: C.white }}>3–2</div>
          <div style={{ ...mono(26), color: C.white }}>Seri devam eder</div>
          <div style={{ ...display(70), color: C.white, marginTop: 20 }}>?</div>
        </div>
        <div style={{ flex: 1, border: `3px solid ${GOLD}`, borderRadius: 18, padding: 30, opacity: r, boxShadow: `0 0 50px ${GOLD}55` }}>
          <div style={{ ...mono(26), color: GOLD }}>Kurtarıldı</div>
          <div style={{ ...display(150), color: GOLD }}>3–1</div>
          <div style={{ ...mono(26), color: C.white }}>Türkiye yarı finalde</div>
          <div style={{ ...display(70), color: C.white, marginTop: 20 }}>Almanya</div>
        </div>
      </div>
    </Stage>
  );
};

export const PenaltiReel: React.FC = () => (
  <Shell
    caps={E1_CAPTIONS}
    voice="voice-e1.mp3"
    score="score-e1.wav"
    cuts={[
      [0, 147, E1Title],
      [147, 280, E1Clock],
      [280, 375, E1Semih],
      [375, 673, E1Shoot],
      [673, 870, E1Futures],
      [870, 990, () => <EndQ lines={["Bu geceyi", "hatırlıyor musun?"]} sub="Yorumlara yaz 👇" />],
    ]}
  />
);

/* ================= 2 · what would you do? ================= */
export const E2_TOTAL = 600;
const X0 = 90;
const Y0 = 330;
const PW = 900;
const PH = 900;
const P = (x: number, y: number) => ({ x: X0 + x * PW, y: Y0 + y * PH });

const E2Board: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ramp = (a: number, d = 0.5) => interpolate(t - a, [0, d], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const paused = t >= 5.2 && t < 10.6;
  const chose = t >= 10.6;
  const goal = t >= 11.8;
  const nihat = P(0.42, 0.62);
  const ball = goal ? P(0.56, 0.06) : chose ? { x: nihat.x + (P(0.56, 0.06).x - nihat.x) * ramp(10.9, 0.9), y: nihat.y + (P(0.56, 0.06).y - nihat.y) * ramp(10.9, 0.9) } : nihat;
  const opts = [
    { k: "A", at: 6.9, to: P(0.88, 0.5), label: "Kanada pas", dash: false },
    { k: "B", at: 8.2, to: P(0.62, 0.38), label: "İçeri dripling", dash: true },
    { k: "C", at: 9.6, to: P(0.56, 0.08), label: "Şut", dash: false },
  ];
  const defs = [P(0.35, 0.3), P(0.55, 0.28), P(0.7, 0.4), P(0.45, 0.45)];
  const mates = [P(0.88, 0.5), P(0.2, 0.42)];
  return (
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 210 }}>
        <Meta left="Türkiye 2–2 Çekya · Cenevre" right="89'" />
      </div>
      <div style={{ position: "absolute", left: X0, top: Y0, width: PW, height: PH, border: "3px solid rgba(201,220,234,0.35)", borderRadius: 10, background: "linear-gradient(180deg,#0f1a14,#0c1410)" }}>
        <div style={{ position: "absolute", left: PW * 0.2, top: 0, width: PW * 0.6, height: PH * 0.22, border: "3px solid rgba(201,220,234,0.35)", borderTop: "none" }} />
        <div style={{ position: "absolute", left: PW * 0.38, top: -14, width: PW * 0.24, height: 14, background: C.white }} />
      </div>
      <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
        {opts.map((o) => {
          const k = ramp(o.at);
          const hi = chose ? o.k === "C" : true;
          return (
            <g key={o.k} opacity={k * (hi ? 1 : 0.2)}>
              <line x1={nihat.x} y1={nihat.y} x2={nihat.x + (o.to.x - nihat.x) * k} y2={nihat.y + (o.to.y - nihat.y) * k} stroke={chose && o.k === "C" ? GOLD : C.white} strokeWidth={9} strokeDasharray={o.dash ? "20 16" : undefined} strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      {opts.map((o) => {
        const k = ramp(o.at);
        const hi = chose ? o.k === "C" : true;
        return (
          <div key={o.k} style={{ position: "absolute", left: o.to.x - 40, top: o.to.y - 100, opacity: k * (hi ? 1 : 0.25), display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: chose && o.k === "C" ? GOLD : C.white, color: "#08090b", display: "flex", alignItems: "center", justifyContent: "center", ...display(54) }}>{o.k}</div>
            <div style={{ ...mono(24), color: C.white, whiteSpace: "nowrap", textShadow: "0 2px 6px #000" }}>{o.label}</div>
          </div>
        );
      })}
      {defs.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x - 30, top: d.y - 30, width: 60, height: 60, borderRadius: 30, background: "#2a6fdb", border: "3px solid #fff" }} />
      ))}
      {mates.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x - 30, top: d.y - 30, width: 60, height: 60, borderRadius: 30, background: TR, border: "3px solid #fff", opacity: 0.8 }} />
      ))}
      <div style={{ position: "absolute", left: nihat.x - 40, top: nihat.y - 40, width: 80, height: 80, borderRadius: 40, background: TR, border: `4px solid ${GOLD}`, boxShadow: `0 0 30px ${GOLD}` }} />
      <div style={{ position: "absolute", left: nihat.x - 60, top: nihat.y + 46, ...mono(26), color: GOLD }}>Nihat</div>
      <div style={{ position: "absolute", left: ball.x - 16, top: ball.y - 16, width: 32, height: 32, borderRadius: 16, background: C.white, boxShadow: "0 0 18px #fff" }} />
      <div style={{ position: "absolute", left: PAD, top: Y0 + PH + 14, ...mono(20), color: C.ice, opacity: 0.6 }}>Pozisyon temsilidir · sonuç gerçektir</div>
      {paused ? <Freeze code="88:5x" /> : null}
      {goal ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: `rgba(227,10,23,${interpolate(t, [11.8, 12.3], [0.6, 0.35], clamp)})` }}>
          <div style={{ ...display(260), color: C.white }}>Gol!</div>
          <div style={{ ...display(220), color: GOLD, opacity: ramp(12.5, 0.2) }}>3–2</div>
          <div style={{ ...display(70), color: C.white, opacity: ramp(13.1, 0.2) }}>Türkiye çeyrek finalde</div>
        </AbsoluteFill>
      ) : null}
      {goal ? <Sequence from={Math.round(11.8 * FPS)}><Flash at={0} /></Sequence> : null}
    </Stage>
  );
};

export const KararReel: React.FC = () => (
  <Shell
    caps={E2_CAPTIONS}
    voice="voice-e2.mp3"
    score="score-e2.wav"
    cuts={[
      [0, 435, E2Board],
      [435, 600, () => <EndQ lines={["A · B · C?", "Sen ne yapardın?"]} sub="Harfini yorumlara yaz 👇" />],
    ]}
  />
);

/* ================= 3 · what the scoreboard doesn't say ================= */
export const E3_TOTAL = 770;

const Board3: React.FC<{ glitch?: boolean }> = ({ glitch }) => {
  const frame = useCurrentFrame();
  const g = glitch && frame % 7 < 3 ? 10 : 0;
  return (
    <Stage light={1.1}>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 30, transform: `translateX(${g}px)` }}>
        <Meta left="EURO 2008 · Grup A · Cenevre" right="15 Haziran" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...display(110), color: C.white }}>Türkiye</div>
          <div style={{ ...display(200), color: GOLD, textShadow: g ? `${-g}px 0 #33d1ff, ${g}px 0 ${MISS}` : undefined }}>3–2</div>
          <div style={{ ...display(110), color: C.white }}>Çekya</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono(28), color: C.ice }}>
          <div>
            Arda 75'
            <br />
            Nihat 87'
            <br />
            Nihat 89'
          </div>
          <div style={{ textAlign: "right" }}>
            Koller 34'
            <br />
            Plašil 62'
          </div>
        </div>
        {glitch ? <Chip color={MISS}>Skor tabelası · eksik bilgi</Chip> : null}
      </AbsoluteFill>
      {glitch ? <Freeze code="90+" /> : null}
    </Stage>
  );
};

const Red3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 9, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: "#1c0507", justifyContent: "center", alignItems: "center", gap: 36 }}>
      <div style={{ width: 210, height: 300, borderRadius: 18, background: MISS, transform: `rotate(${(1 - s) * -30 + 8}deg) scale(${s})`, boxShadow: "0 30px 80px rgba(229,72,77,0.5)" }} />
      <Drop size={140} align="center" delay={8} lines={[{ text: "Volkan Demirel" }, { text: "kırmızı kart.", color: "#ff6b72" }]} />
      <div style={{ ...mono(30), color: C.ice, opacity: interpolate(frame, [80, 90], [0, 1], clamp) }}>Koller'i itti · 90+</div>
    </AbsoluteFill>
  );
};

const Empty3: React.FC = () => {
  const frame = useCurrentFrame();
  const name = frame > 80;
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ ...mono(30), color: C.ice }}>Çeyrek final · kaleci</div>
        <div style={{ width: 300, height: 300, borderRadius: 150, border: `5px dashed ${name ? GOLD : "rgba(241,239,234,0.35)"}`, display: "flex", alignItems: "center", justifyContent: "center", ...display(name ? 90 : 160), color: name ? GOLD : MISS }}>
          {name ? "Rüştü" : "✕"}
        </div>
        <div style={{ ...display(90), color: C.white }}>{name ? "Kaleye geçti." : "Volkan cezalı."}</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Save3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 30, fps, config: { damping: 9, mass: 0.6 } });
  return (
    <Stage light={1.3}>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 20 }}>
        <Meta left="5 gün sonra · 20 Haziran" right="Hırvatistan" />
        <div style={{ ...display(120), color: C.white }}>Petrić'in penaltısı</div>
        <div style={{ ...display(190), color: GOLD, transform: `scale(${s})`, transformOrigin: "left center" }}>Rüştü kurtardı.</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Chain3: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = ["Kırmızı kart", "Rüştü kalede", "Penaltı kurtarışı", "Yarı final"];
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 24 }}>
        {steps.map((s, i) => {
          const k = interpolate(frame - i * 12, [0, 10], [0, 1], clamp);
          return (
            <div key={s} style={{ opacity: k, transform: `translateX(${(1 - k) * -60}px)` }}>
              <div style={{ ...display(i === 3 ? 130 : 100), color: i === 0 ? MISS : i === 3 ? GOLD : C.white }}>{s}</div>
              {i < 3 ? <div style={{ ...display(60), color: C.ice }}>↓</div> : null}
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};

export const TabelaReel: React.FC = () => (
  <Shell
    caps={E3_CAPTIONS}
    voice="voice-e3.mp3"
    score="score-e3.wav"
    cuts={[
      [0, 150, () => <Board3 />],
      [150, 224, () => <Board3 glitch />],
      [224, 345, Red3],
      [345, 467, Empty3],
      [467, 572, Save3],
      [572, 655, Chain3],
      [655, 770, () => <EndQ lines={["Turnuvanın gerçek", "kahramanı kim?"]} sub="Yorumlara yaz 👇" />],
    ]}
  />
);
