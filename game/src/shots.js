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
const sedan = (g, x, y) => {
  const p = g.state.player;
  p.x = 830; p.y = 660;
  const c = g.nearestCar(85) || g.nearestCar(400);
  if (c) g.enterCar(c);
  const m = g.playerCar();
  if (m) { m.x = x; m.y = y; m.angle = Math.PI / 2; m.speed = 0; }
};
const sc = (g) => { const s = g.state; s.cash = 48750; s.player.health = 92; s.hurtFlash = 0; };

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
    s.cars.filter((c) => c.driver === 'race').forEach((c, i) => { c.x = px + (i % 2 === 0 ? -32 : 32); c.y = py - 140 - i * 40; c.angle = Math.PI / 2; c.speed = 330; c.raceGate = 0; c.raceLap = 1; });
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
    for (const [x, y, v] of [[925, 320, 320], [830, 380, 300], [875, 480, 280]]) { const c = g.spawnPatrolCar(); c.x = x; c.y = y; c.angle = Math.PI / 2; c.speed = v; }
    for (const [x, y] of [[820, 380], [930, 450], [820, 600]]) { const c = g.spawnFootCop(); c.x = x; c.y = y; }
    const h = s.air.heli;
    if (h) { h.x = 1020; h.y = 320; h.z = 26; h.spotX = 1000; h.spotY = 200; }
    wreck(s, 940, 420, 0.5);
    sc(g); st();
    return { screen: PL, wheelOpen: true, wheelSlot: 6, wheelPos: { x: 380, y: 400 } };
  }
  if (name === 'mission') {
    g.reset(); sm();
    g.startMission(9);
    s.dialogue = [...MISSIONS[9].brief];
    const m = g.spawnParkedCar('muscle', 3180, 2580, -2.4);
    const p = s.player;
    p.x = 3180; p.y = 2610;
    g.enterCar(m);
    p.pistol = true; p.shotgun = 5; p.rpg = 3; p.weapon = 6;
    s.upgrades.glow = 1;
    s.rep['Lighthouse Point'] = 68;
    rf(g, 0.5, IDLE);
    s.banner = 'MISSION 10/10: THE GRAND CASINO HEIST — $5,000';
    s.bannerTimer = 30;
    sc(g); st();
    return { screen: PL };
  }
  g.reset(); sm();
  sedan(g, 2200, 2500);
  rf(g, 8, IDLE);
  sc(g); st();
  return { screen: TI };
}
