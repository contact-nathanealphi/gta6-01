import { PLAYER, STEP } from './tune.js';
import { MISSIONS } from './world.js';
import { SCREEN_PLAY as PL, SCREEN_TITLE as TI } from './render.js';
import { spawnBurningWreck as wreck } from './police-air-support.js';
import { StreetRaceCircuit as RC } from './crew-garage-race.js';
const P = Math.PI, H = P / 2;
const IDLE = { up: false, down: false, left: false, right: false, run: false, enter: false, punch: false, reload: false, shoot: false };
const TOD = { dusk: 107.5, gold: 105, evening: 110.5, night: 117.5 };
const rf = (g, s, f) => { const n = Math.round(s / STEP); for (let i = 0; i < n; i += 1) g.step(STEP, typeof f === 'function' ? f() : f); };
const drv = (g, av) => {
 const c = g.playerCar();
 if (!c) return IDLE;
 const lane = av - 25;
 let w = H;
 if (c.x < lane - 15) w -= 0.3; else if (c.x > lane + 15) w += 0.3;
 let d = w - c.angle;
 while (d > P) d -= P * 2;
 while (d < -P) d += P * 2;
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
 if (m) { m.x = x; m.y = y; m.angle = H; m.speed = 0; }
};
const sc = (g) => { const s = g.state; s.cash = 48750; s.player.health = 92; s.hurtFlash = 0; s.shake = 0; s.wantedFlash = 0; };
export function stageShot(name, g, o) {
 const s = g.state;
 o = o || {};
 const st = () => { if (o.tod && TOD[o.tod] !== undefined) s.time = TOD[o.tod]; };
 const sm = () => { if (o.cam) s.shotCam = o.cam; };
 if (name === 'drive') {
  g.reset(); sm();
  const m = g.spawnParkedCar('muscle', 1500, 300, H);
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
  if (mine) { mine.speed = 380; mine.angle = H + 0.25; s.nitrousT = 2.5; }
  RC.CIRCUITS[1].gates = [[px, py - 600], [px, py + 420], [px + 600, py + 420], [px + 600, py - 600]];
  s.race = { active: true, circuit: 1, gate: 1, lap: 2, laps: 3, reward: 800 };
  const rivals = s.cars.filter((c) => c.driver === 'race');
  rivals.forEach((c, i) => { c.x = px + (i % 2 === 0 ? -32 : 32); c.y = py + 90 + i * 80; c.angle = H; c.speed = 330; c.raceGate = 0; c.raceLap = 1; });
  const ahead = [[1475, 420, 'sedan', H], [1525, 500, 'taxi', -H], [1475, 580, 'van', H], [1525, 660, 'pickup', -H], [1475, 740, 'sedan', H], [1525, 820, 'limo', -H], [1475, 900, 'sedan', H], [1525, 980, 'taxi', -H]];
  for (const [x, y, k, a] of ahead) g.spawnParkedCar(k, px + (x - 1500), py + (y - 300), a);
  ped(g, px - 92, py + 150, '#7fb3d5');
  ped(g, px + 92, py + 260, '#d4693c');
  ped(g, px - 92, py + 380, '#f2c94c');
  ped(g, px + 92, py + 480, '#7fb3d5');
  s.nearMissStreak = 3; s.nearMissStreakT = 4;
  s.radioToast = { name: 'VICE FM 104.5', until: performance.now() + 60000 };
  s.banner = 'STREET RACE — 3 laps!';
  s.bannerTimer = 30;
  sc(g); st();
  return { screen: PL };
 }
 if (name === 'chase') {
  g.reset(); sm();
  const sp = g.spawnParkedCar('sports', 875, 200, H);
  const p = s.player;
  p.x = 875; p.y = 230;
  g.enterCar(sp);
  p.pistol = true; p.mag = PLAYER.magSize; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
  g.setWanted(10);
  rf(g, 2, IDLE);
  sp.x = 875; sp.y = 200; sp.angle = H; sp.speed = 420; sp.health = 100;
  const staged = [sp];
  for (const [x, y, v, k, a] of [[845, 275, 380, 'patrol', H], [915, 255, 360, 'patrol', H], [860, 430, 0, 'van', H + 0.45]]) { const c = g.spawnPatrolCar(k); c.x = x; c.y = y; c.angle = a; c.speed = v; staged.push(c); }
  s.cars = s.cars.filter((c) => staged.includes(c));
  s.cops = [];
  for (const [x, y] of [[810, 380], [810, 440], [795, 320]]) { const c = g.spawnFootCop(); c.x = x; c.y = y; }
  const h = s.air.heli;
  if (h) { h.x = 930; h.y = 365; h.z = 96; h.spotX = 875; h.spotY = 200; h.angle = 0.12; }
  wreck(s, 815, 230, 0.6);
  s.upgrades.glow = 1;
  s.dialogue = [];
  sc(g); st();
  return { screen: PL, wheelOpen: true, wheelSlot: 6, wheelPos: { x: 380, y: 400 } };
 }
 if (name === 'mission') {
  g.reset(); sm();
  g.startMission(9);
  s.dialogue = [...MISSIONS[9].brief];
  const m = g.spawnParkedCar('muscle', 2980, 380, H);
  const p = s.player;
  p.x = 2980; p.y = 410;
  g.enterCar(m);
  p.pistol = true; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
  s.upgrades.glow = 1;
  s.rep['Palm Heights'] = 68;
  s.rep['Lighthouse Point'] = 68;
  g.spawnParkedCar('sedan', 2700, 300, 0);
  g.spawnParkedCar('taxi', 3150, 330, P);
  g.spawnParkedCar('sports', 2850, 300, 0);
  g.spawnParkedCar('van', 3275, 430, H);
  g.spawnParkedCar('pickup', 2620, 420, H);
  g.spawnParkedCar('limo', 3300, 330, P);
  g.spawnParkedCar('sports', 2750, 220, 0.4);
  g.spawnParkedCar('sedan', 3250, 250, -0.4);
  for (const [x, y] of [[2740, 330], [3260, 330], [2700, 430], [3300, 430], [2700, 250], [3300, 260]]) g.city.palms.push({ x, y });
  ped(g, 2900, 430, '#7fb3d5');
  ped(g, 3100, 430, '#e8e2d4');
  ped(g, 2950, 700, '#c2a06a');
  ped(g, 3000, 300, '#d4693c');
  s.banner = 'MISSION 10/10: THE GRAND CASINO HEIST — $5,000';
  s.bannerTimer = 30;
  sc(g); st();
  return { screen: PL };
 }
 g.reset(); sm();
 sedan(g, 2200, 2500);
 rf(g, 8, IDLE);
 g.spawnParkedCar('taxi', 2675, 2150, H);
 g.spawnParkedCar('sedan', 2725, 2350, -H);
 g.spawnParkedCar('sports', 3275, 2400, H);
 g.spawnParkedCar('muscle', 875, 2500, 0);
 for (const [x, k] of [[1200, 'sedan'], [1500, 'taxi'], [1800, 'pickup'], [2000, 'van'], [2500, 'limo'], [2900, 'sports'], [3100, 'muscle']]) g.spawnParkedCar(k, x, 2500, 0);
 g.spawnParkedCar('sedan', 1350, 2500, 0);
 g.spawnParkedCar('taxi', 2150, 2500, 0);
 g.spawnParkedCar('sports', 2700, 2500, 0);
 for (const [x, y] of [[1700, 2560], [2900, 2560]]) g.city.palms.push({ x, y });
 ped(g, 2400, 2560, '#7fb3d5');
 ped(g, 2620, 2560, '#d4693c');
 ped(g, 1500, 2560, '#f2c94c');
 ped(g, 2000, 2560, '#7fb3d5');
 sc(g); st();
 return { screen: TI };
}
