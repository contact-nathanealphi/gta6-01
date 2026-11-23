// Screenshot scenes behind ?shot=start|drive|chase|mission — scripted play, same seed, same frame.

import { PLAYER, STEP } from './tune.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const IDLE = { up: false, down: false, left: false, right: false, run: false, enter: false, punch: false, reload: false, shoot: false };

function runFor(game, seconds, inputFor) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    game.step(STEP, typeof inputFor === 'function' ? inputFor() : inputFor);
  }
}

function driveSouthOn(game, avenue) {
  const car = game.playerCar();
  if (!car) return IDLE;
  const lane = avenue - 25;
  let want = Math.PI / 2;
  if (car.x < lane - 15) want -= 0.3;
  else if (car.x > lane + 15) want += 0.3;
  let diff = want - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return { ...IDLE, up: true, left: diff < -0.08, right: diff > 0.08 };
}

function putPlayerInSedan(game, x, y) {
  const p = game.state.player;
  p.x = 830;
  p.y = 660;
  const car = game.nearestCar(85);
  if (car) game.enterCar(car);
  const mine = game.playerCar();
  if (mine) {
    mine.x = x;
    mine.y = y;
    mine.angle = Math.PI / 2;
    mine.speed = 0;
  }
}

export function stageShot(name, game) {
  const state = game.state;
  if (name === 'drive') {
    game.reset();
    const sedan = game.spawnParkedCar('sedan', 1500, 300, Math.PI / 2);
    const p = state.player;
    p.x = 1500;
    p.y = 330;
    game.enterCar(sedan);
    sedan.speed = 300;
    runFor(game, 5, () => driveSouthOn(game, 1500));
    return { screen: SCREEN_PLAY };
  }
  if (name === 'chase') {
    game.reset();
    const sports = game.spawnParkedCar('sports', 900, 200, Math.PI / 2);
    const p = state.player;
    p.x = 900;
    p.y = 230;
    game.enterCar(sports);
    sports.speed = 350;
    game.setWanted(6);
    const p1 = game.spawnPatrolCar();
    p1.x = 878; p1.y = 120; p1.angle = Math.PI / 2; p1.speed = 250;
    const p2 = game.spawnPatrolCar();
    p2.x = 922; p2.y = 170; p2.angle = Math.PI / 2; p2.speed = 230;
    const p3 = game.spawnPatrolCar();
    p3.x = 950; p3.y = 300; p3.angle = Math.PI / 2; p3.speed = 220;
    game.spawnFootCop();
    game.spawnFootCop();
    game.spawnFootCop();
    runFor(game, 2.5, () => driveSouthOn(game, 900));
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    game.reset();
    game.startMission(3);
    const p = state.player;
    p.x = 2400;
    p.y = 2200;
    runFor(game, 0.5, IDLE);
    p.x = 2330;
    p.y = 2290;
    p.pistol = true;
    p.mag = PLAYER.magSize;
    runFor(game, 1.5, () => {
      let target = null;
      let best = Infinity;
      for (const rival of state.rivals) {
        const d = Math.hypot(rival.x - p.x, rival.y - p.y);
        if (d < best) { best = d; target = rival; }
      }
      if (!target) return IDLE;
      return { ...IDLE, shoot: true, aimX: target.x, aimY: target.y };
    });
    state.hurtFlash = 0;
    if (state.player.health < 35) state.player.health = 35;
    return { screen: SCREEN_PLAY };
  }
  game.reset();
  putPlayerInSedan(game, 900, 700);
  runFor(game, 8, IDLE);
  return { screen: SCREEN_TITLE };
}
