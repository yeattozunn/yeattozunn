import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Drop, Grain, Meta, PivotMark, Stage } from "./parts";
import { Flash } from "./derby";
import { C, display, F, mono } from "./theme";
import { W_CAPTIONS } from "./wkCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const LIME = "#c6f432";

// Süper Lig U21 "wonderkid list" (ESPN rosters after week 9, 29 Oct 2026). Cuts follow W_CAPTIONS.
export const WK_TOTAL = 1260;

type Kid = { rank: number; name: string; photo: string; club: string; crest: string; color: string; age: number; pos: string; mp: string; g: number; a: number; tag: string; reveal: number; tr?: boolean };
const KIDS: Kid[] = [
  { rank: 5, name: "Iustin Doicaru", photo: "wk-doicaru.png", club: "Rizespor", crest: "rizespor", color: "#1f8a4c", age: 19, pos: "Forvet", mp: "7", g: 1, a: 1, tag: "Rumen forvet", reveal: 70 },
  { rank: 4, name: "Arda Usluoğlu", photo: "wk-arda.png", club: "Alanyaspor", crest: "alanyaspor", color: "#f28c28", age: 20, pos: "Forvet", mp: "8", g: 2, a: 0, tag: "Takımın golcüsü", reveal: 80, tr: true },
  { rank: 3, name: "Ousmane Diabate", photo: "wk-diabate.png", club: "Gençlerbirliği", crest: "genclerbirligi", color: "#d22630", age: 19, pos: "Orta saha", mp: "9/9", g: 1, a: 1, tag: "Her maç sahada", reveal: 70 },
  { rank: 2, name: "İlhan Fakılı", photo: "wk-ilhan.png", club: "Beşiktaş", crest: "besiktas", color: "#9aa0a6", age: 20, pos: "Forvet", mp: "8", g: 1, a: 1, tag: "Kartalın genç forveti", reveal: 52, tr: true },
  { rank: 1, name: "Saikuba Jarju", photo: "wk-jarju.png", club: "Samsunspor", crest: "samsunspor", color: "#d22630", age: 18, pos: "Forvet", mp: "8", g: 0, a: 2, tag: "Listenin en genci", reveal: 50 },
];

const Bar: React.FC<{ k: number; color?: string }> = ({ k, color = LIME }) => (
  <div style={{ height: 10, background: "rgba(241,239,234,0.12)", borderRadius: 5, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${k * 100}%`, background: color, borderRadius: 5 }} />
  </div>
);

// The list: rows stay "???" until `shown` ranks are revealed (5 → 1).
const List: React.FC<{ shown: number; pulse?: boolean; title?: string }> = ({ shown, pulse, title }) => {
  const frame = useCurrentFrame();
  return (
    <Stage light={1.1}>
      <AbsoluteFill style={{ justifyContent: "flex-start", padding: PAD, paddingTop: 300, gap: 24 }}>
        {title ? <Drop size={110} delay={0} lines={[{ text: title, color: C.white }]} /> : null}
        <div style={{ border: `2px solid ${LIME}55`, borderRadius: 18, padding: 34, background: "rgba(198,244,50,0.04)", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", ...mono(26), color: LIME }}>
            <span>■ WONDERKID LİSTESİ</span>
            <span style={{ opacity: 0.6 }}>SÜPER LİG · U21</span>
          </div>
          {[1, 2, 3, 4, 5].map((rank, i) => {
            const kid = KIDS.find((x) => x.rank === rank)!;
            const open = 6 - rank <= shown;
            const fill = interpolate(frame - i * 5, [0, 40], [0, open ? 1 : 0.35 + 0.1 * i], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
            const glow = pulse && rank === 1 ? 0.5 + 0.5 * Math.sin(frame / 3) : 0;
            return (
              <div key={rank} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ ...display(60), color: LIME, width: 50 }}>{rank}</div>
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 46,
                    border: `2px solid ${open ? LIME : "rgba(241,239,234,0.25)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: glow ? `0 0 ${40 * glow}px ${LIME}` : undefined,
                  }}
                >
                  {open ? <Img src={staticFile(`photos/${kid.photo}`)} style={{ width: 88, height: 88, borderRadius: 44, objectFit: "cover", objectPosition: "50% 20%" }} /> : <span style={{ ...display(54), color: "rgba(241,239,234,0.5)" }}>?</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div lang={kid.tr ? "tr" : "en"} style={{ ...display(54), color: open ? C.white : "rgba(241,239,234,0.5)" }}>{open ? kid.name : "???"}</div>
                  <Bar k={fill} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const scramble = (name: string, frame: number, at: number) => {
  const chars = "ABCDEFGHIJKLMNOPRSTUVYZ";
  return name
    .split("")
    .map((ch, i) => (ch === " " ? " " : frame >= at + i * 1.2 ? ch : frame < at - 20 ? "?" : chars[(frame * 7 + i * 13) % chars.length]))
    .join("");
};

const Card: React.FC<{ kid: Kid }> = ({ kid }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rank = spring({ frame, fps, config: { damping: 10, mass: 0.6 } });
  const crest = spring({ frame: frame - kid.reveal, fps, config: { damping: 12, mass: 0.7 } });
  const stats = (d: number) => interpolate(frame - kid.reveal - 14 - d, [0, 8], [0, 1], clamp);
  const flash = interpolate(frame, [kid.reveal, kid.reveal + 2, kid.reveal + 10], [0, 0.8, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 70% 25%, ${kid.color}55, #08090b 70%)` }}>
      <Img
        src={staticFile(`crest/${kid.crest}.png`)}
        style={{ position: "absolute", right: -160, top: 160, width: 900, height: 900, objectFit: "contain", opacity: 0.1 * crest, transform: `rotate(-8deg) scale(${0.9 + 0.1 * crest})` }}
      />
      <div
        style={{
          position: "absolute",
          right: PAD,
          top: 300,
          width: 400,
          height: 400,
          borderRadius: 200,
          overflow: "hidden",
          border: `4px solid ${LIME}`,
          background: `radial-gradient(circle at 50% 40%, ${kid.color}aa, #101114)`,
          boxShadow: `0 0 ${60 * crest}px ${LIME}66`,
          transform: `scale(${0.85 + 0.15 * crest})`,
        }}
      >
        <Img
          src={staticFile(`photos/${kid.photo}`)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%", filter: frame >= kid.reveal ? "none" : "brightness(0) blur(2px)" }}
        />
        {frame < kid.reveal ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...display(200), color: LIME }}>?</div>
        ) : null}
      </div>
      <AbsoluteFill style={{ padding: PAD, paddingTop: 220, gap: 26 }}>
        <Meta left="Wonderkid listesi" right={`#${kid.rank} / 5`} />
        <div style={{ ...display(400), color: LIME, transform: `scale(${rank})`, transformOrigin: "left center", lineHeight: 0.9 }}>#{kid.rank}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <Img src={staticFile(`crest/${kid.crest}.png`)} style={{ width: 150, height: 150, objectFit: "contain", transform: `scale(${crest})` }} />
          <div style={{ ...mono(30), color: C.white, opacity: crest }}>
            {kid.club}
            <br />
            {kid.pos}
          </div>
        </div>
        <div lang={kid.tr ? "tr" : "en"} style={{ ...display(kid.name.length > 13 ? 120 : 140), color: frame >= kid.reveal ? C.white : "rgba(241,239,234,0.5)" }}>{scramble(kid.name, frame, kid.reveal)}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
          {[
            ["Yaş", String(kid.age)],
            ["Maç", kid.mp],
            ["Gol", String(kid.g)],
            ["Asist", String(kid.a)],
          ].map(([k, v], i) => (
            <div key={k} style={{ flex: 1, border: `1.5px solid ${LIME}66`, borderRadius: 12, padding: "18px 0", textAlign: "center", opacity: stats(i * 4), transform: `translateY(${(1 - stats(i * 4)) * 20}px)` }}>
              <div style={{ ...display(84), color: k === "Yaş" ? LIME : C.white }}>{v}</div>
              <div style={{ ...mono(22), color: C.ice }}>{k}</div>
            </div>
          ))}
        </div>
        <div style={{ opacity: stats(20), ...mono(28), color: LIME }}>▲ {kid.tag}</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.white, opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => (
  <List shown={0} title="Henüz kimse konuşmuyor." />
);

const Final: React.FC = () => <List shown={5} title="Sıradaki Batrakov?" />;
const Pre1: React.FC = () => <List shown={4} pulse />;

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = spring({ frame: frame - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  return (
    <Stage light={0.7}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
        <div style={{ transform: `scale(${0.6 + 0.4 * word})` }}>
          <PivotMark size={220} angle={interpolate(rot, [0, 1], [0, -36])} />
        </div>
        <div style={{ ...display(190), color: C.white, opacity: word }}>Pivot</div>
        <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(frame, [20, 32], [0, 1], clamp) }}>
          Senin wonderkid'in kim? 👇
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const kidScene = (i: number): React.FC => () => <Card kid={KIDS[i]} />;

const CUTS: [number, number, React.FC][] = [
  [0, 127, Hook],
  [127, 308, kidScene(0)],
  [308, 473, kidScene(1)],
  [473, 661, kidScene(2)],
  [661, 822, kidScene(3)],
  [822, 858, Pre1],
  [858, 1063, kidScene(4)],
  [1063, 1170, Final],
  [1170, 1260, Logo],
];

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = W_CAPTIONS.find((p) => t >= p.words[0].s - 0.1 && t < p.words[p.words.length - 1].e + 0.2);
  if (!c) return null;
  const from = c.words[0].s - 0.1;
  const to = c.words[c.words.length - 1].e + 0.2;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const WonderkidReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    {CUTS.map(([a, b, S], i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <S />
        <Flash at={0} />
      </Sequence>
    ))}
    <Captions />
    <Grain />
    <Audio src={staticFile("score-wk.wav")} volume={0.25} />
    <Sequence from={9}>
      <Audio src={staticFile("voice-wk.mp3")} volume={1.5} />
    </Sequence>
  </AbsoluteFill>
);
