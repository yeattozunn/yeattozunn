import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, display, F, mono } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Graphite stage: falling spotlight, slow push-in, vignette and moving film grain.
export const Stage: React.FC<{ children: React.ReactNode; light?: number }> = ({
  children,
  light = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const push = interpolate(frame, [0, durationInFrames], [1, 1.045]);
  const flicker = 0.92 + 0.08 * Math.sin(frame * 0.7) * Math.sin(frame * 0.23);
  const lightIn = interpolate(frame, [0, 10], [0.35, 1], clamp);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 38% at 50% 0%, rgba(190,215,235,${0.34 * light * flicker * lightIn}) 0%, transparent 72%)`,
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{ background: "radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)" }}
      />
    </AbsoluteFill>
  );
};

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.16, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 9} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Words drop in from above with a short, hard spring — the PİVOT cut.
export const Drop: React.FC<{
  lines: { text: string; color?: string; weight?: number }[];
  size: number;
  delay?: number;
  align?: "left" | "center";
  stagger?: number;
}> = ({ lines, size, delay = 0, align = "left", stagger = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let i = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: size * 0.04 }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", gap: size * 0.2, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }}>
          {line.text.split(" ").map((w, wi) => {
            const s = spring({ frame: frame - delay - i++ * stagger, fps, config: { damping: 16, mass: 0.55, stiffness: 180 } });
            return (
              <span
                key={wi}
                style={{
                  ...display(size, line.weight ?? 800),
                  color: line.color ?? C.white,
                  display: "inline-block",
                  transform: `translateY(${interpolate(s, [0, 1], [-size * 0.5, 0])}px)`,
                  opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
                  filter: `blur(${interpolate(s, [0, 1], [8, 0], clamp)}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Meta: React.FC<{ left: string; right?: string; delay?: number }> = ({ left, right, delay = 0 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - delay, [0, 8], [0, 0.7], clamp);
  return (
    <div style={{ ...mono(27), color: C.white, opacity: o, display: "flex", justifyContent: "space-between", width: "100%" }}>
      <span>{left}</span>
      {right ? <span>{right}</span> : null}
    </div>
  );
};

// team = crest file name in public/ (gs, lille, bjk, palace)
export const Crest: React.FC<{ team: string; size: number; style?: React.CSSProperties }> = ({ team, size, style }) => (
  <Img
    src={staticFile(`${team}.svg`)}
    style={{ width: size, height: size, objectFit: "contain", filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.6))", ...style }}
  />
);

export const Count: React.FC<{
  to: number;
  from?: number;
  start: number;
  dur: number;
  decimals?: number;
  prefix?: string;
  style: React.CSSProperties;
}> = ({ to, from = 0, start, dur, decimals = 0, prefix = "", style }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [start, start + dur], [0, 1], clamp);
  const e = 1 - Math.pow(1 - k, 3);
  const v = from + (to - from) * e;
  const txt = v.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span style={{ ...style, fontVariantNumeric: "tabular-nums" }}>{prefix + txt}</span>;
};

export const FadeIn: React.FC<{ at: number; children: React.ReactNode; y?: number; style?: React.CSSProperties }> = ({
  at,
  children,
  y = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 200 } });
  return (
    <div style={{ opacity: s, transform: `translateY(${(1 - s) * y}px)`, ...style }}>{children}</div>
  );
};

// Karaoke-style subtitle: the spoken word lights up, the rest of the phrase waits dimmed.
export const Caption: React.FC<{ words: { t: string; s: number; e: number }[]; t: number; local: number; len: number }> = ({
  words,
  t,
  local,
  len,
}) => {
  const o = interpolate(local, [0, 4, len - 5, len], [0, 1, 1, 0], clamp);
  const y = interpolate(local, [0, 6], [14, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 1395,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 14px",
        fontFamily: F.ui,
        fontWeight: 600,
        fontSize: 48,
        lineHeight: 1.25,
        opacity: o,
        transform: `translateY(${y}px)`,
        textShadow: "0 2px 18px rgba(0,0,0,0.85)",
      }}
    >
      {words.map((w, i) => {
        const on = t >= w.s - 0.04;
        const now = on && t < w.e + 0.08;
        return (
          <span key={i} style={{ color: now ? C.ice : on ? C.white : "rgba(241,239,234,0.35)", transform: `scale(${now ? 1.04 : 1})` }}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

export const PivotMark: React.FC<{ size: number; angle: number; color?: string }> = ({ size, angle, color = C.white }) => (
  <svg width={size} height={size} viewBox="0 0 60 60">
    <line x1="8" y1="30" x2="52" y2="30" stroke={color} strokeWidth="1.6" opacity="0.3" />
    <line
      x1="8"
      y1="30"
      x2="52"
      y2="30"
      stroke={C.ice}
      strokeWidth="2.6"
      strokeLinecap="round"
      transform={`rotate(${angle} 30 30)`}
    />
    <circle cx="30" cy="30" r="6" fill={color} />
  </svg>
);
