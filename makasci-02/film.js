// Makasçı - Gece 2: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// beats.json is 60 bpm from 0, so u == seconds; times below are the VO edit's (audio/score.py).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, wobble, font, layout, text, fill, rrect, hash01, noise1, mix, bump } = M;

const C = {
  sky0: '#070B1A', sky1: '#1A2650', snow: '#E8EEF8', ink: '#05070F', wood: '#2A1C14', wood2: '#3A281C',
  lamp: '#FFC861', red: '#E5322D', yel: '#FFD23F', green: '#2FA84F', steel: '#3A4256', paper: '#E9E1CC',
};
const DISPLAY = 'Display', UI = 'UI';
const VO_A = 0.4, VO_ANNE = 31.0, VO_B = 37.2;

// ---------------------------------------------------------------- captions (VO phrase times)
// [start, end, text, {word: colour}]
const CAP = [
  ...[
    [0, 0.97, 'MAKASI AÇMADIM', { 'AÇMADIM': C.yel }],
    [1.53, 2.15, 'KURALA UYDUM', {}],
    [2.97, 4.41, 'TREN GERİ GERİ GİTTİ...', { 'GERİ': C.yel }],
    [4.84, 6.14, 'SANKİ HİÇ GELMEMİŞ GİBİ', {}],
    [6.99, 10.1, 'SABAH KAR ÜSTÜNDE AYAK İZLERİ VARDI', { AYAK: C.yel, 'İZLERİ': C.yel }],
    [10.69, 11.35, 'GELEN İZLER', {}],
    [11.91, 12.61, 'GİDEN İZ YOKTU', { YOKTU: C.red }],
    [13.14, 14.36, 'TELSİZ YİNE CIZIRDADI', { 'TELSİZ': C.yel }],
    [22.76, 23.47, 'İKİNCİ GECE', { 'İKİNCİ': C.red }],
    [23.86, 25.05, 'SAAT 02:40', {}],
    [25.55, 26.22, 'KAPI ÇALINDI', { 'ÇALINDI': C.yel }],
    [26.72, 27.04, 'BİR...', {}],
    [27.55, 27.94, 'İKİ...', { 'İKİ...': C.red }],
    [28.51, 29.39, 'ÜÇÜNCÜSÜ GELMEDİ', { 'GELMEDİ': C.red }],
  ].map(([a, b, s, h]) => [a + VO_A, b + VO_A, s, h]),
  [VO_ANNE + 0.0, VO_ANNE + 1.85, 'OĞLUM? BENİM...', {}],
  [VO_ANNE + 2.21, VO_ANNE + 2.95, 'ANNEN', { ANNEN: C.red }],
  [VO_ANNE + 3.53, VO_ANNE + 5.5, 'ÜŞÜYORUM... AÇ KAPIYI', { 'KAPIYI': C.yel }],
  [VO_B + 0.0, VO_B + 1.03, 'ANNEM KÖYDE...', { 'KÖYDE...': C.yel }],
  [VO_B + 1.48, VO_B + 3.04, '800 KİLOMETRE UZAKTA', { '800': C.red }],
];

const KNOCKS = [27.15, 27.98];
const HITS = [
  [0, 'open', 'sub', { len: 2 }],
  [3.4, 'cut train', 'whoosh', { len: 0.8, from: 900, to: 200 }],
  [7.0, 'morning', 'click'],
  [11.9, 'no return prints', 'sub', { len: 1 }],
  [13.4, 'radio', 'impact'],
  [15.3, 'kural 4', 'thud'],
  [19.9, 'insan değildir', 'impact'],
  [22.6, 'night', 'sub', { len: 1.5 }],
  [KNOCKS[0], 'knock 1', 'thud', { pitch: 'D3' }],
  [KNOCKS[1], 'knock 2', 'thud', { pitch: 'D3' }],
  [31.0, 'mother', 'swell'],
  [37.2, 'photo', 'tick'],
  [41.0, 'end card', 'impact'],
  [41.8, 'buttons', 'pop', { pitch: 'A4' }],
];
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
function sLever(ctx, t) {           // 0..3.4: the switch lever, chained shut
  interiorWall(ctx);
  const z = 1.0 * 1.15 ** E.outCubic(prog(t, 0, 3.4));
  ctx.save(); camera(ctx, z, W / 2, H * 0.55);
  ctx.fillStyle = '#1A110B'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
  clockFace(ctx, W * 0.72, H * 0.33, 150, 3, 2, 10 + Math.floor(t));
  // lever base + handle
  ctx.fillStyle = '#3A4256'; rrect(ctx, W * 0.2, H * 0.66, 360, 120, 20); ctx.fill();
  ctx.save(); ctx.translate(W * 0.2 + 180, H * 0.67); ctx.rotate(-0.35);
  ctx.fillStyle = '#9AA3B5'; ctx.fillRect(-18, -520, 36, 520);
  ctx.fillStyle = C.red; rrect(ctx, -46, -600, 92, 110, 30); ctx.fill();
  ctx.restore();
  // chain + padlock
  ctx.strokeStyle = '#C9C2B0'; ctx.lineWidth = 10;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(W * 0.2 + 40 + i * 34, H * 0.6 + Math.sin(i * 0.7) * 20, 20, 12, i % 2 ? 0 : Math.PI / 2, 0, M.TAU); ctx.stroke(); }
  const lx = W * 0.2 + 190, ly = H * 0.62 + springU(t, 0.3, SPRING.bouncy) * 10;
  ctx.fillStyle = C.yel; rrect(ctx, lx - 50, ly, 100, 90, 14); ctx.fill();
  ctx.strokeStyle = C.yel; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(lx, ly, 34, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(lx, ly + 40, 10, 0, M.TAU); ctx.fill(); ctx.fillRect(lx - 5, ly + 40, 10, 26);
  ctx.restore();
}
function train(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let c = 0; c < 4; c++) {
    const cx = -560 - c * 560;
    ctx.fillStyle = '#1C2234'; rrect(ctx, cx, -300, 540, 260, 18); ctx.fill();
    ctx.fillStyle = '#5A1C1A'; ctx.fillRect(cx, -110, 540, 18);
    ctx.fillStyle = '#05070F'; for (let wi = 0; wi < 5; wi++) { rrect(ctx, cx + 30 + wi * 102, -260, 76, 90, 10); ctx.fill(); }
    ctx.fillStyle = C.snow; rrect(ctx, cx - 6, -312, 552, 20, 10); ctx.fill();
    ctx.fillStyle = '#0A0C14'; for (const wx of [80, 460]) { ctx.beginPath(); ctx.arc(cx + wx, -36, 34, 0, M.TAU); ctx.fill(); }
  }
  ctx.fillStyle = '#2A3046'; rrect(ctx, -540, -340, 620, 300, 26); ctx.fill();
  ctx.fillStyle = C.red; ctx.fillRect(-540, -130, 620, 26);
  ctx.fillStyle = '#05070F'; rrect(ctx, -60, -300, 110, 110, 14); ctx.fill();
  ctx.fillStyle = C.snow; rrect(ctx, -546, -352, 632, 22, 10); ctx.fill();
  ctx.fillStyle = '#0A0C14'; for (const wx of [-440, -260, -60]) { ctx.beginPath(); ctx.arc(wx, -36, 40, 0, M.TAU); ctx.fill(); }
  ctx.restore();
}
function sReverse(ctx, t) {         // 3.4..7.0: the train backs away into the dark
  sky(ctx, 0.35); stars(ctx, t, 40);
  mountains(ctx, H * 0.5, 2, '#0B1128', 260);
  ctx.fillStyle = '#C5CFDF'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
  station(ctx, W * 0.86, H * 0.62, 0.95, 0.3);
  rails(ctx, H * 0.7, 1.1);
  const p = E.inCubic(prog(t, 3.6, 7.0));
  train(ctx, lerp(W * 0.62, -300, p), H * 0.7, 1.05);
  ctx.fillStyle = `rgba(5,7,15,${0.6 * p})`; ctx.fillRect(0, 0, W, H);
  snowfall(ctx, t, 110);
}
function footprint(ctx, x, y, s, rot, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = `rgba(70,84,110,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 30, 0, 0, M.TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 44, 13, 16, 0, 0, M.TAU); ctx.fill();
  ctx.restore();
}
function sPrints(ctx, t) {          // 7.0..13.4: morning, prints from the rails to the door, none going back
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5C6578'); g.addColorStop(1, '#9AA3B5');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // camera tilts from the rails down to the door
  const cy = lerp(0, -380, E.inOutSine(prog(t, 7.2, 11.5)));
  ctx.save(); ctx.translate(0, cy);
  mountains(ctx, H * 0.36, 2, '#4A5368', 200);
  ctx.fillStyle = '#E4E9F2'; ctx.fillRect(0, H * 0.42, W, H * 1.2);
  rails(ctx, H * 0.47, 0.9);
  // cabin door at the bottom
  ctx.fillStyle = '#3A281C'; ctx.fillRect(W * 0.2, H * 1.05, W * 0.6, H * 0.4);
  ctx.fillStyle = '#20150D'; rrect(ctx, W * 0.38, H * 1.08, W * 0.24, H * 0.3, 10); ctx.fill();
  ctx.fillStyle = '#C9A13B'; ctx.beginPath(); ctx.arc(W * 0.58, H * 1.24, 12, 0, M.TAU); ctx.fill();
  // prints: rails -> door, revealed as the camera passes
  const n = 14;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const x = W * 0.5 + (i % 2 ? 40 : -40) + Math.sin(k * 3) * 60;
    const y = lerp(H * 0.52, H * 1.02, k);
    const a = clamp((t - 7.4 - k * 3.2) * 3) * 0.85;
    footprint(ctx, x, y, lerp(0.7, 1.3, k), Math.sin(k * 3) * 0.2, a);
  }
  ctx.restore();
  // "no prints going back": red mark on the empty side
  const r = E.outCubic(prog(t, 12.3, 12.8));
  if (r > 0) {
    ctx.strokeStyle = C.red; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.58, 230, 330, 0, -1.5, -1.5 + r * M.TAU); ctx.stroke();
  }
  snowfall(ctx, t, 50, 0.5, 20);
}
function sRadio(ctx, t) {           // 13.4..15.2
  interiorWall(ctx);
  const [sx, sy] = shakeAt(t, [13.4], 26);
  ctx.save(); camera(ctx, 1.0 * 1.12 ** E.inOutSine(prog(t, 13.4, 15.2)), W / 2, H * 0.42, sx, sy);
  ctx.fillStyle = '#1A110B'; ctx.fillRect(0, H * 0.62, W, H * 0.4);
  const x = W * 0.12, y = H * 0.26, w = W * 0.76, h = H * 0.34;
  ctx.fillStyle = '#4A3424'; rrect(ctx, x, y, w, h, 40); ctx.fill();
  ctx.fillStyle = '#5E4430'; rrect(ctx, x + 20, y + 20, w - 40, h - 40, 28); ctx.fill();
  ctx.fillStyle = '#2A1C12';
  for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { ctx.beginPath(); ctx.arc(x + 90 + i * 34, y + 110 + j * 46, 9, 0, M.TAU); ctx.fill(); }
  const dx = x + w * 0.56, dw = w * 0.36;
  ctx.fillStyle = '#0B1A10'; rrect(ctx, dx, y + 90, dw, 170, 14); ctx.fill();
  ctx.strokeStyle = '#7CFF9A'; ctx.lineWidth = 4; ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const px = dx + 14 + i / 60 * (dw - 28);
    const py = y + 175 + 55 * Math.abs(noise1(t * 6 + i * 0.25, 4)) * Math.sin(i * 1.7 + t * 40);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#7CFF9A'; ctx.font = font(26, 700, UI); ctx.fillText('KANAL 3', dx + 18, y + 125);
  const on = Math.floor(t * 3) % 2 === 0;
  ctx.fillStyle = on ? C.red : '#4A1010'; ctx.beginPath(); ctx.arc(x + w - 70, y + 60, 16, 0, M.TAU); ctx.fill();
  if (on) glow(ctx, x + w - 70, y + 60, 180, 'rgba(229,50,45,A)', 0.6);
  ctx.strokeStyle = '#9AA3B5'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + w - 120, y); ctx.lineTo(x + w + 20, y - 260); ctx.stroke();
  ctx.restore();
}
function warnTri(ctx, x, y, s) {
  ctx.fillStyle = C.yel; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.1, y + s * 0.85); ctx.lineTo(x - s * 1.1, y + s * 0.85); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillRect(x - s * 0.1, y - s * 0.45, s * 0.2, s * 0.78); ctx.fillRect(x - s * 0.1, y + s * 0.45, s * 0.2, s * 0.2);
}
const RULE4 = [[16.65, ['BİRİ KAPINI', 'ÇALARSA,'], '#FFFFFF'], [18.1, ['ÜÇ KERE ÇALMASINI', 'BEKLE.'], '#FFFFFF'], [19.9, ['İKİ KERE ÇALAN', 'İNSAN DEĞİLDİR.'], C.yel]];
function sRule4(ctx, t) {           // 15.2..22.6
  fill(ctx, '#0A0608');
  glow(ctx, W / 2, H * 0.45, 1100, 'rgba(229,50,45,A)', 0.16 + 0.1 * bump(t, 20.0, 0.8));
  const k = springU(t, 15.2, SPRING.gentle);
  const [sx, sy] = shakeAt(t, [15.3, 19.9], 16);
  ctx.save(); ctx.translate(sx, sy + (1 - k) * 300); ctx.globalAlpha = clamp(k * 1.5);
  const x = 70, y = 420, w = W - 140, h = 1180;
  ctx.fillStyle = '#16090B'; rrect(ctx, x, y, w, h, 46); ctx.fill();
  warnTri(ctx, x + 100, y + 110, 46);
  ctx.fillStyle = '#F3EDE2'; ctx.font = font(52, 900, DISPLAY); ctx.fillText('TELSİZ MESAJI', x + 180, y + 110);
  ctx.fillStyle = '#B9A9A6'; ctx.font = font(30, 700, UI); ctx.fillText('şimdi · kaynak bilinmiyor', x + 182, y + 158);
  ctx.fillStyle = '#8E1F1C'; rrect(ctx, x + 30, y + 210, w - 60, h - 250, 30); ctx.fill();
  ctx.fillStyle = C.ink; rrect(ctx, x + 80, y + 260, 230, 66, 33); ctx.fill();
  ctx.fillStyle = C.yel; ctx.font = font(40, 900, DISPLAY); ctx.fillText('KURAL 4', x + 114, y + 309);
  RULE4.forEach(([at, lines, col], i) => {
    const p = springU(t, at - 0.08, SPRING.bouncy);
    if (p <= 0) return;
    ctx.save(); ctx.translate(x + 80, y + 440 + i * 250); ctx.scale(lerp(1.4, 1, clamp(p)), lerp(1.4, 1, clamp(p))); ctx.globalAlpha = clamp(p * 2);
    ctx.fillStyle = col; ctx.font = font(76, 900, DISPLAY);
    lines.forEach((l, j) => ctx.fillText(l, 0, j * 84));
    ctx.restore();
  });
  ctx.restore();
}
function sNight(ctx, t) {           // 22.6..25.9: the cabin, lights off
  sky(ctx, 0.5); stars(ctx, t, 60);
  const z = 1.0 * 1.25 ** E.inOutSine(prog(t, 22.6, 25.9));
  ctx.save(); camera(ctx, z, W * 0.45, H * 0.6);
  mountains(ctx, H * 0.55, 5, '#080D20', 220);
  ctx.fillStyle = '#8A95AC'; ctx.fillRect(0, H * 0.64, W, H * 0.36);
  rails(ctx, H * 0.72, 1.1);
  station(ctx, W * 0.45, H * 0.64, 1.25, 0);
  ctx.restore();
  snowfall(ctx, t, 120);
}
function door(ctx, t, lightUnder, shadow) {
  interiorWall(ctx);
  ctx.fillStyle = '#20150D'; ctx.fillRect(W * 0.18, H * 0.12, W * 0.64, H * 0.76);
  ctx.fillStyle = '#3A281C'; ctx.fillRect(W * 0.21, H * 0.14, W * 0.58, H * 0.72);
  ctx.strokeStyle = '#2A1C12'; ctx.lineWidth = 10;
  ctx.strokeRect(W * 0.27, H * 0.19, W * 0.46, H * 0.25); ctx.strokeRect(W * 0.27, H * 0.5, W * 0.46, H * 0.3);
  ctx.fillStyle = '#C9A13B'; ctx.beginPath(); ctx.arc(W * 0.72, H * 0.5, 18, 0, M.TAU); ctx.fill();
  ctx.fillStyle = '#9AA3B5'; ctx.fillRect(W * 0.66, H * 0.45, 70, 18);   // bolt
  // light under the door, broken by two still feet
  const ly = H * 0.86;
  ctx.fillStyle = `rgba(255,236,190,${0.7 * lightUnder})`; ctx.fillRect(W * 0.21, ly, W * 0.58, 10);
  glow(ctx, W / 2, ly + 30, 420, 'rgba(255,236,190,A)', 0.25 * lightUnder);
  if (shadow > 0) { ctx.fillStyle = `rgba(5,7,15,${shadow})`; ctx.fillRect(W * 0.4, ly - 2, 70, 14); ctx.fillRect(W * 0.53, ly - 2, 70, 14); }
  ctx.fillStyle = '#120C08'; ctx.fillRect(0, ly + 10, W, H - ly);
}
function sDoor(ctx, t) {            // 25.9..37.2: two knocks, then her voice
  const [sx, sy] = shakeAt(t, KNOCKS, 30, 11);
  const z = 1.0 * 1.2 ** E.inOutSine(prog(t, 25.9, 37.2));
  ctx.save(); camera(ctx, z, W / 2, H * 0.6, sx, sy);
  door(ctx, t, prog(t, 26.0, 26.6), 0.9 * prog(t, 26.4, 26.8));
  // frost creeping over the door while she speaks
  const fr = prog(t, 31.0, 37.2);
  if (fr > 0) for (let i = 0; i < 40; i++) {
    const a = hash01(i, 21) * M.TAU, d = (0.3 + 0.7 * hash01(i, 22)) * fr * 700;
    ctx.fillStyle = 'rgba(220,235,255,0.05)';
    ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * d, H * 0.86 + Math.sin(a) * d * 0.6 - 40, 40 + 60 * hash01(i, 23), 0, M.TAU); ctx.fill();
  }
  ctx.restore();
  for (const k of KNOCKS) { const b = bump(t, k + 0.05, 0.12); if (b > 0) { ctx.fillStyle = `rgba(255,255,255,${0.12 * b})`; ctx.fillRect(0, 0, W, H); } }
}
function sPhoto(ctx, t) {           // 37.2..41.0: a framed photo of mother and son
  interiorWall(ctx);
  glow(ctx, W / 2, H * 0.42, 900, 'rgba(255,200,97,A)', 0.18);
  const z = 1.0 * 1.15 ** E.inOutSine(prog(t, 37.2, 41.0));
  ctx.save(); camera(ctx, z, W / 2, H * 0.42); ctx.translate(W / 2, H * 0.42); ctx.rotate(0.03); ctx.translate(-W / 2, -H * 0.42);
  const x = 170, y = 380, w = W - 340, h = 860;
  ctx.fillStyle = '#5E4430'; ctx.fillRect(x - 30, y - 30, w + 60, h + 60);
  ctx.fillStyle = C.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#B8C2CF'; ctx.fillRect(x + 30, y + 30, w - 60, h - 180);   // sky
  ctx.fillStyle = '#8C9A6E'; ctx.fillRect(x + 30, y + h - 380, w - 60, 230);   // field
  body(ctx, x + w * 0.36, y + 420, 220, 330, '#7A3B4E');
  head(ctx, x + w * 0.36, y + 340, 90, { eyes: 'dot', smile: 0.6 });
  ctx.fillStyle = '#E6D9C8'; ctx.beginPath(); ctx.ellipse(x + w * 0.36, y + 290, 100, 70, 0, Math.PI, 0); ctx.fill();   // headscarf
  body(ctx, x + w * 0.64, y + 460, 160, 290, '#2C3A5E');
  head(ctx, x + w * 0.64, y + 390, 70, { eyes: 'dot', smile: 0.7, beanie: true });
  ctx.fillStyle = '#2A2016'; ctx.font = font(34, 700, UI); ctx.textAlign = 'center';
  ctx.fillText('Annemle, köyde · 2019', x + w / 2, y + h - 60); ctx.textAlign = 'left';
  ctx.restore();
}
function sEnd(ctx, t) {             // 41.0..45
  fill(ctx, '#0A0406');
  glow(ctx, W / 2, H * 0.45, 1200, 'rgba(229,50,45,A)', 0.3);
  const T0 = 41.0;
  [['KAPIYI', '#FFFFFF'], ['AÇAR', C.red], ['MISIN?', '#FFFFFF']].forEach(([s, col], i) => {
    const p = springU(t, T0 + i * 0.18, SPRING.bouncy);
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
  btn(W * 0.29, 'AÇ', C.green, T0 + 0.8, (c) => { c.strokeStyle = '#fff'; c.lineWidth = 10; c.strokeRect(-170, -42, 54, 84); c.fillStyle = '#fff'; c.beginPath(); c.arc(-128, 0, 7, 0, M.TAU); c.fill(); });
  btn(W * 0.71, 'AÇMA', C.red, T0 + 1.05, (c) => { c.fillStyle = '#fff'; c.fillRect(-195, -14, 56, 50); c.strokeStyle = '#fff'; c.lineWidth = 10; c.beginPath(); c.arc(-167, -14, 19, Math.PI, 0); c.stroke(); });
  const tp = E.outCubic(prog(t, T0 + 1.8, T0 + 2.3));
  if (tp > 0) {
    ctx.globalAlpha = tp;
    text(ctx, 'YORUMLARA YAZ', W / 2, 1660 + (1 - tp) * 30, font(58, 900, DISPLAY), C.yel, 'center');
    text(ctx, 'GECE 3 YAKINDA', W / 2, 1740 + (1 - tp) * 30, font(36, 700, UI), '#B9A9A6', 'center');
    ctx.globalAlpha = 1;
  }
}
// ---------------------------------------------------------------- overlays
function hud(ctx, t) {
  if (t >= 41.0) return;
  const clock = t < 3.4 ? '03:02' : t < 7.0 ? '03:04' : t < 22.6 ? '07:12' : t < 27.0 ? '02:40' : t < 37.2 ? '02:41' : '02:42';
  const hot = bump(t, 22.8, 0.6);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? C.red : '#8E1F1C'; ctx.beginPath(); ctx.arc(84, 162, 12, 0, M.TAU); ctx.fill();
  text(ctx, 'GECE 2', 108, 176, font(40, 900, DISPLAY), C.red);
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
    if (t < 3.4) sLever(ctx, t);
    else if (t < 7.0) sReverse(ctx, t);
    else if (t < 13.4) sPrints(ctx, t);
    else if (t < 15.2) sRadio(ctx, t);
    else if (t < 22.6) sRule4(ctx, t);
    else if (t < 25.9) sNight(ctx, t);
    else if (t < 37.2) sDoor(ctx, t);
    else if (t < 41.0) sPhoto(ctx, t);
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
    if (t > 44.4) { ctx.fillStyle = `rgba(0,0,0,${(t - 44.4) / 0.6})`; ctx.fillRect(0, 0, W, H); }
    hud(ctx, t);
    captions(ctx, t);
  },
});
