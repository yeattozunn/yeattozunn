import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Count, Crest, Drop, FadeIn, Meta, PivotMark, Stage } from "./parts";
import { C, display, F, mono } from "./theme";
import { MATCH, SIM } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAD = 90;

const Top: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: PAD, right: PAD, top: 230, display: "flex", flexDirection: "column", gap: 34 }}>
    {children}
  </div>
);

/* 1 — Lille had the ball */
export const Possession: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [54, 84], [0, 1], clamp);
  const e = 1 - Math.pow(1 - grow, 3);
  return (
    <Stage>
      <Top>
        <Meta left="Şampiyonlar Ligi · 3. hafta" right="Maç sonu" />
        <Drop size={150} lines={[{ text: "Lille topa" }, { text: "sahip oldu.", color: C.ice, weight: 300 }]} delay={2} />
      </Top>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 760 }}>
        <FadeIn at={46}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
            <Count to={56} start={48} dur={30} prefix="%" style={{ ...display(330), color: C.white }} />
            <div style={{ ...mono(26), color: C.dim, paddingBottom: 34 }}>Topa sahip olma</div>
          </div>
        </FadeIn>
        <div style={{ marginTop: 40, height: 14, display: "flex", gap: 8 }}>
          <div style={{ width: `${56 * e}%`, background: C.white }} />
          <div style={{ width: `${44 * e}%`, background: C.steel }} />
        </div>
        <FadeIn at={70}>
          <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", ...mono(24), color: C.white }}>
              <Crest team="lille" size={64} /> Lille %56
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", ...mono(24), color: C.dim }}>
              %44 Galatasaray <Crest team="gs" size={64} />
            </div>
          </div>
        </FadeIn>
      </div>
    </Stage>
  );
};

/* 2 — more shots, more xG */
const StatRow: React.FC<{ at: number; label: string; l: number; g: number; max: number; dec?: number }> = ({ at, label, l, g, max, dec = 0 }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 22], [0, 1], clamp);
  const e = 1 - Math.pow(1 - k, 3);
  const half = 400;
  return (
    <FadeIn at={at}>
      <div style={{ ...mono(22), color: C.dim, textAlign: "center", marginBottom: 14 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Count to={l} start={at} dur={22} decimals={dec} style={{ ...display(110), color: C.white, width: 170, textAlign: "left" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ height: 12, width: (half * l * e) / max, background: C.white }} />
        </div>
        <div style={{ width: 2, height: 54, background: C.faint }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: (half * g * e) / max, background: C.steel }} />
        </div>
        <Count to={g} start={at} dur={22} decimals={dec} style={{ ...display(110), color: C.dim, width: 170, textAlign: "right" }} />
      </div>
    </FadeIn>
  );
};

export const Shots: React.FC = () => (
  <Stage>
    <Top>
      <Meta left="Lille" right="Galatasaray" />
      <Drop size={150} lines={[{ text: "Daha çok" }, { text: "şut çekti.", color: C.ice, weight: 300 }]} />
    </Top>
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 700, display: "flex", flexDirection: "column", gap: 54 }}>
      <StatRow at={14} label="Şut" l={MATCH.shots[0]} g={MATCH.shots[1]} max={15} />
      <StatRow at={40} label="İsabetli şut" l={MATCH.onTarget[0]} g={MATCH.onTarget[1]} max={15} />
      <StatRow at={76} label="Beklenen gol (xG)" l={MATCH.xg[0]} g={MATCH.xg[1]} max={15 / 5} dec={2} />
    </div>
  </Stage>
);

/* 3 — but the scoreboard says otherwise */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const HIT = 67;
  if (frame < HIT) {
    const out = interpolate(frame, [HIT - 6, HIT], [1, 0], clamp);
    return (
      <Stage light={0.6}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
          <Drop
            size={170}
            align="center"
            stagger={4}
            lines={[{ text: "Ama tabela" }, { text: "başka", color: C.ice, weight: 300 }, { text: "konuşuyor." }]}
          />
        </AbsoluteFill>
      </Stage>
    );
  }
  const f = frame - HIT;
  const flash = interpolate(f, [0, 7], [0.9, 0], clamp);
  const shake = f < 10 ? Math.sin(f * 2.7) * (10 - f) * 1.6 : 0;
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 14, mass: 0.7, stiffness: 160 } });
  const glow = 0.5 + 0.5 * Math.sin(f * 0.18);
  return (
    <Stage light={1.25}>
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
        <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", ...mono(26), color: C.dim }}>
          Lille · Galatasaray · Maç sonu
        </div>
        <div style={{ position: "absolute", top: 440, left: PAD, right: PAD, display: "flex", justifyContent: "space-between" }}>
          <Crest team="lille" size={210} style={{ transform: `scale(${s(0)})` }} />
          <Crest team="gs" size={210} style={{ transform: `scale(${s(4)})` }} />
        </div>
        <div style={{ position: "absolute", top: 700, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
          <span style={{ ...display(560), color: C.dim, transform: `translateY(${(1 - s(2)) * -300}px)` }}>2</span>
          <span style={{ ...display(240, 300), color: C.faint }}>–</span>
          <span
            style={{
              ...display(560),
              color: C.ice,
              transform: `translateY(${(1 - s(7)) * -300}px)`,
              textShadow: `0 0 ${60 + 50 * glow}px rgba(201,220,234,${0.35 + 0.25 * glow})`,
            }}
          >
            4
          </span>
        </div>
        <div style={{ position: "absolute", top: 1220, left: PAD, right: PAD, display: "flex", justifyContent: "space-between", ...display(64), color: C.white, opacity: s(10) }}>
          <span style={{ color: C.dim }}>Lille</span>
          <span>Galatasaray</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.white, opacity: flash }} />
    </Stage>
  );
};

/* 4 — 50,000 simulations */
const COLS = 40;
const ROWS = 25;
const DOTS = COLS * ROWS;
const order = (() => {
  // deterministic shuffle so every render paints the same grid
  const a = Array.from({ length: DOTS }, (_, i) => i);
  let seed = 2026;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();
const nGs = Math.round(SIM.gs * DOTS);
const nDraw = Math.round(SIM.draw * DOTS);
const nExact = Math.round((SIM.exact24 / SIM.n) * DOTS);
const kind = new Array<string>(DOTS);
order.forEach((idx, rank) => {
  kind[idx] = rank < nExact ? "exact" : rank < nGs ? "gs" : rank < nGs + nDraw ? "draw" : "lille";
});
const appear = new Array<number>(DOTS);
order.forEach((idx, rank) => {
  appear[idx] = (rank * 7919) % DOTS; // reveal order independent of category
});

export const Simulation: React.FC = () => {
  const frame = useCurrentFrame();
  const focus = interpolate(frame, [138, 152], [0, 1], clamp);
  const cell = 22;
  const dot = 15;
  const shown = interpolate(frame, [40, 100], [0, DOTS], clamp);
  return (
    <Stage>
      <Top>
        <Meta left="xG'ye göre simülasyon" right="50.000 maç" />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22 }}>
          <Count to={50000} start={2} dur={40} style={{ ...display(230), color: C.white }} />
        </div>
        <FadeIn at={18}>
          <div style={{ ...display(84, 300), color: C.ice, marginTop: -20 }}>kez oynattık.</div>
        </FadeIn>
      </Top>
      <div style={{ position: "absolute", left: (1080 - COLS * cell) / 2, top: 760, width: COLS * cell, height: ROWS * cell }}>
        {Array.from({ length: DOTS }, (_, i) => {
          if (appear[i] > shown) return null;
          const k = kind[i];
          const base = k === "gs" || k === "exact" ? C.ice : k === "draw" ? "rgba(241,239,234,0.22)" : "rgba(241,239,234,0.55)";
          const isExact = k === "exact";
          const pulse = isExact ? 0.5 + 0.5 * Math.sin((frame - 152) * 0.3) : 0;
          const opacity = isExact ? 1 : interpolate(focus, [0, 1], [1, 0.12]);
          const size = isExact ? dot + focus * (8 + 4 * pulse) : dot;
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
                background: isExact && focus > 0 ? C.white : base,
                opacity,
                boxShadow: isExact && focus > 0 ? `0 0 ${18 + 16 * pulse}px rgba(201,220,234,0.9)` : undefined,
              }}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1330 - 40, height: 1 }} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1480, display: "flex", justifyContent: "space-between", ...mono(22), color: C.dim }}>
        <span>1 nokta = 50 maç</span>
        <span>Kaynak: SofaScore · FotMob</span>
      </div>
      {/* legend → focus line */}
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 1328 }}>
        <div style={{ opacity: 1 - focus, display: "flex", justifyContent: "space-between", ...mono(22), color: C.white }}>
          <FadeIn at={96}><span style={{ color: C.ice }}>● GS kazanır %34</span></FadeIn>
          <FadeIn at={102}><span style={{ color: C.dim }}>● Beraberlik %22</span></FadeIn>
          <FadeIn at={108}><span>● Lille %44</span></FadeIn>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 900, height: 330, opacity: focus, background: "radial-gradient(60% 50% at 50% 50%, rgba(11,12,14,0.92) 30%, transparent 100%)" }} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 950, opacity: focus, textAlign: "center" }}>
        <div style={{ ...display(190), color: C.white }}>2–4: %1,5</div>
        <div style={{ ...mono(28), color: C.ice, marginTop: 18 }}>50.000 maçta sadece 767 kez</div>
      </div>
    </Stage>
  );
};

/* 5 — the six goals */
export const Goals: React.FC = () => {
  const frame = useCurrentFrame();
  const x0 = PAD + 40;
  const x1 = 1080 - PAD - 40;
  const minute = interpolate(frame, [12, 108], [0, 90], clamp);
  const px = (m: number) => x0 + ((x1 - x0) * m) / 90;
  const passed = MATCH.goals.filter((g) => g.min <= minute);
  const score = passed.length ? passed[passed.length - 1].score : "0–0";
  return (
    <Stage>
      <Top>
        <Meta left="Gol akışı" right={`${Math.floor(minute)}'`} />
        <Drop size={140} lines={[{ text: "Altı gol." }, { text: "Tek kazanan.", color: C.ice, weight: 300 }]} />
      </Top>
      <div style={{ position: "absolute", top: 620, left: 0, right: 0 }}>
        <div style={{ position: "absolute", left: x0, width: x1 - x0, top: 0, height: 2, background: C.faint }} />
        <div style={{ position: "absolute", left: x0, width: px(minute) - x0, top: -1, height: 4, background: C.white }} />
        <div style={{ position: "absolute", left: px(45) - 1, top: -14, width: 2, height: 30, background: C.faint }} />
        <div style={{ position: "absolute", left: px(45) - 40, width: 80, top: 26, textAlign: "center", ...mono(16), color: C.dim }}>İY</div>
        <div style={{ position: "absolute", left: px(minute) - 9, top: -8, width: 18, height: 18, borderRadius: 18, background: C.white, boxShadow: "0 0 20px rgba(241,239,234,0.8)" }} />
        {MATCH.goals.map((g) => {
          const on = minute >= g.min;
          const isGs = g.team === "gs";
          return (
            <div key={g.min} style={{ position: "absolute", left: px(g.min) - 40, width: 80, top: isGs ? -78 : 22, textAlign: "center", opacity: on ? 1 : 0 }}>
              {isGs ? null : <div style={{ width: 12, height: 12, borderRadius: 12, background: C.dim, margin: "0 auto 8px" }} />}
              <div style={{ ...mono(22), letterSpacing: "0.04em", color: isGs ? C.ice : C.dim }}>{g.min}'</div>
              {isGs ? <div style={{ width: 14, height: 14, borderRadius: 14, background: C.ice, margin: "8px auto 0", boxShadow: "0 0 16px rgba(201,220,234,0.9)" }} /> : null}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 740, left: PAD, right: PAD, display: "flex", flexDirection: "column", gap: 4 }}>
        {MATCH.goals.map((g, i) => {
          const on = minute >= g.min;
          const isGs = g.team === "gs";
          const isLast = i === MATCH.goals.length - 1;
          return (
            <div
              key={g.min}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                height: 92,
                borderBottom: `1px solid ${C.faint}`,
                opacity: on ? 1 : 0.08,
                transform: `translateX(${on ? 0 : -30}px)`,
              }}
            >
              <span style={{ ...mono(24), letterSpacing: "0.04em", color: C.dim, width: 70 }}>{g.min}'</span>
              <Crest team={g.team as "gs" | "lille"} size={52} />
              <span style={{ ...display(62, isGs ? 800 : 500), color: isGs ? C.white : C.dim, flex: 1 }}>{g.name}</span>
              <span style={{ ...display(62), color: isLast ? C.ice : C.white, fontVariantNumeric: "tabular-nums" }}>{g.score}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1330, left: PAD, right: PAD, display: "flex", justifyContent: "flex-end", ...mono(22), color: C.dim }}>
        Skor · Lille–GS · {score}
      </div>
    </Stage>
  );
};

/* 6 — where was the difference */
const Chance: React.FC<{ at: number; fillAt?: number; size: number }> = ({ at, fillAt, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, mass: 0.6 } });
  const goal = fillAt !== undefined && frame >= fillAt;
  const fill = fillAt === undefined ? 0 : spring({ frame: frame - fillAt, fps, config: { damping: 14, mass: 0.5 } });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        border: `4px solid ${goal ? C.ice : C.dim}`,
        background: `rgba(201,220,234,${0.9 * fill})`,
        display: "grid",
        placeItems: "center",
        transform: `scale(${0.85 + 0.15 * s})`,
        boxShadow: goal ? `0 0 ${50 * fill}px rgba(201,220,234,0.5)` : undefined,
      }}
    >
      <span style={{ ...display(size * 0.3), color: goal ? C.bg0 : C.dim, opacity: goal ? fill : fillAt === undefined ? s : 0 }}>{goal ? "Gol" : "—"}</span>
    </div>
  );
};

export const Chances: React.FC = () => {
  const frame = useCurrentFrame();
  const head = interpolate(frame, [40, 50], [1, 0.45], clamp);
  return (
    <Stage>
      <Top>
        <Meta left="Büyük fırsatlar" right="Galatasaray" />
        <div style={{ opacity: head }}>
          <Drop size={150} lines={[{ text: "Peki fark" }, { text: "nerede?", color: C.ice, weight: 300 }]} />
        </div>
      </Top>
      <div style={{ position: "absolute", top: 700, left: PAD, right: PAD }}>
        <FadeIn at={42}>
          <div style={{ ...display(110), color: C.white }}>4 büyük fırsat</div>
        </FadeIn>
        <div style={{ display: "flex", gap: 26, marginTop: 40 }}>
          <Chance at={46} fillAt={78} size={200} />
          <Chance at={50} fillAt={84} size={200} />
          <Chance at={54} fillAt={90} size={200} />
          <Chance at={58} size={200} />
        </div>
        <FadeIn at={94}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 50 }}>
            <span style={{ ...display(170), color: C.ice }}>%75</span>
            <span style={{ ...mono(26), color: C.white }}>dönüşüm</span>
          </div>
        </FadeIn>
        <FadeIn at={98}>
          <div style={{ ...mono(22), color: C.dim, marginTop: 18 }}>Lille · 2 büyük fırsat</div>
        </FadeIn>
      </div>
    </Stage>
  );
};

/* 7 — verdict + logo */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const A = frame < 88;
  const B = frame >= 88 && frame < 160;
  const lf = frame - 160;
  const rot = spring({ frame: lf - 4, fps, config: { damping: 11, mass: 0.8 } });
  const word = spring({ frame: lf - 14, fps, config: { damping: 200 } });
  return (
    <Stage light={A || B ? 1 : 0.7}>
      {A ? (
        <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
          <Drop size={130} lines={[{ text: "Lille topu", color: C.dim, weight: 500 }, { text: "tuttu.", color: C.dim, weight: 500 }]} />
          <div style={{ height: 50 }} />
          <Drop size={150} delay={40} lines={[{ text: "Galatasaray" }, { text: "maçı aldı.", color: C.ice }]} />
        </AbsoluteFill>
      ) : B ? (
        <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
          <Drop size={176} stagger={5} lines={[{ text: "Bitiricilik," }, { text: "istatistiği" }, { text: "yener.", color: C.ice, weight: 300 }]} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40 }}>
          <div style={{ transform: `scale(${0.6 + 0.4 * word})` }}>
            <PivotMark size={260} angle={interpolate(rot, [0, 1], [0, -36])} />
          </div>
          <div style={{ ...display(220), letterSpacing: "0.01em", color: C.white, opacity: word, transform: `translateY(${(1 - word) * 30}px)` }}>Pivot</div>
          <div style={{ fontFamily: F.ui, fontSize: 40, fontWeight: 500, color: C.dim, opacity: interpolate(lf, [26, 40], [0, 1], clamp) }}>
            Her maç, sayılarla.
          </div>
          <div style={{ ...mono(24), color: C.ice, opacity: interpolate(lf, [36, 50], [0, 1], clamp), marginTop: 30 }}>Takip et</div>
        </AbsoluteFill>
      )}
    </Stage>
  );
};
