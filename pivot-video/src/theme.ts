import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

export const C = {
  bg0: "#0b0c0e",
  bg1: "#16191c",
  steel: "#2b3036",
  white: "#f1efea",
  ice: "#c9dcea",
  dim: "rgba(241,239,234,0.38)",
  faint: "rgba(241,239,234,0.16)",
};

export const F = {
  display: '"Archivo Variable", "Archivo", Impact, sans-serif',
  ui: '"Geist Variable", "Geist", system-ui, sans-serif',
  mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace',
};

// PİVOT headline: condensed Archivo, heavy, uppercase
export const display = (size: number, weight = 800): React.CSSProperties => ({
  fontFamily: F.display,
  fontStretch: "62%",
  fontVariationSettings: '"wdth" 62',
  fontWeight: weight,
  fontSize: size,
  lineHeight: 0.86,
  textTransform: "uppercase",
  letterSpacing: "-0.005em",
});

export const mono = (size: number): React.CSSProperties => ({
  fontFamily: F.mono,
  fontSize: size,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
});

export const FPS = 30;
export const W = 1080;
export const H = 1920;
