import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { FT_CAPTIONS } from "./ftCaptions";

// Full time: Galatasaray 2–0 Stuttgart (3 Nov 2026), ESPN match data. Cuts follow FT_CAPTIONS.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const VFB = "#e3221a";
export const FT_TOTAL = 870;

const Crest: React.FC<{ f: string; size: number }> = ({ f, size }) => (
  <Img src={staticFile(`crest/${f}.png`)} style={{ width: size, height: size, objectFit: "contain" }} />
);

const Model: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = interpolate(frame, [22, 32], [0, 1], clamp);
  return (
    <Stage light={1.2}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
        <div style={{ ...mono(30), color: C.ice }}>Model · Galatasaray kazanır</div>
        <div style={{ position: "relative" }}>
          <div style={{ ...display(380), color: C.white, opacity: 1 - 0.5 * cut }}>%20</div>
          <div style={{ position: "absolute", left: -20, top: "50%", height: 22, width: `${cut * 110}%`, background: GOLD, transform: "rotate(-8deg)" }} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 2, fps, config: { damping: 8, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.25]} dim={0.45} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ ...mono(32), color: C.ice }}>Maç sonu · Şampiyonlar Ligi</div>
        <div style={{ display: "flex", alignItems: "center", gap: 40, transform: `scale(${s})` }}>
          <Crest f="galatasaray" size={170} />
          <div style={{ ...display(280), color: C.white }}>2–0</div>
          <Crest f="stuttgart" size={170} />
        </div>
        <div style={{ opacity: interpolate(frame, [40, 48], [0, 1], clamp) }}>
          <Chip color={VFB}>Stuttgart'ın Avrupa'daki ilk yenilgisi</Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const chips = (at: number) => interpolate(frame - at, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Photo src="bat-arms.png" pos="50% 25%" zoom={[1.0, 1.15]} dim={0.55} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 540, gap: 16 }}>
        <div style={{ ...mono(30), color: C.ice }}>Kahraman</div>
        <Drop size={190} delay={30} lines={[{ text: "Batrakov.", color: GOLD }]} />
        <div style={{ display: "flex", gap: 16, opacity: chips(60) }}>
          <Chip color={GOLD}>⚽ 12'</Chip>
          <Chip color={GOLD}>⚽ 15'</Chip>
        </div>
        <div style={{ opacity: chips(110) }}>
          <Chip>3 şut · 3 isabet · 2 gol</Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Saves: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS + 10.5;
  const saved = t >= 14.3;
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 40 }}>
        <Meta left="Stuttgart · isabetli şut" right="Maç geneli" />
        <Drop size={110} lines={[{ text: "İkinci yarı" }, { text: "başka hikâye.", color: C.ice, weight: 300 }]} />
        <div style={{ display: "flex", gap: 20 }}>
          {[...Array(5)].map((_, i) => {
            const k = interpolate(t - 12.5 - i * 0.2, [0, 0.25], [0, 1], clamp);
            const sv = interpolate(t - 14.3 - i * 0.15, [0, 0.2], [0, 1], clamp);
            return (
              <div key={i} style={{ width: 150, height: 150, borderRadius: 75, opacity: k, transform: `scale(${k})`, background: sv > 0.5 ? GOLD : VFB, display: "flex", alignItems: "center", justifyContent: "center", ...display(70), color: "#08090b" }}>
                {sv > 0.5 ? "✋" : "⚽"}
              </div>
            );
          })}
        </div>
        <div style={{ ...display(saved ? 120 : 90), color: saved ? GOLD : C.white }}>{saved ? "Uğurcan: 5 kurtarış" : "5 kez kaleyi buldu"}</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Split: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const r = interpolate(frame, [30, 42], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 30 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1, border: `3px solid ${GOLD}`, borderRadius: 18, padding: 30, opacity: k, transform: `translateX(${(1 - k) * -80}px)` }}>
            <div style={{ ...mono(26), color: C.ice }}>Golleri attı</div>
            <div style={{ ...display(80), color: C.white }}>Batrakov</div>
            <div style={{ ...display(220), color: GOLD }}>2</div>
            <div style={{ ...mono(24), color: C.ice }}>gol</div>
          </div>
          <div style={{ flex: 1, border: `3px solid ${C.ice}`, borderRadius: 18, padding: 30, opacity: r, transform: `translateX(${(1 - r) * 80}px)` }}>
            <div style={{ ...mono(26), color: C.ice }}>Skoru korudu</div>
            <div style={{ ...display(80), color: C.white }}>Uğurcan</div>
            <div style={{ ...display(220), color: C.ice }}>5</div>
            <div style={{ ...mono(24), color: C.ice }}>kurtarış</div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Points: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [8, 28], [3, 6], clamp));
  return (
    <Stage light={1.2}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
        <Crest f="galatasaray" size={170} />
        <div style={{ ...mono(30), color: C.ice }}>Şampiyonlar Ligi · 4 maç</div>
        <div style={{ ...display(360), color: GOLD }}>{n}</div>
        <div style={{ ...display(80), color: C.white }}>puan</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Scoreboard: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    { f: "lille", m: "Lille", p: "%34", r: "4–2 ✓", at: 0 },
    { f: "stuttgart", m: "Stuttgart", p: "%20", r: "2–0 ✓", at: 20 },
  ];
  const fin = interpolate(frame, [75, 85], [0, 1], clamp);
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 30 }}>
        <Meta left="Modelin GS'ye verdiği şans" right="Sonuç" />
        {rows.map((r) => {
          const k = interpolate(frame - r.at, [0, 10], [0, 1], clamp);
          return (
            <div key={r.m} style={{ display: "flex", alignItems: "center", gap: 24, opacity: k }}>
              <Crest f={r.f} size={100} />
              <div style={{ ...display(70), color: C.white, flex: 1 }}>{r.m}</div>
              <div style={{ ...display(90), color: "rgba(241,239,234,0.5)", textDecoration: "line-through", textDecorationColor: GOLD }}>{r.p}</div>
              <div style={{ ...display(90), color: GOLD }}>{r.r}</div>
            </div>
          );
        })}
        <div style={{ ...display(150), color: C.white, opacity: fin, textAlign: "center", marginTop: 30 }}>
          Model 0–2 <span style={{ color: GOLD }}>Aslan</span>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Poll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 40, fps, config: { damping: 11, mass: 0.8 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ ...mono(32), color: C.ice }}>Maçın adamı?</div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            ["Batrakov", "2 gol", GOLD],
            ["Uğurcan", "5 kurtarış", C.ice],
          ].map(([n, s, c], i) => (
            <div key={n} style={{ width: 400, border: `3px solid ${c}`, borderRadius: 18, padding: "30px 0", textAlign: "center", opacity: interpolate(frame - i * 10, [0, 10], [0, 1], clamp) }}>
              <div style={{ ...display(84), color: c }}>{n}</div>
              <div style={{ ...mono(26), color: C.white }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40 }}>
          <PivotMark size={140} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(110), color: C.white }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 40, fontWeight: 600, color: C.white, opacity: interpolate(frame, [50, 60], [0, 1], clamp) }}>Yorumlara yaz 👇</div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 52, Model],
  [52, 150, Final],
  [150, 315, Hero],
  [315, 478, Saves],
  [478, 563, Split],
  [563, 622, Points],
  [622, 739, Scoreboard],
  [739, 870, Poll],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = FT_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const FtReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-ft.wav")} volume={0.24} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-ft.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
