import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { ST_CAPTIONS } from "./stCaptions";

// Galatasaray – Stuttgart, UCL league phase MD4 (3 Nov 2026, 20:45). Sims: scripts/sim_stuttgart.py. Cuts follow ST_CAPTIONS.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const GS_RED = "#c8102e";
const UCL = "#3d6bff";
export const ST_TOTAL = 1230;

const Crest: React.FC<{ f: string; size: number; style?: React.CSSProperties }> = ({ f, size, style }) => (
  <Img src={staticFile(`crest/${f}.png`)} style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.7))", ...style }} />
);

const Konya: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 4, fps, config: { damping: 9, mass: 0.6 } });
  const goals = [
    ["Osimhen", "12'"],
    ["Yunus", "28'"],
    ["Batrakov", "49'"],
    ["Leao", "55' pen."],
  ];
  return (
    <AbsoluteFill>
      <Photo src="osi-shh.jpg" pos="50% 30%" zoom={[1.05, 1.2]} dim={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 24 }}>
        <Meta left="Süper Lig · Cuma" right="Konya" />
        <div style={{ display: "flex", alignItems: "center", gap: 30, transform: `scale(${s})`, transformOrigin: "left center" }}>
          <Crest f="konyaspor" size={130} />
          <div style={{ ...display(260), color: C.white }}>0–4</div>
          <Crest f="galatasaray" size={130} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {goals.map(([n, m], i) => {
            const k = interpolate(frame - 84 - i * 12, [0, 8], [0, 1], clamp);
            return (
              <div key={n} style={{ display: "flex", gap: 20, alignItems: "baseline", opacity: k, transform: `translateX(${(1 - k) * -50}px)` }}>
                <span style={{ ...display(80), color: GOLD }}>⚽ {n}</span>
                <span style={{ ...mono(30), color: C.ice }}>{m}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Stars: React.FC = () => {
  const frame = useCurrentFrame();
  const ucl = frame > 82;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 42%, ${ucl ? "#0d1a4a" : "#111"}, #05060a)`, justifyContent: "center", alignItems: "center" }}>
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + frame / 40;
        const k = interpolate(frame - i * 3, [0, 12], [0, 1], clamp);
        return (
          <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * 330 - 30, top: 820 + Math.sin(a) * 330 - 30, fontSize: 60, opacity: k, color: C.white }}>
            ★
          </div>
        );
      })}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {ucl ? (
          <Drop size={120} align="center" lines={[{ text: "Şampiyonlar" }, { text: "Ligi", color: UCL }]} />
        ) : (
          <Drop size={120} align="center" delay={4} lines={[{ text: "Başka bir" }, { text: "sınav.", color: GOLD }]} />
        )}
      </div>
    </AbsoluteFill>
  );
};

const Arrive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 2, fps, config: { damping: 11, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile("wan/rams-flares.mp4")} startFrom={40} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <Crest f="stuttgart" size={300} style={{ transform: `translateY(${(1 - s) * -600}px) rotate(${(1 - s) * 40}deg)` }} />
        <div style={{ ...display(110), color: C.white }}>Stuttgart</div>
        <Chip color={GOLD}>RAMS Park · Salı 20:45</Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Worlds: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  return (
    <AbsoluteFill style={{ background: "#08090b" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1920, background: `linear-gradient(180deg, ${GS_RED}55, #08090b)`, transform: `translateX(${(1 - k) * -540}px)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Crest f="galatasaray" size={240} />
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, width: 540, height: 1920, background: "linear-gradient(180deg, #e3221a44, #08090b)", transform: `translateX(${(1 - k) * 540}px)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Crest f="stuttgart" size={240} />
      </div>
      <div style={{ position: "absolute", left: 538, top: 0, width: 4, height: 1920, background: C.white, opacity: k }} />
      <AbsoluteFill style={{ padding: PAD, paddingTop: 300 }}>
        <Drop size={110} align="center" delay={10} lines={[{ text: "İki farklı" }, { text: "dünya.", color: GOLD }]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS + 13.97;
  const rows = [
    { f: "galatasaray", n: "Galatasaray", at: 14.0, cells: [["Puan", "3"], ["Sıra", "23."], ["Yediği", "9"]], hot: 17.4, c: GS_RED },
    { f: "stuttgart", n: "Stuttgart", at: 18.6, cells: [["Puan", "7"], ["Sıra", "6."], ["Yediği", "2"]], hot: 21.9, c: "#e3221a" },
  ];
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 50 }}>
        <Meta left="Şampiyonlar Ligi · lig aşaması" right="3 maç" />
        {rows.map((r) => {
          const k = interpolate(t - r.at, [0, 0.4], [0, 1], clamp);
          return (
            <div key={r.n} style={{ opacity: k, transform: `translateY(${(1 - k) * 30}px)`, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <Crest f={r.f} size={100} />
                <div style={{ ...display(90), color: C.white }}>{r.n}</div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {r.cells.map(([a, b], i) => {
                  const hot = i === 2 && t >= r.hot;
                  return (
                    <div key={a} style={{ flex: 1, borderRadius: 14, padding: "18px 0", textAlign: "center", border: `2px solid ${hot ? GOLD : "rgba(241,239,234,0.2)"}`, background: hot ? `${GOLD}22` : "transparent" }}>
                      <div style={{ ...display(100), color: hot ? GOLD : C.white }}>{b}</div>
                      <div style={{ ...mono(22), color: C.ice }}>{a}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [
    { at: 64, n: "Stuttgart", v: 62, c: "#e3221a" },
    { at: 115, n: "Galatasaray", v: 20, c: GS_RED },
    { at: 115, n: "Beraberlik", v: 18, c: "rgba(241,239,234,0.5)" },
  ];
  const n = Math.round(interpolate(frame, [0, 40], [0, 50000], clamp));
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 30 }}>
        <Meta left="Poisson simülasyonu" right={`${n.toLocaleString("tr-TR")} maç`} />
        <Drop size={120} lines={[{ text: "Acımasız.", color: C.ice, weight: 300 }]} />
        {bars.map((b) => {
          const k = interpolate(frame - b.at, [0, 16], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          return (
            <div key={b.n} style={{ display: "flex", flexDirection: "column", gap: 8, opacity: k }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...display(80), color: C.white }}>
                <span>{b.n}</span>
                <span>%{Math.round(b.v * k)}</span>
              </div>
              <div style={{ height: 32, borderRadius: 6, background: "rgba(241,239,234,0.08)" }}>
                <div style={{ height: "100%", width: `${b.v * k}%`, background: b.c, borderRadius: 6 }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </Stage>
  );
};

const Rams: React.FC = () => {
  const frame = useCurrentFrame();
  const sh = frame > 56 && frame < 76 ? Math.sin(frame * 3) * (76 - frame) * 0.9 : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${sh}px, ${sh * 0.4}px)` }}>
      <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.0, 1.3]} dim={frame > 56 ? 0.6 : 0.3} />
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 20 }}>
        <div style={{ ...mono(32), color: C.ice }}>Model bir şeyi bilmiyor</div>
        {frame > 56 ? <Drop size={230} lines={[{ text: "RAMS" }, { text: "Park.", color: GOLD }]} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Lille: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 90, fps, config: { damping: 9, mass: 0.6 } });
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
        <Meta left="21 Ekim · Lille" right="Şampiyonlar Ligi" />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Crest f="lille" size={110} />
          <div style={{ ...mono(30), color: C.ice }}>Model: Galatasaray kazanır</div>
        </div>
        <div style={{ ...display(300), color: C.white, textDecoration: frame > 90 ? "line-through" : "none", textDecorationColor: GOLD, opacity: frame > 90 ? 0.5 : 1 }}>%34</div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `scale(${s})`, transformOrigin: "left center" }}>
          <div style={{ ...display(200), color: GOLD }}>2–4</div>
          <div style={{ ...display(70), color: C.white }}>Galatasaray</div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 14, fps, config: { damping: 11, mass: 0.8 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          <Crest f="galatasaray" size={120} />
          <div style={{ ...display(90), color: C.white }}>?–?</div>
          <Crest f="stuttgart" size={120} />
        </div>
        <Drop size={100} align="center" lines={[{ text: "Aslan modeli" }, { text: "yine yanıltır mı?", color: GOLD }]} />
        <PivotMark size={150} angle={interpolate(rot, [0, 1], [0, -36])} />
        <div style={{ ...display(120), color: C.white }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 40, fontWeight: 600, color: C.white, opacity: interpolate(frame, [20, 30], [0, 1], clamp) }}>Skor tahminin? Yorumlara 👇</div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 148, Konya],
  [148, 273, Stars],
  [273, 338, Arrive],
  [338, 419, Worlds],
  [419, 709, Table],
  [709, 866, Sim],
  [866, 960, Rams],
  [960, 1104, Lille],
  [1104, 1230, End],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = ST_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const StuttgartReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-st.wav")} volume={0.24} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-st.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
