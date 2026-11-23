// Vice-Dusk 3D geometry: one merged static mesh for the whole city (ground,
// buildings, landmarks, palms, lamps) and one dynamic mesh rebuilt per frame
// (cars, people, bullets, particles, marker, lighthouse beam). Vertex layout:
// pos(3) normal(3) colour(3) uv(2) emissive(1) = 12 floats. Yaw is the 3D
// rotation about Y; a 2D angle a maps to yaw -a, forward (cos a, 0, sin a).

import { AVENUES, CAR_KINDS, STREETS, WORLD } from '../tune.js';
import { VICE_FACADE_UV, VICE_ROOF_UV, VICE_WHITE_UV } from './textures3d.js';

export const VICE_VERT_STRIDE = 12;

export function viceHex(h) {
  return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
}

export function viceCreateMesh(capacity) {
  const data = new Float32Array(capacity * VICE_VERT_STRIDE);
  let n = 0;
  function vert(x, y, z, nx, ny, nz, r, g, b, u, v, e) {
    const o = n * VICE_VERT_STRIDE;
    data[o] = x; data[o + 1] = y; data[o + 2] = z;
    data[o + 3] = nx; data[o + 4] = ny; data[o + 5] = nz;
    data[o + 6] = r; data[o + 7] = g; data[o + 8] = b;
    data[o + 9] = u; data[o + 10] = v; data[o + 11] = e;
    n += 1;
  }
  function quad(a, b, c, d, nx, ny, nz, col, uv, emi) {
    const u0 = uv[0], v0 = uv[1], u1 = uv[2], v1 = uv[3];
    vert(a[0], a[1], a[2], nx, ny, nz, col[0], col[1], col[2], u0, v0, emi);
    vert(b[0], b[1], b[2], nx, ny, nz, col[0], col[1], col[2], u1, v0, emi);
    vert(c[0], c[1], c[2], nx, ny, nz, col[0], col[1], col[2], u1, v1, emi);
    vert(a[0], a[1], a[2], nx, ny, nz, col[0], col[1], col[2], u0, v0, emi);
    vert(c[0], c[1], c[2], nx, ny, nz, col[0], col[1], col[2], u1, v1, emi);
    vert(d[0], d[1], d[2], nx, ny, nz, col[0], col[1], col[2], u0, v1, emi);
  }
  function tri(a, b, c, nx, ny, nz, col, uv, emi) {
    vert(a[0], a[1], a[2], nx, ny, nz, col[0], col[1], col[2], uv[0], uv[1], emi);
    vert(b[0], b[1], b[2], nx, ny, nz, col[0], col[1], col[2], uv[2], uv[1], emi);
    vert(c[0], c[1], c[2], nx, ny, nz, col[0], col[1], col[2], uv[2], uv[3], emi);
  }
  function groundQuad(x0, z0, x1, z1, y, col, emi) {
    quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], 0, 1, 0, col, VICE_WHITE_UV, emi);
  }
  function box(cx, cy, cz, sx, sy, sz, yaw, col, uv, emi, roofUv, roofEmi) {
    const co = Math.cos(yaw), si = Math.sin(yaw);
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const L = [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], [-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]];
    const P = L.map((p) => [cx + p[0] * co + p[2] * si, cy + p[1], cz - p[0] * si + p[2] * co]);
    const N = [[0, 1, 0], [co, 0, -si], [-co, 0, si], [si, 0, co], [-si, 0, -co]];
    const rUv = roofUv || uv;
    const rEm = roofEmi === undefined ? emi : roofEmi;
    quad(P[4], P[5], P[6], P[7], N[0][0], N[0][1], N[0][2], col, rUv, rEm);
    quad(P[1], P[2], P[6], P[5], N[1][0], N[1][1], N[1][2], col, uv, emi);
    quad(P[3], P[0], P[4], P[7], N[2][0], N[2][1], N[2][2], col, uv, emi);
    quad(P[2], P[3], P[7], P[6], N[3][0], N[3][1], N[3][2], col, uv, emi);
    quad(P[0], P[1], P[5], P[4], N[4][0], N[4][1], N[4][2], col, uv, emi);
  }
  return {
    data,
    get count() { return n; },
    reset() { n = 0; },
    slice() { return data.subarray(0, n * VICE_VERT_STRIDE); },
    vert, quad, tri, groundQuad, box,
  };
}

export function viceBuildingHeight(b) {
  const h = (((b.x * 7 + b.y * 13) % 100) + 100) % 100 / 100;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const downtown = cx > 1200 && cx < 3000 && cy > 600 && cy < 2000 ? 1.5 : 1.0;
  const beach = cy > 2300 ? 0.6 : 1.0;
  return (60 + h * 140) * downtown * beach;
}

const NEON_TRIM = [[1, 0.18, 0.47], [0, 0.9, 1], [1, 0.82, 0.24], [1, 0.48, 0.18]];

export function buildViceCityStaticGeometry(city) {
  const m = viceCreateMesh(22000);
  const white = [1, 1, 1];
  const grass = viceHex('#5d8a48');
  const sand = viceHex('#e2cd96');
  const sidewalk = viceHex('#9a8f7d');
  const asphalt = viceHex('#33373f');
  const lane = viceHex('#d8c96a');
  m.groundQuad(0, 0, WORLD.width, WORLD.height, 0, grass, 0);
  m.groundQuad(0, 2440, WORLD.width, WORLD.height, 0.1, sand, 0);
  for (const ax of AVENUES) {
    m.groundQuad(ax - 86, 0, ax + 86, WORLD.height, 0.12, sidewalk, 0);
    m.groundQuad(ax - 60, 0, ax + 60, WORLD.height, 0.15, asphalt, 0);
    for (let y = 60; y < WORLD.height - 30; y += 120) m.groundQuad(ax - 2, y, ax + 2, y + 30, 0.18, lane, 0);
  }
  for (const sy of STREETS) {
    m.groundQuad(0, sy - 86, WORLD.width, sy + 86, 0.12, sidewalk, 0);
    m.groundQuad(0, sy - 60, WORLD.width, sy + 60, 0.15, asphalt, 0);
    for (let x = 60; x < WORLD.width - 30; x += 120) m.groundQuad(x, sy - 2, x + 30, sy + 2, 0.18, lane, 0);
  }
  for (const [ix, iy] of [[1500, 1300], [900, 800]]) {
    for (let s = 0; s < 5; s += 1) m.groundQuad(ix - 50 + s * 20, iy - 60, ix - 42 + s * 20, iy + 60, 0.18, white, 0);
  }
  for (const b of city.buildings) {
    const cx = b.x + b.w / 2, cz = b.y + b.h / 2;
    const ti = Math.abs(Math.floor(b.x * 3 + b.y * 5) % 4);
    const trim = NEON_TRIM[Math.abs(Math.floor(b.x + b.y) % 4)];
    if (b.kind === 'casino') {
      m.box(cx, 30, cz, b.w, 60, b.h, 0, white, VICE_FACADE_UV[2], 0.4, VICE_ROOF_UV, 0);
      m.box(cx, 82, cz, b.w * 0.7, 45, b.h * 0.7, 0, white, VICE_FACADE_UV[2], 0.5, VICE_ROOF_UV, 0);
      m.box(cx, 125, cz, b.w * 0.5, 18, 14, 0, [1, 0.18, 0.47], VICE_WHITE_UV, 1);
      m.box(cx, 103, cz, b.w + 4, 4, b.h + 4, 0, trim, VICE_WHITE_UV, 1);
      continue;
    }
    if (b.kind === 'stadium') {
      m.box(cx, 18, cz, b.w, 36, b.h, 0, white, VICE_FACADE_UV[1], 0.3, VICE_ROOF_UV, 0);
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        m.box(cx + ox * (b.w / 2 - 6), 35, cz + oz * (b.h / 2 - 6), 8, 70, 8, 0, [0.2, 0.2, 0.22], VICE_WHITE_UV, 0);
        m.box(cx + ox * (b.w / 2 - 6), 72, cz + oz * (b.h / 2 - 6), 16, 4, 10, 0, [1, 0.95, 0.8], VICE_WHITE_UV, 1);
      }
      continue;
    }
    if (b.kind === 'lighthouse') {
      m.box(cx, 32, cz, 34, 64, 34, 0, viceHex('#c94f43'), VICE_WHITE_UV, 0);
      m.box(cx, 96, cz, 30, 64, 30, 0, white, VICE_WHITE_UV, 0);
      m.box(cx, 132, cz, 22, 10, 22, 0, [1, 0.82, 0.24], VICE_WHITE_UV, 1);
      continue;
    }
    const hgt = viceBuildingHeight(b);
    m.box(cx, hgt / 2, cz, b.w, hgt, b.h, 0, white, VICE_FACADE_UV[ti], 0.35, VICE_ROOF_UV, 0);
    m.box(cx, hgt - 2, cz, b.w + 4, 4, b.h + 4, 0, trim, VICE_WHITE_UV, 1);
  }
  for (const palm of city.palms) {
    m.box(palm.x, 11, palm.y, 4, 22, 4, 0, viceHex('#5a4632'), VICE_WHITE_UV, 0);
    m.box(palm.x, 24, palm.y, 26, 4, 26, 0.4, viceHex('#3f7d3a'), VICE_WHITE_UV, 0);
    m.box(palm.x + 3, 27, palm.y + 2, 18, 3, 18, 0.9, viceHex('#2f6b2e'), VICE_WHITE_UV, 0);
  }
  let lamp = 0;
  for (const ax of AVENUES) {
    for (const sy of STREETS) {
      lamp += 1;
      if (lamp % 2 === 0) continue;
      m.box(ax + 70, 13, sy + 70, 3, 26, 3, 0, [0.15, 0.15, 0.17], VICE_WHITE_UV, 0);
      m.box(ax + 70, 27, sy + 70, 9, 3, 9, 0, [1, 0.85, 0.55], VICE_WHITE_UV, 1);
    }
  }
  return m.slice();
}

export function buildViceDynamicGeometry(state, m) {
  m.reset();
  const white = [1, 1, 1];
  const dark = [0.08, 0.08, 0.1];
  const skin = viceHex('#e8b98a');
  const px = state.player.x, pz = state.player.y;
  for (const car of state.cars) {
    const dx = car.x - px, dz = car.y - pz;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    const spec = CAR_KINDS[car.kind] || CAR_KINDS.sedan;
    const yaw = -car.angle;
    const col = viceHex(car.color || spec.color);
    const L = spec.length, W = spec.width;
    m.box(car.x, 9, car.y, L, 10, W, yaw, col, VICE_WHITE_UV, 0);
    m.box(car.x - Math.cos(car.angle) * 2, 17, car.y - Math.sin(car.angle) * 2, L * 0.45, 8, W * 0.85, yaw, viceHex('#9fd4e8'), VICE_WHITE_UV, 0.15);
    const co = Math.cos(car.angle), si = Math.sin(car.angle);
    for (const [lx, lz] of [[L * 0.32, W / 2], [L * 0.32, -W / 2], [-L * 0.32, W / 2], [-L * 0.32, -W / 2]]) {
      m.box(car.x + lx * co - lz * si, 4, car.y + lx * si + lz * co, 10, 8, 3, yaw, dark, VICE_WHITE_UV, 0);
    }
    for (const s of [-1, 1]) {
      m.box(car.x + (L / 2 - 1) * co - s * (W / 2 - 4) * si, 8, car.y + (L / 2 - 1) * si + s * (W / 2 - 4) * co, 3, 3, 5, yaw, [1, 0.9, 0.6], VICE_WHITE_UV, 1);
      m.box(car.x - (L / 2 - 1) * co - s * (W / 2 - 4) * si, 8, car.y - (L / 2 - 1) * si + s * (W / 2 - 4) * co, 3, 3, 5, yaw, [1, 0.15, 0.15], VICE_WHITE_UV, car.speed < -20 ? 1 : 0.5);
    }
    m.box(car.x, 1.5, car.y, L + 8, 1.5, W + 8, yaw, col, VICE_WHITE_UV, 0.7);
    if (car.kind === 'patrol') {
      const flash = Math.floor(state.time * 3) % 2 === 0;
      m.box(car.x - Math.cos(car.angle) * 4, 23, car.y - Math.sin(car.angle) * 4, 8, 3, W * 0.6, yaw, flash ? [1, 0.2, 0.2] : [0.2, 0.4, 1], VICE_WHITE_UV, 1);
    }
    if (car.kind === 'taxi') {
      m.box(car.x, 22, car.y, 14, 4, 8, yaw, [1, 0.82, 0.24], VICE_WHITE_UV, 0.8);
    }
  }
  function person(x, y, shirt, angle) {
    const yaw = -angle;
    m.box(x, 9, y, 13, 18, 10, yaw, shirt, VICE_WHITE_UV, 0);
    m.box(x, 21, y, 8, 8, 8, yaw, skin, VICE_WHITE_UV, 0);
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
    m.box(b.x, 2, b.y, 10, 2, 2, -Math.atan2(b.vy, b.vx), [1, 0.9, 0.6], VICE_WHITE_UV, 1);
  }
  let drawn = 0;
  for (const pt of state.particles) {
    if (drawn >= 30) break;
    const dx = pt.x - px, dz = pt.y - pz;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    m.box(pt.x, 2, pt.y, pt.size * 2, pt.size * 2, pt.size * 2, 0, viceHex(pt.color || '#ffd23d'), VICE_WHITE_UV, 0.6);
    drawn += 1;
  }
  for (const s of state.skids) {
    const dx = s.x - px, dz = s.y - pz;
    if (dx * dx + dz * dz > 1200 * 1200) continue;
    m.groundQuad(s.x - 7, s.y - 2, s.x + 7, s.y + 2, 0.2, [0.08, 0.08, 0.08], 0);
  }
  if (state.objective) {
    const o = state.objective;
    const bob = 30 + Math.sin(state.time * 3) * 4;
    m.box(o.x, bob, o.y, 12, 24, 12, state.time * 0.8, [1, 0.82, 0.24], VICE_WHITE_UV, 1);
    m.box(o.x, 75, o.y, 5, 150, 5, 0, [1, 0.82, 0.24], VICE_WHITE_UV, 0.8);
  }
  const beam = (state.time * 0.9) % (Math.PI * 2);
  const lx = 3335, lz = 2515, ly = 136;
  const bx = lx + Math.cos(beam) * 320, bz = lz + Math.sin(beam) * 320;
  const up = [lx, ly + 4, lz];
  for (let i = 0; i < 8; i += 1) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
    const r = 34;
    const p0 = [bx + Math.cos(a0) * r, ly - 20, bz + Math.sin(a0) * r];
    const p1 = [bx + Math.cos(a1) * r, ly - 20, bz + Math.sin(a1) * r];
    m.tri(up, p0, p1, 0, 1, 0, [1, 0.9, 0.6], VICE_WHITE_UV, 0.55);
  }
  return m.slice();
}
