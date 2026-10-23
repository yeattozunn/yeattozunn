// Makasçı - Gece 1: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// beats.json is 60 bpm from 0, so u == seconds; times below are the VO edit's (audio/score.py).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, wobble, font, layout, text, fill, rrect, hash01, noise1, mix, bump } = M;

const C = {
  sky0: '#070B1A', sky1: '#1A2650', snow: '#E8EEF8', ink: '#05070F', wood: '#2A1C14', wood2: '#3A281C',
  lamp: '#FFC861', red: '#E5322D', yel: '#FFD23F', green: '#2FA84F', steel: '#3A4256', paper: '#E9E1CC',
};
const DISPLAY = 'Display', UI = 'UI';
const VO_A = 0.4, VO_BABA = 32.2, VO_B = 37.0;

// ---------------------------------------------------------------- captions (VO phrase times)
// [start, end, text, {word: colour}]
const CAP = [
  ...[
    [0, 1.94, "KIZILKAYA'DA GECE MAKASÇISIYIM", { "KIZILKAYA'DA": C.yel }],
    [2.49, 3.82, 'BURAYA ARTIK TREN UĞRAMIYOR', { TREN: C.yel }],
    [4.47, 5.06, 'EN AZINDAN...', {}],
    [5.54, 6.27, 'ÖYLE SANIYORDUM', { SANIYORDUM: C.red }],
    [7.05, 9.82, 'SAAT 02:58... TELSİZ CIZIRDADI', { TELSİZ: C.yel }],
    [10.27, 11.66, 'BU SES MERKEZ DEĞİLDİ', { 'DEĞİLDİ': C.red }],
    [21.03, 22.3, 'SAAT ÜÇÜ BİR GEÇE...', { 'ÜÇÜ': C.red }],
    [22.67, 23.61, 'UZAKTAN BİR IŞIK', { 'IŞIK': C.yel }],
    [24.0, 25.32, 'TARİFEDE OLMAYAN BİR TREN', { OLMAYAN: C.red }],
    [25.73, 27.44, 'VAGONLARINDA TEK BİR IŞIK BİLE YOK', { YOK: C.red }],
    [27.99, 28.92, 'MAKİNİST İNDİ...', {}],
    [29.32, 30.48, 'VE PENCEREME VURDU', { VURDU: C.red }],
  ].map(([a, b, s, h]) => [a + VO_A, b + VO_A, s, h]),
  ...[
    [0, 1.17, 'MAKASI AÇ EVLAT...', {}],
    [1.72, 2.26, 'BEN BABANIM', { 'BABANIM': C.red }],
    [3.17, 4.1, 'EVE DÖNÜYORUZ', { 'DÖNÜYORUZ': C.yel }],
  ].map(([a, b, s, h]) => [a + VO_BABA, b + VO_BABA + 0.4, s, h]),
  ...[
    [0, 0.61, 'BABAM...', {}],
    [0.9, 1.9, 'OTUZ YIL ÖNCE', { OTUZ: C.yel }],
    [2.18, 3.31, 'BU HATTA KAYBOLMUŞTU', { 'KAYBOLMUŞTU': C.red }],
  ].map(([a, b, s, h]) => [a + VO_B, b + VO_B, s, h]),
];

// Every accent: [beat, label, sfx, opts]; sfx.mjs voices them.
const HITS = [
  [0, 'open', 'sub', { len: 2 }],
  [4.0, 'cut inside', 'click'],
  [7.4, 'radio wakes', 'impact'],
  [12.56, 'kural 1', 'thud'],
  [15.8, 'kural 2', 'thud'],
  [18.0, 'kural 3', 'thud'],
  [21.0, '03:01', 'sub', { len: 1.5 }],
  [24.3, 'train arrives', 'whoosh', { len: 0.8, from: 200, to: 900 }],
  [28.3, 'cut conductor', 'click'],
  [31.05, 'knock 1', 'thud', { pitch: 'D3' }],
  [31.35, 'knock 2', 'thud', { pitch: 'D3' }],
  [31.65, 'knock 3', 'thud', { pitch: 'D3' }],
  [33.9, 'ben babanım', 'impact'],
  [37.0, 'newspaper', 'swell'],
  [39.4, 'circle', 'tick'],
  [41.2, 'end card', 'impact'],
  [42.0, 'buttons', 'pop', { pitch: 'A4' }],
];

const KNOCKS = [31.05, 31.35, 31.65];

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

// ---------------------------------------------------------------- scenes
function sExterior(ctx, t) {        // 0..4
  const z = 1.0 * (1.22 / 1.0) ** E.inOutSine(prog(t, 0, 4.0));
  sky(ctx); stars(ctx, t);
  ctx.save(); camera(ctx, z, W * 0.42, H * 0.6);
  mountains(ctx, H * 0.5, 2, '#121A36', 260);
  mountains(ctx, H * 0.6, 5, '#0C1228', 180);
  ctx.fillStyle = '#D9E2F0'; ctx.fillRect(0, H * 0.66, W, H * 0.34);      // snow field
  ctx.fillStyle = 'rgba(14,22,48,0.25)'; ctx.fillRect(0, H * 0.66, W, 30);
  rails(ctx, H * 0.75, 1.2);
  station(ctx, W * 0.42, H * 0.66, 1.25, 1);
  signal(ctx, W * 0.82, H * 0.48, 1.1, Math.sin(t * 4) > -0.2);
  ctx.restore();
  snowfall(ctx, t);
}
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
function sCabin(ctx, t) {           // 4..7.4
  interiorWall(ctx);
  const z = 1.0 * (1.15) ** E.outCubic(prog(t, 4, 7.4));
  ctx.save(); camera(ctx, z, W * 0.5, H * 0.38);
  // window with snow
  ctx.fillStyle = C.sky0; ctx.fillRect(W * 0.56, H * 0.36, W * 0.34, H * 0.22);
  ctx.save(); ctx.beginPath(); ctx.rect(W * 0.56, H * 0.36, W * 0.34, H * 0.22); ctx.clip(); snowfall(ctx, t, 50, 0.8); ctx.restore();
  ctx.strokeStyle = '#120C08'; ctx.lineWidth = 18; ctx.strokeRect(W * 0.56, H * 0.36, W * 0.34, H * 0.22);
  ctx.fillStyle = '#120C08'; ctx.fillRect(W * 0.725, H * 0.36, 12, H * 0.22);
  // clock: 02:58, second hand ticking each second
  const ss = 40 + Math.floor(t - 4) * 1 + E.outBack(clamp((t % 1) / 0.12)) - 1;
  clockFace(ctx, W * 0.3, H * 0.36, 170, 2, 58, ss);
  // desk + stove glow + character from behind
  glow(ctx, W * 0.12, H * 0.78, 520, 'rgba(255,140,60,A)', 0.35 + 0.05 * Math.sin(t * 9));
  ctx.fillStyle = '#1A110B'; ctx.fillRect(0, H * 0.72, W, H * 0.28);
  body(ctx, W * 0.5, H * 0.6, 300, 420, '#2C3A5E');
  head(ctx, W * 0.5, H * 0.56, 115, { beanie: true, eyes: 'dot', look: 0.6, blink: bump(t, 6.3, 0.12) });
  ctx.restore();
}
function sRadio(ctx, t) {           // 7.4..12.4
  interiorWall(ctx);
  const [sx, sy] = shakeAt(t, [7.4], 26);
  ctx.save(); camera(ctx, 1.0 * 1.12 ** E.inOutSine(prog(t, 7.4, 12.4)), W / 2, H * 0.42, sx, sy);
  ctx.fillStyle = '#1A110B'; ctx.fillRect(0, H * 0.62, W, H * 0.4);
  const x = W * 0.12, y = H * 0.26, w = W * 0.76, h = H * 0.34;
  ctx.fillStyle = '#4A3424'; rrect(ctx, x, y, w, h, 40); ctx.fill();
  ctx.fillStyle = '#5E4430'; rrect(ctx, x + 20, y + 20, w - 40, h - 40, 28); ctx.fill();
  // speaker grill
  ctx.fillStyle = '#2A1C12';
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.arc(x + 90 + i * 34, y + 110 + j * 46, 9, 0, M.TAU); ctx.fill(); }
  // dial + waveform screen
  const dx = x + w * 0.56, dw = w * 0.36;
  ctx.fillStyle = '#0B1A10'; rrect(ctx, dx, y + 90, dw, 170, 14); ctx.fill();
  const talking = t > 7.05 + VO_A;
  ctx.strokeStyle = '#7CFF9A'; ctx.lineWidth = 4; ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const px = dx + 14 + i / 60 * (dw - 28);
    const a = talking ? 55 * Math.abs(noise1(t * 6 + i * 0.25, 4)) * (0.4 + 0.6 * Math.abs(Math.sin(t * 7))) : 6;
    const py = y + 175 + a * Math.sin(i * 1.7 + t * 40);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#7CFF9A'; ctx.font = font(26, 700, UI); ctx.fillText('KANAL 3', dx + 18, y + 125);
  // knobs
  for (const k of [0, 1]) { ctx.fillStyle = '#20150D'; ctx.beginPath(); ctx.arc(dx + 60 + k * 150, y + 340, 48, 0, M.TAU); ctx.fill(); ctx.strokeStyle = '#C9A13B'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx + 60 + k * 150, y + 340); ctx.lineTo(dx + 60 + k * 150 + 40 * Math.cos(k + t * 0.3), y + 340 + 40 * Math.sin(k + t * 0.3)); ctx.stroke(); }
  // red LED
  const on = Math.floor(t * 3) % 2 === 0;
  ctx.fillStyle = on ? C.red : '#4A1010'; ctx.beginPath(); ctx.arc(x + w - 70, y + 60, 16, 0, M.TAU); ctx.fill();
  if (on) glow(ctx, x + w - 70, y + 60, 180, 'rgba(229,50,45,A)', 0.6);
  // antenna
  ctx.strokeStyle = '#9AA3B5'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + w - 120, y); ctx.lineTo(x + w + 20 + 10 * Math.sin(t * 2), y - 260); ctx.stroke();
  ctx.restore();
}
const RULES = [
  [12.56, 'KURAL 1', ["03:00'TEN SONRA", 'MAKASI AÇMA.']],
  [15.8, 'KURAL 2', ['PENCEREDEN', 'BAKMA.']],
  [18.0, 'KURAL 3', ['İSMİNİ SÖYLEYENE', 'CEVAP VERME.']],
];
function warnTri(ctx, x, y, s) {
  ctx.fillStyle = C.yel; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.1, y + s * 0.85); ctx.lineTo(x - s * 1.1, y + s * 0.85); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillRect(x - s * 0.1, y - s * 0.45, s * 0.2, s * 0.78); ctx.fillRect(x - s * 0.1, y + s * 0.45, s * 0.2, s * 0.2);
}
function sRules(ctx, t) {           // 12.4..21
  fill(ctx, '#0A0608');
  glow(ctx, W / 2, H * 0.45, 1100, 'rgba(229,50,45,A)', 0.16 + 0.04 * Math.sin(t * 3));
  const k = springU(t, 12.4, SPRING.gentle);
  const [sx, sy] = shakeAt(t, RULES.map((r) => r[0]), 14);
  ctx.save(); ctx.translate(sx, sy + (1 - k) * 300); ctx.globalAlpha = clamp(k * 1.5);
  const x = 70, y = 420, w = W - 140, h = 1180;
  ctx.fillStyle = '#16090B'; rrect(ctx, x, y, w, h, 46); ctx.fill();
  ctx.strokeStyle = '#3A1416'; ctx.lineWidth = 6; ctx.stroke();
  warnTri(ctx, x + 100, y + 110, 46);
  ctx.fillStyle = '#F3EDE2'; ctx.font = font(52, 900, DISPLAY); ctx.fillText('TELSİZ MESAJI', x + 180, y + 110);
  ctx.fillStyle = '#B9A9A6'; ctx.font = font(30, 700, UI); ctx.fillText('şimdi · kaynak bilinmiyor', x + 182, y + 158);
  ctx.fillStyle = '#8E1F1C'; rrect(ctx, x + 30, y + 210, w - 60, h - 250, 30); ctx.fill();
  RULES.forEach(([at, tag, lines], i) => {
    const p = springU(t, at - 0.08, SPRING.bouncy);
    if (p <= 0) return;
    const ry = y + 270 + i * 300;
    ctx.save(); ctx.translate(x + 80, ry); ctx.scale(lerp(1.4, 1, clamp(p)), lerp(1.4, 1, clamp(p))); ctx.globalAlpha = clamp(p * 2);
    ctx.fillStyle = C.ink; rrect(ctx, 0, 0, 230, 66, 33); ctx.fill();
    ctx.fillStyle = C.yel; ctx.font = font(40, 900, DISPLAY); ctx.fillText(tag, 34, 49);
    ctx.fillStyle = '#FFFFFF'; ctx.font = font(76, 900, DISPLAY);
    lines.forEach((l, j) => ctx.fillText(l, 0, 150 + j * 84));
    ctx.restore();
  });
  ctx.restore();
}
function sHeadlight(ctx, t) {       // 21..24.3
  sky(ctx, 0.35); stars(ctx, t, 40);
  const z = 1.0 * 1.3 ** E.inOutSine(prog(t, 21, 24.3));
  ctx.save(); camera(ctx, z, W * 0.25, H * 0.6);
  mountains(ctx, H * 0.55, 2, '#0B1128', 260);
  ctx.fillStyle = '#B9C4D8'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
  // rails vanishing into the distance on the left
  ctx.strokeStyle = '#5A6378'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(W * 0.25, H * 0.62); ctx.lineTo(-W * 0.4, H); ctx.moveTo(W * 0.27, H * 0.62); ctx.lineTo(W * 0.5, H); ctx.stroke();
  const p = E.inQuad(prog(t, 21.2, 24.3));
  const r = lerp(8, 40, p);
  glow(ctx, W * 0.26, H * 0.61, lerp(120, 520, p), 'rgba(255,240,200,A)', lerp(0.4, 0.85, p));
  ctx.fillStyle = '#FFF6DE'; ctx.beginPath(); ctx.arc(W * 0.26, H * 0.61, r, 0, M.TAU); ctx.fill();
  station(ctx, W * 0.78, H * 0.62, 0.9, 1);
  ctx.restore();
  snowfall(ctx, t, 120);
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
function sTrain(ctx, t) {           // 24.3..28.3
  sky(ctx, 0.3); stars(ctx, t, 40);
  const ey = 0.3 * Math.sin(t * 31) * 6 * (1 - prog(t, 26.5, 27.6));
  ctx.save(); ctx.translate(0, ey);
  mountains(ctx, H * 0.5, 2, '#0B1128', 260);
  ctx.fillStyle = '#C5CFDF'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
  station(ctx, W * 0.86, H * 0.62, 0.95, 1);
  rails(ctx, H * 0.7, 1.1);
  const p = E.outCubic(prog(t, 24.3, 27.4));
  train(ctx, lerp(-200, W * 0.62, p), H * 0.7, 1.05, t);
  ctx.restore();
  snowfall(ctx, t, 130);
}
function sConductor(ctx, t) {       // 28.3..32.2
  sky(ctx, 0.3);
  const [sx, sy] = shakeAt(t, KNOCKS, 22, 12);
  ctx.save(); ctx.translate(sx, sy);
  mountains(ctx, H * 0.48, 2, '#0B1128', 240);
  ctx.fillStyle = '#C5CFDF'; ctx.fillRect(0, H * 0.58, W, H * 0.42);
  // dark train across the back
  ctx.fillStyle = '#151A2A'; ctx.fillRect(0, H * 0.38, W, H * 0.2);
  ctx.fillStyle = '#05070F'; for (let i = 0; i < 6; i++) { rrect(ctx, 30 + i * 180, H * 0.41, 120, 120, 10); ctx.fill(); }
  ctx.fillStyle = C.snow; ctx.fillRect(0, H * 0.375, W, 16);
  // conductor walks toward us
  const p = E.inOutSine(prog(t, 28.3, 30.9));
  const s = lerp(0.55, 1.65, p);
  const bob = Math.abs(Math.sin(t * 6)) * 14 * (1 - prog(t, 30.6, 30.9));
  const cx = lerp(W * 0.3, W * 0.5, p), cy = lerp(H * 0.62, H * 0.62, p) - bob;
  ctx.fillStyle = 'rgba(5,7,15,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + 330 * s, 120 * s, 22 * s, 0, 0, M.TAU); ctx.fill();
  body(ctx, cx, cy, 200 * s, 330 * s, '#1B2236');
  ctx.fillStyle = '#C9A13B'; for (let b = 0; b < 3; b++) { ctx.beginPath(); ctx.arc(cx, cy + (60 + b * 70) * s, 9 * s, 0, M.TAU); ctx.fill(); }
  head(ctx, cx, cy - 70 * s, 95 * s, { cap: true, eyes: 'shadow', shadow: 0.55, smile: 0.2 });
  // knocking arm after he arrives
  if (t > 30.8) {
    const kn = KNOCKS.reduce((a, k) => a + bump(t, k, 0.12), 0);
    ctx.strokeStyle = '#1B2236'; ctx.lineWidth = 46 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 80 * s, cy + 40 * s); ctx.lineTo(cx + (150 + 40 * kn) * s, cy - (60 + 30 * kn) * s); ctx.stroke();
    ctx.fillStyle = '#ECECEA'; ctx.beginPath(); ctx.arc(cx + (150 + 40 * kn) * s, cy - (60 + 30 * kn) * s, 28 * s, 0, M.TAU); ctx.fill();
  }
  ctx.restore();
  // our window frame (we are inside): edges framing the shot after he arrives
  const f = E.outCubic(prog(t, 30.4, 30.9));
  if (f > 0) {
    ctx.fillStyle = '#120C08';
    ctx.fillRect(0, 0, W, 120 * f); ctx.fillRect(0, H - 260 * f, W, 260 * f); ctx.fillRect(0, 0, 70 * f, H); ctx.fillRect(W - 70 * f, 0, 70 * f, H);
  }
  snowfall(ctx, t, 90);
}
function sWindow(ctx, t) {          // 32.2..37
  sky(ctx, 0.5);
  const z = 1.0 * 1.25 ** E.inOutSine(prog(t, 32.2, 37));
  const hit = bump(t, 34.0, 0.3);
  ctx.save(); camera(ctx, z * (1 + 0.05 * hit), W / 2, H * 0.42);
  snowfall(ctx, t, 60, 0.6);
  body(ctx, W / 2, H * 0.55, 620, 900, '#1B2236');
  ctx.fillStyle = '#C9A13B'; ctx.beginPath(); ctx.arc(W / 2, H * 0.64, 16, 0, M.TAU); ctx.fill();
  const sm = lerp(0.15, 0.75, E.inOutSine(prog(t, 33.6, 34.4)));
  head(ctx, W / 2, H * 0.42, 260, { cap: true, eyes: 'shadow', shadow: 0.5, smile: sm, glint: 0.8 * prog(t, 33.6, 34.2) });
  // breath fog on the glass
  const fog = 0.5 + 0.5 * Math.sin(t * 2.2);
  glow(ctx, W / 2, H * 0.52, 260, 'rgba(220,230,245,A)', 0.18 * fog);
  ctx.restore();
  // glass + frost + window frame
  ctx.fillStyle = 'rgba(160,190,230,0.06)'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(W * 0.15, H * 0.15); ctx.lineTo(W * 0.4, H * 0.05); ctx.stroke();
  ctx.fillStyle = '#120C08'; ctx.fillRect(0, 0, W, 110); ctx.fillRect(0, H - 250, W, 250); ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H); ctx.fillRect(W / 2 - 10, 0, 20, 110);
  if (hit > 0) { ctx.fillStyle = `rgba(229,50,45,${0.25 * hit})`; ctx.fillRect(0, 0, W, H); }
}
function sPaper(ctx, t) {           // 37..41.2
  fill(ctx, '#140D08');
  glow(ctx, W * 0.5, H * 0.42, 1000, 'rgba(255,200,97,A)', 0.22);
  const z = 1.0 * 1.08 ** E.inOutSine(prog(t, 37, 41.2));
  ctx.save(); camera(ctx, z, W * 0.45, H * 0.44); ctx.translate(W / 2, H * 0.44); ctx.rotate(-0.05); ctx.translate(-W / 2, -H * 0.44);
  const x = 110, y = 400, w = W - 220, h = 960;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + 18, y + 24, w, h);
  ctx.fillStyle = C.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2A2016'; ctx.font = font(30, 700, UI); ctx.fillText('DOĞU POSTASI · 14 ŞUBAT 1996', x + 50, y + 70);
  ctx.fillRect(x + 50, y + 92, w - 100, 4);
  ctx.font = font(92, 900, DISPLAY); ctx.fillText('KIZILKAYA', x + 50, y + 200); ctx.fillText('TRENİ KARDA', x + 50, y + 300); ctx.fillText('KAYBOLDU', x + 50, y + 400);
  // photo: train silhouette
  ctx.fillStyle = '#3A3024'; ctx.fillRect(x + 50, y + 450, w - 100, 330);
  ctx.fillStyle = '#1E1810'; rrect(ctx, x + 120, y + 610, 560, 130, 14); ctx.fill(); rrect(ctx, x + 520, y + 570, 200, 170, 14); ctx.fill();
  ctx.fillStyle = '#2A2016'; ctx.font = font(34, 700, UI);
  ['Kızılkaya İstasyonu yakınında kaybolan', 'yolcu treninden haber yok. Makinist', 'Rıza Usta bulunamadı.'].forEach((l, i) => ctx.fillText(l, x + 50, y + 850 + i * 52));
  // red marker circle around "Rıza Usta"
  const cp = E.outCubic(prog(t, 39.4, 40.2));
  if (cp > 0) { ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(x + 230, y + 943, 210, 50, -0.03, -0.4, -0.4 + cp * M.TAU * 1.02); ctx.stroke(); }
  ctx.restore();
}
function sEnd(ctx, t) {             // 41.2..46
  fill(ctx, '#0A0406');
  glow(ctx, W / 2, H * 0.45, 1200, 'rgba(229,50,45,A)', 0.3);
  const lines = [['MAKASI', '#FFFFFF'], ['AÇAR', C.red], ['MISIN?', '#FFFFFF']];
  lines.forEach(([s, col], i) => {
    const p = springU(t, 41.2 + i * 0.18, SPRING.bouncy);
    if (p <= 0) return;
    const size = 230;
    ctx.save(); ctx.translate(W / 2, 640 + i * 240); ctx.scale(lerp(1.6, 1, clamp(p)), lerp(1.6, 1, clamp(p))); ctx.globalAlpha = clamp(p * 2);
    text(ctx, s, 0, 0, font(size, 900, DISPLAY), col, 'center', -0.02 * size);
    ctx.restore();
  });
  const btn = (bx, label, col, at, icon) => {
    const p = springU(t, at, SPRING.bouncy); if (p <= 0) return;
    const pulse = 1 + 0.04 * Math.sin((t - at) * 6) * prog(t, at + 0.5, at + 1);
    ctx.save(); ctx.translate(bx, 1440); ctx.scale(p * pulse, p * pulse);
    ctx.fillStyle = col; rrect(ctx, -225, -80, 450, 160, 80); ctx.fill();
    icon(ctx);
    text(ctx, label, 40, 30, font(label.length > 2 ? 74 : 84, 900, DISPLAY), '#FFFFFF', 'center');
    ctx.restore();
  };
  btn(W * 0.29, 'AÇ', C.green, 42.0, (c) => { c.strokeStyle = '#fff'; c.lineWidth = 10; c.strokeRect(-170, -42, 54, 84); c.fillStyle = '#fff'; c.beginPath(); c.arc(-128, 0, 7, 0, M.TAU); c.fill(); });
  btn(W * 0.71, 'AÇMA', C.red, 42.25, (c) => { c.fillStyle = '#fff'; c.fillRect(-195, -14, 56, 50); c.strokeStyle = '#fff'; c.lineWidth = 10; c.beginPath(); c.arc(-167, -14, 19, Math.PI, 0); c.stroke(); });
  const tp = E.outCubic(prog(t, 43.0, 43.5));
  if (tp > 0) {
    ctx.globalAlpha = tp;
    text(ctx, 'YORUMLARA YAZ', W / 2, 1660 + (1 - tp) * 30, font(58, 900, DISPLAY), C.yel, 'center');
    text(ctx, 'GECE 2 YAKINDA', W / 2, 1740 + (1 - tp) * 30, font(36, 700, UI), '#B9A9A6', 'center');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- overlays
function hud(ctx, t) {
  if (t >= 41.2) return;
  const clock = t < 12.4 ? '02:58' : t < 21 ? '02:59' : t < 28.3 ? '03:01' : t < 37 ? '03:02' : '03:03';
  const hot = bump(t, 21.2, 0.6);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? C.red : '#8E1F1C'; ctx.beginPath(); ctx.arc(84, 162, 12, 0, M.TAU); ctx.fill();
  text(ctx, 'GECE 1', 108, 176, font(40, 900, DISPLAY), C.red);
  ctx.save(); ctx.translate(70, 290); ctx.scale(1 + 0.25 * hot, 1 + 0.25 * hot);
  text(ctx, clock, 0, 0, font(110, 900, DISPLAY), mix('#FFFFFF', C.red, hot));
  ctx.restore();
  text(ctx, 'KIZILKAYA İSTASYONU', 74, 345, font(32, 700, UI), C.yel);
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

M.film({
  fonts: [font(100, 900, DISPLAY), font(40, 700, UI)],
  hits: HITS,
  samples: 8,
  draw(ctx, u, t) {
    if (t < 4.0) sExterior(ctx, t);
    else if (t < 7.4) sCabin(ctx, t);
    else if (t < 12.4) sRadio(ctx, t);
    else if (t < 21.0) sRules(ctx, t);
    else if (t < 24.3) sHeadlight(ctx, t);
    else if (t < 28.3) sTrain(ctx, t);
    else if (t < 32.2) sConductor(ctx, t);
    else if (t < 37.0) sWindow(ctx, t);
    else if (t < 41.2) sPaper(ctx, t);
    else sEnd(ctx, t);
  },
  post(ctx, u, t) {
    // vignette, grain, then HUD + captions crisp on top
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fr = Math.floor(t * 24);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 * hash01(i, fr)})`; ctx.fillRect(hash01(i, fr + 1) * W, hash01(i, fr + 2) * H, 2, 2); }
    if (t < 0.6) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.6})`; ctx.fillRect(0, 0, W, H); }
    if (t > 45.4) { ctx.fillStyle = `rgba(0,0,0,${(t - 45.4) / 0.6})`; ctx.fillRect(0, 0, W, H); }
    hud(ctx, t);
    captions(ctx, t);
  },
});
