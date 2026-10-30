// Kazan: "Yeniçeriler isyan edince neden kazan devirirdi?" A pure function of time.
// Picture follows docs/shotlist.md; every title word and callout is timed to the voice (voice.json).
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import { worldSet } from './sets/world.js';

const { W, H, FORMAT, E, prog, lerp, clamp, springU, SPRING, font, fitSize, layout, fill, rrect } = M;
const C = { white: '#FFFFFF', accent: '#FF7A1A', ink: '#1B1B26' };
const DISPLAY = 'Display', UI = 'UI';
let SET = null;

const GRIDJ = await (await fetch('beats.json')).json();
const VOICE = await (await fetch('voice.json')).json();
const WORDS = VOICE.words;
const ub = (t) => (t - GRIDJ.offset) / GRIDJ.period;      // seconds -> beats (module scope, before film())
const wu = (i) => ub(WORDS[i].t0);                         // beat on which word i is spoken
const SH = [0, 5, 9, 19, 24, 29.5, 40];                    // shot boundaries (beats), each on a vocal onset

const TIMES = { tipU: wu(27) - 0.45, refuseU: wu(22) - 0.1, spoonU: wu(22) + 0.2 };

// ---------------------------------------------------------------- titles, timed to the words
// lines: arrays of word indices; hl: words in the accent colour; [from, to) beats on screen
const SUPERS = [
  { lines: [[0, 1], [2, 3, 4], [5]], hl: [4] },
  { lines: [[6, 7], [8, 9]], hl: [9] },
  { lines: [[10, 11, 12], [13, 14, 15], [16]], hl: [12, 15] },
  { lines: [[17, 18], [19, 20]], hl: [19] },
  { lines: [[21, 22], [23], [24, 25]], hl: [22, 24, 25] },
  { lines: [[26, 27, 28], [29, 30]], hl: [27, 30] },
  { lines: [[31, 32, 33], [34, 35, 36]], hl: [32] },
];
// each title leaves just before the next one's first word is spoken; the last one yields to the end card
SUPERS.forEach((S, i) => { S.to = i + 1 < SUPERS.length ? wu(SUPERS[i + 1].lines[0][0]) - 0.4 : 35.2; });

function drawSuper(ctx, u, S) {
  const first = WORDS[S.lines[0][0]], u0 = ub(first.t0);
  if (u < u0 - 0.1 || u > S.to + 0.4) return;
  const s = FORMAT.safe, maxW = s.w - 10;
  const text = (l) => l.map((i) => WORDS[i].w).join(' ');
  const size = Math.min(112, ...S.lines.map((l) => fitSize(ctx, text(l), 800, DISPLAY, maxW, 112)));
  const f = font(size, 800, DISPLAY), lh = size * 0.98;
  const out = E.inBack(prog(u, S.to, S.to + 0.3), 1.3);
  ctx.save();
  ctx.font = f; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
  S.lines.forEach((l, li) => {
    const space = layout(ctx, 'a a', f).width - layout(ctx, 'aa', f).width;
    let x = s.x;
    l.forEach((wi) => {
      const w = layout(ctx, WORDS[wi].w, f).width, k = springU(u, wu(wi) - 0.12, SPRING.bouncy);
      if (k > 0) {
        const hl = S.hl.includes(wi), y = s.y + size + li * lh - out * 260 + (1 - k) * 70;
        ctx.globalAlpha = clamp(k * 1.6) * (1 - out);
        ctx.font = f; ctx.fillStyle = hl ? C.accent : C.white; ctx.textAlign = 'left';
        ctx.save(); ctx.translate(x + w / 2, y - size * 0.3); ctx.scale(1 + 0.0 * k, 1); ctx.translate(-(x + w / 2), -(y - size * 0.3));
        ctx.fillText(WORDS[wi].w, x, y); ctx.restore();
      }
      x += w + space;
    });
  });
  ctx.restore();
}

// ---------------------------------------------------------------- callouts: pill + dotted line to a 3-D point
const v = new G.THREE.Vector3();
function callout(ctx, SET, u, { a, label, dx, dy, from, to, side = 1 }) {
  if (u < from || u > to + 0.5) return;
  const k = springU(u, from, SPRING.bouncy) * (1 - prog(u, to, to + 0.4));
  if (k <= 0.01) return;
  (a.getWorldPosition ? a.getWorldPosition(v) : v.copy(a)).project(SET.camera);
  const ax = (v.x * 0.5 + 0.5) * W, ay = (-v.y * 0.5 + 0.5) * H;
  const f = font(46, 800, UI);
  ctx.save(); ctx.font = f;
  const tw = ctx.measureText(label).width, pw = tw + 64, ph = 78;
  const px = clamp(ax + dx - pw / 2, 40, W - 40 - pw), py = ay + dy - ph / 2;
  const cx = px + pw / 2, cy = py + ph / 2;
  // dotted line pill -> anchor
  ctx.globalAlpha = k > 1 ? 1 : k;
  ctx.setLineDash([1, 15]); ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = C.white;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(lerp(cx, ax, clamp(k)), lerp(cy, ay, clamp(k))); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(ax, ay, 14 * Math.min(1, k), 0, 7); ctx.fillStyle = C.accent; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.white; ctx.stroke();
  ctx.translate(cx, cy); ctx.scale(Math.min(1.15, k), Math.min(1.15, k)); ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  rrect(ctx, px, py, pw, ph, ph / 2); ctx.fillStyle = C.white; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, cy + 3);
  ctx.restore();
}

// ---------------------------------------------------------------- backdrop (2-D, behind the 3-D set)
const BG = [
  ['#0d1630', '#243a66', '#ff9a3c'],   // night courtyard, fire glow low
  ['#0d1630', '#2a3f6d', '#ff9a3c'],
  ['#2a1838', '#6b3a46', '#ffb15c'],   // dusk, warm
  ['#2a1838', '#6b3a46', '#ffb15c'],
  ['#3a0c0e', '#8c2315', '#ff5a2a'],   // riot red
  ['#070b16', '#18233a', '#42557f'],   // aftermath, cold
];
function backdrop(ctx, u, s) {
  const [a, b, glow] = BG[s];
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(0.62, b); g.addColorStop(1, a);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W * 0.5, H * 0.66, 40, W * 0.5, H * 0.66, H * 0.5);
  r.addColorStop(0, glow + (s === 5 ? '55' : '88')); r.addColorStop(1, glow + '00');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}
// readability: a dark falloff under the title zone (top) and under the end card (bottom)
function scrims(ctx, u, s) {
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.42);
  g.addColorStop(0, 'rgba(8,8,22,0.82)'); g.addColorStop(0.55, 'rgba(8,8,22,0.5)'); g.addColorStop(1, 'rgba(8,8,22,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.42);
  if (s === 5) {
    const k = clamp(springU(u, wu(32) - 0.2, SPRING.gentle));
    const b = ctx.createLinearGradient(0, H * 0.58, 0, H);
    b.addColorStop(0, 'rgba(6,8,18,0)'); b.addColorStop(0.5, `rgba(6,8,18,${0.7 * k})`); b.addColorStop(1, `rgba(6,8,18,${0.85 * k})`);
    ctx.fillStyle = b; ctx.fillRect(0, H * 0.58, W, H * 0.42);
  }
}
function vignette(ctx) {
  const r = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.75);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- end card
function endCard(ctx, u) {
  const k = springU(u, wu(32) - 0.2, SPRING.gentle);
  if (k <= 0) return;
  const s = FORMAT.safe, cx = s.x + s.w / 2, base = s.y + s.h * 0.83;
  ctx.save(); ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 28;
  ctx.globalAlpha = clamp(k * 1.4);
  const size = 250, y = base - (1 - k) * 90;
  ctx.font = font(size, 800, DISPLAY); ctx.fillStyle = C.white; ctx.fillText('1826', cx, y);
  const k2 = springU(u, wu(32) + 1.2, SPRING.gentle);
  ctx.globalAlpha = clamp(k2 * 1.4);
  ctx.font = font(62, 800, UI); ctx.fillStyle = C.accent; ctx.fillText('Vaka-i Hayriye', cx, y + 86 + (1 - k2) * 30);
  ctx.font = font(46, 800, UI); ctx.fillStyle = '#F1E7D4'; ctx.fillText('Yeniçeri Ocağı kaldırıldı', cx, y + 150 + (1 - k2) * 30);
  ctx.restore();
}

// ---------------------------------------------------------------- hits: every accent on the beat grid
const HITS = [
  [0, 'hook: kazan lands', 'impact'],
  [wu(4), 'kazan word', 'pop', { pitch: 'A5' }],
  [SH[1], 'cut: courtyard', 'whoosh', { len: 0.4 }],
  [5.15, 'janissary 1 lands', 'thud'], [5.5, 'janissary 2 lands', 'thud'], [5.85, 'janissary 3 lands', 'thud'],
  [wu(7), 'label kazan', 'pop', { pitch: 'D6' }], [wu(8), 'label ocak', 'pop', { pitch: 'A5' }],
  [SH[2], 'cut: close-up', 'whoosh', { len: 0.4, from: 600, to: 2400 }],
  [wu(11), 'label börk', 'pop', { pitch: 'D6' }], [wu(13), 'label kaşıklık', 'pop', { pitch: 'A5' }],
  [wu(19), 'çorbacı', 'bell', { pitch: 'D6' }],
  [SH[3], 'cut: the bowl', 'whoosh', { len: 0.4, from: 2400, to: 600 }],
  [TIMES.spoonU, 'spoon drops', 'tick'], [TIMES.spoonU + 1.3, 'spoon lands', 'tick'],
  [SH[4], 'cut: the pot', 'whoosh', { len: 0.4 }],
  [TIMES.tipU + 1.3, 'pot hits the ground', 'impact'],
  [SH[5], 'cut: aftermath', 'thud'],
  [wu(32), '1826', 'bell', { pitch: 'D5' }],
];

M.film({
  fonts: [font(100, 800, DISPLAY), font(40, 800, UI)],
  hits: HITS,
  samples: (t) => 4,
  async init() { await G.initGL({ exposure: 1.1 }); SET = worldSet(TIMES); },
  draw(ctx, u, t) {
    let s = 0; while (u >= SH[s + 1] && s < 5) s++;
    backdrop(ctx, u, s);
    G.renderSet(ctx, SET, t, u);
    scrims(ctx, u, s);
    vignette(ctx);
    const A = SET.anchors;
    if (s === 1) {
      callout(ctx, SET, u, { a: A.pot, label: 'kazan', dx: -250, dy: -170, from: wu(7), to: SH[2] - 0.2 });
      callout(ctx, SET, u, { a: A.hearth, label: 'ocak', dx: 260, dy: 190, from: wu(8), to: SH[2] - 0.2 });
    }
    if (s === 2) {
      callout(ctx, SET, u, { a: A.bork, label: 'börk', dx: 280, dy: 170, from: wu(11), to: wu(17) });
      callout(ctx, SET, u, { a: A.holder, label: 'kaşıklık', dx: -250, dy: 200, from: wu(13), to: wu(17) });
    }
    SUPERS.forEach((S) => drawSuper(ctx, u, S));
    if (u >= wu(32) - 0.3) endCard(ctx, u);
  },
});
