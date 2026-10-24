import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Count, Crest, Drop, FadeIn, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo, Whip } from "./derby";
import { Dot, GoalHead, Move, NetFlash, Pitch } from "./lille2";
import { C, display, F, mono } from "./theme";
import { BJK_CAPTIONS } from "./bjkCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const VO_OFFSET = 0.4;
const PAL = "#3b6fd4";
const RED = "#e0313b";

// Scene boundaries (frames), cut to the narration. scripts/bjk_cues.json mirrors them in seconds.
export const BJ = {
  hook: { from: 0, dur: 155 },
  xg: { from: 155, dur: 157 },
  ndidi: { from: 312, dur: 185 },
  palace: { from: 497, dur: 373 },
  olaitan: { from: 870, dur: 203 },
  red: { from: 1073, dur: 127 },
  sim: { from: 1200, dur: 239 },
  outro: { from: 1439, dur: 247 },
};
export const BJ_TOTAL = 1686;

// Beşiktaş 2–2 Crystal Palace, UEL league phase MD3, 22 Oct 2026, Tüpraş Stadyumu.
// xG is the midpoint of providers (ESPN, FotMob, footballwebpages); sims in scripts/sim_bjk.py.
const XG = { bjk: 0.7, pal: 0.43 };
const SIM = { n: 50000, fourPlus: 1470, exact22: 380 };

const head = { home: "bjk", away: "palace", label: "Beşiktaş · Crystal Palace", colors: { bjk: C.ice, palace: PAL } };

/* ---------- 1 · hook ---------- */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Photo src="bjk-stad3.jpg" pos="50% 45%" zoom={[1.1, 1.3]} drift={[0, -20]} dim={0.5} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 30 }}>
        <Meta left="Avrupa Ligi · 3. hafta" right="Tüpraş Stadyumu" />
        {frame < 80 ? (
          <Drop size={160} delay={4} lines={[{ text: "Tüpraş'ta" }, { text: "dört gollü" }, { text: "bir gece.", color: C.ice, weight: 300 }]} />
        ) : (
          <Drop size={140} delay={82} lines={[{ text: "Ama bir rakam" }, { text: "her şeyi", color: C.ice, weight: 300 }, { text: "değiştiriyor.", color: C.ice, weight: 300 }]} />
        )}
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1110, display: "flex", alignItems: "center", gap: 30 }}>
        <FadeIn at={20}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Crest team="bjk" size={120} />
            <span style={{ ...display(140), color: C.white }}>2–2</span>
            <Crest team="palace" size={120} />
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 2 · 1.1 xG, 4 goals ---------- */
const XgVsGoals: React.FC = () => {
  const frame = useCurrentFrame();
  const goalsIn = frame >= 132;
  return (
    <Whip>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 26 }}>
          <Meta left="İki takım toplam" right="xG vs gol" />
          <Drop size={120} delay={2} lines={[{ text: "Beklenen gol" }, { text: "ve gerçek.", color: C.ice, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 620, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <FadeIn at={60}>
            <div style={{ ...mono(26), color: C.dim }}>Toplam xG</div>
            <Count to={1.1} start={62} dur={22} decimals={1} style={{ ...display(330), color: C.white }} />
          </FadeIn>
          <div style={{ opacity: goalsIn ? 1 : 0, textAlign: "right" }}>
            <div style={{ ...mono(26), color: C.ice }}>Atılan gol</div>
            <div style={{ ...display(400), color: C.ice, textShadow: "0 0 80px rgba(201,220,234,0.5)", transform: `scale(${interpolate(frame, [132, 138, 146], [1.4, 0.96, 1], clamp)})`, transformOrigin: "right bottom" }}>4</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1070, display: "flex", flexDirection: "column", gap: 26 }}>
          {[
            { team: "bjk", name: "Beşiktaş", xg: XG.bjk, at: 90, c: C.white },
            { team: "palace", name: "Crystal Palace", xg: XG.pal, at: 100, c: PAL },
          ].map((r) => {
            const k = interpolate(frame, [r.at, r.at + 20], [0, 1], clamp);
            return (
              <FadeIn key={r.team} at={r.at}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <Crest team={r.team} size={56} />
                  <span style={{ ...display(54), color: C.white, width: 330 }}>{r.name}</span>
                  <div style={{ flex: 1, height: 14, background: C.faint, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(r.xg / 2) * 100 * k}%`, background: r.c }} />
                    {goalsIn ? <div style={{ position: "absolute", left: 0, top: -4, height: 22, width: "100%", border: `2px solid ${C.ice}` }} /> : null}
                  </div>
                  <span style={{ ...mono(22), color: C.dim, width: 170, textAlign: "right" }}>
                    {r.xg.toLocaleString("tr-TR")} xG{goalsIn ? " · 2 gol" : ""}
                  </span>
                </div>
              </FadeIn>
            );
          })}
        </div>
        <Flash at={132} />
      </Stage>
    </Whip>
  );
};

/* ---------- 3 · 45+2' Ndidi ---------- */
const Ndidi: React.FC = () => (
  <Whip dir={-1}>
    <Stage light={0.8}>
      <GoalHead {...head} minute="45+2'" who="Ndidi" how="Salih Özcan'ın pası · sol ayak" prev="0–0" score="1–0" scoreAt={150} team="bjk" />
      <Pitch zoom={1.2} anchor="top" from={30}>
        <Dot at={[0.38, 0.27]} ring color={PAL} from={6} />
        <Dot at={[0.62, 0.27]} ring color={PAL} from={8} />
        <Dot at={[0.5, 0.03]} ring color={PAL} from={10} />
        <Dot at={[0.3, 0.58]} label="Salih Özcan" color={C.white} from={14} />
        <Dot at={[0.62, 0.42]} label="Ndidi" color={C.ice} from={16} glow labelBelow={false} />
        <Move pts={[[0.62, 0.42], [0.6, 0.3], [0.55, 0.16]]} from={40} dur={50} dashed color={C.ice} width={4} />
        <Move pts={[[0.3, 0.58], [0.42, 0.34], [0.55, 0.16]]} from={50} dur={40} ball color={C.white} width={5} />
        <Move pts={[[0.55, 0.16], [0.53, 0.08], [0.52, -0.01]]} from={108} dur={14} ball width={6} />
        <NetFlash at={122} top />
      </Pitch>
      <Flash at={122} />
    </Stage>
  </Whip>
);

/* ---------- 4 · Palace: 51' Pino (VAR), 55' Mateta ---------- */
const Palace: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = frame < 76 ? 0 : frame < 230 ? 1 : 2;
  const offside = frame >= 158 && frame < 196;
  const varOk = frame >= 196;
  return (
    <Whip>
      {phase === 0 ? (
        <Stage>
          <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
            <Meta left="İkinci yarı" right="51' – 55'" />
            <div style={{ height: 30 }} />
            <Drop size={150} delay={2} lines={[{ text: "Dört dakikada" }, { text: "iki darbe.", color: PAL }]} />
          </AbsoluteFill>
        </Stage>
      ) : (
        <Stage light={0.8}>
          {phase === 1 ? (
            <GoalHead key="pino" {...head} minute="51'" who="Pino" how="Khalaili'nin ortası · VAR onayı" prev="1–0" score="1–1" scoreAt={212} team="palace" delay={78} />
          ) : (
            <GoalHead key="mateta" {...head} minute="55'" who="Mateta" how="Savunma hatası · sol çapraz" prev="1–1" score="1–2" scoreAt={352} team="palace" delay={232} />
          )}
          <Pitch zoom={1.25} anchor="bottom" from={phase === 1 ? 84 : 236}>
            {phase === 1 ? (
              <>
                <Dot at={[0.5, 0.97]} ring color={C.ice} from={80} />
                <Dot at={[0.42, 0.88]} ring color={C.ice} from={81} />
                <Dot at={[0.6, 0.88]} ring color={C.ice} from={82} />
                <Dot at={[0.12, 0.78]} label="Khalaili" color={PAL} from={84} />
                <Dot at={[0.52, 0.82]} label="Pino" color={PAL} from={86} glow labelBelow={false} />
                <Move pts={[[0.12, 0.78], [0.3, 0.92], [0.52, 0.9]]} from={92} dur={22} ball color={C.white} width={5} />
                <Move pts={[[0.52, 0.82], [0.52, 0.9]]} from={92} dur={20} dashed color={PAL} width={4} />
                <Move pts={[[0.52, 0.9], [0.52, 0.96], [0.5, 1.01]]} from={124} dur={10} ball color={PAL} width={6} />
                <NetFlash at={134} top={false} color={PAL} />
              </>
            ) : (
              <>
                <Dot at={[0.5, 0.97]} ring color={C.ice} from={232} />
                <Dot at={[0.45, 0.8]} label="Beşiktaş" color={C.white} from={234} />
                <Dot at={[0.38, 0.74]} label="Mateta" color={PAL} from={236} glow labelBelow={false} />
                <Move pts={[[0.38, 0.74], [0.42, 0.78], [0.45, 0.8]]} from={250} dur={14} dashed color={PAL} width={4} />
                <Move pts={[[0.45, 0.8], [0.56, 0.84], [0.66, 0.86]]} from={280} dur={24} ball color={PAL} width={5} />
                <Move pts={[[0.66, 0.86], [0.6, 0.94], [0.55, 1.01]]} from={314} dur={12} ball color={PAL} width={6} />
                <NetFlash at={326} top={false} color={PAL} />
              </>
            )}
          </Pitch>
          {phase === 1 ? (
            <div style={{ position: "absolute", left: PAD, top: 500, display: "flex", gap: 14, alignItems: "flex-start" }}>
              {offside ? <Chip color={RED}>Bayrak: ofsayt</Chip> : null}
              {varOk ? <FadeIn at={196}><Chip color={C.ice}>VAR: gol geçerli</Chip></FadeIn> : null}
            </div>
          ) : (
            <div style={{ position: "absolute", left: PAD, top: 500 }}>
              <FadeIn at={248}><Chip color={RED}>Beşiktaş savunma hatası</Chip></FadeIn>
            </div>
          )}
          <Flash at={phase === 1 ? 210 : 330} />
        </Stage>
      )}
    </Whip>
  );
};

/* ---------- 5 · 73' Olaitan, 0.07 xG ---------- */
const Olaitan: React.FC = () => {
  const frame = useCurrentFrame();
  const big = interpolate(frame, [128, 140], [0, 1], clamp);
  return (
    <Whip dir={-1}>
      <Stage light={0.8}>
        <GoalHead {...head} minute="73'" who="Olaitan" how="İki oyuncuyu geçer · sağ ayak" prev="1–2" score="2–2" scoreAt={100} team="bjk" />
        <div style={{ opacity: 1 - 0.7 * big }}>
          <Pitch zoom={1.3} anchor="top" from={10}>
            <Dot at={[0.44, 0.24]} ring color={PAL} from={6} />
            <Dot at={[0.57, 0.19]} ring color={PAL} from={8} />
            <Dot at={[0.5, 0.03]} ring color={PAL} from={10} />
            <Dot at={[0.5, 0.34]} label="Olaitan" color={C.ice} from={12} glow />
            <Move pts={[[0.5, 0.34], [0.4, 0.27], [0.5, 0.21], [0.6, 0.16], [0.52, 0.13]]} from={30} dur={46} dashed color={C.ice} width={5} />
            <Move pts={[[0.52, 0.13], [0.48, 0.06], [0.44, -0.01]]} from={84} dur={12} ball width={6} />
            <NetFlash at={96} top />
          </Pitch>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", opacity: big, transform: `scale(${0.85 + 0.15 * big})` }}>
          <div style={{ ...mono(26), color: C.ice }}>Bu pozisyonun gol olma ihtimali</div>
          <div style={{ ...display(400), color: C.white }}>%7</div>
          <div style={{ ...mono(24), color: C.dim }}>xG 0,07</div>
        </div>
        <Flash at={96} />
      </Stage>
    </Whip>
  );
};

/* ---------- 6 · red card ---------- */
const Red: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 58, fps, config: { damping: 11, mass: 0.7 } });
  const ten = interpolate(frame, [84, 100], [0, 1], clamp);
  return (
    <Whip>
      <Stage light={0.7}>
        <AbsoluteFill style={{ background: RED, opacity: interpolate(frame, [62, 66, 90], [0, 0.35, 0.08], clamp) }} />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 20 }}>
          <Meta left="77'" right="Ümit Akdağ" />
          <Drop size={140} delay={20} lines={[{ text: "Direkt" }, { text: "kırmızı.", color: RED }]} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 540 - 140,
            top: 700,
            width: 280,
            height: 390,
            borderRadius: 22,
            background: RED,
            boxShadow: `0 40px 120px rgba(224,49,59,${0.5 * card})`,
            transform: `translateY(${(1 - card) * 500}px) rotate(${(1 - card) * -35 + 8}deg)`,
            opacity: card > 0.01 ? 1 : 0,
          }}
        />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1170, display: "flex", justifyContent: "center", gap: 18 }}>
          {Array.from({ length: 11 }, (_, i) => {
            const out = i === 4;
            return (
              <div
                key={i}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 46,
                  background: out ? RED : C.white,
                  opacity: out ? 1 - ten : 0.9,
                  transform: out ? `translateY(${ten * 60}px)` : undefined,
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1250, textAlign: "center", opacity: ten }}>
          <span style={{ ...display(80), color: C.white }}>Beşiktaş 10 kişi</span>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 7 · 50,000 sims ---------- */
const COLS = 40;
const ROWS = 25;
const DOTS = COLS * ROWS;
const n4 = Math.round((SIM.fourPlus / SIM.n) * DOTS);
const n22 = Math.max(1, Math.round((SIM.exact22 / SIM.n) * DOTS));
const picks = (() => {
  const a = Array.from({ length: DOTS }, (_, i) => i);
  let seed = 2210;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  const rank = new Array<number>(DOTS);
  a.forEach((cell, r) => (rank[cell] = r));
  return rank;
})();

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const cell = 22;
  const shown = interpolate(frame, [40, 80], [0, DOTS], clamp);
  const f4 = interpolate(frame, [92, 104], [0, 1], clamp);
  const f22 = interpolate(frame, [176, 188], [0, 1], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.3);
  const gx = (1080 - COLS * cell) / 2;
  const gy = 640;
  return (
    <Whip dir={-1}>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 12 }}>
          <Meta left="Maçın xG'si ile" right="Poisson simülasyonu" />
          <Count to={50000} start={44} dur={30} style={{ ...display(220), color: C.white }} />
          <div style={{ ...display(70, 300), color: C.ice, marginTop: -6 }}>kez oynattık.</div>
        </div>
        <div style={{ position: "absolute", left: gx, top: gy, width: COLS * cell, height: ROWS * cell }}>
          {Array.from({ length: DOTS }, (_, i) => {
            if (picks[i] > shown) return null;
            const is4 = picks[i] < n4;
            const is22 = picks[i] < n22;
            const lit = is22 ? f22 : 0;
            const size = 15 + (is4 ? f4 * 3 : 0) + lit * (8 + 4 * pulse);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (i % COLS) * cell + (cell - size) / 2,
                  top: Math.floor(i / COLS) * cell + (cell - size) / 2,
                  width: size,
                  height: size,
                  borderRadius: size,
                  background: is22 && lit > 0 ? C.white : is4 && f4 > 0 ? C.ice : "rgba(241,239,234,0.35)",
                  opacity: is4 ? 1 : 1 - 0.75 * f4,
                  boxShadow: is4 && f4 > 0 ? `0 0 ${10 + 14 * lit * pulse}px rgba(201,220,234,0.8)` : undefined,
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: gy + ROWS * cell + 30, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <FadeIn at={94}>
            <span style={{ ...display(110), color: C.ice }}>4+ gol: %3</span>
          </FadeIn>
          <FadeIn at={178}>
            <span style={{ ...display(110), color: C.white }}>2–2: %0,8</span>
          </FadeIn>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 8 · outro ---------- */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - 176;
  const rot = spring({ frame: lf - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: lf - 12, fps, config: { damping: 200 } });
  return (
    <Whip>
      {frame < 80 ? (
        <Stage>
          <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
            <Drop size={170} stagger={5} delay={2} lines={[{ text: "Futbol bazen" }, { text: "istatistiği" }, { text: "dinlemez.", color: C.ice, weight: 300 }]} />
          </AbsoluteFill>
        </Stage>
      ) : frame < 176 ? (
        <AbsoluteFill>
          <Photo src="bjk-stad1.jpg" pos="50% 50%" zoom={[1.1, 1.25]} dim={0.45} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 300, display: "flex", flexDirection: "column", gap: 40 }}>
            <Meta left="Avrupa Ligi" right="3 maç" />
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <Drop size={300} delay={82} lines={[{ text: "7" }]} />
              <Drop size={110} delay={86} lines={[{ text: "puan.", color: C.ice, weight: 300 }]} />
            </div>
            {frame >= 144 ? (
              <FadeIn at={146}>
                <div style={{ ...mono(26), color: C.ice }}>Sırada</div>
                <div style={{ ...display(130), color: C.white, marginTop: 8 }}>Celtic – Beşiktaş</div>
                <div style={{ ...mono(24), color: C.dim, marginTop: 8 }}>5 Kasım · 23:00</div>
              </FadeIn>
            ) : null}
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
              Her maç, sayılarla.
            </div>
            <div style={{ ...mono(24), color: C.ice, opacity: interpolate(lf, [30, 42], [0, 1], clamp) }}>Takip et</div>
          </AbsoluteFill>
          <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 330, ...mono(17), letterSpacing: "0.06em", lineHeight: 1.6, color: C.dim, textAlign: "center" }}>
            Fotoğraflar: Wikimedia Commons · Beşiktaş JK (CC BY 2.0)
            <br />
            Veri: ESPN · FotMob · Gol çizimleri temsilidir
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
  const c = BJK_CAPTIONS.find((p) => t >= p.words[0].s - 0.12 && t < p.words[p.words.length - 1].e + 0.3);
  if (!c) return null;
  const from = c.words[0].s - 0.12;
  const to = c.words[c.words.length - 1].e + 0.3;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const BjkReel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    <Sequence from={BJ.hook.from} durationInFrames={BJ.hook.dur}><Hook /></Sequence>
    <Sequence from={BJ.xg.from} durationInFrames={BJ.xg.dur}><XgVsGoals /></Sequence>
    <Sequence from={BJ.ndidi.from} durationInFrames={BJ.ndidi.dur}><Ndidi /></Sequence>
    <Sequence from={BJ.palace.from} durationInFrames={BJ.palace.dur}><Palace /></Sequence>
    <Sequence from={BJ.olaitan.from} durationInFrames={BJ.olaitan.dur}><Olaitan /></Sequence>
    <Sequence from={BJ.red.from} durationInFrames={BJ.red.dur}><Red /></Sequence>
    <Sequence from={BJ.sim.from} durationInFrames={BJ.sim.dur}><Sim /></Sequence>
    <Sequence from={BJ.outro.from} durationInFrames={BJ.outro.dur}><Outro /></Sequence>
    <Captions />
    <Grain />
    <Audio src={staticFile("score-bjk.wav")} volume={0.45} />
    <Sequence from={Math.round(VO_OFFSET * FPS)}>
      <Audio src={staticFile("voice-bjk.mp3")} />
    </Sequence>
  </AbsoluteFill>
);
