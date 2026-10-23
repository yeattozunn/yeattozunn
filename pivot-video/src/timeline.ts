// Scene boundaries in frames (30 fps), cut to the voiceover. scripts/score.py mirrors these in seconds.
export const SCENES = {
  possession: { from: 0, dur: 106 },
  shots: { from: 106, dur: 137 },
  reveal: { from: 243, dur: 150 }, // score lands at local frame 67 (10.33 s), on "Lille iki"
  sim: { from: 393, dur: 229 },
  goals: { from: 622, dur: 126 },
  chances: { from: 748, dur: 108 },
  outro: { from: 856, dur: 238 },
};
export const TOTAL = 1094;

// Match data: Lille 2–4 Galatasaray, UCL league phase MD3, 21 Oct 2026.
// Sources: SofaScore / FotMob match stats, Sky Sports commentary.
export const MATCH = {
  possession: [56, 44],
  shots: [15, 10],
  onTarget: [5, 4],
  xg: [1.88, 1.64],
  bigChances: [2, 4],
  goals: [
    { min: 2, team: "gs", name: "Yunus Akgün", score: "0–1" },
    { min: 7, team: "lille", name: "Diaoune", score: "1–1" },
    { min: 39, team: "lille", name: "Diaoune", score: "2–1" },
    { min: 44, team: "gs", name: "Batrakov", score: "2–2" },
    { min: 52, team: "gs", name: "Kendi kalesine", score: "2–3" },
    { min: 61, team: "gs", name: "Osimhen", score: "2–4" },
  ],
};

// 50,000 Poisson simulations from the match xG (seed 2026), see scripts/sim.py
export const SIM = { n: 50000, lille: 0.4403, draw: 0.2188, gs: 0.3409, exact24: 767 };
