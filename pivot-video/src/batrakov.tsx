import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Count, Crest, Drop, FadeIn, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Whip } from "./derby";
import { Dot, Move, NetFlash, Pitch, P, PY, PH } from "./lille2";
import { C, display, F, mono } from "./theme";
import { BAT_CAPTIONS } from "./batrakovCaptions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const LOKO = "#d8262f";
const LOKO_G = "#14a05a";
const GOLD = "#f2b632";

// Scene boundaries (frames), laid on the phrase slots in batrakovCaptions.ts.
export const BT = {
  hook: { from: 0, dur: 270 },
  name: { from: 270, dur: 69 },
  origin: { from: 339, dur: 177 },
  rise: { from: 516, dur: 504 },
  istanbul: { from: 1020, dur: 309 },
  profile: { from: 1329, dur: 189 },
  derby: { from: 1518, dur: 342 },
};
export const BT_TOTAL = 1860;

// Aleksey Batrakov (b. 9 Jun 2005). Sources: Wikipedia, haberler.com, Sofascore, Milliyet.
// AI-generated b-roll (Wan 3.0 via Higgsfield) is a stand-in player, not Batrakov himself.

/* ---------- AI b-roll, slowed down for a cinematic feel ---------- */
const Broll: React.FC<{ src: string; rate: number; dim?: number }> = ({ src, rate, dim = 0.6 }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(src)} playbackRate={rate} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: `contrast(1.1) brightness(${dim}) saturate(0.85)` }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,9,11,0.8) 0%, rgba(8,9,11,0.05) 32%, rgba(8,9,11,0.15) 62%, rgba(8,9,11,0.92) 100%)" }} />
  </AbsoluteFill>
);

/* ---------- 1 · hook: first Russian, 21, €25m ---------- */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Broll src="wan/batrakov-tunnel.mp4" rate={0.55} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
        <Meta left="Galatasaray · 121 yıl" right="Bir ilk" />
        <Drop size={150} delay={14} lines={[{ text: "İlk Rus" }, { text: "futbolcu.", color: C.ice, weight: 300 }]} />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1000, display: "flex", flexDirection: "column", gap: 10 }}>
        <FadeIn at={132}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <span style={{ ...display(150), color: C.white }}>21</span>
            <span style={{ ...mono(26), color: C.dim }}>yaşında</span>
          </div>
        </FadeIn>
        {frame >= 190 ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <Count to={25} start={192} dur={24} prefix="€" style={{ ...display(190), color: GOLD }} />
            <span style={{ ...display(90, 300), color: GOLD }}>milyon</span>
          </div>
        ) : null}
      </div>
      <Flash at={198} />
    </AbsoluteFill>
  );
};

/* ---------- 2 · the name ---------- */
const Name: React.FC = () => (
  <Whip>
    <Stage light={1.1}>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
        <Meta left="Ofansif orta saha" right="9 Haziran 2005" />
        <div style={{ height: 30 }} />
        <Drop size={150} delay={2} stagger={4} lines={[{ text: "Aleksey" }, { text: "Batrakov", color: C.ice }]} />
        <div style={{ height: 20 }} />
        <Drop size={120} delay={30} lines={[{ text: "kim?", weight: 300 }]} />
      </AbsoluteFill>
    </Stage>
  </Whip>
);

/* ---------- 3 · academy to debut ---------- */
const Origin: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [10, 110], [0, 1], clamp);
  const x0 = PAD + 30;
  const x1 = 1080 - PAD - 30;
  const nodes = [
    { at: 8, k: 0, year: "2011", age: "6 yaş", what: "Lokomotiv Moskova akademisi" },
    { at: 96, k: 1, year: "31 Mart 2024", age: "18 yaş", what: "İlk lig maçı · Krasnodar" },
  ];
  return (
    <Whip dir={-1}>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
          <Meta left="Lokomotiv Moskova" right="Akademi ürünü" />
          <Drop size={140} delay={2} lines={[{ text: "Tek kulüp," }, { text: "on beş yıl.", color: LOKO_G, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: x0, width: x1 - x0, top: 840, height: 4, background: C.faint }} />
        <div style={{ position: "absolute", left: x0, width: (x1 - x0) * line, top: 840, height: 4, background: `linear-gradient(90deg, ${LOKO_G}, ${LOKO})` }} />
        {nodes.map((n) => (
          <div key={n.year} style={{ position: "absolute", left: n.k === 0 ? x0 - 14 : x1 - 330, top: 826, width: 360 }}>
            <FadeIn at={n.at}>
              <div style={{ width: 32, height: 32, borderRadius: 32, background: n.k === 0 ? LOKO_G : LOKO, marginLeft: n.k === 0 ? 0 : 310, boxShadow: `0 0 30px ${n.k === 0 ? LOKO_G : LOKO}` }} />
              <div style={{ textAlign: n.k === 0 ? "left" : "right", marginTop: 26 }}>
                <div style={{ ...display(88), color: C.white }}>{n.year}</div>
                <div style={{ ...mono(24), color: n.k === 0 ? LOKO_G : LOKO, marginTop: 8 }}>{n.age}</div>
                <div style={{ fontFamily: F.ui, fontSize: 30, fontWeight: 500, color: C.dim, marginTop: 10 }}>{n.what}</div>
              </div>
            </FadeIn>
          </div>
        ))}
      </Stage>
    </Whip>
  );
};

/* ---------- 4 · the explosion: 14 goals, 17+13, two Young Player awards ---------- */
const SeasonBar: React.FC<{ at: number; season: string; goals: number; assists?: number; note: string; max: number }> = ({ at, season, goals, assists = 0, note, max }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 24], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const w = 860;
  return (
    <FadeIn at={at}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ ...display(64), color: C.white }}>{season}</span>
        <span style={{ ...mono(22), color: C.dim }}>{note}</span>
      </div>
      <div style={{ display: "flex", height: 70, gap: 6 }}>
        <div style={{ width: (w * goals * k) / max, background: C.ice, display: "flex", alignItems: "center", paddingLeft: 18, boxSizing: "border-box" }}>
          <span style={{ ...display(52), color: C.bg0, opacity: k }}>{goals} gol</span>
        </div>
        {assists ? (
          <div style={{ width: (w * assists * k) / max, background: C.steel, display: "flex", alignItems: "center", paddingLeft: 18, boxSizing: "border-box" }}>
            <span style={{ ...display(52), color: C.white, opacity: k }}>{assists} asist</span>
          </div>
        ) : null}
      </div>
    </FadeIn>
  );
};

const Rise: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Whip>
      <Stage light={frame < 60 ? 1.3 : 0.9}>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
          <Meta left="Rusya Premier Ligi" right="2024 – 2026" />
          <Drop size={150} delay={6} lines={[{ text: "Sonra" }, { text: "patlama geldi.", color: C.ice, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 720, display: "flex", flexDirection: "column", gap: 60 }}>
          <SeasonBar at={64} season="2024–25" goals={14} note="Lig · gol krallığında 3." max={30} />
          <SeasonBar at={250} season="2025–26" goals={17} assists={13} note="Tüm kortlar" max={30} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1110, display: "flex", flexWrap: "wrap", gap: 14 }}>
          <FadeIn at={160}><Chip color={C.ice}>Gol krallığında 3.</Chip></FadeIn>
          <FadeIn at={356}><Chip color={LOKO}>Spartak'a hat-trick</Chip></FadeIn>
          <FadeIn at={416}><Chip color={GOLD}>2× ligin en iyi genç oyuncusu</Chip></FadeIn>
        </div>
        <Flash at={6} />
      </Stage>
    </Whip>
  );
};

/* ---------- 5 · Istanbul, Champions League goals ---------- */
const Istanbul: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = frame < 150 ? 0 : 1;
  const arc = interpolate(frame, [14, 70], [0, 1], clamp);
  // abstract map: Moscow top-right, Istanbul lower-left, ~1,750 km apart
  const mo = { x: 760, y: 700 };
  const ist = { x: 330, y: 1150 };
  const ctrl = { x: 760, y: 1050 };
  const pt = (t: number) => ({
    x: (1 - t) * (1 - t) * mo.x + 2 * (1 - t) * t * ctrl.x + t * t * ist.x,
    y: (1 - t) * (1 - t) * mo.y + 2 * (1 - t) * t * ctrl.y + t * t * ist.y,
  });
  const pts = Array.from({ length: 41 }, (_, i) => pt((i / 40) * arc));
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const card = (d0: number) => spring({ frame: frame - d0, fps, config: { damping: 14 } });
  return (
    <Whip dir={-1}>
      <Stage>
        {phase === 0 ? (
          <>
            <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
              <Meta left="20 Ağustos 2026" right="€25 milyon" />
              <Drop size={150} delay={4} lines={[{ text: "Ağustosta" }, { text: "İstanbul.", color: C.ice, weight: 300 }]} />
            </div>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <path d={d} fill="none" stroke={C.ice} strokeWidth={5} strokeDasharray="14 12" />
              <circle cx={mo.x} cy={mo.y} r={16} fill={LOKO} />
              <circle cx={ist.x} cy={ist.y} r={16 + 4 * Math.sin(frame * 0.3)} fill={C.ice} opacity={arc} />
              <text x={mo.x + 30} y={mo.y + 10} style={{ ...display(54) }} fill={C.white}>Moskova</text>
              <text x={ist.x - 20} y={ist.y + 70} style={{ ...display(54) }} fill={C.white} opacity={arc}>İstanbul</text>
              <text x={600} y={980} style={{ ...mono(22) }} fill={C.dim} opacity={arc}>1.750 KM</text>
            </svg>
          </>
        ) : (
          <>
            <div style={{ position: "absolute", left: PAD, right: PAD, top: 200, display: "flex", flexDirection: "column", gap: 14 }}>
              <Meta left="Şampiyonlar Ligi" right="3 maç · 2 gol" />
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { at: 152, vs: "Barcelona", min: "28'", how: "Leão'nun pası" },
                  { at: 162, vs: "Lille", min: "44'", how: "Sallai'nin ortası · kafa" },
                ].map((c) => (
                  <div
                    key={c.vs}
                    style={{
                      flex: 1,
                      border: `2px solid ${C.ice}`,
                      borderRadius: 14,
                      padding: "18px 20px",
                      background: "rgba(8,9,11,0.6)",
                      transform: `translateY(${(1 - card(c.at)) * 60}px)`,
                      opacity: card(c.at),
                    }}
                  >
                    <div style={{ ...display(84), color: C.ice }}>{c.min}</div>
                    <div style={{ ...display(54), color: C.white }}>{c.vs}</div>
                    <div style={{ ...mono(18), color: C.dim, marginTop: 6 }}>{c.how}</div>
                  </div>
                ))}
              </div>
            </div>
            <Pitch zoom={1.25} anchor="top" from={220}>
              <Dot at={[0.4, 0.1]} ring color="#d23b4a" from={210} />
              <Dot at={[0.6, 0.1]} ring color="#d23b4a" from={212} />
              <Dot at={[0.5, 0.03]} ring color="#d23b4a" from={214} />
              <Dot at={[0.9, 0.24]} label="Sallai" color={C.white} from={216} />
              <Dot at={[0.47, 0.09]} label="Batrakov" color={C.ice} from={218} glow labelBelow={false} />
              <Move pts={[[0.9, 0.24], [0.75, 0.08], [0.55, 0.06], [0.47, 0.09]]} from={232} dur={24} ball color={C.white} width={5} />
              <Move pts={[[0.47, 0.09], [0.49, 0.04], [0.5, -0.01]]} from={262} dur={10} ball width={6} />
              <NetFlash at={272} top />
            </Pitch>
            <Flash at={272} />
          </>
        )}
      </Stage>
    </Whip>
  );
};

/* ---------- 6 · player profile ---------- */
const Profile: React.FC = () => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [8, 30], [0, 1], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.25);
  const am = P([0.5, 0.33]);
  const rw = P([0.86, 0.3]);
  return (
    <Whip>
      <Stage light={0.8}>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 200, display: "flex", flexDirection: "column", gap: 14 }}>
          <Meta left="Oyuncu profili" right="1,73 m" />
          <Drop size={110} delay={2} lines={[{ text: "Ofansif orta saha," }, { text: "gerekirse sağ kanat.", color: C.ice, weight: 300 }]} />
        </div>
        <Pitch>
          <ellipse cx={am.x} cy={am.y} rx={170 * z} ry={120 * z} fill={`rgba(201,220,234,${0.18 + 0.1 * pulse})`} stroke={C.ice} strokeWidth={3} />
          <ellipse cx={rw.x} cy={rw.y} rx={90 * z} ry={150 * z} fill={`rgba(201,220,234,${0.08 + 0.06 * pulse})`} stroke={C.ice} strokeDasharray="10 8" strokeWidth={3} />
          <text x={am.x} y={am.y + 12} textAnchor="middle" style={{ ...display(44) }} fill={C.white} opacity={z}>10 NUMARA</text>
          <text x={rw.x} y={rw.y + 12} textAnchor="middle" style={{ ...display(34) }} fill={C.white} opacity={z}>SAĞ KANAT</text>
        </Pitch>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: PY + PH - 320, display: "flex", alignItems: "center", gap: 24, padding: "20px 24px", background: "rgba(8,9,11,0.75)", borderRadius: 14, border: `1px solid ${C.faint}`, opacity: interpolate(frame, [82, 94], [0, 1], clamp) }}>
          <div style={{ display: "flex", flexDirection: "column", width: 70, height: 48, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ flex: 1, background: "#ffffff" }} />
            <div style={{ flex: 1, background: "#1c3f94" }} />
            <div style={{ flex: 1, background: "#d52b1e" }} />
          </div>
          <div>
            <div style={{ ...mono(22), color: C.dim }}>Rusya Milli Takımı</div>
            <div style={{ ...display(80), color: C.white }}>15 maç · 4 gol</div>
          </div>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 7 · derby, the €25m question, logo ---------- */
const Derby: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - 266;
  const rot = spring({ frame: lf - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: lf - 12, fps, config: { damping: 200 } });
  return (
    <Whip dir={-1}>
      {lf < 0 ? (
        <AbsoluteFill>
          <Broll src="wan/rams-flares.mp4" rate={0.6} dim={0.55} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
            <Meta left="Pazartesi · 21:30" right="RAMS Park" />
            {frame < 82 ? (
              <Drop size={200} delay={8} lines={[{ text: "Sırada" }, { text: "derbi.", color: C.ice, weight: 300 }]} />
            ) : (
              <>
                <Drop size={120} delay={84} lines={[{ text: "€25 milyonluk" }, { text: "soru:", color: GOLD, weight: 300 }]} />
                <Drop size={150} delay={110} lines={[{ text: "Yeni yıldız mı?", color: C.ice }]} />
              </>
            )}
          </div>
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 1110, display: "flex", alignItems: "center", gap: 20 }}>
            <FadeIn at={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Crest team="gs" size={100} />
                <span style={{ ...display(70), color: C.white }}>Galatasaray – Fenerbahçe</span>
              </div>
            </FadeIn>
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
              Cevabını yorumlara yaz.
            </div>
          </AbsoluteFill>
          <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 330, ...mono(17), letterSpacing: "0.06em", lineHeight: 1.6, color: C.dim, textAlign: "center" }}>
            Video planları yapay zekâ ile üretilmiştir (Wan 3.0) · Temsilidir
            <br />
            Veri: Wikipedia · Sofascore · Milliyet
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
  const c = BAT_CAPTIONS.find((p) => t >= p.words[0].s - 0.12 && t < p.words[p.words.length - 1].e + 0.3);
  if (!c) return null;
  const from = c.words[0].s - 0.12;
  const to = c.words[c.words.length - 1].e + 0.3;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const BatrakovReel: React.FC<{ voice?: string }> = ({ voice }) => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    <Sequence from={BT.hook.from} durationInFrames={BT.hook.dur}><Hook /></Sequence>
    <Sequence from={BT.name.from} durationInFrames={BT.name.dur}><Name /></Sequence>
    <Sequence from={BT.origin.from} durationInFrames={BT.origin.dur}><Origin /></Sequence>
    <Sequence from={BT.rise.from} durationInFrames={BT.rise.dur}><Rise /></Sequence>
    <Sequence from={BT.istanbul.from} durationInFrames={BT.istanbul.dur}><Istanbul /></Sequence>
    <Sequence from={BT.profile.from} durationInFrames={BT.profile.dur}><Profile /></Sequence>
    <Sequence from={BT.derby.from} durationInFrames={BT.derby.dur}><Derby /></Sequence>
    <Captions />
    <Grain />
    <Audio src={staticFile("score-batrakov.wav")} volume={voice ? 0.45 : 0.9} />
    {voice ? <Audio src={staticFile(voice)} /> : null}
  </AbsoluteFill>
);

