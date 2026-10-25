import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, Count, Crest, Drop, FadeIn, Grain, Meta, PivotMark, Stage } from "./parts";
import { Chip, Flash, Photo, Whip } from "./derby";
import { Dot, Move, Pitch } from "./lille2";
import { C, display, F, mono } from "./theme";
import { D2_CAPTIONS } from "./derby2Captions";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;
const FPS = 30;
const GS_RED = "#c8102e";
const GOLD = "#f2b632";
const FB_NAVY = "#13244f";
const FB_YEL = "#e2bb45";

// Galatasaray – Fenerbahçe, Süper Lig week 9, 26 Oct 2026, RAMS Park. Deep-dive preview.
// Data: Haberler/İHA (scorers), NTV (table), Milliyet (Buruk record), Hürriyet (Apr 2026 derby),
// Yeni Ankara (138 derbies / first goal), scripts/sim_derby.py (50,000 sims).
export const D2 = {
  hook: { from: 0, dur: 234 },
  table: { from: 234, dur: 252 },
  scorers: { from: 486, dur: 258 },
  defense: { from: 744, dur: 209 },
  kerem: { from: 953, dur: 171 },
  coaches: { from: 1124, dur: 229 },
  last: { from: 1353, dur: 116 },
  sim: { from: 1469, dur: 181 },
  btts: { from: 1650, dur: 153 },
  outro: { from: 1803, dur: 147 },
};
export const D2_TOTAL = 1950;

const FbBadge: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size, background: FB_NAVY, border: `${Math.max(3, size / 22)}px solid ${FB_YEL}`, display: "grid", placeItems: "center", ...display(size * 0.36), color: FB_YEL, flex: "none" }}>
    FB
  </div>
);

const Card: React.FC<{ src: string; w: number; h: number; pos?: string; at: number; style?: React.CSSProperties; border?: string; children?: React.ReactNode }> = ({
  src,
  w,
  h,
  pos = "50% 30%",
  at,
  style,
  border = C.white,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 14, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        width: w,
        height: h,
        borderRadius: 16,
        overflow: "hidden",
        border: `3px solid ${border}`,
        boxShadow: "0 40px 110px rgba(0,0,0,0.8)",
        opacity: s > 0.01 ? 1 : 0,
        transform: `translateY(${(1 - s) * 300}px) rotate(${(1 - s) * 6}deg)`,
        ...style,
      }}
    >
      <Img src={staticFile(`photos/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter: "contrast(1.06) saturate(0.95)" }} />
      {children}
    </div>
  );
};

const Cut: React.FC<{ src: string; h: number; at: number; style?: React.CSSProperties; from?: "left" | "right" | "bottom" }> = ({ src, h, at, style, from = "bottom" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 200, mass: 1 } });
  const off = (1 - s) * 360;
  const tr = from === "left" ? `translateX(${-off}px)` : from === "right" ? `translateX(${off}px)` : `translateY(${off}px)`;
  return (
    <Img
      src={staticFile(`photos/${src}`)}
      style={{ position: "absolute", height: h, opacity: s, transform: tr, filter: "drop-shadow(0 0 2px rgba(201,220,234,0.85)) drop-shadow(0 30px 60px rgba(0,0,0,0.8))", ...style }}
    />
  );
};

/* ---------- 1 · hook: 138 derbies, the first goal ---------- */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const ten = frame >= 100;
  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("wan/derby-ball.mp4")} playbackRate={0.68} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6) contrast(1.1)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,9,11,0.85) 0%, rgba(8,9,11,0.1) 35%, rgba(8,9,11,0.2) 60%, rgba(8,9,11,0.9) 100%)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 10 }}>
        <Meta left="Süper Lig tarihi" right="GS – FB" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <Count to={138} start={8} dur={30} style={{ ...display(300), color: C.white }} />
          <span style={{ ...display(90, 300), color: C.ice }}>derbi.</span>
        </div>
      </div>
      {frame >= 56 ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 640 }}>
          <Drop size={88} delay={58} lines={[{ text: "İlk golü atan takım" }, { text: "sadece", weight: 300 }]} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 6, opacity: ten ? 1 : 0 }}>
            <span style={{ ...display(260), color: GOLD, textShadow: "0 0 60px rgba(242,182,50,0.45)" }}>10</span>
            <span style={{ ...display(88), color: C.white }}>kez kaybetti.</span>
          </div>
        </div>
      ) : null}
      {frame >= 146 ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1110 }}>
          <Drop size={96} delay={149} lines={[{ text: "O golü" }, { text: "kim atacak?", color: C.ice }]} />
        </div>
      ) : null}
      <Flash at={104} />
    </AbsoluteFill>
  );
};

/* ---------- 2 · table: leader vs league's best attack ---------- */
const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const fbLead = frame >= 117;
  return (
    <Whip>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
          <Meta left="Süper Lig · 8 hafta" right="Puan durumu" />
          <Drop size={130} delay={2} lines={[{ text: "Lider ve" }, { text: "ligin en golcüsü.", color: C.ice, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 700, display: "flex", flexDirection: "column", gap: 40 }}>
          {[
            { at: 5, team: "gs", name: "Galatasaray", rank: "1.", pts: 19, gf: 17, ga: 11 },
            { at: 66, team: "fb", name: "Fenerbahçe", rank: "3.", pts: 16, gf: 22, ga: 6 },
          ].map((r) => (
            <FadeIn key={r.team} at={r.at}>
              <div style={{ display: "flex", alignItems: "center", gap: 22, paddingBottom: 26, borderBottom: `1px solid ${C.faint}` }}>
                <span style={{ ...display(60), color: C.dim, width: 60 }}>{r.rank}</span>
                {r.team === "gs" ? <Crest team="gs" size={86} /> : <FbBadge size={86} />}
                <div style={{ flex: 1 }}>
                  <div style={{ ...display(76), color: C.white }}>{r.name}</div>
                  <div style={{ ...mono(22), color: C.dim, marginTop: 6 }}>
                    Attığı{" "}
                    <span style={{ color: r.team === "fb" && fbLead ? GOLD : C.white }}>{r.gf}</span> · Yediği{" "}
                    <span style={{ color: r.team === "fb" && frame >= 208 ? C.ice : C.white }}>{r.ga}</span>
                  </div>
                </div>
                <Count to={r.pts} start={r.at} dur={18} style={{ ...display(140), color: C.white }} />
              </div>
            </FadeIn>
          ))}
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1120, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {fbLead ? <FadeIn at={117}><Chip color={GOLD}>Ligin en golcüsü: FB 22</Chip></FadeIn> : null}
          {frame >= 208 ? <FadeIn at={208}><Chip color={C.ice}>En az gol yiyen: FB 6</Chip></FadeIn> : null}
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 3 · scorers: Osimhen 6 vs Muriqi 7 ---------- */
const Scorers: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Whip dir={-1}>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 220, display: "flex", flexDirection: "column", gap: 18 }}>
          <Meta left="Golcüler" right="Lig · 8 hafta" />
          <Drop size={110} delay={2} lines={[{ text: "Gol 10 oyuncuya" }, { text: "dağılmış.", color: C.ice, weight: 300 }]} />
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <FadeIn key={i} at={14 + i * 3}>
                <div style={{ width: 40, height: 40, borderRadius: 40, background: i === 0 ? C.ice : "rgba(241,239,234,0.55)" }} />
              </FadeIn>
            ))}
          </div>
        </div>
        <Card src="osi-potm.jpg" w={430} h={570} at={76} pos="50% 25%" border={C.ice} style={{ left: PAD - 10, top: 640 }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "50px 18px 14px", background: "linear-gradient(transparent, rgba(8,9,11,0.95))" }}>
            <div style={{ ...display(54), color: C.white }}>Osimhen</div>
            <div style={{ ...display(96), color: C.ice, marginTop: -6 }}>6 gol</div>
          </div>
        </Card>
        <Cut src="muriqi2.png" h={640} at={144} from="right" style={{ right: 30, top: 600 }} />
        <div style={{ position: "absolute", right: PAD - 20, top: 1150, textAlign: "right", opacity: interpolate(frame, [150, 162], [0, 1], clamp) }}>
          <div style={{ ...display(54), color: C.white }}>Muriqi</div>
          <div style={{ ...display(96), color: FB_YEL, marginTop: -6 }}>7 gol</div>
        </div>
        {frame >= 210 ? (
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 1250 - 10, display: "flex", justifyContent: "flex-end" }}>
            <FadeIn at={213}><Chip color={FB_YEL}>Greenwood · 4 gol</Chip></FadeIn>
          </div>
        ) : null}
      </Stage>
    </Whip>
  );
};

/* ---------- 4 · the lock: FB back line, Ake out, Osimhen's target ---------- */
const Defense: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ake = spring({ frame: frame - 71, fps, config: { damping: 12 } });
  const osi = frame >= 150;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.35);
  return (
    <Whip>
      <Stage light={0.85}>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 200, display: "flex", flexDirection: "column", gap: 14 }}>
          <Meta left="Maçın kilidi" right="FB savunması" />
          <Drop size={100} delay={2} lines={[{ text: osi ? "Hedef:" : "Ake yok." }, { text: osi ? "tam o boşluk." : "Yeni bir ikili.", color: C.ice, weight: 300 }]} key={osi ? "b" : "a"} />
        </div>
        <Pitch zoom={1.2} anchor="top" from={10}>
          <Dot at={[0.14, 0.24]} ring color={FB_YEL} from={10} />
          <Dot at={[0.86, 0.24]} ring color={FB_YEL} from={12} />
          <Dot at={[0.6, 0.17]} label="Skriniar" color={FB_YEL} ring from={14} />
          <Dot at={[0.4, 0.17]} ring color={FB_YEL} from={16} />
          <Dot at={[0.5, 0.03]} ring color={FB_YEL} from={18} />
          <g opacity={ake}>
            <text x={90 + 0.4 * 900} y={520 + 0.17 * 830 - 34} textAnchor="middle" style={{ ...display(30) }} fill={C.white}>YENİ PARTNER?</text>
          </g>
          {osi ? (
            <>
              <ellipse cx={90 + 0.5 * 900} cy={520 + 0.17 * 830} rx={60 + 8 * pulse} ry={34 + 5 * pulse} fill={`rgba(201,220,234,${0.12 + 0.1 * pulse})`} />
              <Dot at={[0.5, 0.44]} label="Osimhen" color={C.ice} from={152} glow />
              <Move pts={[[0.5, 0.42], [0.56, 0.3], [0.5, 0.18], [0.5, 0.05]]} from={160} dur={30} dashed color={C.ice} width={5} />
            </>
          ) : null}
        </Pitch>
        <Card src="skriniar.jpg" w={360} h={300} at={74} pos="45% 30%" border={FB_YEL} style={{ right: PAD - 20, top: 1080 }}>
          <div style={{ position: "absolute", left: 14, bottom: 10, ...display(44), color: C.white, textShadow: "0 2px 14px rgba(0,0,0,0.9)" }}>Skriniar</div>
        </Card>
        <div style={{ position: "absolute", left: PAD, top: 1110, opacity: ake }}>
          <Chip color={GS_RED}>Ake sakat</Chip>
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 5 · Kerem vs his old club, the space behind Sallai ---------- */
const Kerem: React.FC = () => {
  const frame = useCurrentFrame();
  const pitch = interpolate(frame, [60, 74], [0, 1], clamp);
  return (
    <Whip dir={-1}>
      <AbsoluteFill>
        <Photo src="kerem2.jpg" pos="62% 30%" zoom={[1.15, 1.3]} dim={0.62} />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 18 }}>
          <Meta left="Fenerbahçe'nin silahı" right="Eski takımına karşı" />
          <Drop size={220} delay={4} lines={[{ text: "Kerem." }]} />
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: pitch }}>
          <Pitch zoom={1.3} anchor="bottom" from={62}>
            <Dot at={[0.88, 0.7]} label="Sallai" color={C.white} from={64} />
            <Dot at={[0.84, 0.5]} label="Kerem" color={FB_YEL} from={66} glow labelBelow={false} />
            <Move pts={[[0.84, 0.5], [0.92, 0.68], [0.88, 0.86]]} from={80} dur={34} dashed color={FB_YEL} width={5} />
            <rect x={90 + 0.76 * 900} y={520 + 0.72 * 830} width={0.24 * 900} height={0.2 * 830} fill={FB_YEL} opacity={0.12 + 0.06 * Math.sin(frame * 0.3)} />
          </Pitch>
        </div>
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 6 · the benches: Buruk's record, Kartal's seat ---------- */
const Coaches: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ex = spring({ frame: frame - 162, fps, config: { damping: 200, mass: 0.9 } });
  const topH = 960 * (1 - ex);
  return (
    <Whip>
      <AbsoluteFill style={{ background: "#08090b" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: topH, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960 }}>
            <Photo src="buruk.jpg" pos="45% 22%" zoom={[1.05, 1.15]} dim={0.6} />
            <div style={{ position: "absolute", left: PAD, right: PAD, top: 220 }}>
              <Meta left="Okan Buruk" right="FB'ye karşı" />
            </div>
            <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 70, display: "flex", alignItems: "flex-end", gap: 30 }}>
              <FadeIn at={50}>
                <div style={{ ...display(220), color: C.white }}>6</div>
              </FadeIn>
              <FadeIn at={58}>
                <div style={{ ...mono(26), color: C.ice, paddingBottom: 34 }}>galibiyet · 11 maçta</div>
              </FadeIn>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: topH, height: 1920 - topH, overflow: "hidden" }}>
          <Photo src="kartal2.jpg" pos="30% 30%" zoom={[1.1, 1.22]} dim={0.6} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: interpolate(ex, [0, 1], [70, 240]) }}>
            <Meta left="İsmail Kartal" right="Fenerbahçe" />
          </div>
          {frame >= 160 ? (
            <div style={{ position: "absolute", left: PAD, right: PAD, top: 900 }}>
              <Drop size={160} delay={166} lines={[{ text: "Koltuk" }, { text: "maçı.", color: GS_RED, weight: 300 }]} />
            </div>
          ) : null}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: topH - 1, height: 2, background: C.ice, opacity: 1 - ex }} />
      </AbsoluteFill>
    </Whip>
  );
};

/* ---------- 7 · the last league derby: 3–0 ---------- */
const Last: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 66, fps, config: { damping: 13, mass: 0.7 } });
  return (
    <Whip dir={-1}>
      <Stage light={1.1}>
        <Cut src="barisalper2.png" h={820} at={8} from="right" style={{ right: -110, bottom: 230 }} />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 20 }}>
          <Meta left="Son lig derbisi" right="26 Nisan 2026" />
          <Drop size={120} delay={4} lines={[{ text: "RAMS Park," }, { text: "nisan.", color: C.ice, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: PAD, top: 560, display: "flex", alignItems: "center", gap: 26, transform: `scale(${0.7 + 0.3 * s})`, transformOrigin: "left center", opacity: s }}>
          <Crest team="gs" size={110} />
          <span style={{ ...display(300), color: C.white }}>3–0</span>
          <FbBadge size={110} />
        </div>
        <div style={{ position: "absolute", left: PAD, top: 920, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["40'", "Osimhen"],
            ["67'", "Barış Alper (pen.)"],
            ["83'", "Torreira"],
          ].map(([m, n], i) => (
            <FadeIn key={m} at={74 + i * 6}>
              <div style={{ display: "flex", gap: 18, ...mono(26), color: C.white }}>
                <span style={{ color: C.ice, width: 60 }}>{m}</span>
                {n}
              </div>
            </FadeIn>
          ))}
        </div>
        <Flash at={66} />
      </Stage>
    </Whip>
  );
};

/* ---------- 8 · 50,000 sims ---------- */
const SIM = { fb: 0.45, draw: 0.23, gs: 0.32 };
const COLS = 40;
const ROWS = 25;
const DOTS = COLS * ROWS;
const nFb = Math.round(SIM.fb * DOTS);
const nDraw = Math.round(SIM.draw * DOTS);
const shuffled = (() => {
  const a = Array.from({ length: DOTS }, (_, i) => i);
  let seed = 2610;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();
const cat = (k: number) => (k < nFb ? "fb" : k < nFb + nDraw ? "draw" : "gs");

const Sim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cell = 22;
  const sort = spring({ frame: frame - 50, fps, config: { damping: 200, mass: 1.3 } });
  const shown = interpolate(frame, [6, 44], [0, DOTS], clamp);
  const gx = (1080 - COLS * cell) / 2;
  const gy = 640;
  const colour = (c: string) => (c === "fb" ? FB_YEL : c === "gs" ? GS_RED : "rgba(241,239,234,0.3)");
  return (
    <Whip>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 12 }}>
          <Meta left="Poisson simülasyonu" right="Sezon gol verisi" />
          <Count to={50000} start={2} dur={28} style={{ ...display(220), color: C.white }} />
          <div style={{ ...display(70, 300), color: C.ice, marginTop: -6 }}>simülasyon.</div>
        </div>
        <div style={{ position: "absolute", left: gx, top: gy, width: COLS * cell, height: ROWS * cell }}>
          {Array.from({ length: DOTS }, (_, k) => {
            const sc = shuffled[k];
            if (sc > shown) return null;
            const tc = Math.floor(k / ROWS);
            const tr = k % ROWS;
            const sx = (sc % COLS) * cell;
            const sy = Math.floor(sc / COLS) * cell;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: sx + (tc * cell - sx) * sort + 3.5,
                  top: sy + (tr * cell - sy) * sort + 3.5,
                  width: 15,
                  height: 15,
                  borderRadius: 15,
                  background: frame > 44 ? colour(cat(k)) : C.dim,
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: gx, width: COLS * cell, top: gy + ROWS * cell + 30, display: "flex" }}>
          {[
            { at: 61, w: SIM.fb, label: "Fenerbahçe", v: 45, c: FB_YEL },
            { at: 149, w: SIM.draw, label: "Beraberlik", v: 23, c: C.white },
            { at: 109, w: SIM.gs, label: "Galatasaray", v: 32, c: GS_RED },
          ].map((b) => (
            <div key={b.label} style={{ width: `${b.w * 100}%`, paddingRight: 10, boxSizing: "border-box" }}>
              <FadeIn at={b.at}>
                <Count to={b.v} start={b.at} dur={14} prefix="%" style={{ ...display(110), color: b.c }} />
                <div style={{ ...mono(19), letterSpacing: "0.08em", color: C.white, marginTop: 4 }}>{b.label}</div>
              </FadeIn>
            </div>
          ))}
        </div>
      </Stage>
    </Whip>
  );
};

/* ---------- 9 · surest pick: both teams score ---------- */
const Btts: React.FC = () => {
  const frame = useCurrentFrame();
  const big = frame >= 112;
  return (
    <Whip dir={-1}>
      <Stage>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 24 }}>
          <Meta left="En emin tahmin" right="Karşılıklı gol" />
          <Drop size={120} delay={2} lines={[{ text: "İki takım da" }, { text: "gol atıyor.", color: C.ice, weight: 300 }]} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 700, display: "flex", flexDirection: "column", gap: 34 }}>
          {[
            { team: "gs", at: 8 },
            { team: "fb", at: 16 },
          ].map((r) => (
            <FadeIn key={r.team} at={r.at}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {r.team === "gs" ? <Crest team="gs" size={70} /> : <FbBadge size={70} />}
                <div style={{ display: "flex", gap: 10 }}>
                  {Array.from({ length: 8 }, (_, i) => {
                    const on = i !== (r.team === "gs" ? 3 : 5);
                    const lit = interpolate(frame, [r.at + 6 + i * 3, r.at + 12 + i * 3], [0, 1], clamp);
                    return <div key={i} style={{ width: 70, height: 70, borderRadius: 10, background: on ? `rgba(201,220,234,${0.15 + 0.8 * lit})` : "rgba(241,239,234,0.08)", border: `2px solid ${on ? C.ice : C.faint}` }} />;
                  })}
                </div>
                <span style={{ ...display(70), color: C.white, marginLeft: 8 }}>7/8</span>
              </div>
            </FadeIn>
          ))}
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 1010, display: "flex", alignItems: "baseline", gap: 24, opacity: big ? 1 : 0 }}>
          <span style={{ ...display(260), color: C.ice, textShadow: "0 0 70px rgba(201,220,234,0.45)" }}>%66</span>
          <span style={{ ...mono(26), color: C.white }}>karşılıklı gol</span>
        </div>
        <Flash at={112} />
      </Stage>
    </Whip>
  );
};

/* ---------- 10 · outro: who scores first? ---------- */
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lf = frame - 80;
  const rot = spring({ frame: lf - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: lf - 12, fps, config: { damping: 200 } });
  return (
    <Whip>
      {lf < 0 ? (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile("wan/rams-flares.mp4")} playbackRate={0.6} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)" }} />
          <Img src={staticFile("photos/osi-close.jpg")} style={{ position: "absolute", left: 0, right: 0, top: 560, width: 1080, height: 820, objectFit: "cover", objectPosition: "50% 30%", maskImage: "linear-gradient(180deg, transparent 0%, black 25%, black 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 25%, black 70%, transparent 100%)", filter: "contrast(1.05) brightness(0.9)" }} />
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 20 }}>
            <Meta left="Pazartesi · 21:30" right="RAMS Park" />
            <Drop size={140} delay={3} lines={[{ text: "İlk golü" }, { text: "kim atar?", color: GOLD }]} />
          </div>
        </AbsoluteFill>
      ) : (
        <Stage light={0.7}>
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
            <div style={{ transform: `scale(${0.6 + 0.4 * word})` }}>
              <PivotMark size={240} angle={interpolate(rot, [0, 1], [0, -36])} />
            </div>
            <div style={{ ...display(210), color: C.white, opacity: word }}>Pivot</div>
            <div style={{ fontFamily: F.ui, fontSize: 44, fontWeight: 600, color: C.white, opacity: interpolate(lf, [16, 28], [0, 1], clamp) }}>
              Tahminini yorumlara yaz.
            </div>
          </AbsoluteFill>
          <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 330, ...mono(17), letterSpacing: "0.06em", lineHeight: 1.6, color: C.dim, textAlign: "center" }}>
            Model: sezon gol ortalamalarına dayalı Poisson simülasyonu · kesin sonuç değildir
            <br />
            Stadyum planları yapay zekâ ile üretilmiştir (Wan 3.0)
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
  const c = D2_CAPTIONS.find((p) => t >= p.words[0].s - 0.12 && t < p.words[p.words.length - 1].e + 0.3);
  if (!c) return null;
  const from = c.words[0].s - 0.12;
  const to = c.words[c.words.length - 1].e + 0.3;
  return <Caption words={c.words} t={t} local={frame - from * FPS} len={(to - from) * FPS} />;
};

export const Derby2Reel: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "#08090b" }}>
    <Sequence from={D2.hook.from} durationInFrames={D2.hook.dur}><Hook /></Sequence>
    <Sequence from={D2.table.from} durationInFrames={D2.table.dur}><Table /></Sequence>
    <Sequence from={D2.scorers.from} durationInFrames={D2.scorers.dur}><Scorers /></Sequence>
    <Sequence from={D2.defense.from} durationInFrames={D2.defense.dur}><Defense /></Sequence>
    <Sequence from={D2.kerem.from} durationInFrames={D2.kerem.dur}><Kerem /></Sequence>
    <Sequence from={D2.coaches.from} durationInFrames={D2.coaches.dur}><Coaches /></Sequence>
    <Sequence from={D2.last.from} durationInFrames={D2.last.dur}><Last /></Sequence>
    <Sequence from={D2.sim.from} durationInFrames={D2.sim.dur}><Sim /></Sequence>
    <Sequence from={D2.btts.from} durationInFrames={D2.btts.dur}><Btts /></Sequence>
    <Sequence from={D2.outro.from} durationInFrames={D2.outro.dur}><Outro /></Sequence>
    <Captions />
    <Grain />
    <Audio src={staticFile("score-derby2.wav")} volume={0.22} />
    <Sequence from={Math.round(0.4 * FPS)}>
      <Audio src={staticFile("voice-derby2-fast.wav")} volume={1.6} />
    </Sequence>
  </AbsoluteFill>
);
