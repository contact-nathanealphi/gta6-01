// Screenshot scenes behind ?shot=start|drive|chase|mission&cam=drone|chase|action|hero&tod=dusk|gold|evening|night — scripted play, same seed, same frame.
import { PLAYER, STEP } from './tune.js';
import { MISSIONS } from './world.js';
import { SCREEN_PLAY as PL, SCREEN_TITLE as TI } from './render.js';
import { spawnBurningWreck as wreck } from './police-air-support.js';
import { StreetRaceCircuit as RC } from './crew-garage-race.js';
const IDLE = { up: false, down: false, left: false, right: false, run: false, enter: false, punch: false, reload: false, shoot: false };
const TOD = { dusk: 107.5, gold: 105, evening: 110.5, night: 117.5 };
const rf = (g, s, f) => { const n = Math.round(s / STEP); for (let i = 0; i < n; i += 1) g.step(STEP, typeof f === 'function' ? f() : f); };
const drv = (g, av) => {
  const c = g.playerCar();
  if (!c) return IDLE;
  const lane = av - 25;
  let w = Math.PI / 2;
  if (c.x < lane - 15) w -= 0.3; else if (c.x > lane + 15) w += 0.3;
  let d = w - c.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return { ...IDLE, up: true, left: d < -0.08, right: d > 0.08 };
};
const ped = (g, x, y, shirt) => {
  g.state.peds.push({ x, y, angle: 0, speed: 60, target: { x: x + 30, y }, down: 0, scared: 0, fleeX: 0, fleeY: 0, radius: 12, shirt: shirt || '#e8e2d4', jogger: false });
};
const sedan = (g, x, y) => {
  const p = g.state.player;
  p.x = 830; p.y = 660;
  const c = g.nearestCar(85) || g.nearestCar(400);
  if (c) g.enterCar(c);
  const m = g.playerCar();
  if (m) { m.x = x; m.y = y; m.angle = Math.PI / 2; m.speed = 0; }
};
const sc = (g) => { const s = g.state; s.cash = 48750; s.player.health = 92; s.hurtFlash = 0; s.shake = 0; s.wantedFlash = 0; };
export function stageShot(name, g, o) {
  const s = g.state;
  o = o || {};
  const st = () => { if (o.tod && TOD[o.tod] !== undefined) s.time = TOD[o.tod]; };
  const sm = () => { if (o.cam) s.shotCam = o.cam; };
  if (name === 'drive') {
    g.reset(); sm();
    const m = g.spawnParkedCar('muscle', 1500, 300, Math.PI / 2);
    const p = s.player;
    p.x = 1500; p.y = 330;
    g.enterCar(m);
    m.speed = 300;
    s.upgrades.glow = 1;
    g.sys.race.start(1);
    g.sys.radio.next();
    rf(g, 5, () => drv(g, 1500));
    const mine = g.playerCar();
    const px = mine ? mine.x : 1500, py = mine ? mine.y : 900;
    if (mine) { mine.speed = 380; s.nitrousT = 2.5; }
    RC.CIRCUITS[1].gates = [[px, py - 600], [px, py + 420], [px + 600, py + 420], [px + 600, py - 600]];
    s.race = { active: true, circuit: 1, gate: 1, lap: 2, laps: 3, reward: 800 };
    const rivals = s.cars.filter((c) => c.driver === 'race');
    rivals.forEach((c, i) => { c.x = px + (i % 2 === 0 ? -32 : 32); c.y = py + 150 + i * 110; c.angle = Math.PI / 2; c.speed = 330; c.raceGate = 0; c.raceLap = 1; });
    const ahead = [[1475, 480, 'sedan', Math.PI / 2], [1525, 560, 'taxi', -Math.PI / 2], [1475, 650, 'van', Math.PI / 2], [1525, 740, 'pickup', -Math.PI / 2], [1475, 830, 'sedan', Math.PI / 2], [1525, 920, 'limo', -Math.PI / 2]];
    for (const [x, y, k, a] of ahead) g.spawnParkedCar(k, px + (x - 1500), py + (y - 300), a);
    ped(g, px - 92, py + 320, '#7fb3d5');
    ped(g, px + 92, py + 520, '#d4693c');
    ped(g, px - 92, py + 700, '#f2c94c');
    s.nearMissStreak = 3; s.nearMissStreakT = 4;
    s.radioToast = { name: 'VICE FM 104.5', until: performance.now() + 60000 };
    s.banner = 'STREET RACE: Bayfront Sprint — 3 laps!';
    s.bannerTimer = 30;
    sc(g); st();
    return { screen: PL };
  }
  if (name === 'chase') {
    g.reset(); sm();
    const sp = g.spawnParkedCar('sports', 875, 200, Math.PI / 2);
    const p = s.player;
    p.x = 875; p.y = 230;
    g.enterCar(sp);
    p.pistol = true; p.mag = PLAYER.magSize; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
    g.setWanted(10);
    rf(g, 2, IDLE);
    sp.x = 875; sp.y = 200; sp.angle = Math.PI / 2; sp.speed = 420; sp.health = 100;
    for (const [x, y, v, k] of [[925, 320, 320, 'patrol'], [830, 380, 300, 'patrol'], [875, 480, 280, 'van']]) { const c = g.spawnPatrolCar(k); c.x = x; c.y = y; c.angle = Math.PI / 2; c.speed = v; }
    for (const [x, y] of [[820, 380], [930, 450], [820, 600]]) { const c = g.spawnFootCop(); c.x = x; c.y = y; }
    const h = s.air.heli;
    if (h) { h.x = 890; h.y = 280; h.z = 85; h.spotX = 875; h.spotY = 200; }
    wreck(s, 815, 280, 0.5);
    s.dialogue = [];
    sc(g); st();
    return { screen: PL, wheelOpen: true, wheelSlot: 6, wheelPos: { x: 380, y: 400 } };
  }
  if (name === 'mission') {
    g.reset(); sm();
    g.startMission(9);
    s.dialogue = [...MISSIONS[9].brief];
    const m = g.spawnParkedCar('muscle', 2980, 380, Math.PI / 2);
    const p = s.player;
    p.x = 2980; p.y = 410;
    g.enterCar(m);
    p.pistol = true; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
    s.upgrades.glow = 1;
    s.rep['Palm Heights'] = 68;
    s.rep['Lighthouse Point'] = 68;
    g.spawnParkedCar('sedan', 2700, 300, 0);
    g.spawnParkedCar('taxi', 3150, 330, Math.PI);
    g.spawnParkedCar('sports', 2850, 300, 0);
    g.spawnParkedCar('van', 3275, 430, Math.PI / 2);
    ped(g, 2900, 430, '#7fb3d5');
    ped(g, 3100, 430, '#e8e2d4');
    ped(g, 2950, 700, '#c2a06a');
    s.banner = 'MISSION 10/10: THE GRAND CASINO HEIST — $5,000';
    s.bannerTimer = 30;
    sc(g); st();
    return { screen: PL };
  }
  g.reset(); sm();
  sedan(g, 2200, 2500);
  rf(g, 8, IDLE);
  g.spawnParkedCar('taxi', 2675, 2150, Math.PI / 2);
  g.spawnParkedCar('sedan', 2725, 2350, -Math.PI / 2);
  g.spawnParkedCar('sports', 3275, 2400, Math.PI / 2);
  g.spawnParkedCar('muscle', 875, 2500, 0);
  sc(g); st();
  return { screen: TI };
}
