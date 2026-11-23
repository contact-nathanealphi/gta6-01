export const WEAPON_SLOTS_6 = [
  { key: 1, name: 'Neon Katana', desc: 'Melee', color: '#ff5a3c' },
  { key: 2, name: 'Vice 9mm', desc: 'Pistol', color: '#f2c94c', need: 'pistol' },
  { key: 3, name: 'Micro-SMG', desc: 'Drive-by', color: '#00e5ff' },
  { key: 4, name: 'Combat Shotgun', desc: '5 pellets', color: '#ff8c42', need: 'shotgun' },
  { key: 5, name: 'Tactical Carbine', desc: 'High damage', color: '#57d977', need: 'pistol' },
  { key: 6, name: 'Hydra RPG', desc: 'Rocket', color: '#ff2e88', need: 'rpg' },
];

export class WeaponWheelSystem {
  constructor(state) { this.s = state; }
  available(slot) {
    const p = this.s.player, need = WEAPON_SLOTS_6[slot - 1].need;
    if (need === 'pistol') return !!p.pistol;
    if (need === 'shotgun') return p.shotgun > 0;
    if (need === 'rpg') return p.rpg > 0;
    return true;
  }
  select(slot) {
    if (slot < 1 || slot > 6) return false;
    const s = WEAPON_SLOTS_6[slot - 1];
    if (!this.available(slot)) {
      this.s.banner = s.name + ' not available yet';
      this.s.bannerTimer = 2;
      return false;
    }
    this.s.player.weapon = slot;
    this.s.banner = s.name + ' equipped';
    this.s.bannerTimer = 1.4;
    return true;
  }
  current() { return this.s.player.weapon || 1; }
}

export function renderRadialWeaponWheel(hud, state, highlight) {
  const cx = hud.w / 2, cy = hud.h / 2, R = 150;
  hud.rect(0, 0, hud.w, hud.h, 'rgba(8,10,20,0.45)');
  hud.text('WEAPON WHEEL — SLOW-MO 0.2x', cx, cy - R - 64, 20, '#f2c94c', 'center', true);
  for (let i = 0; i < 6; i += 1) {
    const a = (-90 + i * 60) * Math.PI / 180;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    const slot = WEAPON_SLOTS_6[i];
    const cur = state.player.weapon === slot.key;
    const hot = highlight === slot.key;
    hud.circ(x, y, 52, hot ? 'rgba(242,201,76,0.95)' : cur ? 'rgba(40,48,70,0.95)' : 'rgba(12,16,26,0.9)');
    hud.ring(x, y, 52, hot ? '#f2c94c' : slot.color);
    hud.text('[' + slot.key + ']', x, y - 18, 13, slot.color, 'center', true);
    hud.text(slot.name, x, y + 2, 14, '#ffffff', 'center', true);
    hud.text(slot.desc, x, y + 20, 11, '#b9b3a4', 'center');
  }
  const cur = WEAPON_SLOTS_6[(state.player.weapon || 1) - 1];
  hud.circ(cx, cy, 58, 'rgba(12,16,26,0.95)');
  hud.ring(cx, cy, 58, '#f2c94c');
  hud.text(cur.name, cx, cy - 4, 15, '#ffffff', 'center', true);
  hud.text('release Tab / Q to confirm', cx, cy + 16, 12, '#b9b3a4', 'center');
}

export function detonateHydraRpg(state, x, y) {
  const R = 135;
  for (const t of [...state.rivals, ...state.cops]) if (Math.hypot(t.x - x, t.y - y) < R + t.radius) t.health -= 95;
  for (const car of state.cars) {
    if (car.driver === 'player') continue;
    if (Math.hypot(car.x - x, car.y - y) < R + 22) { car.health -= 70; if (car.driver === 'traffic') car.speed = 0; }
  }
  for (const ped of state.peds) if (Math.hypot(ped.x - x, ped.y - y) < R) { ped.down = 3; ped.scared = 4; }
  const p = state.player;
  if (Math.hypot(p.x - x, p.y - y) < 70) { p.health -= 20; state.hurtFlash = Math.max(state.hurtFlash, 0.7); }
  for (let i = 0; i < 26; i += 1) {
    const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 260;
    state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4 + Math.random() * 0.4, maxLife: 0.8, color: ['#ff7a18', '#ffd23d', '#ff5a3c', '#555555'][i % 4], size: 3 + Math.random() * 4 });
  }
  state.shake = Math.max(state.shake, 14);
}
