export const CITY_DISTRICTS_6 = [
  { name: 'Neon Strip', x: 0, y: 0, w: 1200, h: 1300, color: '#ff2e88' },
  { name: 'Downtown Core', x: 1200, y: 0, w: 1200, h: 1300, color: '#00e5ff' },
  { name: 'Palm Heights', x: 2400, y: 0, w: 1200, h: 1300, color: '#f2c94c' },
  { name: 'Vice Marina', x: 0, y: 1300, w: 1200, h: 1400, color: '#2e9bff' },
  { name: 'Ember Docks', x: 1200, y: 1300, w: 1500, h: 1400, color: '#ff7a18' },
  { name: 'Lighthouse Point', x: 2700, y: 1300, w: 900, h: 1400, color: '#b678ff' },
];

export const RESPECT_RANKS = [
  { min: 0, name: 'Street Runner' }, { min: 20, name: 'Hustler' }, { min: 40, name: 'Made Man' },
  { min: 60, name: 'Vice Lieutenant' }, { min: 80, name: 'Syndicate Boss' }, { min: 95, name: 'Vice Kingpin' },
];

export function districtAt(x, y) {
  for (const d of CITY_DISTRICTS_6) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return CITY_DISTRICTS_6[1];
}

export function rankFor(rep) {
  let r = RESPECT_RANKS[0];
  for (const k of RESPECT_RANKS) if (rep >= k.min) r = k;
  return r;
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
  const line = state.dialogue[0] || '';
  const w = 680, x = (hud.w - w) / 2, y = hud.h - 116;
  hud.rect(x, y, w, 82, 'rgba(12,16,26,0.92)');
  hud.rect(x, y, w, 3, '#ff2e88');
  const px = x + 8, py = y + 6;
  hud.circ(px + 35, py + 35, 35, '#2a0e2e');
  hud.ring(px + 35, py + 35, 35, '#ff2e88');
  hud.circ(px + 35, py + 34, 19, '#e8b98a');
  hud.rect(px + 14, py + 8, 42, 20, '#1a1a22');
  hud.rect(px + 21, py + 30, 9, 4, '#111');
  hud.rect(px + 40, py + 30, 9, 4, '#111');
  hud.rect(px + 28, py + 44, 15, 4, '#c22e5e');
  hud.text("ELENA 'VIPER' CRUZ — SYNDICATE FIXER", x + 92, y + 28, 14, '#ff2e88', 'left', true);
  hud.text(line, x + 92, y + 56, 16, '#ffe9c4', 'left');
}
