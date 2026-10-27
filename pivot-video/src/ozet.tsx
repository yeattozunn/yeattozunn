import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Crest, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo, Whip } from "./derby";
import { C, display, F, mono } from "./theme";
import { O_CAPTIONS } from "./ozetCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";
const GS_RED = "#c8102e";
const FB_YEL = "#e2bb45";

// Derby recap (GS 2–1 FB, 26 Oct 2026). Cuts follow O_CAPTIONS.
export const OZ_TOTAL = 930;

const Open: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile("wan/rams-flares.mp4")} startFrom={20} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
      <Drop size={220} delay={2} lines={[{ text: "Bir" }, { text: "derbi.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Two: React.FC = () => (
  <Stage light={1.2}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Drop size={300} align="center" delay={1} lines={[{ text: "İki" }, { text: "gol.", color: GOLD }]} />
    </AbsoluteFill>
  </Stage>
);

const Name: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Photo src="osi-mask.jpg" pos="45% 30%" zoom={[1.15, 1.0]} dim={0.75} />
      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 520, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...mono(30), color: C.ice, opacity: interpolate(frame, [0, 10], [0, 1], clamp) }}>Tek isim</div>
        <Drop size={150} delay={14} lines={[{ text: "Victor" }, { text: "Osimhen.", color: GOLD }]} />
      </div>
    </AbsoluteFill>
  );
};

const Goal: React.FC<{ min: string; score: string; photo: string; pos: string; label: string }> = ({ min, score, photo, pos, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 10, mass: 0.6 } });
  return (
    <Whip>
      <Photo src={photo} pos={pos} zoom={[1.05, 1.2]} dim={0.6} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 240 }}>
        <Meta left="Gol · Osimhen" right={label} />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 10 }}>
        <div style={{ ...display(360), color: C.white, transform: `scale(${pop})`, transformOrigin: "left center" }}>{min}'</div>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Crest team="gs" size={110} />
          <div style={{ ...display(140), color: GOLD }}>{score}</div>
        </div>
      </AbsoluteFill>
    </Whip>
  );
};

const Half: React.FC = () => (
  <AbsoluteFill>
    <Photo src="skriniar.jpg" pos="50% 30%" zoom={[1.0, 1.15]} dim={0.5} />
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 240 }}>
      <Meta left="İlk yarı" right="GS 2–0 FB" />
    </div>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
      <Chip color={FB_YEL}>Yeni stoper ikilisi</Chip>
      <Drop size={150} delay={6} stagger={4} lines={[{ text: "Bir devre" }, { text: "bile", weight: 300, color: C.ice }, { text: "dayanamadı.", color: FB_YEL }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Reply: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 10, mass: 0.6 } });
  return (
    <Stage>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 240 }}>
        <Meta left="Gol · İrfan Can Kahveci" right="Fenerbahçe" />
      </div>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 20 }}>
        <div style={{ ...display(360), color: FB_YEL, transform: `scale(${pop})`, transformOrigin: "left center" }}>62'</div>
        <Drop size={130} delay={12} lines={[{ text: "İrfan Can" }, { text: "umut verdi.", color: C.ice, weight: 300 }]} />
        <div style={{ ...display(120), color: C.white, opacity: interpolate(frame, [20, 28], [0, 1], clamp) }}>2–1</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Shut: React.FC = () => (
  <AbsoluteFill>
    <Photo src="buruk.jpg" pos="50% 30%" zoom={[1.0, 1.14]} dim={0.6} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560 }}>
      <Drop size={150} delay={2} lines={[{ text: "Galatasaray" }, { text: "kapıyı kapattı.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 2, fps, config: { damping: 9, mass: 0.7 } });
  return (
    <AbsoluteFill>
      <Photo src="skor21.jpg" pos="40% 15%" zoom={[1.2, 1.05]} dim={0.7} />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", gap: 40, paddingBottom: 560 }}>
        <div style={{ ...mono(30), color: C.ice }}>Maç sonu · RAMS Park</div>
        <div style={{ display: "flex", alignItems: "center", gap: 40, transform: `scale(${s})` }}>
          <Crest team="gs" size={170} />
          <div style={{ ...display(300), color: C.white, fontVariantNumeric: "tabular-nums" }}>2–1</div>
          <div style={{ ...display(110), color: FB_YEL }}>FB</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Home: React.FC = () => (
  <AbsoluteFill>
    <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.25]} dim={0.55} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 }}>
      <Crest team="gs" size={220} />
      <Drop size={150} align="center" delay={2} lines={[{ text: "Lider evinde" }, { text: "kaybetmedi.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    { name: "Galatasaray", pts: 22, c: GS_RED, at: 0 },
    { name: "Fenerbahçe", pts: 16, c: FB_YEL, at: 6 },
  ];
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 34 }}>
        <Meta left="Süper Lig · 9. hafta sonu" right="Puan" />
        {rows.map((r) => {
          const k = interpolate(frame - r.at, [0, 18], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          return (
            <div key={r.name} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...display(80), color: C.white }}>
                <span>{r.name}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(r.pts * k)}</span>
              </div>
              <div style={{ height: 26, width: `${(r.pts / 22) * 100 * k}%`, background: r.c, borderRadius: 4 }} />
            </div>
          );
        })}
        <div style={{ opacity: interpolate(frame, [26, 34], [0, 1], clamp), marginTop: 20 }}>
          <Drop size={170} delay={26} lines={[{ text: "Fark: 6", color: GOLD }]} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Ask: React.FC = () => (
  <AbsoluteFill>
    <Photo src="osi-close.jpg" pos="50% 30%" zoom={[1.0, 1.18]} dim={0.6} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560 }}>
      <Drop size={130} delay={2} lines={[{ text: "En iyi" }, { text: "derbisi mi?", color: GOLD }]} />
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
          Yorumlara yaz 👇
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const G1: React.FC = () => <Goal min="29" score="1–0" photo="osi-head.jpg" pos="55% 40%" label="İlk vuruş" />;
const G2: React.FC = () => <Goal min="44" score="2–0" photo="osi-shh.jpg" pos="50% 35%" label="İkincisi" />;

const CUTS: [number, number, React.FC][] = [
  [0, 31, Open],
  [31, 59, Two],
  [59, 137, Name],
  [137, 203, G1],
  [203, 263, G2],
  [263, 404, Half],
  [404, 490, Reply],
  [490, 570, Shut],
  [570, 600, Final],
  [600, 654, Home],
  [654, 721, Table],
  [721, 805, Ask],
  [805, 930, Logo],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = O_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const OzetReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-ozet.wav")} volume={0.25} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-ozet.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
