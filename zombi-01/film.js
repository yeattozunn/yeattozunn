// Ya Olursa - Gün 1: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// beats.json is 60 bpm from 0, so u == seconds; times below come from the VO edit (audio/score.py).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, text, fill, rrect, hash01, noise1, mix, bump } = M;

const C = {
  night0: '#120A22', night1: '#3A1E3E', ink: '#07060D', red: '#E5322D', yel: '#FFD23F', green: '#2FA84F',
  skin: '#F0E6DA', zskin: '#9BAE8C', jacket: '#1F8A8A', paper: '#EDE4CF', wood: '#6B4A33', floor: '#8A5E3C',
};
const DISPLAY = 'Display', UI = 'UI';

// scene starts + VO phrases are filled from the takes' silences (audio/score.py prints them)
import T from './timing.js';
const { CAP, S, KNOCKS, HITS } = T(C);

// ---------------------------------------------------------------- shared art
function glow(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function camera(ctx, s, cx, cy, sx = 0, sy = 0) { ctx.translate(cx + sx, cy + sy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
const shakeAt = (t, times, amp, dec = 9) => {
  let x = 0, y = 0;
  for (const k of times) { const d = t - k; if (d < 0 || d > 0.6) continue; const e = amp * Math.exp(-d * dec); x += e * Math.sin(d * 90); y += e * Math.cos(d * 73); }
  return [x, y];
};
function head(ctx, x, y, r, o = {}) {
  ctx.save(); ctx.translate(x, y);
  const skin = o.skin || C.skin;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, 0, r, 0, M.TAU); ctx.fill();
  const lx = (o.look || 0) * r * 0.2;
  if (o.zombie) {
    ctx.fillStyle = '#2A1A20';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * r * 0.33 + lx, -r * 0.08, r * 0.17, r * 0.14, 0, 0, M.TAU); ctx.fill(); }
    ctx.fillStyle = '#F4F0C8'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * r * 0.33 + lx, -r * 0.08, r * 0.05, 0, M.TAU); ctx.fill(); }
    ctx.fillStyle = '#3A1418'; ctx.beginPath(); ctx.ellipse(lx, r * 0.42, r * 0.2, r * 0.12, 0, 0, M.TAU); ctx.fill();
  } else {
    const er = o.wide ? r * 0.12 : r * 0.08;
    ctx.fillStyle = C.ink;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * r * 0.32 + lx, -r * 0.06, er, 0, M.TAU); ctx.fill(); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round'; ctx.beginPath();
    if (o.mouth === 'o') { ctx.fillStyle = C.ink; ctx.ellipse(lx, r * 0.42, r * 0.1, r * 0.14, 0, 0, M.TAU); ctx.fill(); }
    else { const sm = o.smile ?? 0; ctx.moveTo(-r * 0.22 + lx, r * 0.4); ctx.quadraticCurveTo(lx, r * 0.4 + sm * r * 0.3, r * 0.22 + lx, r * 0.4); ctx.stroke(); }
  }
  if (o.beanie) {
    ctx.fillStyle = o.beanie; ctx.beginPath(); ctx.ellipse(0, -r * 0.45, r * 1.0, r * 0.66, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-r, -r * 0.55, r * 2, r * 0.18);
  }
  if (o.scarf) { ctx.fillStyle = o.scarf; ctx.beginPath(); ctx.ellipse(0, -r * 0.2, r * 1.15, r * 1.0, 0, Math.PI * 1.02, -0.02); ctx.fill(); ctx.fillRect(-r * 1.15, -r * 0.2, r * 0.35, r * 0.9); ctx.fillRect(r * 0.8, -r * 0.2, r * 0.35, r * 0.9); }
  ctx.restore();
}
// a stick-ish person: body capsule + legs; phase drives the walk/run cycle
function person(ctx, x, y, s, o = {}) {
  const ph = o.phase || 0, run = o.run || 0, lean = o.lean || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.rotate(lean);
  ctx.strokeStyle = o.legs || '#22283A'; ctx.lineWidth = 26; ctx.lineCap = 'round';
  for (const k of [0, Math.PI]) { const a = Math.sin(ph + k) * (0.25 + 0.55 * run); ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(Math.sin(a) * 90, -40 + Math.cos(a) * 90); ctx.stroke(); }
  ctx.fillStyle = o.coat || C.jacket; rrect(ctx, -46, -190, 92, 160, 40); ctx.fill();
  ctx.strokeStyle = o.coat || C.jacket; ctx.lineWidth = 24;
  if (o.arms === 'forward') { for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -160); ctx.lineTo(95, -150 + k * 14); ctx.stroke(); } }
  else for (const k of [0, Math.PI]) { const a = -Math.sin(ph + k) * (0.3 + 0.7 * run); ctx.beginPath(); ctx.moveTo(0, -165); ctx.lineTo(Math.sin(a) * 75, -165 + Math.cos(a) * 75); ctx.stroke(); }
  ctx.restore();
  head(ctx, x + (o.flip ? -1 : 1) * Math.sin(lean) * 230 * s, y - 250 * s, 58 * s, o.head || {});
}
function hudGrain(ctx, t) {
  const fr = Math.floor(t * 24);
  for (let i = 0; i < 800; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 * hash01(i, fr)})`; ctx.fillRect(hash01(i, fr + 1) * W, hash01(i, fr + 2) * H, 2, 2); }
}

// ---------------------------------------------------------------- scenes
function shopfront(ctx, x, y, w, h, label, col, lit) {
  ctx.fillStyle = '#2A1C30'; ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = mix('#3A2A40', '#FFE2A0', lit); ctx.fillRect(x + 20, y - h + 90, w - 40, h - 110);
  ctx.fillStyle = col; ctx.fillRect(x, y - h, w, 70);
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(44, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y - h + 52); ctx.textAlign = 'left';
  ctx.fillStyle = '#B23A2E'; for (let i = 0; i < w; i += 60) { ctx.beginPath(); ctx.moveTo(x + i, y - h + 70); ctx.lineTo(x + i + 30, y - h + 110); ctx.lineTo(x + i + 60, y - h + 70); ctx.fill(); }
}
function street(ctx, t, scroll = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.night0); g.addColorStop(1, C.night1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // buildings with windows
  for (let b = -1; b < 6; b++) {
    const bx = ((b * 260 - scroll * 0.4) % 1560 + 1560) % 1560 - 260;
    const bh = 700 + 260 * hash01(b + 50, 3);
    ctx.fillStyle = '#1C1328'; ctx.fillRect(bx, H * 0.62 - bh, 250, bh);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { const on = hash01(b * 40 + i * 9 + j, 7) > 0.45; ctx.fillStyle = on ? '#E9B866' : '#2A1E38'; ctx.fillRect(bx + 24 + i * 56, H * 0.62 - bh + 40 + j * 80, 34, 50); }
  }
  const shops = [['FIRIN', '#C2410C'], ['DÖNER', '#B91C1C'], ['ECZANE', '#15803D'], ['BAKKAL', '#1D4ED8']];
  for (let i = -1; i < 6; i++) {
    const sx = ((i * 420 - scroll) % 1680 + 1680) % 1680 - 420;
    const [l, c] = shops[((i % 4) + 4) % 4];
    shopfront(ctx, sx, H * 0.7, 400, 360, l, c, 0.8);
  }
  ctx.fillStyle = '#2B2235'; ctx.fillRect(0, H * 0.7, W, H * 0.3);           // pavement
  ctx.fillStyle = '#3A3044'; for (let i = 0; i < 12; i++) ctx.fillRect(((i * 160 - scroll) % 1920 + 1920) % 1920 - 160, H * 0.83, 90, 10);
}
function sMarket(ctx, t) {
  const t0 = S.market, fall = t0 + T0.fall, rise = t0 + T0.rise, bite = t0 + T0.bite;
  const z = 1.0 * 1.25 ** E.inOutSine(prog(t, t0, S.run));
  const [sx, sy] = shakeAt(t, [bite], 22);
  ctx.save(); camera(ctx, z, W * 0.5, H * 0.72, sx, sy);
  street(ctx, t, 0);
  // crowd idling: turns grey and faces us after the bite
  const turned = prog(t, bite + 0.3, bite + 1.4);
  for (let i = 0; i < 7; i++) {
    const px = 40 + i * 170 + 30 * hash01(i, 2), py = H * 0.84 + 40 * hash01(i, 3), s = 0.85 + 0.15 * hash01(i, 4);
    if (Math.abs(px - W * 0.52) < 200) continue;
    const zz = turned * (hash01(i, 9) > 0.35 ? 1 : 0);
    person(ctx, px, py, s, { phase: t * 2 + i, coat: mix(['#7C3AED', '#DB2777', '#F59E0B', '#0EA5E9'][i % 4], '#5E6B57', zz), arms: zz > 0.5 ? 'forward' : null, flip: px > W / 2, head: { zombie: zz > 0.5, skin: mix(C.skin, C.zskin, zz) } });
  }
  // the man who falls, rises, bites
  const f = E.inQuad(prog(t, fall, fall + 0.5)) * (1 - E.outBack(prog(t, rise, rise + 0.6)));
  const lunge = E.outCubic(prog(t, bite - 0.2, bite + 0.2));
  const isZ = t > rise;
  ctx.save(); ctx.translate(W * 0.44 + lunge * 60, H * 0.86); ctx.rotate(-f * 1.45); ctx.translate(-W * 0.44 - lunge * 60, -H * 0.86);
  person(ctx, W * 0.44 + lunge * 60, H * 0.86, 1.1, { coat: '#6B7280', arms: isZ ? 'forward' : null, head: { zombie: isZ, skin: isZ ? C.zskin : C.skin } });
  ctx.restore();
  person(ctx, W * 0.64, H * 0.86, 1.05, { coat: '#EAB308', flip: true, lean: -0.3 * lunge, head: { mouth: t > bite ? 'o' : null, wide: t > bite } });
  if (t > bite) { ctx.fillStyle = 'rgba(180,20,30,0.85)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(W * 0.56 + 60 * (hash01(i, 5) - 0.5), H * 0.6 + 50 * hash01(i, 6) + 200 * prog(t, bite, bite + 0.6) * hash01(i, 7), 8, 0, M.TAU); ctx.fill(); } }
  ctx.restore();
}
function sRun(ctx, t) {
  const p = t - S.run;
  street(ctx, t, p * 1100);
  // zombies chasing from the left
  for (let i = 0; i < 7; i++) {
    const px = -160 + i * 90 + 40 * Math.sin(p * 2 + i) + p * 20, py = H * 0.86 + 30 * hash01(i, 8), s = 0.95 + 0.15 * hash01(i, 9);
    person(ctx, px, py, s, { phase: p * 7 + i, run: 0.5, coat: mix('#5E6B57', '#3F3A4A', hash01(i, 1)), arms: 'forward', head: { zombie: true, skin: C.zskin } });
  }
  person(ctx, W * 0.66, H * 0.87, 1.3, { phase: p * 15, run: 1, lean: 0.25, head: { beanie: C.red, wide: true, mouth: 'o', look: -0.6 } });
  // speed lines
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 6;
  for (let i = 0; i < 10; i++) { const y = H * 0.3 + hash01(i, 4) * H * 0.5, x = ((hash01(i, 5) * W - p * 2400) % W + W) % W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180, y); ctx.stroke(); }
}
// isometric room helpers: grid (i, j) -> screen
const ISO = { x: W / 2, y: H * 0.36, a: 64 };
const iso = (i, j, z = 0) => [ISO.x + (i - j) * ISO.a, ISO.y + (i + j) * ISO.a * 0.5 - z];
function isoBox(ctx, i, j, w, d, h, top, left, right) {
  const p = (a, b, z) => iso(i + a, j + b, z);
  const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
  poly([p(0, d, 0), p(w, d, 0), p(w, d, h), p(0, d, h)], left);
  poly([p(w, 0, 0), p(w, d, 0), p(w, d, h), p(w, 0, h)], right);
  poly([p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)], top);
}
function room(ctx, t, lampOn) {
  fill(ctx, '#0F0A1C');
  const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); };
  const N = 9, WH = 520;
  poly([iso(0, 0, WH), iso(N, 0, WH), iso(N, 0), iso(0, 0)], '#3B2F5C');            // back-right wall
  poly([iso(0, 0, WH), iso(0, N, WH), iso(0, N), iso(0, 0)], '#2E244A');            // back-left wall
  poly([iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)], C.floor);                      // floor
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3;
  for (let k = 1; k < N; k++) { const [a, b] = [iso(k, 0), iso(k, N)]; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // window with the city outside
  poly([iso(2, 0, 420), iso(5, 0, 420), iso(5, 0, 180), iso(2, 0, 180)], '#1A1230');
  for (let k = 0; k < 10; k++) { const [x, y] = iso(2.2 + hash01(k, 3) * 2.6, 0, 200 + hash01(k, 4) * 180); ctx.fillStyle = hash01(k, 5) > 0.5 ? '#E9B866' : '#2A1E38'; ctx.fillRect(x - 8, y - 8, 16, 12); }
  // door on the left wall + chain lock
  poly([iso(0, 5.2, 380), iso(0, 7, 380), iso(0, 7), iso(0, 5.2)], '#5A3A26');
  const [kx, ky] = iso(0, 6.6, 190); ctx.fillStyle = '#E8C14E'; ctx.beginPath(); ctx.arc(kx, ky, 9, 0, M.TAU); ctx.fill();
  // rug, sofa, table, lamp, drawer
  poly([iso(2.5, 3, 1), iso(6.5, 3, 1), iso(6.5, 6.5, 1), iso(2.5, 6.5, 1)], '#8E2A35');
  poly([iso(3, 3.5, 2), iso(6, 3.5, 2), iso(6, 6, 2), iso(3, 6, 2)], '#B9474F');
  isoBox(ctx, 6.6, 2.6, 1.6, 4.2, 90, '#2F6B5E', '#245246', '#1C4038');            // sofa seat
  isoBox(ctx, 7.8, 2.6, 0.5, 4.2, 210, '#2F6B5E', '#245246', '#1C4038');            // sofa back
  isoBox(ctx, 3.8, 4.1, 1.4, 1.2, 70, '#7A5236', '#5E3F29', '#4A3120');             // coffee table
  isoBox(ctx, 1, 1, 1.2, 2.2, 140, '#7A5236', '#5E3F29', '#4A3120');                // drawer
  // cat Pamuk on the sofa, breathing
  const [cx, cy] = iso(7.3, 4.0, 100); const br = 1 + 0.04 * Math.sin(t * 3);
  ctx.fillStyle = '#E89B3C'; ctx.beginPath(); ctx.ellipse(cx, cy, 52 * br, 30 * br, -0.2, 0, M.TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 44, cy - 14, 22, 0, M.TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 30, cy - 30); ctx.lineTo(cx + 36, cy - 50); ctx.lineTo(cx + 46, cy - 34); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 48, cy - 34); ctx.lineTo(cx + 60, cy - 50); ctx.lineTo(cx + 62, cy - 30); ctx.fill();
  ctx.strokeStyle = '#B86E22'; ctx.lineWidth = 5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - 20 + k * 16, cy - 26); ctx.lineTo(cx - 14 + k * 16, cy - 8); ctx.stroke(); }
  // candle on the table instead of a lamp (rule 2)
  const [lx, ly] = iso(4.5, 4.7, 80);
  ctx.fillStyle = '#F3EAD5'; ctx.fillRect(lx - 8, ly - 40, 16, 40);
  ctx.fillStyle = '#FFB347'; ctx.beginPath(); ctx.ellipse(lx, ly - 52 + Math.sin(t * 12) * 2, 7, 14, 0, 0, M.TAU); ctx.fill();
  glow(ctx, lx, ly - 50, 420, 'rgba(255,170,80,A)', 0.28 * lampOn);
}
function sHome(ctx, t) {
  const p = t - S.home;
  const z = 1.0 * 1.12 ** E.inOutSine(prog(t, S.home, S.book));
  ctx.save(); camera(ctx, z, W / 2, H * 0.55);
  room(ctx, t, prog(t, S.home + 2.5, S.home + 3.2));
  // character: in at the door, locks it, walks to the drawer
  const walk = E.inOutSine(prog(t, S.home + 1.6, S.book - 0.6));
  const [px, py] = iso(lerp(0.8, 1.8, walk), lerp(6.1, 3.6, walk));
  person(ctx, px, py, 0.8, { phase: p * 6, run: 0.2 * (walk > 0 && walk < 1), head: { beanie: C.red, look: -0.5 } });
  ctx.restore();
}
const RULES = [
  ['1.', 'SESSİZLİK', C.ink],
  ['2.', 'IŞIK YAKMA', C.ink],
  ['3.', 'ISIRILANA KAPI AÇMA', C.red],
];
function sBook(ctx, t) {
  fill(ctx, '#1A120C');
  glow(ctx, W / 2, H * 0.45, 900, 'rgba(255,170,80,A)', 0.25);
  const open = E.inOutCubic(prog(t, S.book + T0.openAt, S.book + T0.openAt + 0.6));
  const x = 110, y = 380, w = W - 220, h = 1080;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + 20, y + 26, w, h);
  ctx.fillStyle = C.paper; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(80,110,160,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 13; k++) { ctx.beginPath(); ctx.moveTo(x + 40, y + 200 + k * 66); ctx.lineTo(x + w - 40, y + 200 + k * 66); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,60,60,0.5)'; ctx.beginPath(); ctx.moveTo(x + 120, y); ctx.lineTo(x + 120, y + h); ctx.stroke();
  ctx.fillStyle = '#2A2016'; ctx.font = font(30, 700, UI); ctx.fillText('babamın el yazısı', x + 150, y + 120);
  RULES.forEach(([n, s, col], i) => {
    const at = T0.rules[i];
    const p = prog(t, at - 0.05, at + 0.5);
    if (p <= 0) return;
    const ry = y + 330 + i * 230;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 140, ry - 90, (w - 160) * E.outCubic(p), 140); ctx.clip();
    ctx.fillStyle = col; ctx.font = font(i === 2 ? 56 : 92, 900, DISPLAY);
    ctx.save(); ctx.translate(x + 150, ry); ctx.rotate(-0.02); ctx.fillText(`${n} ${s}`, 0, 0); ctx.restore();
    ctx.strokeStyle = C.red; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x + 150, ry + 22); ctx.lineTo(x + 150 + (w - 260) * p, ry + 18); ctx.stroke();
    ctx.restore();
  });
  // cover swings open (left hinge) to reveal the page
  if (open < 1) {
    const cw = w * (1 - open);
    ctx.fillStyle = '#20242E'; ctx.fillRect(x, y, cw, h);
    if (cw > 200) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, cw, h); ctx.clip();
      ctx.fillStyle = C.paper; ctx.save(); ctx.translate(x + w / 2, y + h * 0.42); ctx.rotate(-0.05);
      rrect(ctx, -300, -110, 600, 220, 10); ctx.fill();
      ctx.fillStyle = C.ink; ctx.font = font(76, 900, DISPLAY); ctx.textAlign = 'center';
      ctx.fillText('NE OLUR', 0, -18); ctx.fillText('NE OLMAZ', 0, 70); ctx.textAlign = 'left';
      ctx.restore(); ctx.restore();
    }
  }
}
function sPeep(ctx, t) {
  fill(ctx, '#050408');
  const [sx, sy] = shakeAt(t, KNOCKS, 26, 11);
  const reveal = E.outCubic(prog(t, S.peep + 0.3, S.peep + 1.2));
  const R = 470 * reveal, cx = W / 2 + sx, cy = H * 0.47 + sy;
  if (R > 2) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.clip();
    // hallway through a fisheye: dim corridor, her face swelling toward the lens
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, '#5A5240'); g.addColorStop(1, '#1A160E'); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 8; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(cx + k * 120, cy, 60, R, 0, 0, M.TAU); ctx.stroke(); }
    const lean = E.inOutSine(prog(t, S.peep + 1.5, S.end - 0.4));
    const hr = lerp(190, 260, lean);
    ctx.fillStyle = '#6B4E6E'; rrect(ctx, cx - 300, cy + hr * 0.6, 600, 600, 200); ctx.fill();
    head(ctx, cx, cy - 20 + 40 * (1 - lean), hr, { skin: mix(C.skin, C.zskin, 0.35 + 0.3 * lean), scarf: '#B8A6C9', mouth: 'o', wide: true });
    // bandaged arm raised to knock
    const kn = KNOCKS.reduce((a, k) => a + bump(t, k, 0.12), 0);
    ctx.fillStyle = '#6B4E6E'; ctx.save(); ctx.translate(cx + 360, cy + 300); ctx.rotate(-0.3 - 0.2 * kn); ctx.fillRect(-45, -360, 90, 360);
    ctx.fillStyle = '#EDE8DC'; ctx.fillRect(-50, -250, 100, 110);
    ctx.fillStyle = 'rgba(170,20,30,0.9)'; ctx.beginPath(); ctx.ellipse(0, -200, 36, 30, 0.3, 0, M.TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = '#1A1408'; ctx.lineWidth = 50; ctx.beginPath(); ctx.arc(cx, cy, R + 20, 0, M.TAU); ctx.stroke();
    const vg = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)'); ctx.fillStyle = vg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, M.TAU); ctx.fill();
  }
  for (const k of KNOCKS) { const b = bump(t, k + 0.05, 0.12); if (b > 0) { ctx.fillStyle = `rgba(255,255,255,${0.1 * b})`; ctx.fillRect(0, 0, W, H); } }
}
function sEnd(ctx, t) {
  fill(ctx, '#0A0406');
  glow(ctx, W / 2, H * 0.45, 1200, 'rgba(229,50,45,A)', 0.3);
  const T1 = S.end;
  [['KAPIYI', '#FFFFFF'], ['AÇAR', C.red], ['MISIN?', '#FFFFFF']].forEach(([s, col], i) => {
    const p = springU(t, T1 + i * 0.18, SPRING.bouncy);
    if (p <= 0) return;
    ctx.save(); ctx.translate(W / 2, 640 + i * 240); ctx.scale(lerp(1.6, 1, clamp(p)), lerp(1.6, 1, clamp(p))); ctx.globalAlpha = clamp(p * 2);
    text(ctx, s, 0, 0, font(230, 900, DISPLAY), col, 'center', -4.6);
    ctx.restore();
  });
  const btn = (bx, label, col, at) => {
    const p = springU(t, at, SPRING.bouncy); if (p <= 0) return;
    const pulse = 1 + 0.04 * Math.sin((t - at) * 6) * prog(t, at + 0.5, at + 1);
    ctx.save(); ctx.translate(bx, 1440); ctx.scale(p * pulse, p * pulse);
    ctx.fillStyle = col; rrect(ctx, -210, -80, 420, 160, 80); ctx.fill();
    text(ctx, label, 0, 30, font(label.length > 2 ? 78 : 88, 900, DISPLAY), '#FFFFFF', 'center');
    ctx.restore();
  };
  btn(W * 0.29, 'AÇ', C.green, T1 + 0.8);
  btn(W * 0.71, 'AÇMA', C.red, T1 + 1.05);
  const tp = E.outCubic(prog(t, T1 + 1.8, T1 + 2.3));
  if (tp > 0) {
    ctx.globalAlpha = tp;
    text(ctx, 'YORUMLARA YAZ', W / 2, 1660 + (1 - tp) * 30, font(58, 900, DISPLAY), C.yel, 'center');
    text(ctx, 'GÜN 2 YAKINDA', W / 2, 1740 + (1 - tp) * 30, font(36, 700, UI), '#B9A9A6', 'center');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- HUD: day, clock, place, heart rate
const BPM = (t) => {
  const keys = [[0, 86], [S.market + T0.bite, 104], [S.run, 158], [S.home, 150], [S.home + 4, 112], [S.book, 96], [S.peep - 0.5, 92], [KNOCKS[0], 128], [S.peep + 3, 151], [S.end, 164]];
  let v = keys[0][1];
  for (let k = 1; k < keys.length; k++) { const [a, va] = keys[k - 1], [b, vb] = keys[k]; if (t >= a) v = lerp(va, vb, E.inOutSine(prog(t, a, b))); }
  return Math.round(v + 2 * Math.sin(t * 3));
};
function hud(ctx, t) {
  if (t >= S.end) return;
  const clock = t < S.run ? '21:47' : t < S.home ? '21:51' : t < S.book ? '22:06' : t < S.peep ? '22:30' : '23:58';
  const place = t < S.home ? 'KADIKÖY · ÇARŞI' : 'KADIKÖY · 6. KAT';
  const bpm = BPM(t), state = bpm > 140 ? ['PANİK', C.red] : bpm > 105 ? ['GERGİN', '#F59E0B'] : ['SAKİN', '#22C55E'];
  const x = 56, y = 120, w = 470, h = 250;
  ctx.fillStyle = 'rgba(8,6,14,0.62)'; rrect(ctx, x, y, w, h, 16); ctx.fill();
  text(ctx, 'GÜN 1', x + 24, y + 46, font(34, 900, DISPLAY), C.yel);
  text(ctx, 'CMT 24 EKİ', x + 150, y + 46, font(26, 700, UI), '#B8B0C8');
  text(ctx, clock, x + 22, y + 126, font(86, 900, DISPLAY), '#FFFFFF');
  text(ctx, place, x + 24, y + 162, font(24, 700, UI), '#B8B0C8');
  // heart + bpm + ECG
  const beat = bump((t * bpm / 60) % 1, 0.1, 0.1);
  ctx.save(); ctx.translate(x + 40, y + 206); ctx.scale(1 + 0.25 * beat, 1 + 0.25 * beat);
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-26, -6, -14, -26, 0, -12); ctx.bezierCurveTo(14, -26, 26, -6, 0, 12); ctx.fill(); ctx.restore();
  text(ctx, String(bpm), x + 72, y + 222, font(46, 900, DISPLAY), '#FFFFFF');
  text(ctx, 'BPM', x + 150, y + 222, font(22, 700, UI), '#B8B0C8');
  text(ctx, state[0], x + w - 24, y + 222, font(30, 900, DISPLAY), state[1], 'right');
  ctx.strokeStyle = state[1]; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const ph = ((t * bpm / 60) - i / 30) % 1, spike = ph > 0 && ph < 0.06 ? Math.sin(ph / 0.06 * Math.PI) * 26 : 0;
    const px = x + 210 + i * 1.6, py = y + 210 - spike + (i % 9 === 0 ? 2 : 0);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i < Math.round((bpm - 60) / 10) ? (i < 5 ? '#22C55E' : i < 8 ? '#F59E0B' : C.red) : 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 24 + i * 36, y + h - 14, 30, 7); }
}
function captions(ctx, t) {
  const c = CAP.find(([a, b]) => t >= a - 0.05 && t < b + 0.35);
  if (!c) return;
  const [a, b, s, hl] = c;
  const words = s.split(' ');
  const size = 104, GAP = size * 0.3;
  ctx.font = font(size, 900, DISPLAY);
  const maxW = W - 120, lines = [[]];
  let lw = 0;
  for (const w of words) {
    const ww = ctx.measureText(w).width + GAP;
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(w); lw += ww;
  }
  const y0 = (t < S.home ? H * 0.52 : H * 0.76) - (lines.length - 1) * size * 0.55;
  let wi = 0;
  lines.forEach((ln, li) => {
    const total = ln.reduce((s2, w2) => s2 + ctx.measureText(w2).width, 0) + GAP * (ln.length - 1);
    let x = (W - total) / 2;
    for (const w of ln) {
      const at = a + (b - a) * (wi / words.length) - 0.04;
      const p = springU(t, at, SPRING.bouncy);
      const ww = ctx.measureText(w).width;
      if (p > 0) {
        ctx.save(); ctx.translate(x + ww / 2, y0 + li * size * 1.08); ctx.scale(lerp(0.6, 1, clamp(p)), lerp(0.6, 1, clamp(p)));
        ctx.lineJoin = 'round'; ctx.lineWidth = 18; ctx.strokeStyle = '#05070F'; ctx.textAlign = 'center';
        ctx.strokeText(w, 0, 0); ctx.fillStyle = hl[w] || '#FFFFFF'; ctx.fillText(w, 0, 0); ctx.textAlign = 'left';
        ctx.restore();
      }
      x += ww + GAP; wi++;
    }
  });
}

const T0 = T.local;
M.film({
  fonts: [font(100, 900, DISPLAY), font(40, 700, UI)],
  hits: HITS,
  samples: 8,
  draw(ctx, u, t) {
    if (t < S.run) sMarket(ctx, t);
    else if (t < S.home) sRun(ctx, t);
    else if (t < S.book) sHome(ctx, t);
    else if (t < S.peep) sBook(ctx, t);
    else if (t < S.end) sPeep(ctx, t);
    else sEnd(ctx, t);
  },
  post(ctx, u, t) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    hudGrain(ctx, t);
    if (t < 0.4) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.4})`; ctx.fillRect(0, 0, W, H); }
    const D = window.DURATION || 44;
    if (t > D - 0.6) { ctx.fillStyle = `rgba(0,0,0,${(t - D + 0.6) / 0.6})`; ctx.fillRect(0, 0, W, H); }
    hud(ctx, t);
    captions(ctx, t);
  },
});
