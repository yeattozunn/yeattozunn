import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo, Whip } from "./derby";
import { C, display, F, mono } from "./theme";
import { H_CAPTIONS } from "./haftaCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";

// Süper Lig week 9 recap (24–26 Oct 2026). Cuts follow H_CAPTIONS.
export const HF_TOTAL = 1350;

const TEAM: Record<string, string> = {
  Galatasaray: "#c8102e",
  Fenerbahçe: "#e2bb45",
  Amedspor: "#2e9e4f",
  Samsunspor: "#d22630",
  Trabzonspor: "#8a1538",
  Rizespor: "#1f8a4c",
  Erzurumspor: "#2a6fdb",
  Gaziantep: "#c9252c",
  Beşiktaş: "#f1efea",
  Kocaelispor: "#2e9e4f",
  Alanyaspor: "#f28c28",
  Kasımpaşa: "#2a5bd7",
  Eyüpspor: "#7b3fa0",
  Konyaspor: "#2e9e4f",
  Gençlerbirliği: "#d22630",
};

// Club crests from ESPN's team logo CDN, saved in public/crest/
const FILE: Record<string, string> = {
  Galatasaray: "galatasaray", Fenerbahçe: "fenerbahce", Amedspor: "amedspor", Samsunspor: "samsunspor",
  Trabzonspor: "trabzonspor", Rizespor: "rizespor", Erzurumspor: "erzurumspor", Gaziantep: "gaziantep",
  Beşiktaş: "besiktas", Kocaelispor: "kocaelispor", Alanyaspor: "alanyaspor", Kasımpaşa: "kasimpasa",
  Eyüpspor: "eyupspor", Konyaspor: "konyaspor", Gençlerbirliği: "genclerbirligi",
};

export const Logo2: React.FC<{ team: string; size: number; style?: React.CSSProperties }> = ({ team, size, style }) => (
  <Img
    src={staticFile(`crest/${FILE[team]}.png`)}
    style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))", ...style }}
  />
);

const Bar: React.FC<{ team: string }> = ({ team }) => <Logo2 team={team} size={110} />;

// One result: home row, away row, goals counting up, winner in white, loser dimmed.
const Score: React.FC<{ home: string; away: string; hs: number; as: number; meta: string; tag?: string; delay?: number; steps?: [number, number][] }> = ({
  home,
  away,
  hs,
  as,
  meta,
  tag,
  delay = 0,
  steps,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = steps
    ? steps[Math.min(steps.length - 1, Math.max(0, Math.floor((frame - delay) / 9)))]
    : ([hs, as] as [number, number]);
  const done = !steps || frame - delay >= (steps.length - 1) * 9;
  const rows: [string, number, boolean][] = [
    [home, shown[0], hs > as],
    [away, shown[1], as > hs],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Meta left={meta} right={tag} delay={delay} />
      {rows.map(([name, g, win], i) => {
        const s = spring({ frame: frame - delay - i * 4, fps, config: { damping: 200 } });
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 28, opacity: s, transform: `translateX(${(1 - s) * -60}px)` }}>
            <Bar team={name} />
            <div style={{ ...display(96), color: done && !win ? "rgba(241,239,234,0.45)" : C.white, flex: 1 }}>{name}</div>
            <div style={{ ...display(150), color: done && win ? GOLD : C.white, fontVariantNumeric: "tabular-nums" }}>{g}</div>
          </div>
        );
      })}
    </div>
  );
};

const Open: React.FC = () => (
  <Stage light={1.2}>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 20 }}>
      <Meta left="Trendyol Süper Lig" right="24–26 Ekim" />
      <Drop size={330} delay={2} lines={[{ text: "9." }, { text: "hafta", color: GOLD }]} />
    </AbsoluteFill>
  </Stage>
);

const Race: React.FC = () => (
  <AbsoluteFill>
    <Photo src="derbi.jpg" pos="50% 40%" zoom={[1.05, 1.2]} dim={0.5} />
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
      <Drop size={150} delay={2} lines={[{ text: "Zirvede" }, { text: "nefes nefese.", color: GOLD }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Derby: React.FC = () => (
  <Whip>
    <Photo src="osi-shh.jpg" pos="50% 30%" zoom={[1.05, 1.18]} dim={0.55} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 640 }}>
      <Score home="Galatasaray" away="Fenerbahçe" hs={2} as={1} meta="Derbi · RAMS Park" tag="Osimhen 29' 44'" delay={4} />
    </AbsoluteFill>
  </Whip>
);

const Leader: React.FC = () => (
  <AbsoluteFill>
    <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.1, 1.25]} dim={0.5} />
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
      <Logo2 team="Galatasaray" size={200} />
      <div style={{ ...mono(30), color: C.ice }}>Lider</div>
      <Drop size={260} align="center" delay={4} lines={[{ text: "22", color: GOLD }]} />
      <div style={{ ...display(70), color: C.white }}>puan</div>
    </AbsoluteFill>
  </AbsoluteFill>
);

const FbDrop: React.FC = () => (
  <AbsoluteFill>
    <Photo src="kartal.jpg" pos="50% 30%" zoom={[1.0, 1.14]} dim={0.5} />
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560, gap: 10 }}>
      <Logo2 team="Fenerbahçe" size={170} />
      <Chip color={TEAM.Fenerbahçe}>Fenerbahçe · 16 puan</Chip>
      <Drop size={200} delay={6} lines={[{ text: "5. sıra", color: TEAM.Fenerbahçe }]} />
    </AbsoluteFill>
  </AbsoluteFill>
);

const Surprise: React.FC = () => (
  <Stage light={1.1}>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 16 }}>
      <Logo2 team="Amedspor" size={260} />
      <div style={{ ...mono(30), color: C.ice }}>Haftanın sürprizi</div>
      <Drop size={190} delay={4} lines={[{ text: "Amedspor", color: TEAM.Amedspor }]} />
    </AbsoluteFill>
  </Stage>
);

const Amed: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 50 }}>
        <Score home="Samsunspor" away="Amedspor" hs={1} as={2} meta="Samsun · deplasman" tag="Dia Saba 83'" delay={2} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", opacity: interpolate(frame, [30, 38], [0, 1], clamp) }}>
          <Chip color="#e5484d">Samsun 10 kişi</Chip>
          <Chip color={GOLD}>Amed 20 puan · 2.</Chip>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const TsBack: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
      <Score
        home="Trabzonspor"
        away="Rizespor"
        hs={4}
        as={3}
        meta="Trabzon"
        tag="Geriden dönüş"
        steps={[[0, 0], [0, 1], [0, 2]]}
        delay={4}
      />
    </AbsoluteFill>
  </Stage>
);

const TsWin: React.FC = () => (
  <Stage light={1.2}>
    <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
      <Score home="Trabzonspor" away="Rizespor" hs={4} as={3} meta="Trabzon" tag="Maç sonu" steps={[[1, 2], [2, 2], [3, 2], [3, 3], [4, 3]]} delay={0} />
    </AbsoluteFill>
  </Stage>
);

const Motm: React.FC = () => (
  <Stage light={1.3}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 20 }}>
      <Drop size={170} align="center" delay={1} lines={[{ text: "Haftanın" }, { text: "maçı.", color: GOLD }]} />
      <div style={{ ...display(90), color: C.white }}>7 gol</div>
    </AbsoluteFill>
  </Stage>
);

const Erzurum: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 50 }}>
        <Score home="Gaziantep" away="Erzurumspor" hs={1} as={3} meta="Gaziantep" tag="Deplasman" delay={2} />
        <div style={{ opacity: interpolate(frame, [26, 34], [0, 1], clamp) }}>
          <Chip color={TEAM.Erzurumspor}>Sezonun ilk deplasman galibiyeti</Chip>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const Others: React.FC = () => (
  <Stage>
    <AbsoluteFill style={{ justifyContent: "flex-start", padding: PAD, paddingTop: 200, gap: 60, transform: "scale(0.82)", transformOrigin: "top center" }}>
      <Score home="Alanyaspor" away="Kocaelispor" hs={1} as={2} meta="Alanya" delay={2} />
      <Score home="Eyüpspor" away="Kasımpaşa" hs={0} as={1} meta="Eyüp" delay={30} />
      <Score home="Konyaspor" away="Gençlerbirliği" hs={2} as={0} meta="Konya" delay={60} />
    </AbsoluteFill>
  </Stage>
);

const TOP = [
  { name: "Galatasaray", pts: 22 },
  { name: "Amedspor", pts: 20 },
  { name: "Trabzonspor", pts: 19 },
  { name: "Beşiktaş", pts: 18 },
  { name: "Fenerbahçe", pts: 16 },
];

const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const gap = interpolate(frame, [112, 126], [0, 1], clamp);
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
        <Meta left="Puan durumu · ilk 5" right="P" />
        {TOP.map((r, i) => {
          const k = interpolate(frame - i * 14, [0, 16], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          return (
            <div key={r.name} style={{ display: "flex", flexDirection: "column", gap: 8, opacity: k }}>
              <div style={{ display: "flex", justifyContent: "space-between", ...display(66), color: C.white }}>
                <span style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  {i + 1}. <Logo2 team={r.name} size={72} /> {r.name}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{r.pts}</span>
              </div>
              <div style={{ height: 18, width: `${(r.pts / 22) * 100 * k}%`, background: TEAM[r.name], borderRadius: 3 }} />
            </div>
          );
        })}
        <div style={{ opacity: gap, transform: `translateY(${(1 - gap) * 30}px)`, marginTop: 20, ...display(150), color: GOLD }}>Fark: 6 puan</div>
      </AbsoluteFill>
    </Stage>
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
        <Drop size={110} align="center" delay={0} lines={[{ text: "Kim" }, { text: "kopacak?", color: GOLD }]} />
        <div style={{ transform: `scale(${0.6 + 0.4 * word})`, marginTop: 40 }}>
          <PivotMark size={200} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(170), color: C.white, opacity: word }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(frame, [24, 36], [0, 1], clamp) }}>
          Yorumlara yaz 👇
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const CUTS: [number, number, React.FC][] = [
  [0, 52, Open],
  [52, 115, Race],
  [115, 245, Derby],
  [245, 296, Leader],
  [296, 355, FbDrop],
  [355, 421, Surprise],
  [421, 540, Amed],
  [540, 612, TsBack],
  [612, 659, TsWin],
  [659, 697, Motm],
  [697, 833, Erzurum],
  [833, 980, Others],
  [980, 1167, Table],
  [1167, 1350, Logo],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = H_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const HaftaReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-hafta.wav")} volume={0.25} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-hafta.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
