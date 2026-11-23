export class CrewAbilitySystem {
  constructor(state, fx) { this.s = state; this.fx = fx; }
  say(m, t) { this.s.banner = m; this.s.bannerTimer = t || 2; }
  tick(dt) {
    const cd = this.s.crewCd;
    for (let i = 0; i < 3; i += 1) if (cd[i] > 0) cd[i] = Math.max(0, cd[i] - dt);
  }
  use(idx) {
    const s = this.s, p = s.player;
    if (idx < 0 || idx > 2) return false;
    if (s.crewCd[idx] > 0) { this.say('Crew recharging — ' + Math.ceil(s.crewCd[idx]) + 's', 1.5); return false; }
    if (idx === 0) {
      s.wantedPoints = Math.max(0, s.wantedPoints - 4);
      s.wanted = Math.min(5, Math.floor(s.wantedPoints / 2));
      s.crewCd[0] = 45; this.say('Jammed — heat -2 stars', 2.5);
    } else if (idx === 1) {
      this.fx.spawnAlly();
      s.crewCd[1] = 60; this.say('Hit Squad rolling in!', 2.5);
    } else {
      if (p.onFoot) { this.say('Nitrous needs a car', 1.5); return false; }
      s.nitrousT = 3; s.crewCd[2] = 20; this.say('NITROUS!');
    }
    return true;
  }
}

export class NeonCustomsGarage {
  constructor(state) {
    this.s = state;
    try { this.levels = JSON.parse(localStorage.getItem('neon-bay.upgrades.v1') || '{}'); } catch { this.levels = {}; }
    for (const u of N.UPGRADES) this.levels[u.key] ??= 0;
  }
  near() {
    const p = this.s.player;
    if (p.onFoot) return null;
    for (const g of N.POINTS) if (Math.hypot(p.x - g.x, p.y - g.y) < 120) return g;
    return null;
  }
  buy(i) {
    const s = this.s, u = N.UPGRADES[i];
    if (!u) return false;
    const lvl = this.levels[u.key];
    if (lvl >= u.max) { s.banner = u.name + ' already maxed'; s.bannerTimer = 1.5; return false; }
    if (s.cash < u.price) { s.banner = 'Need $' + u.price + ' for ' + u.name; s.bannerTimer = 2; return false; }
    s.cash -= u.price;
    this.levels[u.key] = lvl + 1;
    try { localStorage.setItem('neon-bay.upgrades.v1', JSON.stringify(this.levels)); } catch { /* off */ }
    s.banner = u.name + ' upgraded to Lv' + this.levels[u.key]; s.bannerTimer = 2;
    return true;
  }
}
const N = NeonCustomsGarage;
N.POINTS = [{ x: 870, y: 1550, name: "Rico's Garage" }, { x: 950, y: 2350, name: 'Neon Customs' }];
N.UPGRADES = [
  { key: 'engine', name: 'Engine', desc: '+15% top speed', price: 800, max: 3 },
  { key: 'armor', name: 'Armor', desc: '+50 max car HP', price: 600, max: 3 },
  { key: 'nitrous', name: 'Nitrous', desc: '+boost power', price: 500, max: 3 },
  { key: 'glow', name: 'Underglow', desc: 'Neon underglow', price: 300, max: 1 },
];

export class StreetRaceCircuit {
  constructor(state, fx) { this.s = state; this.fx = fx; }
  start(idx) {
    const s = this.s, p = s.player;
    if (s.race.active) { s.banner = 'Race already running'; s.bannerTimer = 1.5; return false; }
    if (p.onFoot) { s.banner = 'Need a car to race'; s.bannerTimer = 1.5; return false; }
    const c = S.CIRCUITS[idx % 2];
    s.race = { active: true, circuit: idx % 2, gate: 0, lap: 1, laps: c.laps, reward: c.reward };
    const g0 = c.gates[0];
    for (let i = 0; i < 3; i += 1) {
      const car = this.fx.spawnRaceCar(['muscle', 'sports', 'sedan'][i], g0[0] + (i - 1) * 60, g0[1] + 90);
      car.raceGate = 0; car.raceLap = 1;
    }
    s.banner = 'STREET RACE: ' + c.name + ' — ' + c.laps + ' laps!'; s.bannerTimer = 3;
    return true;
  }
  update(dt) {
    const s = this.s, r = s.race;
    if (!r.active) return;
    const c = S.CIRCUITS[r.circuit], p = s.player;
    const gate = c.gates[r.gate];
    if (Math.hypot(p.x - gate[0], p.y - gate[1]) < 80) {
      r.gate += 1;
      if (r.gate >= c.gates.length) {
        r.gate = 0; r.lap += 1;
        if (r.lap > r.laps) {
          s.cash += r.reward;
          s.banner = 'Race won!  +$' + r.reward; s.bannerTimer = 3.5;
          for (const car of s.cars) if (car.driver === 'race') car.driver = 'traffic';
          s.race = { active: false, circuit: 0, gate: 0, lap: 1, laps: 2, reward: 0 };
          return;
        }
        s.banner = 'Lap ' + r.lap + '/' + r.laps; s.bannerTimer = 1.5;
      }
    }
    for (const car of s.cars) {
      if (car.driver !== 'race') continue;
      const g = c.gates[car.raceGate || 0];
      const want = Math.atan2(g[1] - car.y, g[0] - car.x);
      let diff = want - car.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
      car.speed = Math.min(430, car.speed + 380 * dt);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      if (Math.hypot(car.x - g[0], car.y - g[1]) < 80) {
        car.raceGate = (car.raceGate + 1) % c.gates.length;
        if (car.raceGate === 0) car.raceLap = (car.raceLap || 1) + 1;
      }
    }
  }
}
const S = StreetRaceCircuit;
S.CIRCUITS = [
  { name: 'Neon Loop', laps: 2, reward: 500, gates: [[900, 800], [2100, 800], [2100, 1800], [900, 1800]] },
  { name: 'Bayfront Sprint', laps: 2, reward: 800, gates: [[300, 300], [3300, 300], [3300, 2300], [300, 2300]] },
];

export class ProceduralFmRadio {
  constructor(state) { this.s = state; this.idx = -1; this.audio = null; }
  attach(audio) { this.audio = audio; }
  next() {
    this.idx = (this.idx + 1) % 3;
    const st = F.STATIONS[this.idx];
    this.s.radioToast = { name: st.name, until: performance.now() + 3000 };
    this.s.banner = st.name + ' — now playing'; this.s.bannerTimer = 2;
    if (this.audio) this.audio.station(st.bass, st.bpm, st.wave);
    return st.name;
  }
}
const F = ProceduralFmRadio;
F.STATIONS = [
  { name: 'VICE FM 104.5', bpm: 112, wave: 'sawtooth', bass: [55, 65.41, 82.41, 73.42] },
  { name: 'SUNSET 91.7', bpm: 96, wave: 'triangle', bass: [65.41, 82.41, 73.42, 55] },
  { name: 'NEON PULSE 98.2', bpm: 128, wave: 'square', bass: [55, 82.41, 65.41, 98] },
];

export function renderCrewHud(hud, state) {
  const names = ['JAMMER', 'HIT SQUAD', 'NITROUS'];
  const T = hud.text, R = hud.rect, G = hud.ring;
  const x0 = hud.w - 236, y0 = hud.h - 148;
  for (let i = 0; i < 3; i += 1) {
    const x = x0 + i * 76, cd = state.crewCd[i];
    R(x, y0, 68, 68, cd > 0 ? 'rgba(12,16,26,0.55)' : 'rgba(12,16,26,0.85)');
    G(x + 34, y0 + 34, 32, cd > 0 ? '#555' : '#f2c94c');
    T('[' + (i + 1) + ']', x + 34, y0 + 26, 15, '#ffffff', 'center', true);
    T(names[i], x + 34, y0 + 46, 10, '#b9b3a4', 'center', true);
    T(cd > 0 ? Math.ceil(cd) + 's' : 'READY', x + 34, y0 + 62, 12, cd > 0 ? '#ff5a5a' : '#57d977', 'center', true);
  }
}

export function renderRadioToast(hud, state) {
  const t = state.radioToast;
  if (!t || performance.now() > t.until) return;
  const T = hud.text, R = hud.rect;
  const x = hud.w - 250, y = 236, w = 236, h = 54;
  R(x, y, w, h, 'rgba(12,16,26,0.85)');
  R(x, y, 4, h, '#00e5ff');
  T('♪ ' + t.name, x + 14, y + 22, 15, '#ffffff', 'left', true);
  T('[R] switch station', x + 14, y + 42, 12, '#b9b3a4', 'left');
  for (let i = 0; i < 8; i += 1) {
    const bh = 6 + Math.abs(Math.sin(performance.now() / 140 + i * 0.9)) * 22;
    R(x + w - 66 + i * 7, y + h - 8 - bh, 5, bh, '#00e5ff');
  }
}

export function renderRaceHud(hud, state) {
  const r = state.race;
  if (!r.active) return;
  const T = hud.text, R = hud.rect;
  const c = S.CIRCUITS[r.circuit];
  const p = state.player, g = c.gates[r.gate];
  const d = Math.round(Math.hypot(p.x - g[0], p.y - g[1]));
  const n = c.gates.length, prog = (r.lap - 1) * n + r.gate;
  let pos = 1;
  for (const car of state.cars) if (car.driver === 'race' && ((car.raceLap - 1) * n + (car.raceGate || 0)) > prog) pos += 1;
  R(14, hud.h - 148, 360, 58, 'rgba(12,16,26,0.8)');
  R(14, hud.h - 148, 360, 3, '#00e5ff');
  T('RACE: ' + c.name + ' · P' + pos + '/4 · Lap ' + r.lap + '/' + r.laps, 28, hud.h - 122, 16, '#00e5ff', 'left', true);
  T('Gate ' + (r.gate + 1) + '/' + n + ' · ' + d + 'm', 28, hud.h - 100, 14, '#f4f1e6', 'left');
}

export function renderGarageShowroom(hud, state, garage) {
  if (!state.garageOpen) return;
  const T = hud.text, R = hud.rect;
  const w = 620, h = 330, x = (hud.w - w) / 2, y = (hud.h - h) / 2;
  R(0, 0, hud.w, hud.h, 'rgba(8,10,20,0.6)');
  R(x, y, w, h, 'rgba(12,16,26,0.95)');
  R(x, y, w, 3, '#ff2e88');
  T('NEON CUSTOMS — ' + (state.garagePoint ? state.garagePoint.name : ''), hud.w / 2, y + 44, 24, '#ff2e88', 'center', true);
  T('Cash: $' + state.cash.toLocaleString('en-US'), hud.w / 2, y + 72, 16, '#f2c94c', 'center', true);
  const ups = N.UPGRADES;
  for (let i = 0; i < ups.length; i += 1) {
    const u = ups[i], lvl = garage.levels[u.key], yy = y + 104 + i * 44;
    R(x + 24, yy, w - 48, 36, 'rgba(255,255,255,0.06)');
    T('[' + (i + 1) + '] ' + u.name + ' — ' + u.desc + '   ' + (lvl >= u.max ? 'MAX' : '$' + u.price + ' · Lv' + lvl + '/' + u.max), x + 38, yy + 23, 15, '#f4f1e6', 'left', true);
  }
  T('1-4 buy · G/Esc leave', hud.w / 2, y + h - 18, 14, '#b9b3a4', 'center');
}
