import { AVENUES, CAR_KINDS, STREETS, WORLD } from '../tune.js';
import { VICE_CASINO_UV, VICE_FACADE_UV, VICE_ROOF_UV, VICE_WHITE_UV as U } from './textures3d.js';
import { StreetRaceCircuit } from '../crew-garage-race.js';
export const VICE_VERT_STRIDE = 12;
export function viceHex(h) {
  const o = [];
  for (let i = 1; i < 6; i += 2) o.push(parseInt(h.slice(i, i + 2), 16) / 255);
  return o;
}
export function viceCreateMesh(capacity) {
  const data = new Float32Array(capacity * VICE_VERT_STRIDE);
  let n = 0;
  function vert() {
    const o = n * VICE_VERT_STRIDE;
    for (let i = 0; i < 12; i += 1) data[o + i] = arguments[i];
    n += 1;
  }
  function quad(a, b, c, d, nx, ny, nz, col, uv, emi) {
    const P = [a, b, c, a, c, d];
    for (let i = 0; i < 6; i += 1) vert(P[i][0], P[i][1], P[i][2], nx, ny, nz, col[0], col[1], col[2], (i === 0 || i === 3 || i === 5) ? uv[0] : uv[2], (i === 0 || i === 1 || i === 3) ? uv[1] : uv[3], emi);
  }
  function tri(a, b, c, nx, ny, nz, col, uv, emi) {
    vert(a[0], a[1], a[2], nx, ny, nz, col[0], col[1], col[2], uv[0], uv[1], emi);
    vert(b[0], b[1], b[2], nx, ny, nz, col[0], col[1], col[2], uv[2], uv[1], emi);
    vert(c[0], c[1], c[2], nx, ny, nz, col[0], col[1], col[2], uv[2], uv[3], emi);
  }
  function groundQuad(x0, z0, x1, z1, y, col, emi) {
    quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], 0, 1, 0, col, U, emi);
  }
  function box(cx, cy, cz, sx, sy, sz, yaw, col, uv, emi, roofUv, roofEmi) {
    const co = Math.cos(yaw), si = Math.sin(yaw);
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const L = [];
    for (let i = 0; i < 8; i += 1) L.push([(i + 3) % 4 < 2 ? hx : -hx, i & 4 ? hy : -hy, i & 2 ? hz : -hz]);
    const P = L.map((p) => [cx + p[0] * co + p[2] * si, cy + p[1], cz - p[0] * si + p[2] * co]);
    const N = [[0, 1, 0], [co, 0, -si], [-co, 0, si], [si, 0, co], [-si, 0, -co]];
    const rUv = roofUv || uv;
    const rEm = roofEmi === undefined ? emi : roofEmi;
    quad(P[4], P[5], P[6], P[7], ...N[0], col, rUv, rEm);
    quad(P[1], P[2], P[6], P[5], ...N[1], col, uv, emi);
    quad(P[3], P[0], P[4], P[7], ...N[2], col, uv, emi);
    quad(P[2], P[3], P[7], P[6], ...N[3], col, uv, emi);
    quad(P[0], P[1], P[5], P[4], ...N[4], col, uv, emi);
  }
  return { data, get count() { return n; }, reset() { n = 0; }, slice() { return data.subarray(0, n * VICE_VERT_STRIDE); }, vert, quad, tri, groundQuad, box };
}
export function viceBuildingHeight(b) {
  const h = (((b.x * 7 + b.y * 13) % 100) + 100) % 100 / 100;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  return (60 + h * 140) * (cx > 1200 && cx < 3000 && cy > 600 && cy < 2000 ? 1.5 : 1) * (cy > 2300 ? 0.6 : 1);
}
const NEON_TRIM = [[1, 0.18, 0.47], [0, 0.9, 1], [1, 0.82, 0.24], [1, 0.48, 0.18]];
export function buildViceCityStaticGeometry(city) {
  const m = viceCreateMesh(32000);
  const white = [1, 1, 1];
  const grass = viceHex('#5d8a48');
  const sand = viceHex('#e8cf9a');
  const sidewalk = viceHex('#b8ab98');
  const asphalt = viceHex('#403f46');
  const lane = viceHex('#e6d47a');
  m.groundQuad(0, 0, WORLD.width, WORLD.height, 0, grass, 0);
  m.groundQuad(0, 2440, WORLD.width, WORLD.height, 0.1, sand, 0);
  for (const ax of AVENUES) {
    m.groundQuad(ax - 86, 0, ax + 86, WORLD.height, 0.12, sidewalk, 0);
    m.groundQuad(ax - 60, 0, ax + 60, WORLD.height, 0.15, asphalt, 0);
    for (let y = 60; y < WORLD.height - 30; y += 120) { m.groundQuad(ax - 6, y, ax - 3, y + 30, 0.18, lane, 0); m.groundQuad(ax + 3, y, ax + 6, y + 30, 0.18, lane, 0); m.groundQuad(ax - 44, y + 40, ax - 40, y + 70, 0.18, white, 0); m.groundQuad(ax + 40, y + 40, ax + 44, y + 70, 0.18, white, 0); }
  }
  for (const sy of STREETS) {
    m.groundQuad(0, sy - 86, WORLD.width, sy + 86, 0.12, sidewalk, 0);
    m.groundQuad(0, sy - 60, WORLD.width, sy + 60, 0.15, asphalt, 0);
    for (let x = 60; x < WORLD.width - 30; x += 120) { m.groundQuad(x, sy - 6, x + 30, sy - 3, 0.18, lane, 0); m.groundQuad(x, sy + 3, x + 30, sy + 6, 0.18, lane, 0); m.groundQuad(x + 40, sy - 44, x + 70, sy - 40, 0.18, white, 0); m.groundQuad(x + 40, sy + 40, x + 70, sy + 44, 0.18, white, 0); }
  }
  for (const [ix, iy] of [[1500, 1300], [900, 800]]) {
    for (let s = 0; s < 5; s += 1) m.groundQuad(ix - 50 + s * 20, iy - 60, ix - 42 + s * 20, iy + 60, 0.18, white, 0);
  }
  for (const b of city.buildings) {
    const cx = b.x + b.w / 2, cz = b.y + b.h / 2;
    const ti = Math.floor(b.x * 3 + b.y * 5) % 4;
    const trim = NEON_TRIM[Math.floor(b.x + b.y) % 4];
    if (b.kind === 'casino') {
      const fz = cz - b.h / 2;
      m.groundQuad(cx - 260, fz - 170, cx + 260, fz, 0.22, viceHex('#cfc4ae'), 0);
      m.groundQuad(cx - 38, fz - 64, cx + 38, fz, 0.26, viceHex('#a31f34'), 0);
      m.box(cx, 30, cz, b.w, 60, b.h, 0, white, VICE_FACADE_UV[2], 0.4, VICE_ROOF_UV, 0);
      m.box(cx, 82, cz, b.w * 0.7, 45, b.h * 0.7, 0, white, VICE_FACADE_UV[2], 0.5, VICE_ROOF_UV, 0);
      m.box(cx, 40, fz - 3, b.w * 0.42, 36, 4, 0, white, VICE_CASINO_UV, 0.9, U, 0);
      m.box(cx, 60, fz - 3, b.w * 0.42 + 8, 3, 5, 0, [1, 0.82, 0.24], U, 1);
      m.box(cx, 20, fz - 3, b.w * 0.42 + 8, 3, 5, 0, [1, 0.82, 0.24], U, 1);
      m.box(cx, 105, cz, b.w * 0.7 + 4, 3, b.h * 0.7 + 4, 0, trim, U, 1);
      for (const s of [-1, 1]) m.box(cx + s * (b.w / 2 - 12), 15, fz - 10, 9, 30, 9, 0, s < 0 ? [0, 0.9, 1] : [1, 0.18, 0.47], U, 1);
      m.box(cx, 14, fz - 12, b.w * 0.5, 3, 10, 0, [1, 0.82, 0.24], U, 1);
      continue;
    }
    if (b.kind === 'stadium') {
      m.box(cx, 18, cz, b.w, 36, b.h, 0, white, VICE_FACADE_UV[1], 0.3, VICE_ROOF_UV, 0);
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        m.box(cx + ox * (b.w / 2 - 6), 35, cz + oz * (b.h / 2 - 6), 8, 70, 8, 0, [0.2, 0.2, 0.22], U, 0);
        m.box(cx + ox * (b.w / 2 - 6), 72, cz + oz * (b.h / 2 - 6), 16, 4, 10, 0, [1, 0.95, 0.8], U, 1);
      }
      continue;
    }
    if (b.kind === 'lighthouse') {
      m.box(cx, 45, cz, 34, 90, 34, 0, viceHex('#c94f43'), U, 0.15);
      m.box(cx, 135, cz, 30, 90, 30, 0, white, U, 0.3);
      m.box(cx, 185, cz, 22, 12, 22, 0, [1, 0.82, 0.24], U, 1);
      continue;
    }
    const hgt = viceBuildingHeight(b);
    m.box(cx, hgt / 2, cz, b.w, hgt, b.h, 0, white, VICE_FACADE_UV[ti], 0.35, VICE_ROOF_UV, 0);
    m.box(cx, hgt - 2, cz, b.w + 4, 4, b.h + 4, 0, trim, U, 1);
    if (hgt > 150) {
      const th = hgt * 0.32;
      m.box(cx, hgt + th / 2, cz, b.w * 0.55, th, b.h * 0.55, 0, white, VICE_FACADE_UV[ti], 0.4, VICE_ROOF_UV, 0);
      m.box(cx, hgt + th - 1, cz, b.w * 0.55 + 4, 3, b.h * 0.55 + 4, 0, trim, U, 1);
    }
  }
  const trunk = viceHex('#6b4a2f'), leaf = viceHex('#6b8e3a'), leaf2 = viceHex('#556f2e');
  for (const palm of city.palms) {
    const lean = ((palm.x * 7 + palm.y * 3) % 10) / 10 * 0.6 - 0.3;
    m.box(palm.x, 7, palm.y, 4, 14, 4, 0, trunk, U, 0);
    m.box(palm.x + lean * 8, 18, palm.y + lean * 4, 4, 12, 4, 0, trunk, U, 0);
    const cxp = palm.x + lean * 14, czp = palm.y + lean * 7;
    for (let f = 0; f < 8; f += 1) {
      const a = (f / 8) * Math.PI * 2 + lean, ca = Math.cos(a), sa = Math.sin(a), lc = f % 2 ? leaf : leaf2;
      const px = -sa, pz = ca, x1 = cxp + ca * 11, z1 = czp + sa * 11, x2 = cxp + ca * 21, z2 = czp + sa * 21;
      m.quad([cxp + px * 3, 27, czp + pz * 3], [x1 + px * 3, 26, z1 + pz * 3], [x1 - px * 3, 26, z1 - pz * 3], [cxp - px * 3, 27, czp - pz * 3], 0, 1, 0, lc, U, 0);
      m.quad([x1 + px * 3, 26, z1 + pz * 3], [x2 + px * 1.5, 18, z2 + pz * 1.5], [x2 - px * 1.5, 18, z2 - pz * 1.5], [x1 - px * 3, 26, z1 - pz * 3], 0, 1, 0, lc, U, 0);
    }
    m.box(cxp, 27, czp, 8, 4, 8, 0, leaf2, U, 0);
  }
  let lamp = 0;
  for (const ax of AVENUES) {
    for (const sy of STREETS) {
      lamp += 1;
      if (lamp % 2 === 0) continue;
      m.box(ax + 70, 13, sy + 70, 3, 26, 3, 0, [0.15, 0.15, 0.17], U, 0);
      m.box(ax + 70, 27, sy + 70, 9, 3, 9, 0, [1, 0.85, 0.55], U, 1);
    }
  }
  m.groundQuad(0, 2624, WORLD.width, 2646, 0.25, viceHex('#8a6f4d'), 0);
  const deck = viceHex('#4a3f35');
  for (let s = 0; s < 3; s += 1) {
    const bx = 800 + s * 1000;
    m.box(bx, 10, 2780, 1000, 4, 26, 0, deck, U, 0);
    m.box(bx, 12, 2780 - 14, 1000, 2, 2, 0, s % 2 ? [1, 0.18, 0.47] : [0, 0.9, 1], U, 1);
    m.box(bx, 12, 2780 + 14, 1000, 2, 2, 0, s % 2 ? [0, 0.9, 1] : [1, 0.18, 0.47], U, 1);
  }
  for (let x = 500; x < 3300; x += 500) {
    m.box(x, 4, 2780, 6, 10, 6, 0, viceHex('#3a3f4a'), U, 0);
    m.box(x, 14, 2780, 4, 4, 4, 0, [1, 0.85, 0.55], U, 1);
  }
  for (const [bx, bz, byaw] of [[900, 2720, 0.3], [2400, 2720, -0.2]]) {
    m.box(bx, 2, bz, 46, 4, 16, byaw, viceHex('#e8e2d4'), U, 0);
    m.box(bx, 5, bz, 20, 5, 12, byaw, viceHex('#2f6fd0'), U, 0.2);
    m.box(bx, 12, bz, 2, 12, 2, byaw, viceHex('#5a4632'), U, 0);
  }
  return m.slice();
}
export function buildViceDynamicGeometry(state, m) {
  m.reset();
  const dark = [0.08, 0.08, 0.1];
  const skin = viceHex('#e8b98a');
  const glass = viceHex('#0e1a26');
  const px = state.player.x, pz = state.player.y;
  for (const car of state.cars) {
    const dx = car.x - px, dz = car.y - pz;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    const spec = CAR_KINDS[car.kind] || CAR_KINDS.sedan;
    const yaw = -car.angle;
    const col = viceHex(car.color || spec.color);
    const L = spec.length, W = spec.width;
    const co = Math.cos(car.angle), si = Math.sin(car.angle);
    const X = (a, b) => car.x + co * a - si * b, Z = (a, b) => car.y + si * a + co * b;
    const P = (a, y, b) => [X(a, b), y, Z(a, b)];
    m.box(X(-L * 0.18, 0), 7, Z(-L * 0.18, 0), L * 0.62, 7, W, yaw, col, U, 0);
    m.box(X(L * 0.32, 0), 6, Z(L * 0.32, 0), L * 0.3, 5, W * 0.94, yaw, col, U, 0);
    m.box(X(-L * 0.3, 0), 6, Z(-L * 0.3, 0), L * 0.28, 5, W * 0.94, yaw, col, U, 0);
    m.box(X(-2, 0), 14, Z(-2, 0), L * 0.42, 7, W * 0.8, yaw, glass, U, 0.6);
    m.quad(P(L * 0.30, 10, W * 0.38), P(L * 0.30, 10, -W * 0.38), P(L * 0.08, 17.5, -W * 0.38), P(L * 0.08, 17.5, W * 0.38), co * 0.7, 0.7, si * 0.7, glass, U, 0.65);
    m.quad(P(-L * 0.24, 17.5, W * 0.38), P(-L * 0.24, 17.5, -W * 0.38), P(-L * 0.40, 10, -W * 0.38), P(-L * 0.40, 10, W * 0.38), -co * 0.7, 0.7, -si * 0.7, glass, U, 0.65);
    m.box(X(L / 2 - 1, 0), 5, Z(L / 2 - 1, 0), 4, 4, W * 0.98, yaw, dark, U, 0);
    m.box(X(-L / 2 + 1, 0), 5, Z(-L / 2 + 1, 0), 4, 4, W * 0.98, yaw, dark, U, 0);
    if (car.kind === 'muscle' || car.kind === 'sports') m.box(X(-L * 0.44, 0), 12.5, Z(-L * 0.44, 0), 3, 2, W * 0.92, yaw, dark, U, 0.2);
    for (const [lx, lz] of [[L * 0.32, W / 2], [L * 0.32, -W / 2], [-L * 0.32, W / 2], [-L * 0.32, -W / 2]]) {
      m.box(X(lx, lz), 4, Z(lx, lz), 10, 8, 3, yaw, dark, U, 0);
    }
    const f = L / 2 - 1, w2 = W / 2 - 4;
    for (const s of [-1, 1]) {
      m.box(X(f, s * w2), 8, Z(f, s * w2), 3, 3, 5, yaw, [1, 0.9, 0.6], U, 1);
      m.box(X(-f, s * w2), 8, Z(-f, s * w2), 3, 3, 5, yaw, [1, 0.15, 0.15], U, 1);
    }
    if (car.driver === 'police') {
      const flash = Math.floor(state.time * 3) % 2 === 0;
      m.box(car.x - Math.cos(car.angle) * 4, 23, car.y - Math.sin(car.angle) * 4, 8, 3, W * 0.6, yaw, flash ? [1, 0.2, 0.2] : [0.2, 0.4, 1], U, 1);
    }
    if (car.kind === 'taxi') m.box(car.x, 22, car.y, 14, 4, 8, yaw, [1, 0.82, 0.24], U, 0.8);
  }
  function person(x, y, shirt, angle) {
    const yaw = -angle;
    m.box(x, 9, y, 13, 18, 10, yaw, shirt, U, 0);
    m.box(x, 21, y, 8, 8, 8, yaw, skin, U, 0);
  }
  for (const ped of state.peds) {
    if (ped.down > 0) continue;
    const dx = ped.x - px, dz = ped.y - pz;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    person(ped.x, ped.y, viceHex(ped.shirt || '#e8e2d4'), ped.angle || 0);
  }
  for (const cop of state.cops) person(cop.x, cop.y, viceHex('#2f6fd0'), cop.angle || 0);
  for (const rival of state.rivals) person(rival.x, rival.y, viceHex('#a83232'), rival.angle || 0);
  const p = state.player;
  if (p.onFoot) person(p.x, p.y, viceHex('#ff5a3c'), p.angle);
  for (const b of state.bullets) {
    m.box(b.x, 2, b.y, 10, 2, 2, -Math.atan2(b.vy, b.vx), [1, 0.9, 0.6], U, 1);
  }
  for (const s of state.skids) {
    const dx = s.x - px, dz = s.y - pz;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    m.groundQuad(s.x - 7, s.y - 2, s.x + 7, s.y + 2, 0.2, [0.08, 0.08, 0.08], 0);
  }
  if (state.objective) {
    const o = state.objective;
    const bob = 30 + Math.sin(state.time * 3) * 4;
    m.box(o.x, bob, o.y, 12, 24, 12, state.time * 0.8, [1, 0.82, 0.24], U, 1);
  }
  const air = state.air;
  if (air && air.heli) {
    const h = air.heli;
    const strobe = Math.floor(state.time * 3) % 2 === 0;
    const hx = Math.cos(h.angle), hy = Math.sin(h.angle);
    m.box(h.x, h.z, h.y, 104, 26, 44, -h.angle, [0.88, 0.88, 0.9], U, 0.45);
    m.box(h.x, h.z - 2, h.y, 100, 6, 45, -h.angle, [0.1, 0.25, 0.6], U, 0.5);
    m.box(h.x + hx * 34, h.z + 2, h.y + hy * 34, 34, 18, 34, -h.angle, [0.08, 0.16, 0.3], U, 0.65);
    m.box(h.x - hx * 62, h.z + 4, h.y - hy * 62, 48, 12, 16, -h.angle, [0.10, 0.24, 0.45], U, 0.3);
    m.box(h.x - hx * 88, h.z + 8, h.y - hy * 88, 2, 12, 12, -h.angle, [0.7, 0.7, 0.72], U, 0.55);
    m.box(h.x, h.z + 17, h.y, 14, 8, 14, 0, [0.1, 0.1, 0.12], U, 0);
    m.box(h.x, h.z + 24, h.y, 140, 2, 6, -h.rotor, [0.75, 0.75, 0.78], U, 0.6);
    m.box(h.x, h.z + 24, h.y, 140, 2, 6, -h.rotor + Math.PI / 2, [0.75, 0.75, 0.78], U, 0.6);
    for (const s of [-14, 14]) m.box(h.x - hy * s, h.z - 16, h.y + hx * s, 84, 3, 3, -h.angle, [0.15, 0.15, 0.17], U, 0);
    m.box(h.x, h.z + 3, h.y, 16, 6, 16, 0, strobe ? [1, 0.2, 0.2] : [0.2, 0.4, 1], U, 1);
  }
  for (const w of state.wrecks || []) {
    m.box(w.x, 7, w.y, 52, 13, 24, -w.angle + 0.22, [0.28, 0.26, 0.26], U, 0);
    m.box(w.x + 6, 14, w.y + 3, 26, 8, 19, -w.angle + 0.4, [0.32, 0.30, 0.30], U, 0.1);
    m.box(w.x - 2, 15, w.y - 4, 10, 3, 18, -w.angle + 0.22, [0.85, 0.85, 0.88], U, 0.4);
  }
  if (state.race && state.race.active) {
    const circ = StreetRaceCircuit.CIRCUITS[state.race.circuit];
    if (!circ) return m.slice();
    const cg = circ.gates;
    for (let i = 0; i < cg.length; i += 1) {
      const g = cg[i], col = i === state.race.gate ? [1, 0.18, 0.55] : [0, 0.9, 1];
      for (const s of [-30, 30]) m.box(g[0] + s, 22, g[1], 6, 44, 6, 0, col, U, 1);
      m.box(g[0], 44, g[1], 66, 5, 6, 0, col, U, 1);
      m.box(g[0], 8, g[1], 66, 3, 6, 0, col, U, 0.9);
    }
  }
  return m.slice();
}
export function buildViceAdditiveGeometry(state, m) {
  m.reset();
  function beam(a, b, c, d, e, f, r0, r1, col, emi) {
    const dx = d - a, dy = e - b, dz = f - c, L = Math.hypot(dx, dy, dz) || 1;
    const px = -dz / L, pz = dx / L;
    const qx = (dy / L) * pz, qy = (dz / L) * px - (dx / L) * pz, qz = -(dy / L) * px;
    m.quad([a + px * r0, b, c + pz * r0], [d + px * r1, e, f + pz * r1], [d - px * r1, e, f - pz * r1], [a - px * r0, b, c - pz * r0], 0, 1, 0, col, U, emi);
    m.quad([a + qx * r0, b + qy * r0, c + qz * r0], [d + qx * r1, e + qy * r1, f + qz * r1], [d - qx * r1, e - qy * r1, f - qz * r1], [a - qx * r0, b - qy * r0, c - qz * r0], 0, 1, 0, col, U, emi);
  }
  const p = state.player;
  for (const car of state.cars) {
    const dx = car.x - p.x, dz = car.y - p.y;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    const spec = CAR_KINDS[car.kind] || CAR_KINDS.sedan;
    const L = spec.length, co = Math.cos(car.angle), si = Math.sin(car.angle);
    const X = (a, b) => car.x + co * a - si * b, Z = (a, b) => car.y + si * a + co * b;
    m.tri([X(L / 2, 0), 0.5, Z(L / 2, 0)], [X(L / 2 + 48, 16), 0.5, Z(L / 2 + 48, 16)], [X(L / 2 + 48, -16), 0.5, Z(L / 2 + 48, -16)], 0, 1, 0, [1, 0.85, 0.5], U, 0.22);
    if (car.driver === 'player' && state.upgrades && state.upgrades.glow > 0) { const q = Math.abs(si) > 0.7 ? [16, 26] : [26, 16]; m.groundQuad(car.x - q[0], car.y - q[1], car.x + q[0], car.y + q[1], 0.4, [0, 0.55, 0.6], 0.5); }
    if (car.driver === 'race') { const q = Math.abs(si) > 0.7 ? [16, 26] : [26, 16]; m.groundQuad(car.x - q[0], car.y - q[1], car.x + q[0], car.y + q[1], 0.4, [0.6, 0.1, 0.32], 0.5); }
    if (car.driver === 'police') {
      const fl = Math.floor(state.time * 3) % 2 === 0, fc = fl ? [1, 0.15, 0.15] : [0.15, 0.35, 1], fc2 = fl ? [1, 0.35, 0.35] : [0.35, 0.55, 1];
      m.groundQuad(car.x - 80, car.y - 60, car.x + 80, car.y + 60, 0.35, fc, 0.7);
      m.groundQuad(car.x - 40, car.y - 30, car.x + 40, car.y + 30, 0.4, fc2, 0.6);
    }
    if (car.driver === 'player' && state.nitrousT > 0) for (const s of [-6, 6]) {
      const ex = car.x - co * (L / 2 + 2) - si * s, ez = car.y - si * (L / 2 + 2) + co * s;
      m.groundQuad(ex - co * 30 - 3.5, ez - si * 30 - 3.5, ex + co * 2 + 3.5, ez + si * 2 + 3.5, 1, [0.2, 0.55, 1], 0.45);
      m.groundQuad(ex - co * 48 - 2.5, ez - si * 48 - 2.5, ex - co * 26 + 2.5, ez - si * 26 + 2.5, 1, [0.15, 0.4, 0.95], 0.35);
    }
  }
  let drawn = 0;
  for (const pt of state.particles) {
    if (drawn >= 30) break;
    const dx = pt.x - p.x, dz = pt.y - p.y;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    const s = pt.size || 3;
    m.groundQuad(pt.x - s, pt.y - s, pt.x + s, pt.y + s, 1, viceHex(pt.color || '#ffd23d'), 0.6);
    drawn += 1;
  }
  const ba = (state.time * 0.9) % (Math.PI * 2);
  beam(3335, 194, 2515, 3335 + Math.cos(ba) * 320, 170, 2515 + Math.sin(ba) * 320, 4, 18, [1, 0.9, 0.6], 0.28);
  if (state.objective) m.box(state.objective.x, 75, state.objective.y, 5, 150, 5, 0, [1, 0.82, 0.24], U, 0.35);
  const air = state.air;
  if (air && air.heli) {
    const h = air.heli;
    beam(h.x, h.z - 2, h.y, h.spotX, 1, h.spotY, 5, 32, [1, 0.88, 0.5], 0.3);
    m.groundQuad(h.spotX - 40, h.spotY - 40, h.spotX + 40, h.spotY + 40, 0.3, [1, 0.9, 0.6], 0.45);
    m.groundQuad(h.x - 70, h.y - 70, h.x + 70, h.y + 70, h.z + 24, [1, 1, 1], 0.16);
  }
  for (const w of state.wrecks || []) {
    const fl = 1 + Math.sin(state.time * 9 + w.x) * 0.15;
    for (let k = 0; k < 3; k += 1) {
      const fx = w.x + (k - 1) * 8, fw = (14 - k * 2) * fl, fh = (24 - k * 3) * fl, fc = k === 0 ? [1, 0.4, 0.05] : k === 1 ? [1, 0.62, 0.12] : [1, 0.85, 0.3];
      m.quad([fx - fw, 10, w.y], [fx + fw, 10, w.y], [fx + fw, 10 + fh, w.y], [fx - fw, 10 + fh, w.y], 0, 0, 1, fc, U, 0.85);
      m.quad([fx, 10, w.y - fw], [fx, 10, w.y + fw], [fx, 10 + fh, w.y + fw], [fx, 10 + fh, w.y - fw], 1, 0, 0, fc, U, 0.85);
    }
  }
  return m.slice();
}
export function buildViceSmokeGeometry(state, m) {
  m.reset();
  const p = state.player;
  for (const w of state.wrecks || []) {
    const dx = w.x - p.x, dz = w.y - p.y;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    const drift = Math.sin(state.time * 0.7 + w.x) * 6;
    for (let k = 0; k < 5; k += 1) {
      const sy = 22 + k * 20, sr = 12 + k * 6, sa = 0.65 - k * 0.07;
      const sx = w.x - 10 - k * 4 + drift, sz = w.y - 2 + k * 2;
      const g2 = 0.08 + k * 0.02, sc = [g2, g2, g2 + 0.02];
      m.quad([sx - sr, sy, sz], [sx + sr, sy, sz], [sx + sr, sy + sr * 1.6, sz], [sx - sr, sy + sr * 1.6, sz], 0, 0, 1, sc, U, sa);
      m.quad([sx, sy, sz - sr], [sx, sy, sz + sr], [sx, sy + sr * 1.6, sz + sr], [sx, sy + sr * 1.6, sz - sr], 1, 0, 0, sc, U, sa);
    }
  }
  return m.slice();
}
