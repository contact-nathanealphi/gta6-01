import { AVENUES, ROAD_HALF, STREETS, WALK, WORLD } from './tune.js';

const ROOF_COLORS = ['#b08954', '#8a6f4d', '#a5715e', '#7d8a99', '#c2a06a', '#96705a', '#6f7f6a'];
const GLASS_COLORS = ['#7fb3d5', '#9cc3d8', '#6f9fb8'];

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

  for (let col = 0; col < AVENUES.length - 1; col += 1) {
    for (let row = 0; row < STREETS.length - 1; row += 1) {
      const x0 = AVENUES[col] + ROAD_HALF + WALK + 14;
      const y0 = STREETS[row] + ROAD_HALF + WALK + 14;
      const x1 = AVENUES[col + 1] - ROAD_HALF - WALK - 14;
      const y1 = STREETS[row + 1] - ROAD_HALF - WALK - 14;
      const landmark = LANDMARKS.find((place) => place.col === col && place.row === row);
      if (landmark) {
        const w = Math.min(300, x1 - x0), h = Math.min(190, y1 - y0);
        buildings.push({ x: x0 + (x1 - x0 - w) / 2, y: y0 + (y1 - y0 - h) / 2, w, h, color: landmark.color, glass: rng.pick(GLASS_COLORS), name: landmark.name, kind: landmark.kind });
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

  for (let x = 120; x < WORLD.width; x += 150) {
    palms.push({ x: x + rng.range(-30, 30), y: rng.range(2470, 2620) });
  }
  for (let x = 300; x <= 3300; x += 45) {
    palms.push({ x: x + rng.range(-8, 8), y: 1800 - 100 });
    palms.push({ x: x + rng.range(-8, 8), y: 1800 + 100 });
  }
  for (let y = 150; y <= 2350; y += 45) {
    palms.push({ x: 1500 - 100, y: y + rng.range(-8, 8) });
    palms.push({ x: 1500 + 100, y: y + rng.range(-8, 8) });
  }

  buildings.push({
    x: 3300, y: 2480, w: 70, h: 70,
    color: '#e8e2d4', glass: '#ffd23d', name: 'Neon Bay Lighthouse', kind: 'lighthouse',
  });

  return { buildings, palms };
}

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

export function randomSidewalkPoint(rng) {
  const vertical = rng.chance(0.5);
  if (vertical) {
    const ax = rng.pick(AVENUES);
    return { x: ax + (rng.chance(0.5) ? 1 : -1) * (ROAD_HALF + WALK / 2), y: rng.range(80, WORLD.height - 80) };
  }
  const sy = rng.pick(STREETS);
  return { x: rng.range(80, WORLD.width - 80), y: sy + (rng.chance(0.5) ? 1 : -1) * (ROAD_HALF + WALK / 2) };
}

export function resolveBuildings(buildings, body) {
  let pushed = false;
  for (const b of buildings) {
    const nearX = Math.max(b.x, Math.min(body.x, b.x + b.w));
    const nearY = Math.max(b.y, Math.min(body.y, b.y + b.h));
    const dx = body.x - nearX, dy = body.y - nearY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= body.radius * body.radius) continue;
    pushed = true;
    if (distSq > 0.01) {
      const dist = Math.sqrt(distSq), push = body.radius - dist;
      body.x += (dx / dist) * push;
      body.y += (dy / dist) * push;
    } else {
      const l = body.x - b.x, r = b.x + b.w - body.x, t = body.y - b.y, bo = b.y + b.h - body.y;
      const m = Math.min(l, r, t, bo);
      if (m === l) body.x = b.x - body.radius;
      else if (m === r) body.x = b.x + b.w + body.radius;
      else if (m === t) body.y = b.y - body.radius;
      else body.y = b.y + b.h + body.radius;
    }
  }
  return pushed;
}

export function lineBlocked(buildings, x1, y1, x2, y2) {
  for (const b of buildings) if (segmentHitsRect(x1, y1, x2, y2, b)) return true;
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  const edges = [[r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h], [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y]];
  for (const [ax, ay, bx, by] of edges) if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
