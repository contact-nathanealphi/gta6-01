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
  m.color = '#ff2a1a';
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
  rivals.forEach((c, i) => { c.x = px + (i % 2 === 0 ? -32 : 32); c.y = py + 90 + i * 80; c.angle = H; c.speed = 330; c.raceGate = 0; c.raceLap = 1; c.color = ['#ffd23d', '#2f6fd0', '#ff7a2d'][i % 3]; });
  const ahead = [[1475, 420, 'sedan', H], [1525, 500, 'taxi', -H], [1475, 580, 'van', H], [1525, 660, 'pickup', -H], [1475, 740, 'sedan', H]];
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
  const sp = g.spawnParkedCar('sports', 920, 270, H);
  sp.color = '#ff2a1a';
  const p = s.player;
  p.x = 875; p.y = 250;
  p.pistol = true; p.mag = PLAYER.magSize; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
  g.setWanted(10);
  rf(g, 2, IDLE);
  p.x = 875; p.y = 250; p.angle = 0;
  const staged = [sp];
  for (const [x, y, v, k, a] of [[845, 320, 0, 'patrol', H], [915, 300, 0, 'patrol', H], [860, 470, 0, 'van', H + 0.45]]) { const c = g.spawnPatrolCar(k); c.x = x; c.y = y; c.angle = a; c.speed = v; staged.push(c); }
  s.cars = s.cars.filter((c) => staged.includes(c));
  s.cops = [];
  for (const [x, y] of [[810, 380], [810, 440], [795, 320], [940, 380]]) { const c = g.spawnFootCop(); c.x = x; c.y = y; }
  const h = s.air.heli;
  if (h) { h.x = 960; h.y = 360; h.z = 55; h.spotX = 875; h.spotY = 250; h.angle = -0.4; }
  wreck(s, 980, 230, 0.6);
  for (const [x, y, col, sz] of [[980, 230, '#ff7a2d', 10], [995, 220, '#ffd23d', 8], [970, 245, '#ff3b1f', 9]]) s.particles.push({ x, y, vx: 0, vy: -20, life: 0.5, maxLife: 0.5, color: col, size: sz });
  s.upgrades.glow = 1;
  s.dialogue = ['NBPD Dispatch: SWAT converging on your position!'];
  sc(g); st();
  return { screen: PL, wheelOpen: true, wheelSlot: 6, wheelPos: { x: 320, y: 400 } };
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
 const sp = g.spawnParkedCar('sports', 1500, 1800, 0);
 sp.color = '#ff2a1a';
 const p = s.player;
 p.x = 1500; p.y = 1800;
 g.enterCar(sp);
 sp.speed = 420;
 p.pistol = true; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
 g.setWanted(10);
 rf(g, 2, IDLE);
 sp.x = 1500; sp.y = 1800; sp.angle = 0; sp.speed = 420;
 const staged = [sp];
 for (const [x, y, a] of [[1740, 1772, 0], [1790, 1828, 0], [1660, 1770, 0]]) { const c = g.spawnPatrolCar('patrol'); c.x = x; c.y = y; c.angle = a; c.speed = 380; staged.push(c); }
 s.cars = s.cars.filter((c) => staged.includes(c));
 s.cops = [];
 for (const [x, y] of [[1560, 1900], [1620, 1700]]) { const c = g.spawnFootCop(); c.x = x; c.y = y; }
 const h = s.air.heli;
 if (h) { h.x = 1700; h.y = 1880; h.z = 100; h.spotX = 1500; h.spotY = 1800; h.angle = 0.5; }
 wreck(s, 1650, 1835, 0.6);
 s.upgrades.glow = 1;
 s.dialogue = ['Fixer: Five stars, Viper. Lose them before the meet — or make it loud.'];
 ped(g, 1560, 1700, '#7fb3d5');
 ped(g, 1700, 1900, '#d4693c');
 sc(g); st();
 return { screen: PL };
}
