// Voxel space diorama: three pixel planets, and three voxel surfaces (machines, crystals, ocean) with one explorer.
// update(t, u, o) is a pure function of time; shot boundaries come from T.SH (beats).
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';

const { THREE } = G;
const { lerp, clamp, prog, E, springU, SPRING, noise1, hash01, kf } = M;

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const box = (w, h, d, mat, parent, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
};

// ---------------------------------------------------------------- pixel planet textures
function vnoise(x, y, seed) {   // 2-D value noise on a lattice, wraps in x so the map has no seam
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const s = (t) => t * t * (3 - 2 * t), h = (i, j) => hash01(((i % 32) + 32) % 32 * 131 + j * 17, seed);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), s(fx)), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), s(fx)), s(fy));
}
function planetTexture(kind) {
  const w = 128, h = 64, tex = G.canvasTexture(w, h);
  tex.draw((c) => {
    const img = c.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = vnoise(x / 9, y / 9, 3) * 0.6 + vnoise(x / 4, y / 4, 7) * 0.3 + vnoise(x / 2, y / 2, 9) * 0.1;
      let r, g, b;
      if (kind === 1) {                       // grey-white continents, dark seas, a few red lights
        const land = n > 0.5; const v = land ? 190 + n * 60 : 30 + n * 50;
        [r, g, b] = land ? [v, v, v + 6] : [v * 0.5, v * 0.7, v * 1.1];
        if (hash01(x * 7 + y * 131, 5) > 0.992) [r, g, b] = [255, 70, 50];
      } else if (kind === 2) {                // golden banded world with white sparkle
        const band = Math.sin(y * 0.55 + n * 5) * 0.5 + 0.5; const v = 0.55 + band * 0.45;
        [r, g, b] = [255 * v, 200 * v, 90 * v];
        if (hash01(x * 3 + y * 91, 4) > 0.96) [r, g, b] = [255, 250, 220];
      } else {                                // blue ocean, green land, white caps
        const land = n > 0.56; [r, g, b] = land ? [70 + n * 70, 150 + n * 50, 70] : [30, 80 + n * 90, 190 + n * 50];
        if (y < 4 || y > h - 5) [r, g, b] = [235, 240, 250];
      }
      const i = (y * w + x) * 4; img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  });
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  return tex;
}
function planet(kind, r, glow) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshLambertMaterial({ map: planetTexture(kind), emissive: 0x111118, emissiveMap: null }));
  g.add(m);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 24, 16), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false }));
  g.add(halo);
  g.userData = { body: m, halo };
  return g;
}

// ---------------------------------------------------------------- voxel terrain
function voxelField(n, size, heightFn, colorFn, mat = lam(0xffffff)) {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(size, size, size), mat, n * n);
  const d = new THREE.Object3D(), col = new THREE.Color(); let i = 0;
  for (let ix = 0; ix < n; ix++) for (let iz = 0; iz < n; iz++) {
    const x = (ix - n / 2) * size, z = (iz - n / 2) * size, h = Math.round(heightFn(x, z) / size) * size;
    d.position.set(x, h - size / 2, z); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    mesh.setColorAt(i, colorFn(x, z, h, col)); i++;
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  return mesh;
}

// ---------------------------------------------------------------- the explorer
function explorer() {
  const root = new THREE.Group(), head = new THREE.Group(), jeans = lam(0x2f4a8a), jacket = lam(0xb8301f), skin = lam(0xf0b48a);
  box(0.22, 0.8, 0.24, jeans, root, -0.14, 0.4); box(0.22, 0.8, 0.24, jeans, root, 0.14, 0.4);
  box(0.62, 0.7, 0.36, jacket, root, 0, 1.15);
  box(0.52, 0.66, 0.26, lam(0x2c5aa0), root, 0, 1.17, -0.3); box(0.4, 0.14, 0.2, lam(0x1c3a6e), root, 0, 1.55, -0.3);
  const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.4, 1.4, 0); root.add(a); box(0.17, 0.62, 0.2, jacket, a, 0, -0.28); box(0.17, 0.16, 0.2, skin, a, 0, -0.64); return a; });
  head.position.set(0, 1.5, 0); root.add(head);
  box(0.4, 0.4, 0.4, skin, head, 0, 0.22); box(0.43, 0.14, 0.43, lam(0x3a2418), head, 0, 0.46); box(0.43, 0.3, 0.12, lam(0x3a2418), head, 0, 0.3, -0.16);
  box(0.06, 0.07, 0.02, lam(0x1b1f3b), head, -0.1, 0.24, 0.205); box(0.06, 0.07, 0.02, lam(0x1b1f3b), head, 0.1, 0.24, 0.205);
  return { root, head, arms };
}

// ---------------------------------------------------------------- the set
export function worldSet(T) {
  const scene = new THREE.Scene(), cam = G.camera(34, 0.1, 160);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-4, 8, 6); scene.add(key);
  const hemi = new THREE.HemisphereLight(0xaab4ff, 0x20182a, 0.9); scene.add(hemi);
  const glowL = new THREE.PointLight(0x66ddff, 0, 14, 1.6); scene.add(glowL);

  // ---- space group
  const space = new THREE.Group(); scene.add(space);
  const stars = (() => {
    const n = 700, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 40 + hash01(i, 1) * 30, a = hash01(i, 2) * 6.283, e = (hash01(i, 3) - 0.5) * 2.4;
      p.set([Math.cos(a) * r, e * r * 0.5, -Math.abs(Math.sin(a)) * r - 8], i * 3);
      const b = 0.5 + hash01(i, 4) * 0.5; c.set([b, b, b * (0.8 + hash01(i, 5) * 0.4)], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.55, vertexColors: true, sizeAttenuation: true }));
  })();
  space.add(stars);
  const P = [planet(1, 1, 0x6fb0ff), planet(2, 1, 0xffc060), planet(3, 1, 0x5fd0ff)];
  P.forEach((p) => space.add(p));
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.7, 48), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = Math.PI / 2 - 0.35; ring.rotation.y = 0.0; P[1].add(ring);

  // ---- surface 1: machine world
  const s1 = new THREE.Group(); scene.add(s1);
  s1.add(voxelField(60, 0.8, (x, z) => 0.8 * Math.round(vnoise(x / 6 + 20, z / 6 + 20, 11) * 2.2), (x, z, h, c) => c.setHSL(0.08, 0.28, 0.3 + h * 0.07 + hash01(Math.round(x * 3 + z * 7), 2) * 0.05)));
  const steel = lam(0x555a66), rust = lam(0x8a5a3e), dark = lam(0x2e3038);
  const sprouts = new THREE.Group(); s1.add(sprouts);
  for (let i = 0; i < 40; i++) { const x = (hash01(i, 40) - 0.5) * 12, z = 1 - hash01(i, 41) * 14, h = 0.3 + hash01(i, 42) * 0.5; box(0.12, h, 0.12, lam(i % 5 ? 0x3fbf5a : 0xd84a5a), sprouts, x, h / 2 + 0.6, z); }
  const walker = new THREE.Group(); walker.position.set(0, 0, -14); s1.add(walker);
  box(8, 3.2, 5.5, steel, walker, 0, 19, 0); box(5, 1.6, 4, rust, walker, 0, 21.4, 0); box(0.5, 6, 0.5, dark, walker, 1.5, 25, 0);
  box(1.4, 6, 1.4, dark, walker, 0, 15.6, 0);
  const legs = [[-3.2, -2], [3.2, -2], [-3.2, 2], [3.2, 2]].map(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 18, z); walker.add(g);
    box(1.1, 18, 1.1, i % 2 ? steel : rust, g, 0, -9, 0); box(1.8, 1.0, 1.8, dark, g, 0, -17.6, 0); box(1.5, 1.5, 1.5, dark, g, 0, 0, 0);
    return g;
  });
  for (let i = 0; i < 5; i++) box(0.12, 12 + i * 2, 0.12, dark, walker, -3 + i * 1.5, 12, 3.2 + i * 0.1).rotation.z = 0.03 * (i - 2);
  [[-9, -18, 9], [8, -22, 15], [14, -10, 12], [-14, -12, 8]].forEach(([x, z, h]) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); s1.add(t);
    box(2, h, 2, steel, t, 0, h / 2); for (let k = 1; k < 5; k++) box(2.6, 0.4, 2.6, rust, t, 0, (h / 5) * k); box(0.4, 3, 0.4, dark, t, 0, h + 1.5);
  });
  const pod = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), lam(0x3a2a22)); pod.scale.set(1.1, 2.3, 1); pod.position.set(5.2, 4.4, -5); pod.rotation.z = -0.18; s1.add(pod);
  const sky1 = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ map: planetTexture(2), fog: false })); sky1.position.set(-14, 20, -60); s1.add(sky1);

  // ---- surface 2: crystal world
  const s2 = new THREE.Group(); scene.add(s2);
  s2.add(voxelField(60, 0.8, (x, z) => 0.8 * Math.round(vnoise(x / 5 + 40, z / 5 + 40, 21) * 2.4), (x, z, h, c) => c.setHSL(0.74, 0.35, 0.16 + h * 0.06 + hash01(Math.round(x * 3 + z * 5), 3) * 0.04)));
  const CR = 70, crystals = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), CR);
  const crData = Array.from({ length: CR }, (_, i) => {
    const near = i < 36, a = hash01(i, 50) * 6.283, r = near ? 1.5 + hash01(i, 51) * 5 : 7 + hash01(i, 51) * 14;
    return { x: Math.cos(a) * r * 0.9, z: -Math.abs(Math.sin(a)) * r - 1.2, h: (near ? 1.2 : 3) + hash01(i, 52) * (near ? 3.2 : 8), w: 0.3 + hash01(i, 53) * 0.45, tilt: (hash01(i, 54) - 0.5) * 0.4, hue: hash01(i, 55) > 0.5 ? 0.5 : 0.85, ph: hash01(i, 56) * 6.28 };
  });
  s2.add(crystals);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(20, 28, 64), new THREE.MeshBasicMaterial({ color: 0xe4c8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false }));
  ring2.position.set(-6, 20, -50); ring2.rotation.x = Math.PI / 2 - 0.55; ring2.rotation.z = 0.3; s2.add(ring2);
  const sky2 = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ map: planetTexture(2), color: 0xb28cff, fog: false })); sky2.position.set(-6, 20, -52); s2.add(sky2);

  // ---- surface 3: ocean world
  const s3 = new THREE.Group(); scene.add(s3);
  const NW = 48, WS = 0.7;
  const water = new THREE.InstancedMesh(new THREE.BoxGeometry(WS, 1.2, WS), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, depthWrite: false }), NW * NW);
  const wcol = new THREE.Color();
  for (let i = 0; i < NW * NW; i++) { wcol.setHSL(0.52 + (hash01(i, 60) - 0.5) * 0.03, 0.6, 0.38 + hash01(i, 61) * 0.08); water.setColorAt(i, wcol); }
  s3.add(water);
  const island = voxelField(14, 0.7, (x, z) => (Math.hypot(x, z - 1) < 2.4 ? 0.5 + 0.7 * Math.round(Math.max(0, 1 - Math.hypot(x, z - 1) / 2.8) * 1.5) : -3), (x, z, h, c) => c.setHSL(0.11, 0.5, 0.42 - h * 0.06));
  island.position.y = 0.25; s3.add(island);
  const palms = new THREE.Group(); s3.add(palms);
  [[-1.4, 0.2], [1.5, -0.3]].forEach(([x, z], i) => { box(0.18, 1.6 + i * 0.3, 0.18, lam(0x7a5a38), palms, x, 1.4, z); box(1.0, 0.16, 1.0, lam(0x2fae5a), palms, x, 2.3 + i * 0.3, z); });
  const beast = new THREE.Group(); s3.add(beast);
  const SEG = 16;
  const beastSeg = Array.from({ length: SEG }, (_, i) => box(2.6 - Math.abs(i - 5) * 0.12, 1.5 - Math.abs(i - 5) * 0.06, 1.8 - Math.abs(i - 5) * 0.08, lam(i % 2 ? 0x0d2238 : 0x12304d), beast));
  const eyes = [-1, 1].map((s) => box(0.35, 0.35, 0.2, new THREE.MeshBasicMaterial({ color: 0x66f0ff }), beast, 0, 0, 0));
  const bubbles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xbff6ff, transparent: true, opacity: 0.75 }), 40);
  s3.add(bubbles);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 16), new THREE.MeshBasicMaterial({ map: planetTexture(1), color: 0xddeeff, fog: false })); moon.position.set(16, 22, -60); s3.add(moon);

  const hero = explorer(); scene.add(hero.root);
  const dm = new THREE.Object3D(), tc = new THREE.Color();

  const SH = T.SH;
  const shotOf = (u) => { let s = 0; while (s + 1 < SH.length - 1 && u >= SH[s + 1]) s++; return s; };
  // shot ids: 0 hook, 1 planet01, 2 surface1, 3 planet02, 4 surface2, 5 planet03, 6 surface3, 7 finale

  function planetsLayout(s, u, su) {
    const base = [[0, 1.0, 0, 0.78], [-1.0, -1.45, 0, 0.7], [1.0, -1.45, 0, 0.7]];
    P.forEach((p, i) => {
      let [x, y, z, r] = base[i]; let vis = true;
      const focus = s === 1 ? 0 : s === 3 ? 1 : s === 5 ? 2 : -1;
      if (focus >= 0) {
        vis = i === focus; const k = E.outCubic(prog(su, 0, 1.2));
        x = lerp(x, 0, k); y = lerp(y, 0.2, k); r = lerp(r, 1.5, k) * (1 + 0.5 * E.inCubic(prog(su, 0.6, 1.5)));
      } else if (s === 7) { const pulse = 1 + 0.07 * Math.sin(u * 4 + i * 2); r *= pulse; }
      p.visible = vis; p.position.set(x, y, z); p.scale.setScalar(r);
      p.userData.body.rotation.y = u * 0.12 + i * 2;
    });
    ring.visible = true;
  }

  function update(t, u, o = {}) {
    const s = shotOf(u), su = u - SH[s];
    const inSpace = s === 0 || s === 1 || s === 3 || s === 5 || s === 7;
    space.visible = inSpace;
    s1.visible = s === 2; s2.visible = s === 4; s3.visible = s === 6;
    hero.root.visible = !inSpace;
    scene.fog = null;
    glowL.intensity = 0;
    if (inSpace) {
      key.color.set(0xfff3e0); key.intensity = 2.6; hemi.intensity = 0.5; planetsLayout(s, u, su);
      let pos, tgt;
      if (s === 0) { pos = [0, -0.1, kf(u, [[0, 12.4], [6, 10.8]], E.inOutSine)]; tgt = [0, -0.1, 0]; }
      else if (s === 7) { pos = [0, -0.1, kf(u, [[27, 10.4], [36, 11.6]], E.inOutSine)]; tgt = [0, -0.1, 0]; }
      else { pos = [0, 0.2, kf(su, [[0, 8], [1.5, 3.2]], E.inCubic)]; tgt = [0, 0.2, 0]; }
      cam.fov = 34; cam.updateProjectionMatrix(); cam.position.set(...pos); cam.lookAt(...tgt);
      stars.position.x = u * 0.05;
    } else {
      const sw = Math.sin(u * 1.1) * 0.01;
      hero.root.position.set(0, 0, 0); hero.root.rotation.y = Math.PI; hero.root.scale.setScalar(1);
      const look = s === 2 ? kf(u, [[SH[2], -0.5], [SH[2] + 3, -0.55], [SH[3] - 0.5, -0.15]], E.inOutSine) : -0.25;
      hero.head.rotation.x = look; hero.root.position.y = 0.04 * Math.abs(Math.sin(u * 1.4)); hero.arms.forEach((a, i) => { a.rotation.x = 0.1 * Math.sin(u * 1.3 + i * 3); });
      if (s === 2) {
        key.color.set(0xffc890); key.intensity = 2.3; hemi.color.set(0xe0a090); hemi.groundColor.set(0x2a2030); hemi.intensity = 0.95;
        scene.fog = new THREE.Fog(0xd88a68, 14, 62);
        hero.root.position.set(0.0, 0.8, 3.0);
        legs.forEach((l, i) => { l.rotation.x = 0.1 * Math.sin(u * 1.0 + (i % 2) * Math.PI) * (i < 2 ? 1 : -1); });
        walker.position.y = 0.4 * Math.sin(u * 1.0 * 2);
        walker.position.z = -14 + 0.6 * (u - SH[2]);
        const k = kf(u, [[SH[2], 0], [SH[3] - 0.5, 1]], E.inOutSine);
        cam.fov = 52; cam.updateProjectionMatrix();
        cam.position.set(lerp(0.9, -0.4, k), lerp(1.2, 2.2, k), lerp(8.8, 8.2, k));
        cam.lookAt(0, lerp(6.4, 4.8, k), -8);
      } else if (s === 4) {
        key.color.set(0x9a8cff); key.intensity = 1.0; hemi.color.set(0x7a60c0); hemi.groundColor.set(0x120a24); hemi.intensity = 0.9;
        scene.fog = new THREE.Fog(0x2a1650, 12, 55);
        hero.root.position.set(0, 0.8, 3.4); glowL.intensity = 5; glowL.position.set(0, 2.4, 1.6); glowL.color.set(0x66ddff);
        const k = kf(u, [[SH[4], 0], [SH[5], 1]], E.inOutSine);
        cam.fov = 52; cam.updateProjectionMatrix();
        cam.position.set(lerp(-1.0, 1.0, k), lerp(1.4, 2.2, k), lerp(8.0, 7.2, k)); cam.lookAt(0, lerp(2.6, 3.4, k), -7);
        const dd = new THREE.Object3D();
        for (let i = 0; i < CR; i++) {
          const c = crData[i], pulse = 0.6 + 0.4 * Math.sin(u * 2.2 + c.ph) * Math.sin(u * 0.7 + i * 0.3);
          const hh = c.h * (0.92 + 0.08 * pulse);
          dd.position.set(c.x, hh / 2 + 0.6, c.z); dd.rotation.set(c.tilt, c.ph, c.tilt * 0.6); dd.scale.set(c.w, hh, c.w); dd.updateMatrix(); crystals.setMatrixAt(i, dd.matrix);
          tc.setHSL(c.hue, 0.9, 0.35 + 0.3 * pulse); crystals.setColorAt(i, tc);
        }
        crystals.instanceMatrix.needsUpdate = true; crystals.instanceColor.needsUpdate = true;
        ring2.rotation.z = 0.3 + u * 0.004;
      } else if (s === 6) {
        key.color.set(0xbfe8ff); key.intensity = 1.9; hemi.color.set(0x7fb8d8); hemi.groundColor.set(0x0a2030); hemi.intensity = 1.0;
        scene.fog = new THREE.Fog(0x2a8aa0, 14, 60);
        hero.root.position.set(0.1, 1.2, 1.6); hero.root.rotation.y = Math.PI + 0.35;
        const br = prog(u, T.breathU, T.breathU + 2);
        for (let i = 0; i < NW; i++) for (let j = 0; j < NW; j++) {
          const x = (i - NW / 2) * WS, z = (j - NW / 2) * WS, h = 0.12 * Math.round((Math.sin(x * 0.7 + u * 1.6) + Math.cos(z * 0.6 - u * 1.3)) * 2.2) / 2 + 0.04;
          dm.position.set(x, h - 0.6, z); dm.updateMatrix(); water.setMatrixAt(i * NW + j, dm.matrix);
        }
        water.instanceMatrix.needsUpdate = true;
        // the beast, under the water, drifting; it surfaces a little when it breathes
        const bx = 3.2 + 0.6 * Math.sin(u * 0.4), br2 = 1 + 0.09 * Math.sin(u * 3.1) * (0.4 + br);
        beastSeg.forEach((m, i) => { m.position.set(bx - i * 0.95, -0.55 + 0.25 * Math.sin(u * 1.2 - i * 0.5) + br * 0.6, 5.2 + 0.7 * Math.sin(u * 0.8 - i * 0.35)); m.scale.set(1.5, br2 * 1.5, br2 * 1.5); });
        eyes.forEach((e, i) => { e.position.set(bx - 2.5 + (i ? 0.7 : -0.7), 0.35 + br * 0.5, 6.4); e.scale.setScalar(0.05 + br * 1.4); });
        for (let i = 0; i < 40; i++) {
          const ph = (u * 0.22 + hash01(i, 70)) % 1, on = br > 0.01 || hash01(i, 71) > 0.6 ? 1 : 0;
          dm.position.set(bx - 1 - hash01(i, 72) * 4, -1.8 + ph * 2.2, 5.2 + (hash01(i, 73) - 0.5) * 2); dm.scale.setScalar(on * (0.5 + hash01(i, 74))); dm.updateMatrix(); bubbles.setMatrixAt(i, dm.matrix);
        }
        dm.scale.setScalar(1); bubbles.instanceMatrix.needsUpdate = true;
        const k = kf(u, [[SH[6], 0], [SH[7], 1]], E.inOutSine);
        cam.fov = 46; cam.updateProjectionMatrix();
        cam.position.set(lerp(-0.8, 0.6, k), lerp(4.4, 4.8, k), lerp(11.8, 10.6, k)); cam.lookAt(lerp(0.4, 0.2, k), lerp(-0.2, -0.6, k), -3.0);
        moon.rotation.y = u * 0.02;
      }
    }
    // landing punch on every cut
    const punch = 4 * Math.exp(-su * 3.4) * (s === 0 ? 0 : 1);
    cam.fov += punch; cam.updateProjectionMatrix();
    cam.updateMatrixWorld(); scene.updateMatrixWorld(true);
  }
  return { scene, camera: cam, update, planets: P, shotOf };
}
