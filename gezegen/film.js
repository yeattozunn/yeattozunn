// Gezegen: "Bir gezegen seç. Bir yıl hayatta kal." Voxel space reel, Turkish voice-over, typed pixel captions.
// A pure function of time. Titles, labels and cuts are timed to voice.json and the beat grid.
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import { worldSet } from './sets/world.js';

const { W, H, FORMAT, E, prog, lerp, clamp, springU, SPRING, font, fitSize, layout } = M;
const DISPLAY = 'Display', UI = 'UI';
const C = { white: '#FFFFFF', gold: '#FFC83D', cyan: '#7FE9FF', ink: '#06101C' };
let SET = null;

const GRIDJ = await (await fetch('beats.json')).json();
const VOICE = await (await fetch('voice.json')).json();
const WORDS = VOICE.words;
const ub = (t) => (t - GRIDJ.offset) / GRIDJ.period;
const wu = (i) => ub(WORDS[i].t0);
// 0 hook | 1 planet 01 | 2 surface 1 | 3 planet 02 | 4 surface 2 | 5 planet 03 | 6 surface 3 | 7 finale
const SH = [0, 6, 7.5, 15, 16.5, 21, 22.5, 27, 36];
const TIMES = { SH, breathU: wu(32) };

// ---------------------------------------------------------------- typed captions
// lines: word indices per line; chars of each word appear across the time it is spoken
const CAPS = [
  { lines: [[0, 1, 2]], upper: true, to: wu(3) - 0.2 },
  { lines: [[3, 4], [5, 6]], upper: true, to: 6 },
  { lines: [[9, 10, 11], [12, 13]], to: wu(14) - 0.3 },
  { lines: [[14, 15, 16], [17, 18, 19, 20]], to: 15 },
  { lines: [[23, 24], [25]], to: 21 - 0.01 + 0 },
  { lines: [[28, 29, 30], [31, 32, 33]], to: 27 },
  { lines: [[34, 35]], to: 36, big: true },
];
CAPS[4].to = SH[5] - 0.1; CAPS[0].to = Math.min(CAPS[0].to, SH[1]);

function typed(w, t, upper) {
  const word = upper ? w.w.toLocaleUpperCase('tr-TR') : w.w, d = Math.max(0.12, Math.min(0.5, w.t1 - w.t0));
  const k = clamp((t - (w.t0 - 0.02)) / d);
  return word.slice(0, Math.ceil(word.length * k));
}
function drawCaption(ctx, u, t, S) {
  const first = WORDS[S.lines[0][0]];
  if (t < first.t0 - 0.05 || u > S.to) return;
  const s = FORMAT.safe, size = S.big ? 96 : S.upper ? 92 : 76, f = font(size, 400, UI), lh = size * 0.95;
  ctx.save(); ctx.font = f; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.shadowOffsetX = 0;
  const cx = s.x + s.w / 2, y0 = s.y + size * 0.7;
  S.lines.forEach((l, li) => {
    const full = l.map((i) => (S.upper ? WORDS[i].w.toLocaleUpperCase('tr-TR') : WORDS[i].w)).join(' ');
    const shown = l.map((i) => typed(WORDS[i], t, S.upper)).filter(Boolean).join(' ');
    if (!shown) return;
    const wFull = layout(ctx, full, f).width, x0 = cx - wFull / 2;
    ctx.textAlign = 'left'; ctx.fillText(shown, x0, y0 + li * lh);
    // the blinking block cursor on the line being typed
    if (li === S.lines.length - 1 || shown.length < full.length) {
      const last = l.every((i) => t > WORDS[i].t1);
      if (!last && Math.floor(t * 8) % 2 === 0) ctx.fillRect(x0 + layout(ctx, shown, f).width + 6, y0 + li * lh - size * 0.72, size * 0.34, size * 0.8);
    }
  });
  ctx.restore();
}

// ---------------------------------------------------------------- pixel labels and numbers
const v = new G.THREE.Vector3();
function pixelText(ctx, str, x, y, size, color, { glow = null, align = 'center', k = 1 } = {}) {
  ctx.save(); ctx.font = font(size, 400, DISPLAY); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.translate(x, y); ctx.scale(k, k);
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 38; }
  ctx.lineWidth = Math.max(4, size * 0.16); ctx.strokeStyle = C.ink; ctx.lineJoin = 'miter'; ctx.strokeText(str, 0, 0);
  ctx.fillStyle = color; ctx.fillText(str, 0, 0); ctx.restore();
}
function planetTag(ctx, i, u, big = 1) {
  const p = SET.planets[i]; if (!p.visible) return;
  p.getWorldPosition(v); const r = p.scale.x;
  const top = v.clone(); v.y -= r * 1.25; v.project(SET.camera);
  const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
  const k = springU(u, 0.3 + i * 0.25, SPRING.bouncy);
  pixelText(ctx, '0' + (i + 1), x, y + 8, 40 * big, C.white, { k: clamp(k, 0, 1.2) });
}
const typedLabel = (str, t, t0, dur = 0.5) => str.slice(0, Math.ceil(str.length * clamp((t - t0) / dur)));

// ---------------------------------------------------------------- backdrops
const SKY = [
  ['#030c1a', '#0a2a45', '#0a2a45'], ['#030c1a', '#0a2a45', '#0a2a45'],
  ['#2a2147', '#b05a6a', '#d88a68'], ['#030c1a', '#0a2a45', '#0a2a45'],
  ['#070618', '#1d0f3c', '#2a1650'], ['#030c1a', '#0a2a45', '#0a2a45'],
  ['#0a2234', '#1d6f88', '#2a8aa0'], ['#030c1a', '#0a2a45', '#0a2a45'],
];
function backdrop(ctx, s) {
  const [a, b, h] = SKY[s], g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, a); g.addColorStop(0.3, b); g.addColorStop(0.55, h); g.addColorStop(1, h);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function scrim(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.34);
  g.addColorStop(0, 'rgba(4,8,20,0.55)'); g.addColorStop(1, 'rgba(4,8,20,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.34);
  const r = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.78);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}
function scanlines(ctx) {   // faint pixel-screen texture, drawn after motion blur so it stays crisp
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}

// ---------------------------------------------------------------- hits
const HITS = [
  [0, 'hook', 'impact'], [wu(4), 'prize', 'pop', { pitch: 'A5' }],
  [3.75, 'count 3', 'tick'], [4.5, 'count 2', 'tick'], [5.25, 'count 1', 'tick'],
  [SH[1], 'planet 01', 'whoosh', { len: 0.5 }], [SH[2], 'cut to surface', 'thud'],
  [SH[3], 'planet 02', 'whoosh', { len: 0.5, from: 600, to: 2400 }], [SH[4], 'crystals', 'bell', { pitch: 'D6' }],
  [SH[5], 'planet 03', 'whoosh', { len: 0.5, from: 2400, to: 600 }], [SH[6], 'ocean', 'thud'],
  [TIMES.breathU, 'it breathes', 'thud'], [SH[7], 'finale', 'impact'], [wu(34), 'question', 'bell', { pitch: 'A5' }],
];

M.film({
  fonts: [font(60, 400, DISPLAY), font(60, 400, UI)],
  hits: HITS,
  samples: () => 3,
  async init() { await G.initGL({ exposure: 1.05 }); SET = worldSet(TIMES); },
  draw(ctx, u, t) {
    let s = 0; while (s + 1 < SH.length - 1 && u >= SH[s + 1]) s++;
    backdrop(ctx, s);
    G.renderSet(ctx, SET, t, u);
    scrim(ctx);
    const su = u - SH[s];
    if (s === 0 || s === 7) {
      [0, 1, 2].forEach((i) => planetTag(ctx, i, su, s === 7 ? 1.15 : 1));
      if (s === 0) {
        const s0 = FORMAT.safe, cx = s0.x + s0.w / 2;
        const pk = springU(u, wu(4) - 0.1, SPRING.bouncy);
        if (pk > 0 && u < 3.7) { const size = Math.min(76, fitSize(ctx, '50.000.000 $', 400, DISPLAY, s0.w + 40)); pixelText(ctx, '50.000.000 $', cx, H * 0.455, size, C.gold, { glow: '#ff9a20', k: clamp(pk, 0, 1.15) }); }
        [[3.75, '3'], [4.5, '2'], [5.25, '1']].forEach(([cu, n], i) => {
          const k = springU(u, cu, SPRING.bouncy), end = i < 2 ? cu + 0.75 : 6;
          if (k > 0 && u < end) pixelText(ctx, n, cx, H * 0.5, 190, C.white, { glow: '#9fe8ff', k: clamp(k, 0, 1.25) });
        });
      } else {
      }
    }
    if (s === 1 || s === 3 || s === 5) {
      const idx = (s - 1) / 2, w0 = WORDS[[7, 21, 26][idx]].t0 - 0.05;
      const label = typedLabel('GEZEGEN 0' + (idx + 1), t, w0, 0.55);
      if (label) pixelText(ctx, label, W / 2, H * 0.7, 54, C.white, {});
    }
    CAPS.forEach((S) => drawCaption(ctx, u, t, S));
  },
  post(ctx) { scanlines(ctx); },
});
