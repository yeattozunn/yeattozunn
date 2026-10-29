import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo } from "./derby";
import { C, display, F, mono } from "./theme";
import { H10_CAPTIONS } from "./h10Captions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GOLD = "#f2b632";

// Week 10 preview: 50,000 Poisson runs per match (scripts/sim_week10.py). Cuts follow H10_CAPTIONS.
export const H10_TOTAL = 1290;

const Logo2: React.FC<{ f: string; size: number }> = ({ f, size }) => (
  <Img src={staticFile(`crest/${f}.png`)} style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))" }} />
);

const Coin: React.FC = () => {
  const frame = useCurrentFrame();
  const spin = frame * 28;
  const y = -Math.abs(Math.sin(frame / 12)) * 120;
  return (
    <Stage light={1.2}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 60 }}>
        <div style={{ transform: `translateY(${y}px) rotateY(${spin}deg)`, width: 360, height: 360, borderRadius: 180, background: "radial-gradient(circle at 35% 30%, #ffe08a, #b8860b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
          <Logo2 f="galatasaray" size={230} />
        </div>
        <Drop size={170} align="center" delay={2} lines={[{ text: "Yazı tura.", color: GOLD }]} />
      </AbsoluteFill>
    </Stage>
  );
};

const Fifty: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [70, 110], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  return (
    <AbsoluteFill>
      <Photo src="koreo.jpg" pos="50% 35%" zoom={[1.05, 1.2]} dim={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 26 }}>
        <Meta left="Zirvede tek başına" right="10. hafta sonu" />
        <Logo2 f="galatasaray" size={170} />
        <div style={{ ...display(420), color: C.white, lineHeight: 0.9, opacity: interpolate(frame, [60, 70], [0, 1], clamp) }}>%50</div>
        <div style={{ display: "flex", height: 30, borderRadius: 6, overflow: "hidden", background: "rgba(241,239,234,0.12)" }}>
          <div style={{ width: `${49.8 * k}%`, background: "#c8102e" }} />
          <div style={{ width: `${50.2 * k}%`, background: "rgba(241,239,234,0.35)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", ...mono(26), color: C.ice, opacity: k }}>
          <span>Tek başına lider</span>
          <span>Yakalanır ya da geçilir</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [0, 55], [0, 50000], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) }));
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 10 }}>
        <Meta left="Poisson simülasyonu" right="Süper Lig · 10. hafta" />
        <div style={{ ...display(250), color: C.white, fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("tr-TR")}</div>
        <Drop size={120} delay={6} lines={[{ text: "kez oynattık.", color: C.ice, weight: 300 }]} />
      </AbsoluteFill>
    </Stage>
  );
};

type M = { home: string; away: string; hf: string; af: string; p: [number, number, number]; when: string; at: number; hi?: 0 | 2 | 1; extra?: React.ReactNode; extraAt?: number; photo?: string };

// Match card: crests in, then the 1-X-2 bar fills at `at`.
const Match: React.FC<{ m: M }> = ({ m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const k = interpolate(frame - m.at, [0, 24], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const labels = [m.home, "Beraberlik", m.away];
  const cols = ["#c9dcea", "rgba(241,239,234,0.35)", GOLD];
  return (
    <AbsoluteFill>
      {m.photo ? <Photo src={m.photo} pos="50% 25%" zoom={[1.05, 1.2]} dim={0.35} /> : <Stage><span /></Stage>}
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD, gap: 40 }}>
        <Meta left={m.when} right="50.000 simülasyon" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", transform: `scale(${s})` }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Logo2 f={m.hf} size={230} />
            <div style={{ ...display(60), color: C.white }}>{m.home}</div>
          </div>
          <div style={{ ...display(90), color: C.ice }}>vs</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Logo2 f={m.af} size={230} />
            <div style={{ ...display(60), color: C.white }}>{m.away}</div>
          </div>
        </div>
        {m.extra ? <div style={{ opacity: interpolate(frame - (m.extraAt ?? 0), [0, 8], [0, 1], clamp) }}>{m.extra}</div> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, opacity: k }}>
          {m.p.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ ...mono(26), color: C.white, width: 250 }}>{labels[i]}</div>
              <div style={{ flex: 1, height: 44, background: "rgba(241,239,234,0.08)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${v * k}%`, background: m.hi === i ? GOLD : cols[i] === GOLD ? "rgba(241,239,234,0.55)" : cols[i], borderRadius: 6 }} />
              </div>
              <div style={{ ...display(70), color: m.hi === i ? GOLD : C.white, width: 160, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{v < 1 && k > 0.99 ? "<%1" : `%${Math.round(v * k)}`}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MATCHES: M[] = [
  { home: "Konyaspor", away: "Galatasaray", hf: "konyaspor", af: "galatasaray", p: [19, 32, 49], when: "Cuma · 20:00 · Konya", at: 55, hi: 2, photo: "osi-mask.jpg" },
  {
    home: "Amedspor",
    away: "Eyüpspor",
    hf: "amedspor",
    af: "eyupspor",
    p: [96, 3, 0.4],
    when: "Pazar · 13:30 · Diyarbakır",
    at: 154,
    hi: 0,
    extraAt: 52,
    extra: <Chip color="#e5484d">Eyüpspor · 9 maçta 23 gol yedi · 3 puan</Chip>,
  },
  { home: "Trabzonspor", away: "Gaziantep", hf: "trabzonspor", af: "gaziantep", p: [84, 12, 4], when: "Pazar · 16:00 · Trabzon", at: 30, hi: 0 },
  { home: "Fenerbahçe", away: "Göztepe", hf: "fenerbahce", af: "goztepe", p: [78, 13, 9], when: "Cumartesi · 19:00 · Kadıköy", at: 30, hi: 0 },
  { home: "Kasımpaşa", away: "Beşiktaş", hf: "kasimpasa", af: "besiktas", p: [35, 30, 35], when: "Pazar · 19:00 · Kasımpaşa", at: 95, hi: 1 },
];

const Shake: React.FC = () => {
  const frame = useCurrentFrame();
  const sh = frame > 20 && frame < 50 ? Math.sin(frame * 2.7) * (50 - frame) * 0.8 : 0;
  return (
    <AbsoluteFill style={{ transform: `translate(${sh}px, ${sh * 0.4}px)` }}>
      <Photo src="osi-shh.jpg" pos="50% 30%" zoom={[1.05, 1.18]} dim={0.45} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: PAD, paddingBottom: 560, gap: 10 }}>
        <Chip color={GOLD}>Konya'da puan kaybı =</Chip>
        <Drop size={160} delay={8} lines={[{ text: "Liderlik" }, { text: "sallanır.", color: GOLD }]} />
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
        <Drop size={100} align="center" delay={0} lines={[{ text: "Konya'dan" }, { text: "kaç puan?", color: GOLD }]} />
        <div style={{ transform: `scale(${0.6 + 0.4 * word})`, marginTop: 30 }}>
          <PivotMark size={200} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(170), color: C.white, opacity: word }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(frame, [20, 32], [0, 1], clamp) }}>
          Yorumlara yaz 👇
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const mk = (i: number): React.FC => () => <Match m={MATCHES[i]} />;

const CUTS: [number, number, React.FC][] = [
  [0, 37, Coin],
  [37, 192, Fifty],
  [192, 269, Sim],
  [269, 477, mk(0)],
  [477, 702, mk(1)],
  [702, 818, mk(2)],
  [818, 917, mk(3)],
  [917, 1069, mk(4)],
  [1069, 1166, Shake],
  [1166, 1290, Logo],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = H10_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const H10Reel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-h10.wav")} volume={0.25} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-h10.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
