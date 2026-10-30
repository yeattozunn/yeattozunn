import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { C1_CAPTIONS } from "./c1Captions";
import { C2_CAPTIONS } from "./c2Captions";
import { C3_CAPTIONS } from "./c3Captions";

// Three format pilots: salary counter, 3-clue quiz, Copenhagen 2000 nostalgia.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
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

// index of the caption phrase that has started most recently
const useBeat = (caps: Cap) => {
  const t = useCurrentFrame() / FPS;
  let i = -1;
  caps.forEach((c, k) => {
    if (t >= c.words[0].s - 0.1) i = k;
  });
  return { i, since: i >= 0 ? (t - (caps[i].words[0].s - 0.1)) * FPS : 0 };
};

const Shell: React.FC<{ caps: Cap; voice: string; score: string; children: React.ReactNode }> = ({ caps, voice, score, children }) => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {children}
    <Captions caps={caps} />
    <Grain />
    <Audio src={staticFile(score)} volume={0.22} />
    <Sequence from={9}>
      <Audio src={staticFile(voice)} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);

const EndMark: React.FC<{ line: string }> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.8 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <PivotMark size={180} angle={interpolate(rot, [0, 1], [0, -36])} />
        <div style={{ ...display(150), color: C.white }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 42, fontWeight: 600, color: C.white, opacity: interpolate(frame, [12, 22], [0, 1], clamp) }}>{line}</div>
      </AbsoluteFill>
    </Stage>
  );
};

/* ---------------- 1 · salary counter ---------------- */
// €15m net/season (club statement) × 55.74 TRY/EUR (30 Oct 2026) = 836.1m TL → 26.51 TL/s.
const PER_SEC = 26.51;
export const C1_TOTAL = 1110;
const tl = (v: number) => "₺" + Math.floor(v).toLocaleString("tr-TR");

const C1Body: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { i, since } = useBeat(C1_CAPTIONS);
  const earned = Math.max(0, frame / FPS - 0.3) * PER_SEC;
  const pop = spring({ frame: since, fps, config: { damping: 11, mass: 0.6 } });
  const end = i >= 9;
  const cards: [string, string][] = [
    ["Sayaç", "başladı"],
    ["€15.000.000", "yıllık net maaş"],
    ["₺836.000.000", "bugünkü kurla · €1 = ₺55,74"],
    ["₺26", "her saniye"],
    ["₺1.590", "her dakika"],
    ["18 dk", "bir asgari ücret (₺28.075)"],
    ["₺143.000", "90 dakikalık bir maç"],
    ["?", "asgari ücretli, bir yıllık maaşını kaç yılda kazanır?"],
    ["2.482", "yıl"],
  ];
  const card = i >= 0 && i < cards.length ? cards[i] : null;
  const minFill = i === 5 ? interpolate(since, [0, 60], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill>
      <Photo src="osi-mask.jpg" pos="45% 30%" zoom={[1.0, 1.25]} dim={end ? 0.25 : 0.38} />
      {/* live counter */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          top: end ? 640 : 220,
          display: "flex",
          flexDirection: "column",
          alignItems: end ? "center" : "flex-start",
          transform: `scale(${end ? 1.25 : 1})`,
          transformOrigin: "center top",
        }}
      >
        <div style={{ ...mono(26), color: C.ice }}>{end ? "Bu videoyu izlerken Osimhen kazandı" : "● Canlı · Osimhen şu ana kadar"}</div>
        <div style={{ ...display(150), color: GOLD, fontVariantNumeric: "tabular-nums" }}>{tl(earned)}</div>
      </div>
      {card && !end ? (
        <AbsoluteFill style={{ justifyContent: "center", padding: PAD, paddingTop: 200 }}>
          <div style={{ transform: `scale(${0.85 + 0.15 * pop})`, opacity: pop, transformOrigin: "left center" }}>
            <div style={{ ...display(i === 8 ? 330 : card[0].length > 9 ? 150 : 230), color: C.white, lineHeight: 0.95 }}>{card[0]}</div>
            <div style={{ ...mono(32), color: C.ice, marginTop: 14 }}>{card[1]}</div>
            {i === 5 ? (
              <div style={{ marginTop: 24, height: 26, borderRadius: 6, background: "rgba(241,239,234,0.12)" }}>
                <div style={{ width: `${minFill * 100}%`, height: "100%", borderRadius: 6, background: GOLD }} />
              </div>
            ) : null}
          </div>
        </AbsoluteFill>
      ) : null}
      {i >= 8 && i < 9 ? <Flash at={0} /> : null}
    </AbsoluteFill>
  );
};

export const SalaryReel: React.FC = () => (
  <Shell caps={C1_CAPTIONS} voice="voice-c1.mp3" score="score-c1.wav">
    <Sequence durationInFrames={1000}>
      <C1Body />
    </Sequence>
    <Sequence from={1000}>
      <EndMark line="Arkadaşını etiketle 👇" />
    </Sequence>
  </Shell>
);

/* ---------------- 2 · 3-clue quiz ---------------- */
export const C2_TOTAL = 640;

const C2Body: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / FPS;
  const reveal = 14.55;
  const clues = [
    { at: 1.4, n: "1", text: "6 yaşında Moskova'da bir akademiye girdi" },
    { at: 4.85, n: "2", text: "Geçen sezon 17 gol, 13 asist" },
    { at: 8.45, n: "3", text: "Galatasaray tarihinin ilk Rus futbolcusu" },
  ];
  const shown = clues.filter((c) => t >= c.at).length;
  const blur = t >= reveal ? 0 : [40, 30, 20, 12][shown];
  const bright = t >= reveal ? 0.8 : 0;
  const ring = interpolate(t, [12.6, reveal], [1, 0], clamp);
  const name = spring({ frame: frame - reveal * FPS, fps, config: { damping: 10, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 30%, #1b1f26, #08090b)" }}>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 200 }}>
        <Meta left="3 ipucunda bil" right={t >= reveal ? "Cevap" : `İpucu ${shown}/3`} />
      </div>
      <div style={{ position: "absolute", left: 240, top: 290, width: 600, height: 600, borderRadius: 300, overflow: "hidden", border: `5px solid ${t >= reveal ? GOLD : "rgba(241,239,234,0.25)"}` }}>
        <Img src={staticFile("photos/bat-close.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: `blur(${blur}px) brightness(${bright})` }} />
        {t < reveal ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...display(300), color: "rgba(241,239,234,0.85)" }}>?</div> : null}
        {t >= 12.6 && t < reveal ? (
          <svg style={{ position: "absolute", inset: 0 }} width={600} height={600}>
            <circle cx={300} cy={300} r={280} fill="none" stroke={GOLD} strokeWidth={14} strokeDasharray={`${2 * Math.PI * 280 * ring} 9999`} transform="rotate(-90 300 300)" />
          </svg>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 940, display: "flex", flexDirection: "column", gap: 22 }}>
        {t < reveal
          ? clues.map((c) => {
              const k = interpolate(t - c.at, [0, 0.3], [0, 1], clamp);
              return (
                <div key={c.n} style={{ display: "flex", gap: 22, alignItems: "center", opacity: k, transform: `translateX(${(1 - k) * -60}px)` }}>
                  <div style={{ width: 70, height: 70, borderRadius: 35, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", ...display(46), color: "#08090b" }}>{c.n}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 38, fontWeight: 600, color: C.white, flex: 1 }}>{c.text}</div>
                </div>
              );
            })
          : (
            <div style={{ transform: `scale(${name})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div lang="en" style={{ ...display(150), color: C.white }}>Aleksey</div>
              <div lang="en" style={{ ...display(170), color: GOLD }}>Batrakov</div>
            </div>
          )}
      </div>
      {t >= reveal ? <Sequence from={Math.round(reveal * FPS)}><Flash at={0} /></Sequence> : null}
    </AbsoluteFill>
  );
};

export const QuizReel: React.FC = () => (
  <Shell caps={C2_CAPTIONS} voice="voice-c2.mp3" score="score-c2.wav">
    <Sequence durationInFrames={560}>
      <C2Body />
    </Sequence>
    <Sequence from={560}>
      <EndMark line="Kaçıncı ipucunda bildin? 👇" />
    </Sequence>
  </Shell>
);

/* ---------------- 3 · Copenhagen 2000 ---------------- */
export const C3_TOTAL = 880;

const KICKS: { team: 0 | 1; who: string; ok: boolean; at: number }[] = [
  { team: 0, who: "Ergün", ok: true, at: 11.8 },
  { team: 1, who: "Suker", ok: false, at: 12.6 },
  { team: 0, who: "Hakan Şükür", ok: true, at: 13.3 },
  { team: 1, who: "Parlour", ok: true, at: 15.0 },
  { team: 0, who: "Ümit Davala", ok: true, at: 16.7 },
  { team: 1, who: "Vieira", ok: false, at: 18.4 },
  { team: 0, who: "Popescu", ok: true, at: 21.4 },
];

const Shootout: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS + 10.4;
  const done = KICKS.filter((k) => t >= k.at);
  const score = [0, 1].map((tm) => done.filter((k) => k.team === tm && k.ok).length);
  const last = done[done.length - 1];
  const win = t >= 21.4;
  const shake = win && t < 22 ? Math.sin(frame * 3) * 12 : 0;
  return (
    <Stage light={win ? 1.4 : 1}>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 50, transform: `translate(${shake}px, 0)` }}>
        <Meta left="Penaltılar · Parken, Kopenhag" right="UEFA Kupası finali" />
        {[0, 1].map((tm) => (
          <div key={tm} style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ ...display(70), color: tm === 0 ? GOLD : C.white, width: 330 }}>{tm === 0 ? "Galatasaray" : "Arsenal"}</div>
            {[0, 1, 2, 3].map((slot) => {
              const k = KICKS.filter((x) => x.team === tm)[slot];
              const shot = k && t >= k.at;
              return (
                <div
                  key={slot}
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 46,
                    border: "3px solid rgba(241,239,234,0.35)",
                    background: shot ? (k.ok ? "#2e9e4f" : "#e5484d") : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...display(54),
                    color: C.white,
                  }}
                >
                  {shot ? (k.ok ? "✓" : "✕") : ""}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ ...display(300), color: win ? GOLD : C.white, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {score[0]}–{score[1]}
        </div>
        <div style={{ ...display(90), color: last ? (last.ok ? C.white : "#e5484d") : C.ice, textAlign: "center", minHeight: 100 }}>
          {last ? `${last.who} · ${last.ok ? "gol" : last.who === "Vieira" ? "üst direk" : "direk"}` : "Ve penaltılar…"}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Year: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile("wan/rams-flares.mp4")} startFrom={10} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4) sepia(0.5) contrast(1.1)" }} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 10 }}>
      <Meta left="17 Mayıs 2000" right="Kopenhag" />
      <Drop size={420} delay={2} lines={[{ text: "2000", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Teams: React.FC = () => (
  <Stage light={1.1}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
      <Img src={staticFile("crest/galatasaray.png")} style={{ width: 230, height: 230 }} />
      <div style={{ ...display(100), color: C.ice }}>vs</div>
      <div style={{ ...display(150), color: C.white }}>Arsenal</div>
    </AbsoluteFill>
  </Stage>
);

const Zero: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile("wan/derby-ball.mp4")} startFrom={40} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.45) sepia(0.4)" }} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 10 }}>
      <div style={{ ...mono(30), color: C.ice }}>90 dakika</div>
      <div style={{ ...display(360), color: C.white }}>0–0</div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Red: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 9, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ background: "#1c0507", justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ width: 230, height: 320, borderRadius: 18, background: "#e5484d", transform: `rotate(${(1 - s) * -30 + 8}deg) scale(${s})`, boxShadow: "0 30px 80px rgba(229,72,77,0.5)" }} />
      <Drop size={160} align="center" delay={8} lines={[{ text: "Hagi" }, { text: "kırmızı kart.", color: "#ff6b72" }]} />
      <div style={{ ...mono(32), color: C.ice, opacity: interpolate(frame, [80, 90], [0, 1], clamp) }}>Galatasaray 10 kişi</div>
    </AbsoluteFill>
  );
};

const Cup: React.FC = () => (
  <AbsoluteFill>
    <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.3]} dim={0.4} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
      <div style={{ fontSize: 220 }}>🏆</div>
      <Drop size={130} align="center" delay={4} lines={[{ text: "Türk futbolunun" }, { text: "ilk Avrupa kupası.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const C3_CUTS: [number, number, React.FC][] = [
  [0, 81, Year],
  [81, 133, Teams],
  [133, 196, Zero],
  [196, 312, Red],
  [312, 659, Shootout],
  [659, 760, Cup],
  [760, 880, () => <EndMark line="O gece neredeydin? 👇" />],
];

export const NostaljiReel: React.FC = () => (
  <Shell caps={C3_CAPTIONS} voice="voice-c3.mp3" score="score-c3.wav">
    {C3_CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
  </Shell>
);
