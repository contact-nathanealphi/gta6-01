export const CITY_DISTRICTS_6 = [
  { name: 'Neon Strip', x: 0, y: 0, w: 1200, h: 1300, color: '#ff2e88' },
  { name: 'Downtown Core', x: 1200, y: 0, w: 1200, h: 1300, color: '#00e5ff' },
  { name: 'Palm Heights', x: 2400, y: 0, w: 1200, h: 1300, color: '#f2c94c' },
  { name: 'Vice Marina', x: 0, y: 1300, w: 1200, h: 1400, color: '#2e9bff' },
  { name: 'Ember Docks', x: 1200, y: 1300, w: 1500, h: 1400, color: '#ff7a18' },
  { name: 'Lighthouse Point', x: 2700, y: 1300, w: 900, h: 1400, color: '#b678ff' },
];

export const RESPECT_RANKS = [
  [0, 'Street Runner'], [20, 'Hustler'], [40, 'Made Man'],
  [60, 'Vice Lieutenant'], [80, 'Syndicate Boss'], [95, 'Vice Kingpin'],
];

export function districtAt(x, y) {
  for (const d of CITY_DISTRICTS_6) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return CITY_DISTRICTS_6[1];
}

export function rankFor(rep) {
  let r = RESPECT_RANKS[0];
  for (const k of RESPECT_RANKS) if (rep >= k[0]) r = k;
  return { name: r[1] };
}

export class DistrictStandingSystem {
  constructor(state) { this.s = state; }
  rep(name) { return this.s.rep[name] || 0; }
  grant(x, y, amount) {
    const d = districtAt(x, y);
    this.s.rep[d.name] = Math.min(100, this.rep(d.name) + amount);
    return d;
  }
  current() { const p = this.s.player; return districtAt(p.x, p.y); }
}

export function renderFixerDialogueBox(hud, state) {
  const T = hud.text, R = hud.rect, C = hud.circ, G = hud.ring;
  const line = state.dialogue[0] || '';
  const w = 680, x = (hud.w - w) / 2, y = hud.h - 116;
  R(x, y, w, 82, 'rgba(12,16,26,0.92)');
  R(x, y, w, 3, '#ff2e88');
  const px = x + 8, py = y + 6, cx = px + 35, cy = py + 35;
  C(cx, cy, 35, '#2a0e2e');
  G(cx, cy, 35, '#ff2e88');
  C(cx, cy - 1, 19, '#e8b98a');
  R(px + 14, py + 8, 42, 20, '#1a1a22');
  for (const ex of [21, 40]) R(px + ex, py + 30, 9, 4, '#111');
  R(px + 28, py + 44, 15, 4, '#c22e5e');
  T("ELENA 'VIPER' CRUZ — SYNDICATE FIXER", x + 92, y + 28, 14, '#ff2e88', 'left', true);
  T(line, x + 92, y + 56, 16, '#ffe9c4', 'left');
}
