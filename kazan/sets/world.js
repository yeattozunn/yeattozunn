// The whole diorama: courtyard, kazan on its fire, round janissary characters, a crowd, spilled soup.
// update(t, u, o) sets every transform from (t, u) alone; o.times carries the voice-synced beats.
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';

const { THREE } = G;
const { lerp, clamp, prog, E, springU, SPRING, noise1, hash01, kf, bump } = M;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const COL = {
  skin: 0xf0b48a, felt: 0xf7f2e6, gold: 0xe3a72f, wood: 0x8a5a2b, ink: 0x1b1f3b, cheek: 0xff8f9c,
  iron: 0x2b2b32, soup: 0xd9772b, stone: 0x7b7468, brick: 0xb8734f,
};
const std = (color, rough = 0.55, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, envMapIntensity: 0.7, ...extra });

function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

// ---------------------------------------------------------------- textures drawn once
function brickTexture(w, h, base = '#b8734f', mortar = '#6d4634') {
  const tex = G.canvasTexture(w, h);
  tex.draw((c) => {
    c.fillStyle = mortar; c.fillRect(0, 0, w, h);
    const bh = h / 8, bw = w / 6;
    for (let r = 0; r < 8; r++) for (let k = -1; k < 7; k++) {
      const x = k * bw + (r % 2 ? bw / 2 : 0), v = hash01(r * 17 + k + 3, 5);
      c.fillStyle = `hsl(${18 + v * 10}, ${42 + v * 14}%, ${42 + v * 14}%)`;
      c.beginPath(); c.roundRect(x + 3, r * bh + 3, bw - 6, bh - 6, 5); c.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function cobbleTexture(s) {
  const tex = G.canvasTexture(s, s);
  tex.draw((c) => {
    c.fillStyle = '#4a443d'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const x = hash01(i, 11) * s, y = hash01(i, 12) * s, r = 22 + hash01(i, 13) * 20, v = hash01(i, 14);
      c.fillStyle = `hsl(${30 + v * 14}, ${10 + v * 8}%, ${44 + v * 16}%)`;
      c.beginPath(); c.ellipse(x, y, r, r * 0.8, hash01(i, 15) * 3, 0, 7); c.fill();
    }
  });
  return tex;
}

// ---------------------------------------------------------------- a round little janissary
export function makeChar(robe = 0xb5301f) {
  const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
  root.add(body); body.add(head);
  const robeM = std(robe, 0.6), skinM = std(COL.skin, 0.7), feltM = std(COL.felt, 0.9), goldM = std(COL.gold, 0.35, 0.6);
  const bd = mesh(new THREE.SphereGeometry(0.62, 40, 28), robeM, body, 0, 0.66, 0); bd.scale.set(1, 1.05, 0.9);
  const belt = mesh(new THREE.TorusGeometry(0.6, 0.055, 12, 48), goldM, body, 0, 0.6, 0); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.9, 1);
  const feet = [-1, 1].map((s) => { const f = mesh(new THREE.SphereGeometry(0.17, 18, 12), std(0x2a1c18, 0.7), root, s * 0.28, 0.07, 0.16); f.scale.set(1, 0.6, 1.35); return f; });
  const arms = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * 0.58, 1.0, 0.02); body.add(g);
    mesh(new THREE.SphereGeometry(0.2, 20, 14), robeM, g, 0, -0.28, 0).scale.set(0.9, 1.25, 0.9);
    mesh(new THREE.SphereGeometry(0.13, 16, 12), skinM, g, 0, -0.56, 0.04);
    return g;
  });
  head.position.set(0, 1.62, 0);
  mesh(new THREE.SphereGeometry(0.6, 48, 32), skinM, head);
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * 0.2, 0.04, 0.53); head.add(g);
    const e = mesh(new THREE.SphereGeometry(0.075, 18, 14), std(COL.ink, 0.25), g); e.scale.set(1, 1.35, 0.55);
    mesh(new THREE.SphereGeometry(0.024, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), g, 0.025, 0.04, 0.04);
    return g;
  });
  [-1, 1].forEach((s) => {
    const p = V3(s * 0.34, -0.13, 0.46).normalize().multiplyScalar(0.585);
    const c = mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: COL.cheek, transparent: true, opacity: 0.55 }), head, p.x, p.y, p.z);
    c.lookAt(p.x * 2, p.y * 2, p.z * 2);
  });
  const smile = mesh(new THREE.TorusGeometry(0.085, 0.017, 8, 20, Math.PI), std(0x6b2a2a, 0.5), head, 0, -0.07, 0.575);
  smile.rotation.z = Math.PI;
  const brows = [-1, 1].map((s) => {
    const b = mesh(new THREE.CapsuleGeometry(0.02, 0.1, 4, 8), std(0x6b4a3a, 0.8), head, s * 0.2, 0.2, 0.55);
    b.userData.s = s; return b;
  });
  // börk: felt cap, a flap hanging behind, and the gilded spoon-holder in front
  const bork = new THREE.Group(); bork.position.set(0, 0.46, -0.02); head.add(bork);
  mesh(new THREE.CylinderGeometry(0.3, 0.43, 0.6, 32), feltM, bork, 0, 0.26, 0);
  mesh(new THREE.SphereGeometry(0.3, 28, 16), feltM, bork, 0, 0.56, 0).scale.set(1, 0.55, 1);
  mesh(new THREE.TorusGeometry(0.425, 0.03, 10, 40), goldM, bork, 0, 0.0, 0).rotation.x = Math.PI / 2;
  const flap = mesh(new THREE.CapsuleGeometry(0.16, 0.6, 6, 14), feltM, bork, 0, -0.18, -0.4);
  flap.scale.set(1, 1, 0.32); flap.rotation.x = -0.12;
  const holder = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.34, 16), goldM, bork, 0, 0.3, 0.41);
  holder.rotation.x = -0.1;
  const spoon = new THREE.Group(); spoon.position.set(0, 0.5, 0.42); head.add(spoon);
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.5, 8), std(COL.wood, 0.7), spoon, 0, 0.2, 0);
  mesh(new THREE.SphereGeometry(0.075, 14, 10), std(COL.wood, 0.7), spoon, 0, 0.5, 0).scale.set(1, 1.2, 0.35);
  const aBork = new THREE.Object3D(); aBork.position.set(0, 0.62, 0); bork.add(aBork);
  const aHolder = new THREE.Object3D(); aHolder.position.set(0, 0.0, 0.1); holder.add(aHolder);
  const shadow = mesh(new THREE.CircleGeometry(0.85, 28), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }), root, 0, 0.012, 0);
  shadow.rotation.x = -Math.PI / 2;
  return { root, body, head, arms, eyes, smile, brows, spoon, bork, aBork, aHolder, shadow, feet };
}

// p: pos, yaw, squash, hop, headYaw, headPitch, mood (+1 smile .. -1 frown), brow (angry radians), armL/armR (raise), blink
function pose(c, p) {
  const { x = 0, y = 0, z = 0, yaw = 0, squash = 0, headYaw = 0, headPitch = 0, mood = 1, brow = 0, armL = 0, armR = 0, blink = 0, tilt = 0 } = p;
  c.root.position.set(x, y, z); c.root.rotation.y = yaw;
  c.body.scale.set(1 + squash, 1 - squash * 1.2, 1 + squash); c.body.rotation.z = tilt;
  c.head.rotation.set(headPitch, headYaw, 0);
  c.smile.scale.y = mood; c.smile.position.y = mood < 0 ? -0.14 : -0.07; c.smile.scale.x = 1 - 0.25 * Math.abs(Math.min(0, mood));
  c.brows.forEach((b) => { b.rotation.z = Math.PI / 2 + b.userData.s * brow; b.position.y = 0.2 - 0.03 * Math.abs(brow); });
  c.eyes.forEach((e) => { e.scale.y = Math.max(0.08, 1 - blink); });
  c.arms[0].rotation.z = -0.25 - armL * 2.6; c.arms[1].rotation.z = 0.25 + armR * 2.6;
  c.shadow.scale.setScalar(Math.max(0.3, 1 - y * 0.25)); c.shadow.material.opacity = Math.max(0.08, 0.3 - y * 0.12);
  c.shadow.position.y = 0.012 - y; c.shadow.position.x = 0;
}
const blinkAt = (t, off = 0) => { const k = (t + off) % 3.1; return k < 0.14 ? Math.sin((k / 0.14) * Math.PI) : 0; };

// ---------------------------------------------------------------- the set
export function worldSet(T) {
  const scene = new THREE.Scene(), cam = G.camera(34, 0.1, 80);
  scene.environment = G.ENV;
  const lights = G.keyLights(scene, { key: 2.4, rim: 1.6, fill: 0.5, keyPos: [-4, 7, 7], rimPos: [5, 3, -5] });
  const hemi = scene.children.find((o) => o.isHemisphereLight);
  const fireLight = new THREE.PointLight(0xff8a3c, 3, 11, 1.6); fireLight.position.set(0, 0.9, 0.9); scene.add(fireLight);

  // courtyard
  const stage = new THREE.Group(); scene.add(stage);
  const ground = mesh(new THREE.CylinderGeometry(9, 9.2, 0.4, 64), std(0x5a5148, 0.9), stage, 0, -0.2, 0);
  const cob = cobbleTexture(512); cob.wrapS = cob.wrapT = THREE.RepeatWrapping; cob.repeat.set(4.2, 4.2);
  const top = mesh(new THREE.CircleGeometry(9, 64), std(0xffffff, 0.95, 0, { map: cob }), stage, 0, 0.002, 0); top.rotation.x = -Math.PI / 2;
  const bt = brickTexture(768, 384); bt.repeat.set(2.4, 1.1);
  const wall = mesh(new THREE.BoxGeometry(13, 3.6, 0.6), std(0x9c8c84, 0.9, 0, { map: bt }), stage, 0, 1.8, -4.1);
  for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(1.2, 0.7, 0.6), std(0x9a6a50, 0.9), stage, -5.4 + i * 2.16, 3.95, -4.1);
  const torches = [-3.8, 3.8].map((x) => {
    mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.5, 10), std(0x3b2a20, 0.8), stage, x, 1.5, -3.7);
    const f = mesh(new THREE.SphereGeometry(0.2, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffb24a }), stage, x, 2.4, -3.7);
    f.scale.set(1, 1.5, 1); return f;
  });

  // the kazan on its fire. The pivot sits on the right base edge so tipping is a rotation about it.
  const potPivot = new THREE.Group(); potPivot.position.set(1.15, 0, 0); scene.add(potPivot);
  const pot = new THREE.Group(); pot.position.set(-1.15, 0.6, 0); potPivot.add(pot);
  const prof = [[0, 0], [0.45, 0.02], [0.82, 0.22], [1.04, 0.62], [1.1, 1.0], [1.08, 1.12], [1.0, 1.1], [0.98, 0.98], [0.9, 0.62], [0.7, 0.26], [0, 0.2]].map(([r, y]) => new THREE.Vector2(r, y));
  const ironM = std(COL.iron, 0.42, 0.75, { side: THREE.DoubleSide });
  mesh(new THREE.LatheGeometry(prof, 56), ironM, pot);
  mesh(new THREE.TorusGeometry(1.06, 0.075, 12, 56), ironM, pot, 0, 1.12, 0).rotation.x = Math.PI / 2;
  [-1, 1].forEach((s) => { const h = mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 24), ironM, pot, s * 1.18, 0.95, 0); h.rotation.y = Math.PI / 2; });
  const soup = mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.04, 48), std(COL.soup, 0.3, 0, { emissive: 0x7a3300, emissiveIntensity: 0.5 }), pot, 0, 0.88, 0);
  const steam = Array.from({ length: 9 }, (_, i) => mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false }), scene));
  // fire under the pot (stays put when the pot tips)
  const fire = new THREE.Group(); scene.add(fire);
  [0, 1, 2].forEach((i) => { const a = (i / 3) * Math.PI * 2 + 0.5; mesh(new THREE.SphereGeometry(0.3, 14, 10), std(COL.stone, 0.95), fire, Math.cos(a) * 0.85, 0.16, Math.sin(a) * 0.85).scale.set(1, 0.7, 1); });
  [0, 1, 2, 3].forEach((i) => { const a = (i / 4) * Math.PI + 0.3, l = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.3, 10), std(0x3a2418, 0.9, 0, { emissive: 0x802200, emissiveIntensity: 0.6 }), fire, 0, 0.14, 0); l.rotation.set(Math.PI / 2, 0, a); });
  const flames = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2, f = mesh(new THREE.ConeGeometry(0.2, 0.8, 12), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffc23d : 0xff6a1f, transparent: true, opacity: 0.92 }), fire, Math.cos(a) * 0.42, 0.45, Math.sin(a) * 0.42);
    f.userData = { i }; return f;
  });
  // spill
  const spill = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), std(COL.soup, 0.3, 0, { emissive: 0x7a3300, emissiveIntensity: 0.4 }), 90);
  scene.add(spill);
  const puddle = mesh(new THREE.CylinderGeometry(1, 1, 0.03, 40), std(COL.soup, 0.3, 0, { emissive: 0x5a2400, emissiveIntensity: 0.3 }), scene, 2.55, 0.02, 0.15);
  const dm = new THREE.Object3D();

  // the cast
  const hero = makeChar(0xb5301f); scene.add(hero.root);
  const mates = [makeChar(0x2f5ba8), makeChar(0x2e8b57)]; mates.forEach((m) => scene.add(m.root));
  const bowl = new THREE.Group(); scene.add(bowl);
  mesh(new THREE.LatheGeometry([[0, 0], [0.22, 0.01], [0.4, 0.14], [0.46, 0.3], [0.43, 0.3], [0.36, 0.14], [0, 0.07]].map(([r, y]) => new THREE.Vector2(r, y)), 32), std(0xefe6d2, 0.4, 0, { side: THREE.DoubleSide }), bowl);
  mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.02, 28), std(COL.soup, 0.3, 0, { emissive: 0x7a3300, emissiveIntensity: 0.4 }), bowl, 0, 0.22, 0);
  const hand = mesh(new THREE.SphereGeometry(0.17, 16, 12), std(COL.skin, 0.7), scene);
  // crowd behind: instanced bodies, heads, raised fists
  const N = 18;
  const cBody = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.38, 0.7, 6, 14), std(0x2a0c0a, 0.9), N);
  const cHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 16, 12), std(0x2f1410, 0.9), N);
  const cFist = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 8), std(0x2f1410, 0.9), N);
  const cHat = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.26, 0.5, 14), std(0x3a2418, 0.9), N);
  [cBody, cHead, cFist, cHat].forEach((m) => scene.add(m));
  const crowd = Array.from({ length: N }, (_, i) => ({ x: -3.0 + (i / (N - 1)) * 8.8 + (hash01(i, 21) - 0.5) * 0.5, z: -2.5 - hash01(i, 22) * 0.9, ph: hash01(i, 23) * 6, d: hash01(i, 24) }));
  const anchors = { pot: V3(1.0, 1.95, 0.2), hearth: V3(-0.9, 0.35, 0.9), bork: hero.aBork, holder: hero.aHolder };
  const potRim = V3();

  const SH = [0, 5, 9, 19, 24, 29.5, 99];
  const shotOf = (u) => { let s = 0; while (u >= SH[s + 1]) s++; return s; };
  const lerp3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

  function update(t, u, o = {}) {
    const s = shotOf(u), su = u - SH[s], tipU = T.tipU, tipP = prog(u, tipU, tipU + 1.6);
    // ----- mood: warm / red riot / cold aftermath
    const red = prog(u, tipU - 0.2, tipU + 0.8) * (u < SH[5] ? 1 : 0), cold = u >= SH[5] ? 1 : 0;
    const keyCol = new THREE.Color(0xfff0e0).lerp(new THREE.Color(0xff6a4a), red * 0.7).lerp(new THREE.Color(0x9db6ff), cold * 0.8);
    lights.key.color.copy(keyCol); lights.key.intensity = lerp(2.4, 1.9, red) * (cold ? 0.5 : 1);
    lights.rim.intensity = cold ? 0.6 : 1.6; hemi.intensity = cold ? 0.35 : 0.5;
    scene.fog = null;

    // ----- fire / pot visibility per shot
    const showPot = s <= 1 || s >= 4;
    const fireOn = (u < tipU + 0.3 ? 1 : 1 - prog(u, tipU + 0.3, tipU + 1.0)) * (showPot ? 1 : 0);
    fire.visible = showPot; pot.visible = showPot; potPivot.visible = showPot;
    const fl = (k) => 1 + 0.25 * noise1(u * 9 + k * 3.3, 4 + k);
    flames.forEach((f) => { const k = f.userData.i; const h = fireOn * fl(k) * (0.9 + 0.2 * Math.sin(u * 7 + k)); f.scale.set(1, Math.max(0.001, h), 1); f.position.y = 0.2 + 0.4 * h; f.visible = fireOn > 0.02; });
    fireLight.intensity = (showPot ? 1 : 0.25) * (3.2 * fireOn + 0.4) * (1 + 0.15 * noise1(u * 6, 8));
    fireLight.color.set(cold ? 0x6f7fb0 : 0xff8a3c);
    torches.forEach((f, i) => { const h = 1.4 + 0.2 * noise1(u * 8 + i * 5, 6); f.scale.set(1, h, 1); f.visible = !cold; });
    steam.forEach((m, i) => {
      const ph = (u * 0.35 + i / steam.length) % 1;
      const smoke = prog(u, tipU, tipU + 1.2);
      const base = potPivot.position.x - 1.15;
      m.position.set(base + 0.5 * Math.sin(i * 2.3 + ph * 4) * (0.5 + ph), 1.9 + ph * 2.6, 0.15 * Math.sin(i * 5.1));
      m.scale.setScalar(0.35 + ph * 0.9 + smoke * 0.4); m.material.opacity = 0.16 * Math.sin(ph * Math.PI) * (showPot ? 1 : 0) * (1 - 0.3 * smoke);
      m.material.color.set(smoke > 0.2 || cold ? 0x8a8f9a : 0xffffff);
      m.visible = showPot && (u < tipU + 3 || !cold || true);
    });

    // ----- pot tipping (pivot on its right base edge)
    const tilt = 1.78 * E.inCubic(clamp(tipP * 1.05)) * (1 - 0.0) - 0.07 * bump(u, tipU - 0.15, 0.35);
    const settle = u > tipU + 1.55 ? 0.035 * Math.exp(-(u - tipU - 1.55) * 2) * Math.cos((u - tipU - 1.55) * 9) : 0;
    potPivot.rotation.z = -(tilt + settle);
    soup.visible = tilt < 0.35;
    // soup spill particles
    const grav = 5.8;
    for (let i = 0; i < 90; i++) {
      const r1 = hash01(i, 31), r2 = hash01(i, 32), r3 = hash01(i, 33);
      const su0 = tipU + 0.75 + r1 * 1.3, tt = (u - su0) * M.GRID.period;
      let x = 2.0, y = 0.12, z = 0.3, sc = 0;
      if (tt > 0 && u > tipU) {
        const vx = 1.6 + r2 * 2.2, vy = 0.8 + r3 * 1.4, vz = (r2 - 0.5) * 1.8, y0 = 1.0 + r3 * 0.5;
        const tl = (vy + Math.sqrt(vy * vy + 2 * grav * (y0 - 0.1))) / grav, q = Math.min(tt, tl);
        x = 1.9 + vx * q; y = Math.max(0.1, y0 + vy * q - 0.5 * grav * q * q); z = vz * q; sc = tt < tl ? 1 : 0.7;
      }
      dm.position.set(x, y, z); dm.scale.setScalar(sc * (0.8 + r2 * 0.6)); dm.updateMatrix(); spill.setMatrixAt(i, dm.matrix);
    }
    spill.instanceMatrix.needsUpdate = true; spill.visible = s >= 4;
    const pud = E.outExpo(prog(u, tipU + 1.0, tipU + 3.2));
    puddle.scale.set(0.01 + pud * 1.9, 1, 0.01 + pud * 1.4); puddle.visible = s >= 4 && pud > 0;

    // ----- characters
    const hop = (u0, k = 1) => Math.abs(Math.sin(((u - u0) * Math.PI) / 1)) * 0.18 * k;
    [hero, ...mates].forEach((c) => { c.root.visible = false; });
    hero.spoon.position.set(0, 0.5, 0.42); hero.spoon.rotation.set(0, 0, 0);
    bowl.visible = false; hand.visible = false;
    if (s === 1) {
      const place = [[-1.6, 2.0, 0.7, 5.15], [1.65, 1.8, -0.75, 5.5], [0.1, 3.9, 0.0, 5.85]];
      [hero, ...mates].forEach((c, i) => {
        const [x, z, yaw, u0] = place[i], k = springU(u, u0, SPRING.bouncy), drop = (1 - clamp(k, 0, 1.2)) * 5.5;
        c.root.visible = u >= u0 - 0.01;
        const land = wobble0(u - u0 - 0.35);
        pose(c, { x, z, yaw: i === 2 ? 3.2 : yaw + (i === 0 ? 0.35 : -0.35), y: drop + (u > u0 + 0.9 ? hop(u0 + 0.9 + i * 0.3, 1) : 0), squash: 0.12 * land, headYaw: 0.25 * Math.sin(u * 1.4 + i), blink: blinkAt(t, i), armL: u > u0 + 1 ? 0.15 * Math.sin(u * 4 + i) : 0, armR: 0.12 });
      });
    } else if (s === 2 || s === 3) {
      hero.root.visible = true;
      const k = springU(u, SH[s], SPRING.bouncy);
      let hp = { x: 0, z: 0, yaw: 0.0, squash: 0.1 * (s === 2 ? wobble0(su - 0.1) : 0), headYaw: 0.18 * Math.sin(u * 1.1), headPitch: 0.04 * Math.sin(u * 1.7), blink: blinkAt(t), armL: 0.03, armR: 0.03, y: s === 2 ? hop(SH[2] + 2, 0.7) * (su > 2 ? 1 : 0) : 0 };
      if (s === 3) {
        const turn = springU(u, T.refuseU, { stiffness: 220, damping: 16 });
        const bowlIn = springU(u, SH[3] + 0.6, SPRING.gentle);
        hp = { x: 0, z: 0, yaw: 0, squash: 0.06 * wobble0(su - 0.1), headYaw: lerp(0.1, -0.85, turn), headPitch: lerp(0, -0.1, turn), mood: lerp(1, -1, clamp(turn * 1.6)), brow: 0.55 * turn, blink: blinkAt(t), armL: 0.35 * turn, armR: -0.1, y: 0, tilt: -0.08 * turn };
        bowl.visible = true; hand.visible = true;
        const by = lerp(-1.3, 0.78, bowlIn) + 0.04 * Math.sin(u * 3);
        bowl.position.set(0.3, by, 2.1); hand.position.set(0.3, by - 0.12, 2.2);
        // spoon pops up, then falls
        const sf = (u - T.spoonU) * M.GRID.period;
        if (sf > 0) {
          const g = 9, fall = Math.min(0.5 * g * sf * sf, 2.25), pop = 0.35 * Math.max(0, Math.sin(Math.min(sf, 0.25) * Math.PI / 0.25));
          const grounded = fall >= 2.25;
          hero.spoon.position.set(0.15 * sf, 0.5 + pop - fall + (grounded ? 0 : 0), 0.42 + 0.3 * sf);
          hero.spoon.rotation.set(grounded ? 1.5 : 1.2 * sf, 0.3, grounded ? 1.57 : 2.2 * sf);
        }
      }
      pose(hero, hp);
    } else if (s === 4 || s === 5) {
      const place = [-1.0, 3.6], k = springU(u, SH[4], SPRING.bouncy);
      hero.root.visible = s === 4;
      const rage = prog(u, tipU, tipU + 1);
      pose(hero, { x: place[0], z: place[1], yaw: 0.35, squash: 0.08 * wobble0(u - tipU - 0.2) , headYaw: 0.3, mood: -1, brow: 0.6, armL: 0.9 * rage, armR: 0.9 * rage, y: rage * Math.abs(Math.sin(u * 5)) * 0.2, blink: 0 });
      mates.forEach((m) => { m.root.visible = false; });
    }
    // crowd (riot shot)
    const cr = springU(u, tipU + 0.6, { stiffness: 140, damping: 14 }), cShow = s === 4 && u > tipU;
    for (let i = 0; i < N; i++) {
      const c = crowd[i], rise = clamp(cr * (0.7 + c.d * 0.3), 0, 1.1), jump = Math.abs(Math.sin(u * 4 + c.ph)) * 0.25 * rise, y = -1.4 + rise * 1.4 + jump;
      const on = cShow ? 1 : 0;
      dm.position.set(c.x, y + 0.7, c.z); dm.scale.setScalar(on); dm.rotation.set(0, 0, 0); dm.updateMatrix(); cBody.setMatrixAt(i, dm.matrix);
      dm.position.set(c.x, y + 1.55, c.z); dm.updateMatrix(); cHead.setMatrixAt(i, dm.matrix);
      dm.position.set(c.x, y + 1.95, c.z); dm.updateMatrix(); cHat.setMatrixAt(i, dm.matrix);
      dm.position.set(c.x + 0.45, y + 1.9 + 0.2 * Math.sin(u * 8 + c.ph) * rise, c.z + 0.15); dm.updateMatrix(); cFist.setMatrixAt(i, dm.matrix);
    }
    [cBody, cHead, cHat, cFist].forEach((m) => { m.instanceMatrix.needsUpdate = true; m.visible = cShow; });
    dm.scale.setScalar(1);

    // ----- camera per shot
    let pos, tgt, fov = 34;
    if (s === 0) { pos = kf(u, [[0, [0, 1.1, 11.6]], [5, [0.2, 1.6, 9.2]]], E.inOutSine); tgt = kf(u, [[0, [0, 1.25, 0]], [5, [0, 1.45, 0]]]); }
    else if (s === 1) { pos = kf(u, [[5, [-5.5, 3.8, 9.8]], [9, [-2.4, 2.9, 10.6]]], E.inOutSine); tgt = [0, 1.3, 0.8]; fov = 38; }
    else if (s === 2) { pos = kf(u, [[9, [2.2, 2.1, 5.7]], [14, [-1.9, 2.3, 5.4]], [19, [0.6, 2.2, 5.0]]], E.inOutSine); tgt = [0, 2.1, 0]; fov = 36; }
    else if (s === 3) { pos = kf(u, [[19, [0.7, 2.2, 6.2]], [24, [0.3, 2.15, 4.9]]], E.inOutSine); tgt = [0.4, 2.1, 0]; fov = 36; }
    else if (s === 4) { pos = kf(u, [[24, [3.4, 1.7, 12.6]], [29.5, [3.0, 2.0, 11.6]]], E.inOutSine); tgt = [1.9, 1.2, 0]; fov = 42; }
    else { pos = kf(u, [[29.5, [2.2, 1.8, 11.0]], [40, [2.2, 3.6, 13.0]]], E.inOutSine); tgt = [2.2, 0.4, 0]; fov = 42; }
    // landing shake when the pot hits the ground, and a small punch-in on every cut
    const sk = u > tipU + 1.2 ? Math.exp(-(u - tipU - 1.2) * 4) * 0.09 : 0;
    const punch = 6 * Math.exp(-su * 3.2) * (s === 0 ? 0 : 1);
    cam.fov = fov + punch; cam.updateProjectionMatrix();
    cam.position.set(pos[0] + sk * noise1(u * 40, 2), pos[1] + sk * noise1(u * 40, 3) + 0.03 * noise1(u * 1.2, 9), pos[2]);
    cam.lookAt(tgt[0], tgt[1], tgt[2]);
    cam.updateMatrixWorld();
    scene.updateMatrixWorld(true);
  }
  const wobble0 = (b) => M.wobble(b, 2.0, 5);
  return { scene, camera: cam, anchors, update, hero };
}
