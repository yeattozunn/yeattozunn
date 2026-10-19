// Tobacco Chocolat × Splitcim: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// Timing is in beats (u) on the measured grid (96 BPM, 24 beats); docs/shotlist.md is the plan.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, springKeys, SPRING, wobble, font, layout, glyph, text, fill, shake, noise1, mulberry32 } = M;

// Brand tokens. Film palette from the bottle; one accent (label gold). Splitcim teal only on its own panel.
const C = {
  cocoa: '#120905', tobacco: '#2c160b', copper: '#b4622a', gold: '#d9b46a',
  cream: '#efe2cf', panel: '#f1e9dd', teal: '#154c5c',
};
const DISPLAY = 'Display', UI = 'UI';

// The real bottle (assets/product/bottle.png, 609x1432). Points in bottle pixels.
const BW = 609, BH = 1432;
const LABEL = [304, 820];    // centre of "TOBACCO CHOCOLAT" on the label
const MID = [304, 716];      // centre of the bottle

const HITS = [
  [0, 'drone under the macro', 'sub', { len: 2.2 }],
  [1.6, 'light sweeps the label', 'whoosh', { len: 1.2, from: 400, to: 1800 }],
  [4, 'TOBACCO rises', 'thud'],
  [6, 'CHOCOLAT drops', 'thud', { pitch: 70, to: 40 }],
  [7.8, 'split opens', 'whoosh', { len: 0.5 }],
  [8, 'bottle lands (drop)', 'impact'],
  [10, 'copper sweep', 'whoosh', { len: 1.0, from: 300, to: 1200, pan: -0.2 }],
  [12, 'bottle slides left', 'whoosh', { len: 0.4, from: 900, to: 2400 }],
  [12.5, 'top notes', 'tick'],
  [14, 'heart notes', 'tick'],
  [16, 'cut to liquid macro', 'sub', { len: 1.2 }],
  [16.5, 'base notes', 'tick'],
  [20, 'end card', 'thud'],
  [21, 'Splitcim panel rises', 'whoosh', { len: 0.5, from: 2400, to: 700 }],
  [21.5, 'Splitcim logo', 'bell', { pitch: 'C6' }],
];

// ---------------------------------------------------------------- helpers

let bottleCv = null, bottleCtx = null;   // scratch canvas for the light sweep (repainted per call)
// Draw the bottle with point (ax, ay) at screen (x, y), scale s. sweep: band position 0..1 (or null).
function bottle(ctx, IMG, x, y, s, { ax = MID[0], ay = MID[1], sweep = null, sweepColor = 'rgba(255,226,180,0.5)', alpha = 1, sq = 0 } = {}) {
  let src = IMG.bottle;
  if (sweep !== null && sweep > -0.2 && sweep < 1.2) {
    bottleCtx.globalCompositeOperation = 'copy';
    bottleCtx.drawImage(IMG.bottle, 0, 0);
    bottleCtx.globalCompositeOperation = 'source-atop';
    const bx = lerp(-BW * 0.7, BW * 1.7, sweep);
    const g = bottleCtx.createLinearGradient(bx - 160, 0, bx + 160, 260);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, sweepColor); g.addColorStop(1, 'rgba(0,0,0,0)');
    bottleCtx.fillStyle = g; bottleCtx.fillRect(0, 0, BW, BH);
    src = bottleCv;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s * (1 + sq), s * (1 - sq));
  ctx.drawImage(src, -ax, -ay);
  ctx.restore();
}

// Warm smoke: a few large soft copper clouds drifting on seeded noise over cocoa black.
function smoke(ctx, u, base = C.cocoa, amt = 1) {
  fill(ctx, base);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = W * (0.5 + 0.45 * noise1(u * 0.09 + i * 3.1, 11 + i));
    const y = H * (0.5 + 0.45 * noise1(u * 0.07 + i * 5.7, 31 + i));
    const r = W * (0.55 + 0.2 * noise1(u * 0.05 + i, 51 + i));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(150,72,28,${0.16 * amt})`);
    g.addColorStop(1, 'rgba(150,72,28,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function vignette(ctx, k = 0.75) {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, W * 0.3, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// Glow pool under a standing bottle.
function floorGlow(ctx, x, y, w, a = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, 0.16);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
  g.addColorStop(0, `rgba(180,98,42,${0.55 * a})`); g.addColorStop(1, 'rgba(180,98,42,0)');
  ctx.fillStyle = g; ctx.fillRect(-w, -w, 2 * w, 2 * w);
  ctx.restore();
}

// A line of type whose glyphs slide out of a mask edge. dir -1: rise from below the baseline clip.
function maskedLine(ctx, str, cx, base, f, color, u, u0, { track = 0, stagger = 0.035, dir = -1, clipTop, clipBot, cfg = SPRING.snappy, alpha = 1 } = {}) {
  const L = layout(ctx, str, f, track);
  const x0 = cx - L.width / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, clipTop, W, clipBot - clipTop); ctx.clip();
  ctx.globalAlpha = alpha;
  L.glyphs.forEach((g, j) => {
    const k = springU(u, u0 + j * stagger, cfg);
    if (k <= 0) return;
    const off = (1 - k) * (L.asc + L.desc + 30) * -dir;
    glyph(ctx, g.ch, x0 + g.cx, base + off, f, color);
  });
  ctx.restore();
  return L;
}

// ---------------------------------------------------------------- S1 label macro   (u 0..4)
function sceneMacro(ctx, u, IMG) {
  smoke(ctx, u, C.cocoa, 0.8);
  // log-space dolly out from the label text
  const p = E.outCubic(prog(u, -0.6, 4.2));
  const s = 2.3 * (1.35 / 2.3) ** p;
  const y = lerp(H * 0.42, H * 0.44, p);
  bottle(ctx, IMG, W / 2, y, s, { ax: LABEL[0], ay: lerp(LABEL[1] - 20, LABEL[1] - 60, p), sweep: prog(u, 1.2, 3.2) });
  vignette(ctx, 0.85);
  // a whisper of copy under the macro
  const g = ctx.createLinearGradient(0, 1150, 0, 1500);
  g.addColorStop(0, 'rgba(10,5,2,0)'); g.addColorStop(1, 'rgba(10,5,2,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 1150, W, H - 1150);
  maskedLine(ctx, "TOM FORD'UN YENİ KOKUSU", W / 2, 1400, font(44, 600, DISPLAY), C.gold, u, 0.6, { track: 6, stagger: 0.018, clipTop: 1340, clipBot: 1412 });
  maskedLine(ctx, 'Private Blend · 2026', W / 2, 1470, font(52, 500, UI), C.cream, u, 1.4, { stagger: 0.015, clipTop: 1420, clipBot: 1488 });
}

// ---------------------------------------------------------------- S2 split TOBACCO / CHOCOLAT   (u 4..8)
const MIDY = H * 0.5;
function sceneSplit(ctx, u, IMG) {
  const open = E.inCubic(prog(u, 7.3, 8.0));      // halves part to reveal the drop
  const dy = open * (H / 2 + 40);
  const big = M.fitSize(ctx, 'CHOCOLAT', 500, DISPLAY, 880, 180, 0.06);
  const f = font(big, 500, DISPLAY), track = 0.06 * big;
  // top half
  ctx.save(); ctx.translate(0, -dy);
  ctx.fillStyle = C.tobacco; ctx.fillRect(0, 0, W, MIDY);
  smokeBand(ctx, u, 0, MIDY, 0.7);
  maskedLine(ctx, 'TOBACCO', W / 2, MIDY - 70, f, C.cream, u, 3.6, { track, dir: -1, clipTop: 0, clipBot: MIDY - 20, cfg: SPRING.gentle });
  maskedLine(ctx, 'kavrulmuş tütün yaprakları', W / 2, MIDY - 70 - big - 40, font(66, 500, UI), C.gold, u, 4.5, { stagger: 0.012, dir: -1, clipTop: 0, clipBot: MIDY - 70 - big + 10 });
  ctx.restore();
  // bottom half
  ctx.save(); ctx.translate(0, dy);
  ctx.fillStyle = C.cocoa; ctx.fillRect(0, MIDY, W, H - MIDY);
  smokeBand(ctx, u + 40, MIDY, H, 0.5);
  maskedLine(ctx, 'CHOCOLAT', W / 2, MIDY + 70 + big * 0.72, f, C.cream, u, 5.6, { track, dir: 1, clipTop: MIDY + 20, clipBot: H, cfg: SPRING.gentle });
  maskedLine(ctx, 've bitter çikolata', W / 2, MIDY + 70 + big * 0.72 + 120, font(66, 500, UI), C.gold, u, 6.4, { stagger: 0.012, dir: 1, clipTop: MIDY + 70 + big * 0.72 + 30, clipBot: H });
  ctx.restore();
  // gold split line draws out from the centre, then rides the opening
  const lw = E.outExpo(prog(u, 3.6, 4.2)) * W;
  if (lw > 0 && open < 1) {
    ctx.fillStyle = C.gold;
    ctx.fillRect(W / 2 - lw / 2, MIDY - dy - 1.5, lw, 3);
    if (dy > 0) ctx.fillRect(W / 2 - lw / 2, MIDY + dy - 1.5, lw, 3);
    // the Splitcim mark sits on the seam
    const mk = springU(u, 4.6, SPRING.bouncy);
    if (mk > 0 && dy < 5) {
      const mh = 92 * mk;
      ctx.save();
      ctx.fillStyle = C.cocoa;
      ctx.beginPath(); ctx.arc(W / 2, MIDY, 64 * mk, 0, M.TAU); ctx.fill();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.stroke();
      ctx.drawImage(TINT.markGold, W / 2 - (mh * 185 / 361) / 2, MIDY - mh / 2 - 4 * mk, mh * 185 / 361, mh);
      ctx.restore();
    }
  }
}
function smokeBand(ctx, u, y0, y1, amt) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const x = W * (0.5 + 0.5 * noise1(u * 0.12 + i * 4.3, 71 + i));
    const y = lerp(y0, y1, 0.5 + 0.5 * noise1(u * 0.1 + i * 2.1, 91 + i));
    const r = W * 0.6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(160,80,30,${0.18 * amt})`); g.addColorStop(1, 'rgba(160,80,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- S3 + S4 bottle lands, notes   (u 7.3..16)
const NOTES = [
  { u: 12.4, head: 'ÜST NOTALAR', lines: ['Portakal', 'Akigalawood'] },
  { u: 14, head: 'KALP NOTALARI', lines: ['Bitter Çikolata', 'Kakao'] },
];
function sceneBottle(ctx, u, IMG) {
  smoke(ctx, u, C.cocoa, 1);
  const land = springU(u, 7.35, { stiffness: 150, damping: 15 });
  const [x, y, s] = springKeys(u, [[0, [540, 900, 0.8]], [11.85, [318, 930, 0.64]]], { stiffness: 140, damping: 19 });
  const yy = y + (1 - land) * 1300;
  const sq = 0.035 * wobble(u - 8, 2.2, 5);
  ctx.save();
  shake(ctx, u, 8, 14, 5, 0.18);
  floorGlow(ctx, x, yy + (BH - MID[1]) * s - 6, 380 * s / 0.8, clamp(land));
  bottle(ctx, IMG, x, yy + (BH - MID[1]) * s, s, { ay: BH, sq, sweep: prog(u, 9.4, 11.4), sweepColor: 'rgba(230,140,70,0.55)' });
  ctx.restore();
  // brand line above the bottle on the drop
  const bk = springU(u, 8.6, SPRING.gentle);
  const bfade = 1 - prog(u, 11.6, 12.1);
  if (bk > 0 && bfade > 0) {
    ctx.save(); ctx.globalAlpha = clamp(bk) * bfade;
    text(ctx, 'TOM FORD · PRIVATE BLEND', W / 2, 300 - (1 - bk) * 30, font(34, 500, DISPLAY), C.gold, 'center', 9);
    ctx.restore();
  }
  // notes column on the right
  const cx = 770, top = 760;
  NOTES.forEach((n, i) => {
    const out = i === 0 ? E.inCubic(prog(u, 13.6, 14.0)) : 0;
    if (u < n.u || out >= 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - out;
    ctx.translate(0, -out * 60);
    maskedLine(ctx, n.head, cx, top, font(34, 600, DISPLAY), C.gold, u, n.u, { track: 6, stagger: 0.015, clipTop: top - 60, clipBot: top + 10 });
    const lw = E.outExpo(prog(u, n.u + 0.2, n.u + 0.9)) * 300;
    ctx.fillStyle = C.gold; ctx.fillRect(cx - lw / 2, top + 30, lw, 2);
    n.lines.forEach((l, j) => {
      const sz = M.fitSize(ctx, l, 500, UI, 430, 100);
      const b = top + 140 + j * 125;
      maskedLine(ctx, l, cx, b, font(sz, 500, UI), C.cream, u, n.u + 0.35 + j * 0.3, { stagger: 0.02, clipTop: b - 90, clipBot: b + 30 });
    });
    ctx.restore();
  });
  vignette(ctx, 0.6);
}

// ---------------------------------------------------------------- S5 liquid macro + base notes   (u 16..20)
function sceneLiquid(ctx, u, IMG) {
  fill(ctx, C.cocoa);
  const p = prog(u, 16, 20.2);
  const s = 3.4 * (2.7 / 3.4) ** p;          // log dolly out
  bottle(ctx, IMG, W / 2, H * 0.5, s, { ax: 304, ay: lerp(1150, 1060, E.inOutSine(p)), sweep: prog(u, 16.4, 19.2), sweepColor: 'rgba(255,190,120,0.35)' });
  // darken the lower band so the type reads
  const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
  g.addColorStop(0, 'rgba(10,5,2,0)'); g.addColorStop(0.3, 'rgba(10,5,2,0.72)'); g.addColorStop(0.6, 'rgba(10,5,2,0.86)'); g.addColorStop(1, 'rgba(10,5,2,1)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const top = 1010;
  maskedLine(ctx, 'DİP NOTALAR', W / 2, top, font(34, 600, DISPLAY), C.gold, u, 16.4, { track: 6, stagger: 0.015, clipTop: top - 60, clipBot: top + 10 });
  const lw = E.outExpo(prog(u, 16.6, 17.3)) * 300;
  ctx.fillStyle = C.gold; ctx.fillRect(W / 2 - lw / 2, top + 30, lw, 2);
  ['Tütün · Paçuli', 'Peru Balsamı'].forEach((l, j) => {
    const b = top + 150 + j * 120;
    maskedLine(ctx, l, W / 2, b, font(96, 500, UI), C.cream, u, 16.8 + j * 0.45, { stagger: 0.02, clipTop: b - 110, clipBot: b + 35 });
  });
  vignette(ctx, 0.7);
}

// ---------------------------------------------------------------- S6 end card + Splitcim panel   (u 20..)
const PANEL_TOP = 1205;
function sceneEnd(ctx, u, IMG) {
  smoke(ctx, u, C.cocoa, 0.9);
  const k = springU(u, 20, SPRING.gentle);
  const s = 0.56 * (0.66 / 0.56) ** (1 - k);
  const bx = W / 2, by = 1040;
  floorGlow(ctx, bx, by - 4, 330, 1);
  bottle(ctx, IMG, bx, by, s, { ay: BH, sweep: prog(u, 22.2, 23.6) });
  // title
  const f = font(58, 500, DISPLAY);
  maskedLine(ctx, 'TOBACCO CHOCOLAT', W / 2, 1122, f, C.cream, u, 20.25, { track: 7, stagger: 0.02, clipTop: 1060, clipBot: 1134 });
  const sk = springU(u, 20.8, SPRING.gentle);
  if (sk > 0) {
    ctx.save(); ctx.globalAlpha = clamp(sk);
    text(ctx, 'Eau de Parfum · Tom Ford Private Blend', W / 2, 1176 + (1 - sk) * 20, font(44, 500, UI), C.gold, 'center', 0.5);
    ctx.restore();
  }
  // the split: a cream panel rises from the bottom carrying Splitcim
  const pk = springU(u, 20.85, { stiffness: 200, damping: 22 });
  if (pk <= 0) return;
  const top = lerp(H + 20, PANEL_TOP, pk);
  ctx.fillStyle = C.panel; ctx.fillRect(0, top, W, H - top);
  ctx.fillStyle = C.gold; ctx.fillRect(0, top, W, 3);
  ctx.save(); ctx.beginPath(); ctx.rect(0, top + 3, W, H - top); ctx.clip();
  const lk = springU(u, 21.4, SPRING.bouncy);
  if (lk > 0) {
    const lw = 440, lh = lw * TINT.word.height / TINT.word.width;
    const ly = top + 50 + (1 - lk) * 120;
    ctx.drawImage(TINT.word, W / 2 - lw / 2, ly, lw, lh);
  }
  maskedLine(ctx, "şimdi Splitcim'de", W / 2, top + 268, font(64, 500, UI), C.teal, u, 21.9, { stagger: 0.02, clipTop: top + 200, clipBot: top + 290 });
  ctx.restore();
}

// ---------------------------------------------------------------- grain (post, not blurred away)
const GRAIN = [];
const TINT = {};
function tinted(img, color) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}

M.film({
  fonts: [font(100, 500, DISPLAY), font(100, 600, DISPLAY), font(60, 500, UI)],
  images: { bottle: 'assets/product/bottle.png', word: 'assets/logo/splitcim_wordmark.png', mark: 'assets/logo/splitcim_mark.png' },
  hits: HITS,
  init(ctx, IMG) {
    bottleCv = document.createElement('canvas'); bottleCv.width = BW; bottleCv.height = BH;
    bottleCtx = bottleCv.getContext('2d');
    TINT.word = tinted(IMG.word, C.teal);
    TINT.markGold = tinted(IMG.mark, C.gold);
    const rnd = mulberry32(7);
    for (let n = 0; n < 6; n++) {
      const c = document.createElement('canvas'); c.width = 540; c.height = 960;
      const x = c.getContext('2d'); const d = x.createImageData(540, 960);
      for (let i = 0; i < d.data.length; i += 4) { const v = (rnd() * 255) | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0); GRAIN.push(c);
    }
  },
  draw(ctx, u, t, IMG) {
    if (u < 4) sceneMacro(ctx, u, IMG);
    else if (u < 16) {
      if (u >= 7.3) sceneBottle(ctx, u, IMG);
      if (u < 8.05) sceneSplit(ctx, u, IMG);
    } else if (u < 20) sceneLiquid(ctx, u, IMG);
    else sceneEnd(ctx, u, IMG);
  },
  post(ctx, u, t) {
    ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(GRAIN[Math.floor(t * 24) % GRAIN.length], 0, 0, W, H);
  },
});
