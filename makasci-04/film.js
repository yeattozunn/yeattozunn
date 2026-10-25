// Makasçı: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// beats.json is 60 bpm from 0, so u == seconds; times below are the VO edit's (audio/score.py).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, wobble, font, layout, text, fill, rrect, hash01, noise1, mix, bump } = M;

const C = {
  sky0: '#070B1A', sky1: '#1A2650', snow: '#E8EEF8', ink: '#05070F', wood: '#2A1C14', wood2: '#3A281C',
  lamp: '#FFC861', red: '#E5322D', yel: '#FFD23F', green: '#2FA84F', steel: '#3A4256', paper: '#E9E1CC',
};
const DISPLAY = 'Display', UI = 'UI';

// ---------------------------------------------------------------- shared art
function sky(ctx, dark = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(C.sky0, '#000000', dark)); g.addColorStop(1, mix(C.sky1, '#05070F', dark));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function stars(ctx, t, n = 70) {
  for (let i = 0; i < n; i++) {
    const a = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + i * 7.1));
    ctx.fillStyle = `rgba(255,255,255,${a * 0.6})`;
    ctx.fillRect(hash01(i, 3) * W, hash01(i, 4) * H * 0.45, 3, 3);
  }
}
function mountains(ctx, base, seed, col, amp) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, base - amp * (0.5 + 0.5 * noise1(x / 260, seed)) - amp * 0.6 * Math.abs(noise1(x / 90, seed + 9)));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // snow caps
  ctx.fillStyle = 'rgba(232,238,248,0.10)';
  ctx.fill();
}
function snowfall(ctx, t, n = 140, speed = 1, wind = 60) {
  for (let i = 0; i < n; i++) {
    const z = 0.4 + hash01(i, 11) * 0.9;
    const y = ((hash01(i, 12) * (H + 40) + t * 90 * z * speed) % (H + 40)) - 20;
    const x = ((hash01(i, 13) * W + t * wind * z + Math.sin(t * 1.3 + i) * 18 * z) % W + W) % W;
    ctx.fillStyle = `rgba(232,238,248,${0.35 + 0.5 * z})`;
    ctx.beginPath(); ctx.arc(x, y, 2.2 + 3.5 * z, 0, M.TAU); ctx.fill();
  }
}
function glow(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function rails(ctx, y, scale = 1) {
  ctx.fillStyle = '#141826';
  for (let x = -40; x < W + 40; x += 70 * scale) ctx.fillRect(x, y - 6 * scale, 34 * scale, 26 * scale);
  ctx.fillStyle = '#7C869C'; ctx.fillRect(0, y - 2 * scale, W, 7 * scale); ctx.fillRect(0, y + 14 * scale, W, 7 * scale);
}
function station(ctx, x, y, s, lit = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#20263A'; ctx.fillRect(-170, -190, 340, 190);        // body
  ctx.fillStyle = '#0D1020'; ctx.beginPath(); ctx.moveTo(-200, -185); ctx.lineTo(0, -280); ctx.lineTo(200, -185); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.snow; ctx.beginPath(); ctx.moveTo(-205, -183); ctx.lineTo(0, -283); ctx.lineTo(205, -183); ctx.lineTo(195, -176); ctx.lineTo(0, -268); ctx.lineTo(-195, -176); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mix('#1A1F30', C.lamp, lit); ctx.fillRect(-120, -140, 90, 80);   // window
  ctx.fillStyle = '#141826'; ctx.fillRect(-79, -140, 8, 80); ctx.fillRect(-120, -104, 90, 8);
  ctx.fillStyle = '#10131F'; ctx.fillRect(40, -130, 70, 130);            // door
  ctx.fillStyle = C.paper; rrect(ctx, -110, -178, 220, 30, 4); ctx.fill();
  ctx.fillStyle = C.ink; ctx.font = font(22, 700, UI); ctx.textAlign = 'center';
  ctx.fillText('KIZILKAYA', 0, -156); ctx.textAlign = 'left';
  ctx.restore();
  if (lit > 0) glow(ctx, x - 75 * s, y - 100 * s, 260 * s, 'rgba(255,200,97,A)', 0.35 * lit);
}
function signal(ctx, x, y, s, on, col = C.red) {
  ctx.fillStyle = '#0B0E18'; ctx.fillRect(x - 6 * s, y, 12 * s, 330 * s);
  rrect(ctx, x - 26 * s, y - 70 * s, 52 * s, 90 * s, 12 * s); ctx.fill();
  ctx.fillStyle = on ? col : '#3A1414'; ctx.beginPath(); ctx.arc(x, y - 40 * s, 15 * s, 0, M.TAU); ctx.fill();
  if (on) glow(ctx, x, y - 40 * s, 120 * s, 'rgba(229,50,45,A)', 0.55);
}
// round-headed character. opts: cap (conductor), eyes 'dot'|'shadow'|'wide', smile 0..1, look -1..1
function head(ctx, x, y, r, o = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = o.skin || '#ECECEA'; ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fill();
  if (o.shadow) { const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, `rgba(5,7,15,${o.shadow})`); g.addColorStop(0.65, `rgba(5,7,15,${o.shadow * 0.5})`); g.addColorStop(1, 'rgba(5,7,15,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fill(); }
  const lx = (o.look || 0) * r * 0.18;
  if (o.eyes === 'shadow') {
    ctx.fillStyle = '#05070F';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * r * 0.33 + lx, -r * 0.08, r * 0.17, r * 0.13, 0, 0, M.TAU); ctx.fill(); }
    if (o.glint) { ctx.fillStyle = `rgba(255,255,255,${o.glint})`; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * r * 0.33 + lx, -r * 0.08, r * 0.035, 0, M.TAU); ctx.fill(); } }
  } else {
    const er = o.eyes === 'wide' ? r * 0.11 : r * 0.07;
    ctx.fillStyle = '#05070F';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * r * 0.32 + lx, -r * 0.08, er, 0, M.TAU); ctx.fill(); }
    if (o.blink) { ctx.fillStyle = o.skin || '#ECECEA'; ctx.fillRect(-r * 0.5 + lx, -r * 0.08 - er - 1, r, er * 2 * o.blink + 1); }
  }
  ctx.strokeStyle = '#05070F'; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
  ctx.beginPath();
  if (o.mouth === 'o') { ctx.fillStyle = '#05070F'; ctx.ellipse(lx, r * 0.4, r * 0.09, r * 0.13, 0, 0, M.TAU); ctx.fill(); }
  else { const sm = o.smile ?? 0; ctx.moveTo(-r * 0.25 + lx, r * 0.38); ctx.quadraticCurveTo(lx, r * 0.38 + sm * r * 0.28, r * 0.25 + lx, r * 0.38); ctx.stroke(); }
  if (o.cap) {
    ctx.fillStyle = '#1B2236';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 1.02, r * 0.42, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(-r * 0.98, -r * 0.66, r * 1.96, r * 0.2);
    ctx.fillStyle = '#0E1322'; ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 0.46, r * 1.1, r * 0.13, 0, 0, M.TAU); ctx.fill();
    ctx.fillStyle = '#C9A13B'; ctx.beginPath(); ctx.arc(0, -r * 0.78, r * 0.11, 0, M.TAU); ctx.fill();
  }
  if (o.beanie) {
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 1.0, r * 0.62, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#A82420'; ctx.fillRect(-r * 1.0, -r * 0.6, r * 2.0, r * 0.2);
  }
  ctx.restore();
}
function body(ctx, x, y, w, h, col) {
  ctx.fillStyle = col; rrect(ctx, x - w / 2, y, w, h, w * 0.35); ctx.fill();
}
function camera(ctx, s, cx, cy, sx = 0, sy = 0) { ctx.translate(cx + sx, cy + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
const shakeAt = (t, times, amp, dec = 9) => {
  let x = 0, y = 0;
  for (const k of times) { const d = t - k; if (d < 0 || d > 0.6) continue; const e = amp * Math.exp(-d * dec); x += e * Math.sin(d * 90); y += e * Math.cos(d * 73); }
  return [x, y];
};

function clockFace(ctx, x, y, r, hh, mm, ss) {
  ctx.fillStyle = '#F2EBDA'; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
  ctx.strokeStyle = '#1A1208'; ctx.lineWidth = r * 0.07; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * M.TAU; ctx.lineWidth = r * (i % 3 ? 0.025 : 0.05); ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * r * 0.78, y - Math.cos(a) * r * 0.78); ctx.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); ctx.stroke(); }
  const hand = (a, len, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len); ctx.stroke(); };
  hand(((hh % 12) + mm / 60) / 12 * M.TAU, r * 0.48, r * 0.07, '#1A1208');
  hand((mm + ss / 60) / 60 * M.TAU, r * 0.72, r * 0.045, '#1A1208');
  hand(ss / 60 * M.TAU, r * 0.8, r * 0.018, C.red);
  ctx.fillStyle = '#1A1208'; ctx.beginPath(); ctx.arc(x, y, r * 0.05, 0, M.TAU); ctx.fill();
}
function interiorWall(ctx) {
  ctx.fillStyle = C.wood; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 120) { ctx.fillStyle = x / 120 % 2 ? C.wood2 : C.wood; ctx.fillRect(x, 0, 116, H); }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
}
function warnTri(ctx, x, y, s) {
  ctx.fillStyle = C.yel; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.1, y + s * 0.85); ctx.lineTo(x - s * 1.1, y + s * 0.85); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillRect(x - s * 0.1, y - s * 0.45, s * 0.2, s * 0.78); ctx.fillRect(x - s * 0.1, y + s * 0.45, s * 0.2, s * 0.2);
}
function train(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // carriages to the left of the locomotive (x<0)
  for (let c = 0; c < 4; c++) {
    const cx = -560 - c * 560;
    ctx.fillStyle = '#1C2234'; rrect(ctx, cx, -300, 540, 260, 18); ctx.fill();
    ctx.fillStyle = '#5A1C1A'; ctx.fillRect(cx, -110, 540, 18);
    ctx.fillStyle = '#05070F'; for (let wi = 0; wi < 5; wi++) { rrect(ctx, cx + 30 + wi * 102, -260, 76, 90, 10); ctx.fill(); }
    ctx.fillStyle = C.snow; rrect(ctx, cx - 6, -312, 552, 20, 10); ctx.fill();
    ctx.fillStyle = '#0A0C14'; for (const wx of [80, 460]) { ctx.beginPath(); ctx.arc(cx + wx, -36, 34, 0, M.TAU); ctx.fill(); }
  }
  // locomotive
  ctx.fillStyle = '#2A3046'; rrect(ctx, -540, -340, 620, 300, 26); ctx.fill();
  ctx.fillStyle = C.red; ctx.fillRect(-540, -130, 620, 26);
  ctx.fillStyle = '#05070F'; rrect(ctx, -60, -300, 110, 110, 14); ctx.fill();
  ctx.fillStyle = C.snow; rrect(ctx, -546, -352, 632, 22, 10); ctx.fill();
  ctx.fillStyle = '#0A0C14'; for (const wx of [-440, -260, -60]) { ctx.beginPath(); ctx.arc(wx, -36, 40, 0, M.TAU); ctx.fill(); }
  ctx.fillStyle = '#FFF6DE'; ctx.beginPath(); ctx.arc(70, -200, 22, 0, M.TAU); ctx.fill();
  ctx.restore();
  glow(ctx, x + 70 * s, y - 200 * s, 380 * s, 'rgba(255,240,200,A)', 0.7);
}

function captions(ctx, t) {
  const c = CAP.find(([a, b]) => t >= a - 0.05 && t < b + 0.35);
  if (!c) return;
  const [a, b, s, hl] = c;
  const words = s.split(' ');
  const size = 104, f = font(size, 900, DISPLAY), GAP = size * 0.3;
  ctx.font = f;
  // greedy wrap to 2 lines within safe width
  const maxW = W - 120, lines = [[]];
  let lw = 0;
  for (const w of words) {
    const ww = ctx.measureText(w).width + GAP;
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(w); lw += ww;
  }
  const y0 = H * 0.76 - (lines.length - 1) * size * 0.55;
  let wi = 0;
  lines.forEach((ln, li) => {
    const total = ln.reduce((s2, w2) => s2 + ctx.measureText(w2).width, 0) + GAP * (ln.length - 1);
    let x = (W - total) / 2;
    for (const w of ln) {
      const at = a + (b - a) * (wi / words.length) - 0.04;
      const p = springU(t, at, SPRING.bouncy);
      const ww = ctx.measureText(w).width;
      if (p > 0) {
        const col = hl[w] || '#FFFFFF';
        ctx.save(); ctx.translate(x + ww / 2, y0 + li * size * 1.08); ctx.scale(lerp(0.6, 1, clamp(p)) * (1 + 0.1 * (p - clamp(p))), lerp(0.6, 1, clamp(p)));
        ctx.lineJoin = 'round'; ctx.lineWidth = 18; ctx.strokeStyle = '#05070F'; ctx.textAlign = 'center';
        ctx.strokeText(w, 0, 0); ctx.fillStyle = col; ctx.fillText(w, 0, 0); ctx.textAlign = 'left';
        ctx.restore();
      }
      x += ww + GAP; wi++;
    }
  });
}

// ---------------------------------------------------------------- episode kit (shared by Gece 3+)
const caps = (off, list) => list.map(([a, b, s, h = {}]) => [a + off, b + off, s, h]);
function radioBox(ctx, t, o = {}) {
  interiorWall(ctx);
  const [sx, sy] = shakeAt(t, o.shakes || [], 26);
  ctx.save(); camera(ctx, o.zoom || 1, W / 2, H * 0.42, sx, sy);
  ctx.fillStyle = '#1A110B'; ctx.fillRect(0, H * 0.62, W, H * 0.4);
  const x = W * 0.12, y = H * 0.26, w = W * 0.76, h = H * 0.34;
  ctx.fillStyle = '#4A3424'; rrect(ctx, x, y, w, h, 40); ctx.fill();
  ctx.fillStyle = '#5E4430'; rrect(ctx, x + 20, y + 20, w - 40, h - 40, 28); ctx.fill();
  // speaker grill; o.smile bends the holes into a grin
  ctx.fillStyle = '#2A1C12';
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
    const u = (i - 4) / 4, bend = (o.smile || 0) * (1 - u * u) * 60;
    const dark = o.smile && j > 5 && Math.abs(u) < 0.9 ? '#05030A' : '#2A1C12';
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(x + 90 + i * 34, y + 110 + j * 46 + bend * (j > 5 ? 1 : 0), 9, 0, M.TAU); ctx.fill();
  }
  const dx = x + w * 0.56, dw = w * 0.36;
  ctx.fillStyle = '#0B1A10'; rrect(ctx, dx, y + 90, dw, 170, 14); ctx.fill();
  if (o.screen) {
    ctx.fillStyle = o.screenCol || '#7CFF9A'; ctx.font = font(30, 700, UI);
    o.screen.forEach((l, i) => ctx.fillText(l, dx + 16, y + 135 + i * 40));
  } else {
    const talk = o.talk ? o.talk(t) : 1;
    ctx.strokeStyle = o.screenCol || '#7CFF9A'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const px = dx + 14 + i / 60 * (dw - 28);
      const py = y + 175 + (6 + 55 * talk * Math.abs(noise1(t * 6 + i * 0.25, 4))) * Math.sin(i * 1.7 + t * 40);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = o.screenCol || '#7CFF9A'; ctx.font = font(26, 700, UI); ctx.fillText(o.label || 'KANAL 3', dx + 18, y + 125);
  }
  const on = Math.floor(t * 3) % 2 === 0;
  ctx.fillStyle = on ? C.red : '#4A1010'; ctx.beginPath(); ctx.arc(x + w - 70, y + 60, 16, 0, M.TAU); ctx.fill();
  if (on) glow(ctx, x + w - 70, y + 60, 180, 'rgba(229,50,45,A)', 0.6);
  ctx.strokeStyle = '#9AA3B5'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + w - 120, y); ctx.lineTo(x + w + 20, y - 260); ctx.stroke();
  ctx.restore();
}
// rule card; lines: [[at, ['line', 'line'], colour], ...]
function ruleCard(ctx, t, t0, tag, lines) {
  fill(ctx, '#0A0608');
  glow(ctx, W / 2, H * 0.45, 1100, 'rgba(229,50,45,A)', 0.18);
  const k = springU(t, t0, SPRING.gentle);
  const [sx, sy] = shakeAt(t, lines.map((l) => l[0]), 14);
  ctx.save(); ctx.translate(sx, sy + (1 - k) * 300); ctx.globalAlpha = clamp(k * 1.5);
  const x = 70, y = 420, w = W - 140, h = 1180;
  ctx.fillStyle = '#16090B'; rrect(ctx, x, y, w, h, 46); ctx.fill();
  warnTri(ctx, x + 100, y + 110, 46);
  ctx.fillStyle = '#F3EDE2'; ctx.font = font(52, 900, DISPLAY); ctx.fillText('TELSİZ MESAJI', x + 180, y + 110);
  ctx.fillStyle = '#B9A9A6'; ctx.font = font(30, 700, UI); ctx.fillText('şimdi · kaynak bilinmiyor', x + 182, y + 158);
  ctx.fillStyle = '#8E1F1C'; rrect(ctx, x + 30, y + 210, w - 60, h - 250, 30); ctx.fill();
  ctx.fillStyle = C.ink; rrect(ctx, x + 80, y + 260, 230, 66, 33); ctx.fill();
  ctx.fillStyle = C.yel; ctx.font = font(40, 900, DISPLAY); ctx.fillText(tag, x + 114, y + 309);
  lines.forEach(([at, ls, col], i) => {
    const p = springU(t, at - 0.08, SPRING.bouncy);
    if (p <= 0) return;
    ctx.save(); ctx.translate(x + 80, y + 440 + i * 240); ctx.scale(lerp(1.4, 1, clamp(p)), lerp(1.4, 1, clamp(p))); ctx.globalAlpha = clamp(p * 2);
    ctx.fillStyle = col; ctx.font = font(76, 900, DISPLAY);
    ls.forEach((l, j) => ctx.fillText(l, 0, j * 84));
    ctx.restore();
  });
  ctx.restore();
}
function endCard(ctx, t, T0, words, a, b, next) {
  fill(ctx, '#0A0406');
  glow(ctx, W / 2, H * 0.45, 1200, 'rgba(229,50,45,A)', 0.3);
  words.forEach(([s, col], i) => {
    const p = springU(t, T0 + i * 0.18, SPRING.bouncy);
    if (p <= 0) return;
    const size = s.length > 6 ? 190 : 230;
    ctx.save(); ctx.translate(W / 2, 640 + i * 240); ctx.scale(lerp(1.6, 1, clamp(p)), lerp(1.6, 1, clamp(p))); ctx.globalAlpha = clamp(p * 2);
    text(ctx, s, 0, 0, font(size, 900, DISPLAY), col, 'center', -0.02 * size);
    ctx.restore();
  });
  const btn = (bx, label, col, at) => {
    const p = springU(t, at, SPRING.bouncy); if (p <= 0) return;
    const pulse = 1 + 0.04 * Math.sin((t - at) * 6) * prog(t, at + 0.5, at + 1);
    ctx.save(); ctx.translate(bx, 1440); ctx.scale(p * pulse, p * pulse);
    ctx.fillStyle = col; rrect(ctx, -225, -80, 450, 160, 80); ctx.fill();
    text(ctx, label, 0, 30, font(label.length > 5 ? 64 : 80, 900, DISPLAY), '#FFFFFF', 'center');
    ctx.restore();
  };
  btn(W * 0.28, a, C.green, T0 + 0.8);
  btn(W * 0.72, b, C.red, T0 + 1.05);
  const tp = E.outCubic(prog(t, T0 + 1.8, T0 + 2.3));
  if (tp > 0) {
    ctx.globalAlpha = tp;
    text(ctx, 'YORUMLARA YAZ', W / 2, 1660 + (1 - tp) * 30, font(58, 900, DISPLAY), C.yel, 'center');
    text(ctx, next, W / 2, 1740 + (1 - tp) * 30, font(36, 700, UI), '#B9A9A6', 'center');
    ctx.globalAlpha = 1;
  }
}
function hudEp(ctx, t, gece, clock, endAt) {
  if (t >= endAt) return;
  ctx.fillStyle = Math.floor(t * 2) % 2 ? C.red : '#8E1F1C'; ctx.beginPath(); ctx.arc(84, 162, 12, 0, M.TAU); ctx.fill();
  text(ctx, gece, 108, 176, font(40, 900, DISPLAY), C.red);
  text(ctx, clock, 70, 290, font(110, 900, DISPLAY), '#FFFFFF');
  text(ctx, 'KIZILKAYA İSTASYONU', 74, 345, font(32, 700, UI), C.yel);
}
// VHS-style rewind between the cold open and "baştan anlatayım"
function rewind(ctx, t, a, b) {
  const p = prog(t, a, b); if (p <= 0 || p >= 1) return;
  const k = Math.sin(p * Math.PI);
  for (let i = 0; i < 14; i++) { const y = ((hash01(i, Math.floor(t * 30)) * H) | 0); ctx.fillStyle = `rgba(255,255,255,${0.25 * k})`; ctx.fillRect(0, y, W, 3 + 20 * hash01(i, 2)); }
  ctx.fillStyle = `rgba(10,0,0,${0.35 * k})`; ctx.fillRect(0, 0, W, H);
  text(ctx, '«« BAŞTAN', W / 2, H * 0.3, font(90, 900, DISPLAY), `rgba(255,255,255,${k})`, 'center');
}
// the girl on the rails, seen from the cabin window; o.near 0..1 brings her to the glass
function girl(ctx, x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#C9C2D6'; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(70, 0); ctx.lineTo(40, -230); ctx.lineTo(-40, -230); ctx.closePath(); ctx.fill();   // dress
  ctx.fillStyle = '#2A2238'; ctx.beginPath(); ctx.ellipse(0, -300, 82, 92, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();   // hair
  ctx.restore();
  head(ctx, x, y - 290 * s, 62 * s, { skin: '#E4E2EA', eyes: 'shadow', smile: o.smile ?? 0, glint: o.glint || 0 });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#2A2238'; ctx.fillRect(-70, -330, 30, 200); ctx.fillRect(40, -330, 30, 200);   // long hair over the shoulders
  const wave = o.wave ? Math.sin(t * 5) * 0.5 : 0;
  ctx.strokeStyle = '#C9C2D6'; ctx.lineWidth = 22; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(40, -200); ctx.lineTo(40 + 80 * Math.cos(-1.2 + wave), -200 + 80 * Math.sin(-1.2 + wave)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-40, -200); ctx.lineTo(-90, -110); ctx.stroke();
  if (o.lantern !== 0) {   // lantern in the left hand
    const a = o.lantern ?? 1;
    ctx.fillStyle = '#3A3020'; ctx.fillRect(-112, -110, 44, 60);
    ctx.fillStyle = `rgba(255,200,110,${a})`; ctx.fillRect(-104, -102, 28, 44);
    ctx.restore();
    glow(ctx, x - 90 * s, y - 80 * s, 260 * s, 'rgba(255,190,100,A)', 0.55 * a);
  } else ctx.restore();
}

// ---------------------------------------------------------------- Gece 4
const VO = { hook: 0.3, b: 9.2, merkez: 25.0, c: 35.3, baba: 41.5, d: 49.5 };
const END = VO.d + 7.6;
const CAP = [
  ...caps(VO.hook, [[0, 1.82, 'TELSİZDEN BABAMIN SESİ GELDİ', { 'BABAMIN': C.yel }], [2.97, 3.96, 'SONRA TELSİZ...'], [4.65, 5.76, 'KENDİ KENDİNE GÜLDÜ', { 'GÜLDÜ': C.red }], [7.09, 8.36, 'AMA BAŞTAN ANLATAYIM']]),
  ...caps(VO.b, [[0, 1.02, 'RAYA İNMEDİM', { 'İNMEDİM': C.yel }], [1.38, 4.6, 'KIZ FENERİYLE BANA UZUN UZUN BAKTI...'], [5.9, 8.3, 'SONRA FENER SÖNDÜ', { 'SÖNDÜ': C.red }], [8.3, 10.7, 'SABAH PENCEREME BAKTIM'], [14.3, 15.23, "MERKEZ'İ ARADIM", { "MERKEZ'İ": C.yel }]]),
  ...caps(VO.merkez, [[0, 2.5, 'KIZILKAYA MI? EVLAT,'], [2.5, 5.0, "O İSTASYON 96'DAN BERİ KAPALI", { 'KAPALI': C.red }], [5.0, 6.6, 'ORADA MAKASÇI YOK', { YOK: C.red }], [6.6, 9.72, 'SON MAKASÇI RIZA USTA... OĞLUYLA BİRLİKTE KAYBOLDU', { 'OĞLUYLA': C.red }]]),
  ...caps(VO.c, [[0, 0.54, 'RIZA...', { 'RIZA...': C.yel }], [1.11, 1.75, 'BABAMIN ADI', { 'BABAMIN': C.red }], [3.91, 5.56, 'GECE ÜÇTE TELSİZ YİNE AÇILDI']]),
  ...caps(VO.baba, [[0, 0.66, 'EVLAT...'], [1.23, 2.67, 'KURALLARI YAZAN BEN DEĞİLİM', { 'DEĞİLİM': C.red }], [3.81, 5.21, 'SEN DE O GECE TRENDEYDİN', { 'TRENDEYDİN': C.red }], [6.48, 7.39, 'TELSİZİ KAPAT', { 'KAPAT': C.yel }]]),
  ...caps(VO.d, [[0, 2.45, 'TELSİZİN EKRANINDA TEK BİR SATIR BELİRDİ']]),
];
const LAUGH = VO.hook + 4.65, OUT = VO.b + 5.9, WRITE = VO.b + 11.4, TRAINFLASH = VO.baba + 3.81;
const HITS = [
  [0, 'cold open', 'sub', { len: 2 }],
  [LAUGH, 'radio laughs', 'impact'],
  [VO.hook + 6.8, 'rewind', 'whoosh', { len: 0.8, from: 3000, to: 300 }],
  [OUT, 'lantern out', 'sub', { len: 1.2 }],
  [WRITE, 'frost letters', 'swell'],
  [VO.merkez, 'phone', 'blip', { pitch: 'E5' }],
  [VO.merkez + 6.6, 'newspaper', 'thud'],
  [VO.c + 1.11, 'my father', 'impact'],
  [VO.baba, 'father voice', 'sub', { len: 1.5 }],
  [TRAINFLASH, 'train flash', 'impact'],
  [VO.d + 3.28, 'kural 6', 'thud'], [VO.d + 4.52, 'kapatma', 'thud'],
  [END, 'end card', 'impact'], [END + 0.8, 'buttons', 'pop', { pitch: 'A4' }],
];
const KNOCKS = [];

function railView(ctx, t, o = {}) {
  sky(ctx, 0.45); stars(ctx, t, 50);
  ctx.save(); camera(ctx, o.zoom || 1, W / 2, H * 0.62);
  mountains(ctx, H * 0.5, 2, '#0B1128', 240);
  ctx.fillStyle = '#C5CFDF'; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  rails(ctx, H * 0.7, 1.1);
  if (o.girl) girl(ctx, W * 0.5, H * 0.71, 1.35, t, o.girl);
  ctx.restore();
  if (o.dark) { ctx.fillStyle = `rgba(2,3,8,${o.dark})`; ctx.fillRect(0, 0, W, H); }
  snowfall(ctx, t, 140);
  ctx.fillStyle = '#120C08'; ctx.fillRect(0, 0, W, 110); ctx.fillRect(0, H - 250, W, 250); ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H); ctx.fillRect(W / 2 - 10, 0, 20, 110);
}
// frosted morning window; letters written by a small finger appear stroke by stroke
function frostWindow(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7B8597'); g.addColorStop(1, '#B9C2D0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  mountains(ctx, H * 0.5, 2, '#5A6378', 220);
  ctx.fillStyle = '#E4E9F2'; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  ctx.fillStyle = 'rgba(235,240,248,0.72)'; ctx.fillRect(0, 0, W, H);      // frost
  for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(hash01(i, 31) * W, hash01(i, 32) * H, 30 + 80 * hash01(i, 33), 0, M.TAU); ctx.fill(); }
  const lines = ['BENİ', 'İÇERİ', 'AL'];
  const p = prog(t, WRITE, WRITE + 2.6);
  ctx.save();
  lines.forEach((l, i) => {
    const q = clamp(p * 3 - i);
    if (q <= 0) return;
    ctx.save(); ctx.translate(W / 2, H * 0.36 + i * 210); ctx.rotate(-0.03 + i * 0.02);
    ctx.font = font(190, 900, DISPLAY); ctx.textAlign = 'center';
    const w = ctx.measureText(l).width;
    ctx.beginPath(); ctx.rect(-w / 2 - 10, -200, (w + 20) * q, 260); ctx.clip();
    ctx.fillStyle = 'rgba(60,70,90,0.85)'; ctx.fillText(l, 0, 0);
    // drips under the letters
    ctx.fillStyle = 'rgba(60,70,90,0.5)'; for (let k = 0; k < 5; k++) ctx.fillRect(-w / 2 + hash01(k + i * 9, 40) * w, 10, 6, 20 + 60 * clamp((t - WRITE - i) * 0.5) * hash01(k, 41));
    ctx.restore();
  });
  ctx.restore();
  ctx.fillStyle = '#120C08'; ctx.fillRect(0, 0, W, 110); ctx.fillRect(0, H - 250, W, 250); ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H);
}
function deskPhone(ctx, t) {
  interiorWall(ctx);
  ctx.fillStyle = '#1A110B'; ctx.fillRect(0, H * 0.62, W, H * 0.4);
  const x = W / 2, y = H * 0.5;
  ctx.fillStyle = '#121212'; rrect(ctx, x - 300, y - 40, 600, 260, 60); ctx.fill();
  ctx.fillStyle = '#1E1E1E'; rrect(ctx, x - 360, y - 170, 720, 120, 60); ctx.fill();      // handset
  ctx.fillStyle = '#E9E1CC'; ctx.beginPath(); ctx.arc(x, y + 90, 100, 0, M.TAU); ctx.fill();
  ctx.fillStyle = '#121212'; for (let i = 0; i < 10; i++) { const a = i / 10 * M.TAU * 0.8 - 2.2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 70, y + 90 + Math.sin(a) * 70, 14, 0, M.TAU); ctx.fill(); }
  const talk = 0.5 + 0.5 * Math.abs(noise1(t * 7, 3));
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  for (let k = 1; k <= 3; k++) { ctx.globalAlpha = talk * (1 - k * 0.25); ctx.beginPath(); ctx.arc(x + 380, y - 110, 30 * k, -0.8, 0.8); ctx.stroke(); }
  ctx.globalAlpha = 1;
  text(ctx, 'MERKEZ', W / 2, H * 0.3, font(110, 900, DISPLAY), '#FFFFFF', 'center');
  text(ctx, 'DDY · HAT KONTROL', W / 2, H * 0.3 + 60, font(34, 700, UI), '#B9A9A6', 'center');
}
function paper96(ctx, t) {
  fill(ctx, '#140D08');
  glow(ctx, W * 0.5, H * 0.42, 1000, 'rgba(255,200,97,A)', 0.22);
  const t0 = VO.merkez + 6.6;
  ctx.save(); camera(ctx, 1.0 * 1.12 ** E.inOutSine(prog(t, t0, VO.c)), W * 0.45, H * 0.5);
  ctx.translate(W / 2, H * 0.44); ctx.rotate(-0.05); ctx.translate(-W / 2, -H * 0.44);
  const x = 110, y = 400, w = W - 220, h = 960;
  ctx.fillStyle = C.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2A2016'; ctx.font = font(30, 700, UI); ctx.fillText('DOĞU POSTASI · 14 ŞUBAT 1996', x + 50, y + 70);
  ctx.fillRect(x + 50, y + 92, w - 100, 4);
  ctx.font = font(92, 900, DISPLAY); ctx.fillText('KIZILKAYA', x + 50, y + 200); ctx.fillText('TRENİ KARDA', x + 50, y + 300); ctx.fillText('KAYBOLDU', x + 50, y + 400);
  ctx.fillStyle = '#3A3024'; ctx.fillRect(x + 50, y + 450, w - 100, 300);
  ctx.fillStyle = '#2A2016'; ctx.font = font(34, 700, UI);
  ['Makinist Rıza Usta ve yanındaki', '9 yaşındaki oğlundan haber yok.', 'İstasyon kapatıldı.'].forEach((l, i) => ctx.fillText(l, x + 50, y + 820 + i * 52));
  const cp = E.outCubic(prog(t, t0 + 1.3, t0 + 2.1));
  if (cp > 0) { ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(x + 300, y + 862, 300, 46, -0.02, -0.4, -0.4 + cp * M.TAU * 1.02); ctx.stroke(); }
  ctx.restore();
}
function photoFatherSon(ctx, t) {
  interiorWall(ctx);
  glow(ctx, W / 2, H * 0.42, 900, 'rgba(255,200,97,A)', 0.18);
  const z = 1.0 * 1.8 ** E.inOutCubic(prog(t, VO.c + 1.0, VO.c + 4.5));
  ctx.save(); camera(ctx, z, W * 0.62, H * 0.42);
  const x = 170, y = 380, w = W - 340, h = 860;
  ctx.fillStyle = '#5E4430'; ctx.fillRect(x - 30, y - 30, w + 60, h + 60);
  ctx.fillStyle = C.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#9AA6B8'; ctx.fillRect(x + 30, y + 30, w - 60, h - 180);
  ctx.fillStyle = '#2A3046'; ctx.fillRect(x + 30, y + 360, w - 60, 200);       // locomotive behind
  body(ctx, x + w * 0.38, y + 420, 240, 330, '#1B2236');
  head(ctx, x + w * 0.38, y + 340, 90, { cap: true, eyes: 'dot', smile: 0.5 });
  body(ctx, x + w * 0.66, y + 470, 150, 260, '#2C3A5E');
  head(ctx, x + w * 0.66, y + 400, 64, { beanie: true, eyes: 'dot', smile: 0.6 });
  ctx.fillStyle = '#2A2016'; ctx.font = font(34, 700, UI); ctx.textAlign = 'center';
  ctx.fillText('Rıza ve oğlu · Ocak 1996', x + w / 2, y + h - 60); ctx.textAlign = 'left';
  ctx.restore();
}
function trainFlash(ctx, t) {      // the boy in the red beanie, behind a dark carriage window
  fill(ctx, '#05060C');
  ctx.fillStyle = '#1C2234'; ctx.fillRect(0, H * 0.2, W, H * 0.55);
  ctx.fillStyle = '#0A0D16'; rrect(ctx, W * 0.2, H * 0.28, W * 0.6, H * 0.36, 30); ctx.fill();
  head(ctx, W / 2, H * 0.48, 170, { beanie: true, eyes: 'shadow', skin: '#C9CED8', smile: -0.2 });
  ctx.fillStyle = 'rgba(160,190,230,0.12)'; ctx.fillRect(W * 0.2, H * 0.28, W * 0.6, H * 0.36);
  for (let i = 0; i < 18; i++) { const y = hash01(i, Math.floor(t * 30)) * H; ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, y, W, 4); }
}
const CLOCK = (t) => t < VO.b ? '03:00' : t < OUT + 1 ? '03:01' : t < VO.baba ? '08:31' : '03:00';
M.film({
  fonts: [font(100, 900, DISPLAY), font(40, 700, UI)],
  hits: HITS,
  samples: 8,
  draw(ctx, u, t) {
    if (t < VO.b) {
      radioBox(ctx, t, { smile: E.outBack(prog(t, LAUGH - 0.3, LAUGH + 0.4)), shakes: [LAUGH, LAUGH + 0.35, LAUGH + 0.7], screenCol: t > LAUGH ? C.red : null, zoom: 1.0 * 1.2 ** E.inOutSine(prog(t, 0, VO.b)) });
      rewind(ctx, t, VO.hook + 6.8, VO.hook + 8.1);
    }
    else if (t < OUT + 1.2) railView(ctx, t, { girl: { lantern: 1 - prog(t, OUT, OUT + 0.25), smile: 0 }, zoom: 1.0 * 1.3 ** E.inOutSine(prog(t, VO.b, OUT)), dark: 0.5 * prog(t, OUT, OUT + 0.3) });
    else if (t < VO.merkez) frostWindow(ctx, t);
    else if (t < VO.merkez + 6.6) deskPhone(ctx, t);
    else if (t < VO.c) paper96(ctx, t);
    else if (t < VO.baba) photoFatherSon(ctx, t);
    else if (t >= TRAINFLASH && t < TRAINFLASH + 1.5) trainFlash(ctx, t);
    else if (t < VO.d) radioBox(ctx, t, { screenCol: C.red, label: 'KANAL ?', shakes: [VO.baba, TRAINFLASH + 1.5] });
    else if (t < VO.d + 3.1) radioBox(ctx, t, { screenCol: C.red, shakes: [VO.d], zoom: 1.0 * 1.2 ** E.inOutSine(prog(t, VO.d, VO.d + 3.1)) });
    else if (t < END) ruleCard(ctx, t, VO.d + 3.1, 'KURAL 6', [[VO.d + 4.52, ['TELSİZİ ASLA', 'KAPATMA.'], C.yel]]);
    else endCard(ctx, t, END, [['TELSİZİ', '#FFFFFF'], ['KAPATIR', C.red], ['MISIN?', '#FFFFFF']], 'KAPAT', 'KAPATMA', 'GECE 5 YAKINDA');
  },
  post(ctx, u, t) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fr = Math.floor(t * 24);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 * hash01(i, fr)})`; ctx.fillRect(hash01(i, fr + 1) * W, hash01(i, fr + 2) * H, 2, 2); }
    if (t < 0.3) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.3})`; ctx.fillRect(0, 0, W, H); }
    const D = window.DURATION; if (t > D - 0.6) { ctx.fillStyle = `rgba(0,0,0,${(t - D + 0.6) / 0.6})`; ctx.fillRect(0, 0, W, H); }
    hudEp(ctx, t, 'GECE 4', CLOCK(t), END);
    captions(ctx, t);
  },
});
