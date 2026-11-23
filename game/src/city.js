// Neon Bay's map: a grid of avenues and streets, the blocks between them filled
// with buildings, and the named places the story happens in. Everything is built
// once from a seeded generator, so the city is the same every run.

import { AVENUES, ROAD_HALF, STREETS, WALK, WORLD } from './tune.js';

const ROOF_COLORS = ['#b08954', '#8a6f4d', '#a5715e', '#7d8a99', '#c2a06a', '#96705a', '#6f7f6a'];
const GLASS_COLORS = ['#7fb3d5', '#9cc3d8', '#6f9fb8'];

/** Named places, by the block they sit in (avenue index, street index). */
const LANDMARKS = [
  { col: 0, row: 0, name: "Mama Rosa's Diner", kind: 'diner', color: '#d4693c' },
  { col: 1, row: 0, name: 'Neon Bay General', kind: 'hospital', color: '#e8e2d4' },
  { col: 2, row: 1, name: 'NBPD Headquarters', kind: 'police', color: '#2f6fd0' },
  { col: 1, row: 2, name: 'Bayfront Mall', kind: 'mall', color: '#c9a86a' },
  { col: 0, row: 2, name: "Rico's Garage", kind: 'garage', color: '#5a6b7d' },
  { col: 3, row: 3, name: 'Port of Neon Bay', kind: 'port', color: '#7d8aa0' },
  { col: 4, row: 0, name: 'Neon Casino', kind: 'casino', color: '#8a4d9e' },
  { col: 4, row: 2, name: 'Neon Stadium', kind: 'stadium', color: '#4d7d5a' },
];

export function buildCity(rng) {
  const buildings = [];
  const palms = [];

  // One or two buildings per block, inset from the road so a sidewalk ring stays
  // walkable around every block.
  for (let col = 0; col < AVENUES.length - 1; col += 1) {
    for (let row = 0; row < STREETS.length - 1; row += 1) {
      const x0 = AVENUES[col] + ROAD_HALF + WALK + 14;
      const y0 = STREETS[row] + ROAD_HALF + WALK + 14;
      const x1 = AVENUES[col + 1] - ROAD_HALF - WALK - 14;
      const y1 = STREETS[row + 1] - ROAD_HALF - WALK - 14;
      const landmark = LANDMARKS.find((place) => place.col === col && place.row === row);
      if (landmark) {
        const w = Math.min(300, x1 - x0);
        const h = Math.min(190, y1 - y0);
        buildings.push({
          x: x0 + (x1 - x0 - w) / 2, y: y0 + (y1 - y0 - h) / 2, w, h,
          color: landmark.color, glass: rng.pick(GLASS_COLORS), name: landmark.name, kind: landmark.kind,
        });
        continue;
      }
      const count = rng.int(1, 2);
      for (let i = 0; i < count; i += 1) {
        const w = rng.range(120, Math.min(260, (x1 - x0) / count - 30));
        const h = rng.range(110, Math.min(200, y1 - y0 - 30));
        const x = x0 + ((x1 - x0) / count) * i + rng.range(6, 30);
        const y = y0 + rng.range(6, Math.max(8, y1 - y0 - h - 6));
        buildings.push({
          x, y, w, h, color: rng.pick(ROOF_COLORS), glass: rng.pick(GLASS_COLORS), name: null, kind: 'block',
        });
      }
    }
  }

  // Palm trees along the beach strip at the south edge.
  for (let x = 120; x < WORLD.width; x += 170) {
    palms.push({ x: x + rng.range(-30, 30), y: rng.range(2470, 2620) });
  }

  return { buildings, palms, landmarks: LANDMARKS };
}

/** True when the point is on a road (asphalt), not a sidewalk or a block. */
export function onRoad(x, y) {
  for (const ax of AVENUES) if (Math.abs(x - ax) <= ROAD_HALF && y >= 0 && y <= WORLD.height) return true;
  for (const sy of STREETS) if (Math.abs(y - sy) <= ROAD_HALF && x >= 0 && x <= WORLD.width) return true;
  return false;
}

/** True when the point is on a sidewalk ring hugging a road. */
export function onSidewalk(x, y) {
  for (const ax of AVENUES) {
    const d = Math.abs(x - ax);
    if (d > ROAD_HALF && d <= ROAD_HALF + WALK) return true;
  }
  for (const sy of STREETS) {
    const d = Math.abs(y - sy);
    if (d > ROAD_HALF && d <= ROAD_HALF + WALK) return true;
  }
  return false;
}

/** The nearest point on a road centre line, for spawning traffic and cops. */
export function nearestRoadPoint(x, y, rng) {
  let bestAx = AVENUES[0];
  let bestDx = Infinity;
  for (const ax of AVENUES) {
    const d = Math.abs(x - ax);
    if (d < bestDx) { bestDx = d; bestAx = ax; }
  }
  let bestSy = STREETS[0];
  let bestDy = Infinity;
  for (const sy of STREETS) {
    const d = Math.abs(y - sy);
    if (d < bestDy) { bestDy = d; bestSy = sy; }
  }
  if (bestDx < bestDy) return { x: bestAx + rng.range(-30, 30), y: Math.max(60, Math.min(WORLD.height - 60, y)) };
  return { x: Math.max(60, Math.min(WORLD.width - 60, x)), y: bestSy + rng.range(-30, 30) };
}

/** A random point on a road, away from the given spot when one is given. */
export function randomRoadPoint(rng, awayFrom, minAway) {
  for (let tries = 0; tries < 12; tries += 1) {
    const vertical = rng.chance(0.5);
    const point = vertical
      ? { x: rng.pick(AVENUES) + rng.range(-30, 30), y: rng.range(80, WORLD.height - 80) }
      : { x: rng.range(80, WORLD.width - 80), y: rng.pick(STREETS) + rng.range(-30, 30) };
    if (!awayFrom || Math.hypot(point.x - awayFrom.x, point.y - awayFrom.y) >= minAway) return point;
  }
  return { x: AVENUES[0], y: STREETS[0] };
}

/** A random point on a sidewalk, for spawning pedestrians. */
export function randomSidewalkPoint(rng) {
  const vertical = rng.chance(0.5);
  if (vertical) {
    const ax = rng.pick(AVENUES);
    return { x: ax + (rng.chance(0.5) ? 1 : -1) * (ROAD_HALF + WALK / 2), y: rng.range(80, WORLD.height - 80) };
  }
  const sy = rng.pick(STREETS);
  return { x: rng.range(80, WORLD.width - 80), y: sy + (rng.chance(0.5) ? 1 : -1) * (ROAD_HALF + WALK / 2) };
}

/**
 * Push a circle (x, y, radius) out of every building it overlaps. Returns true
 * when it was pushed at all, so the caller can kill speed on a hard hit.
 */
export function resolveBuildings(buildings, body) {
  let pushed = false;
  for (const b of buildings) {
    const nearX = Math.max(b.x, Math.min(body.x, b.x + b.w));
    const nearY = Math.max(b.y, Math.min(body.y, b.y + b.h));
    const dx = body.x - nearX;
    const dy = body.y - nearY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= body.radius * body.radius) continue;
    pushed = true;
    if (distSq > 0.01) {
      const dist = Math.sqrt(distSq);
      const push = body.radius - dist;
      body.x += (dx / dist) * push;
      body.y += (dy / dist) * push;
    } else {
      // Centre inside the building: shove it out through the nearest side.
      const left = body.x - b.x;
      const right = b.x + b.w - body.x;
      const top = body.y - b.y;
      const bottom = b.y + b.h - body.y;
      const smallest = Math.min(left, right, top, bottom);
      if (smallest === left) body.x = b.x - body.radius;
      else if (smallest === right) body.x = b.x + b.w + body.radius;
      else if (smallest === top) body.y = b.y - body.radius;
      else body.y = b.y + b.h + body.radius;
    }
  }
  return pushed;
}

/** True when the straight line from (x1,y1) to (x2,y2) crosses a building. */
export function lineBlocked(buildings, x1, y1, x2, y2) {
  for (const b of buildings) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // A segment hits a rectangle when it crosses any of its four edges, or starts inside it.
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
