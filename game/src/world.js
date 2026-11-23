// Neon Bay — rules and state: player, traffic, police, wanted, missions, combat.

import { AVENUES, CAR_KINDS, COPS, PALETTE, PED_COUNT, PLAYER, RIVAL, STREETS, TRAFFIC_COUNT, WANTED, WORLD } from './tune.js';
import { buildCity, lineBlocked, randomRoadPoint, randomSidewalkPoint, resolveBuildings } from './city.js';

export const EVENT_BUSTED = 1;
export const EVENT_WASTED = 2;
export const EVENT_MISSION = 4;
export const EVENT_STORY = 8;

export const MISSIONS = [
  {
    title: 'First Delivery',
    giver: "Mama Rosa",
    brief: ["Rico, welcome back. The docks don't pay like they used to.",
      'Take this package from my diner to Bayfront Mall. No questions, no stops.'],
    stages: [
      { kind: 'go', x: 870, y: 550, label: "Pick up the package at Mama Rosa's" },
      { kind: 'go', x: 1470, y: 1550, label: 'Deliver the package to Bayfront Mall' },
    ],
    reward: 150,
    quip: 'Fast, but you made it. Good.',
  },
  {
    title: 'A Quiet Word',
    giver: "Mama Rosa",
    brief: ['The Harbor Boys lean on my suppliers. A word, they said.',
      'Pick up the pistol at your garage, then have that word with their lookouts by the mall.'],
    stages: [
      { kind: 'go', x: 870, y: 1550, label: "Pick up the pistol at Rico's Garage" },
      { kind: 'kill', count: 3, at: [{ x: 1300, y: 1450 }, { x: 1380, y: 1620 }, { x: 1240, y: 1680 }], label: 'Deal with the 3 Harbor Boys lookouts' },
    ],
    reward: 250,
    quip: 'Three lookouts, one word.',
  },
  {
    title: 'The Golden Comet',
    giver: 'Mama Rosa',
    brief: ['A Golden Comet sits in the mall lot. Its owner owes me. A lot.',
      'Take it. Bring it to your garage. Parked cars do not argue.'],
    stages: [
      { kind: 'steal', carKind: 'sports', x: 1350, y: 1650, label: 'Steal the Golden Comet from the mall lot' },
      { kind: 'deliver', x: 870, y: 1550, label: "Bring the Comet to Rico's Garage" },
    ],
    reward: 400,
    quip: 'A sports car, Rico? You always liked the fast ones.',
  },
  {
    title: 'Dockside Trouble',
    giver: 'Mama Rosa',
    brief: ['The Harbor Boys took my shipment at the port. Five of them, armed.',
      'Go to the docks. Bring my crates back — or make them regret it.'],
    stages: [
      { kind: 'go', x: 2400, y: 2270, label: 'Reach the Port of Neon Bay' },
      { kind: 'kill', count: 5, at: [{ x: 2350, y: 2200 }, { x: 2450, y: 2180 }, { x: 2520, y: 2260 }, { x: 2300, y: 2300 }, { x: 2470, y: 2330 }], label: 'Clear the 5 Harbor Boys at the docks' },
    ],
    reward: 600,
    quip: 'Five of them, and you walked out.',
  },
  {
    title: 'Shake the Heat',
    giver: 'Mama Rosa',
    brief: ['The NBPD saw your face at the docks. Three stars, Rico.',
      'Survive the chase, then come home. Do not lead them here.'],
    stages: [
      { kind: 'survive', seconds: 30, label: 'Survive the police chase — 30 seconds' },
      { kind: 'go', x: 870, y: 550, label: "Get back to Mama Rosa's Diner" },
    ],
    reward: 750,
    quip: 'Three stars, and you are still here.',
  },
  {
    title: 'The Big Score',
    giver: 'Mama Rosa',
    brief: ['One crate at the port. Rosa gold — enough to buy the docks.',
      'Grab it and run for the garage. The whole NBPD will be on you.'],
    stages: [
      { kind: 'go', x: 2400, y: 2270, label: 'Reach the port docks' },
      { kind: 'carry', x: 870, y: 1550, label: "Carry the crate to Rico's Garage" },
    ],
    reward: 2500,
    quip: 'The crate is ours. The NBPD is furious.',
  },
  {
    title: 'The Getaway',
    giver: 'Mama Rosa',
    brief: ['The crate is ours — but the NBPD locked the city down. Four stars.',
      'Shake the chase, then run for the beach. A boat waits at the south shore.'],
    stages: [
      { kind: 'survive', seconds: 20, label: 'Survive the lockdown chase — 20 seconds' },
      { kind: 'go', x: 1800, y: 2560, label: 'Reach the boat at the south beach' },
    ],
    reward: 1000,
    quip: 'Neon Bay is yours, Rico. Go.',
  },
];

let nextCarId = 1;

export function createGame(rng) {
  const city = buildCity(rng);
  function freshState() {
    return { time: 105.8, cash: 120, wantedPoints: 0, wanted: 0, lastCrime: -999, cars: [], peds: [], cops: [], rivals: [], pickups: [], bullets: [], particles: [], skids: [], missionIndex: 0, stageIndex: 0, missionActive: false, stageTimer: 0, hasCrate: false, targetCarId: 0, rivalsLeft: 0, objective: null, banner: null, bannerTimer: 0, dialogue: [], dialogueTimer: 0, storyDone: false, roadblockCd: 0, nearMissCd: 0, nearMissStreak: 0, nearMissStreakT: 0, courier: null, courierCd: 20, fare: null, fareCd: 15, floaters: [], skidSound: false, skidCd: 0 };
  }
  const state = { ...freshState(), player: null, muted: false, shotFired: false, shotSound: false, punchSound: false, pickupSound: false, cashSound: false, crashLoud: false, sirenOn: false, shake: 0, wantedFlash: 0, hurtFlash: 0 };

  function newPlayer(x, y) {
    return {
      x, y, angle: -Math.PI / 2, speed: 0, onFoot: true, carId: 0, radius: PLAYER.radius,
      health: PLAYER.health, pistol: false, mag: 0, shotgun: 0, armor: 0, punchCd: 0, shootCd: 0, reloadT: 0, invuln: 0,
      aimX: x, aimY: y - 100,
    };
  }

  function newCar(kind, x, y, angle, driver) {
    const spec = CAR_KINDS[kind];
    const car = {
      id: nextCarId, kind, x, y, angle, speed: 0, color: spec.color,
      driver, health: 100, smoked: false, radius: 22,
      road: null, line: 0, dir: 1, targetSpeed: 0, turnCd: 0, deployT: 0,
    };
    nextCarId += 1;
    return car;
  }

  function spawnTrafficCar(near) {
    const point = randomRoadPoint(rng, near, 500);
    const vertical = Math.abs(point.x - AVENUES[0]) < 40 || rng.chance(0.5);
    const car = newCar(rng.pick(['sedan', 'sedan', 'taxi', 'van', 'pickup', 'muscle', 'limo']), point.x, point.y, 0, 'traffic');
    if (vertical) {
      car.road = 'v';
      car.line = AVENUES.reduce((best, ax) => (Math.abs(ax - point.x) < Math.abs(best - point.x) ? ax : best), AVENUES[0]);
      car.dir = rng.chance(0.5) ? 1 : -1;
      car.angle = car.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      car.x = car.line + (car.dir === 1 ? -25 : 25);
    } else {
      car.road = 'h';
      car.line = STREETS.reduce((best, sy) => (Math.abs(sy - point.y) < Math.abs(best - point.y) ? sy : best), STREETS[0]);
      car.dir = rng.chance(0.5) ? 1 : -1;
      car.angle = car.dir === 1 ? 0 : Math.PI;
      car.y = car.line + (car.dir === 1 ? 25 : -25);
    }
    car.speed = car.targetSpeed = rng.range(160, 250);
    state.cars.push(car);
    return car;
  }

  function spawnParkedCar(kind, x, y, angle) {
    const car = newCar(kind, x, y, angle, 'parked');
    state.cars.push(car);
    return car;
  }

  function spawnPed() {
    const point = randomSidewalkPoint(rng);
    const ped = {
      x: point.x, y: point.y, angle: rng.range(0, Math.PI * 2), speed: 0,
      target: randomSidewalkPoint(rng), down: 0, scared: 0, fleeX: 0, fleeY: 0, radius: 12,
      shirt: rng.pick(['#e8e2d4', '#7fb3d5', '#d4693c', '#9cc3d8', '#c2a06a', '#8a4d9e', '#4d7d5a', '#e8b4b8', '#5a6b7d', '#f2c94c']),
      jogger: rng.chance(0.15),
    };
    ped.speed = ped.jogger ? rng.range(130, 170) : rng.range(55, 95);
    state.peds.push(ped);
    return ped;
  }

  function spawnFootCop() {
    const point = randomRoadPoint(rng, state.player, 420);
    const cop = { x: point.x, y: point.y, angle: 0, speed: COPS.footSpeed, arrest: 0, health: COPS.footHealth, radius: 13 };
    state.cops.push(cop);
    return cop;
  }

  function spawnPatrolCar() {
    const point = randomRoadPoint(rng, state.player, 550);
    const car = newCar('patrol', point.x, point.y, 0, 'police');
    car.angle = Math.atan2(state.player.y - point.y, state.player.x - point.x);
    car.targetSpeed = COPS.carChaseSpeed;
    state.cars.push(car);
    return car;
  }

  function spawnRival(x, y) {
    const rival = { x, y, angle: 0, health: RIVAL.health, shootT: rng.range(0.3, 0.9), radius: 13, speed: 90 };
    state.rivals.push(rival);
    return rival;
  }

  function spawnPickup(kind, x, y, amount) {
    state.pickups.push({ x, y, kind, amount, bob: rng.range(0, Math.PI * 2) });
  }

  function addWanted(points) {
    state.wantedPoints = Math.min(WANTED.maxPoints, state.wantedPoints + points);
    state.lastCrime = state.time;
    const level = Math.min(5, Math.floor(state.wantedPoints / 2));
    if (level > state.wanted) {
      state.wanted = level;
      state.wantedFlash = 1.2;
    }
  }

  function floatText(x, y, label, color) {
    if (state.floaters.length >= 12) return;
    state.floaters.push({ x, y, label, color, life: 1.1, maxLife: 1.1 });
  }

  function updateFloaters(dt) {
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.y -= 42 * dt;
      f.life -= dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      if (state.particles.length >= 500) return;
      const a = rng.range(0, Math.PI * 2);
      const v = rng.range(speed * 0.4, speed);
      state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rng.range(0.25, 0.6), maxLife: 0.6, color, size: rng.range(2, 5) });
    }
  }

  function keepObjective() { if (!state.missionActive) state.objective = null; }

  function reset() {
    Object.assign(state, freshState());
    state.player = newPlayer(870, 640);
    spawnParkedCar('sedan', 830, 700, Math.PI / 2);
    spawnParkedCar('taxi', 950, 700, Math.PI / 2);
    spawnParkedCar('muscle', 3250, 350, 0);
    spawnParkedCar('limo', 1450, 1250, Math.PI);
    for (let i = 0; i < TRAFFIC_COUNT; i += 1) spawnTrafficCar(state.player);
    for (let i = 0; i < PED_COUNT; i += 1) spawnPed();
    for (let i = 0; i < 6; i += 1) {
      const p = randomSidewalkPoint(rng);
      spawnPickup('cash', p.x, p.y, rng.int(30, 90));
    }
    spawnPickup('health', 1440, 620, 40);
    spawnPickup('health', 900, 1620, 40);
    spawnPickup('ammo', 800, 1500, 24);
    spawnPickup('ammo', 1560, 1600, 24);
    spawnPickup('shotgun', 2380, 2240, 6);
    spawnPickup('shotgun', 2150, 1350, 6);
    spawnPickup('armor', 1500, 350, 20);
    spawnPickup('armor', 850, 1600, 20);
    spawnPickup('repair', 800, 1550, 50);
    spawnPickup('repair', 2450, 2250, 50);
    startMission(0);
  }

  function startMission(index) {
    const mission = MISSIONS[index];
    if (!mission) return;
    state.missionIndex = index;
    state.stageIndex = 0;
    state.missionActive = true;
    state.dialogue = [...state.dialogue, ...mission.brief];
    state.dialogueTimer = 0;
    showBanner(`${mission.title} — ${mission.giver}`, 3);
    setupStage();
  }

  function setupStage() {
    const mission = MISSIONS[state.missionIndex];
    const stage = mission.stages[state.stageIndex];
    state.rivalsLeft = 0;
    if (stage.kind === 'kill') {
      for (const spot of stage.at) spawnRival(spot.x, spot.y);
      state.rivalsLeft = stage.count;
      state.objective = { x: stage.at[0].x, y: stage.at[0].y, label: stage.label };
    } else if (stage.kind === 'steal') {
      const car = spawnParkedCar(stage.carKind, stage.x, stage.y, Math.PI / 2);
      state.targetCarId = car.id;
      state.objective = { x: stage.x, y: stage.y, label: stage.label };
    } else if (stage.kind === 'survive') {
      state.stageTimer = stage.seconds;
      state.wantedPoints = 6;
      state.wanted = 3;
      state.lastCrime = state.time;
      state.objective = { x: state.player.x, y: state.player.y, label: stage.label };
    } else if (stage.kind === 'carry') {
      spawnPickup('crate', 2400, 2270, 0);
      state.objective = { x: 2400, y: 2270, label: 'Grab the crate at the port' };
    } else {
      state.objective = { x: stage.x, y: stage.y, label: stage.label };
    }
  }

  function showBanner(text, seconds) {
    state.banner = text;
    state.bannerTimer = seconds;
  }

  function completeStage() {
    const mission = MISSIONS[state.missionIndex];
    state.stageIndex += 1;
    if (state.missionIndex === 1 && state.stageIndex === 1 && !state.player.pistol) {
      state.player.pistol = true;
      state.player.mag = PLAYER.magSize;
      showBanner('Pistol acquired — click to shoot, F to punch', 3);
    }
    if (state.stageIndex >= mission.stages.length) {
      state.cash += mission.reward;
      floatText(state.player.x, state.player.y - 30, `+$${mission.reward}`, PALETTE.gold);
      state.missionActive = false;
      state.objective = null;
      showBanner(`Mission complete — ${mission.title}  +$${mission.reward}`, 3.5);
      if (mission.quip) state.dialogue.push(`${mission.giver}: ${mission.quip}`);
      if (state.missionIndex + 1 >= MISSIONS.length) {
        state.storyDone = true;
        return EVENT_MISSION | EVENT_STORY;
      }
      startMission(state.missionIndex + 1);
      return EVENT_MISSION;
    }
    setupStage();
    return 0;
  }

  function nearestCar(maxDist) {
    const p = state.player;
    let best = null;
    let bestDist = maxDist;
    for (const car of state.cars) {
      if (car.driver === 'player') continue;
      const d = Math.hypot(car.x - p.x, car.y - p.y);
      if (d < bestDist) { bestDist = d; best = car; }
    }
    return best;
  }

  function enterCar(car) {
    const p = state.player;
    if (car.driver === 'traffic') {
      const driver = { x: car.x, y: car.y, angle: 0, speed: 0, target: randomSidewalkPoint(rng), down: 0, scared: 3, fleeX: p.x, fleeY: p.y, radius: 12, shirt: '#d8d2c2' };
      state.peds.push(driver);
      addWanted(WANTED.stealOccupied);
    } else if (car.driver === 'police') {
      addWanted(WANTED.stealOccupied);
    }
    car.driver = 'player';
    car.speed = 0;
    p.onFoot = false;
    p.carId = car.id;
    p.x = car.x;
    p.y = car.y;
    return 0;
  }

  function exitCar() {
    const p = state.player;
    const car = state.cars.find((c) => c.id === p.carId);
    if (!car) return;
    car.driver = 'parked';
    car.speed = 0;
    const sideX = Math.cos(car.angle + Math.PI / 2);
    const sideY = Math.sin(car.angle + Math.PI / 2);
    p.x = car.x + sideX * 34;
    p.y = car.y + sideY * 34;
    p.onFoot = true;
    p.carId = 0;
    p.angle = car.angle;
  }

  function playerCar() {
    return state.cars.find((c) => c.id === state.player.carId) || null;
  }

  function step(dt, input) {
    let events = 0;
    state.time += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
    if (state.wantedFlash > 0) state.wantedFlash = Math.max(0, state.wantedFlash - dt);
    if (state.hurtFlash > 0) state.hurtFlash = Math.max(0, state.hurtFlash - dt * 2.5);
    if (state.skidCd > 0) state.skidCd = Math.max(0, state.skidCd - dt);
    if (state.nearMissCd > 0) state.nearMissCd -= dt;
    if (state.nearMissStreakT > 0) {
      state.nearMissStreakT -= dt;
      if (state.nearMissStreakT <= 0) state.nearMissStreak = 0;
    }
    if (state.bannerTimer > 0) state.bannerTimer -= dt;
    if (state.dialogue.length > 0) {
      state.dialogueTimer += dt;
      if (state.dialogueTimer > 2.6) {
        state.dialogue.shift();
        state.dialogueTimer = 0;
      }
    }
    const p = state.player;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.armor > 0) p.armor = Math.max(0, p.armor - dt);
    if (p.punchCd > 0) p.punchCd -= dt;
    if (p.shootCd > 0) p.shootCd -= dt;
    if (p.reloadT > 0) {
      p.reloadT -= dt;
      if (p.reloadT <= 0 && p.pistol) p.mag = PLAYER.magSize;
    }

    if (input.enter) {
      if (p.onFoot) {
        const car = nearestCar(85);
        if (car) events |= enterCar(car);
      } else {
        exitCar();
      }
    }

    if (p.onFoot) events |= updateOnFoot(dt, input);
    else events |= updateDriving(dt, input);

    updateTraffic(dt);
    updatePeds(dt);
    events |= updateCops(dt);
    events |= updateRivals(dt);
    updateBullets(dt);
    if (state.wastedFlag) {
      state.wastedFlag = false;
      events |= EVENT_WASTED;
    }
    updatePickups(dt);
    updateCourier(dt);
    updateFare(dt);
    updateParticles(dt);
    updateFloaters(dt);
    events |= updateWanted(dt);
    events |= updateMissions(dt);
    maintainCrowd();
    state.sirenOn = state.wanted > 0 && (state.cops.length > 0 || state.cars.some((c) => c.driver === 'police'));
    return events;
  }

  function updateOnFoot(dt, input) {
    const p = state.player;
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len;
      my /= len;
      const s = input.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
      p.x += mx * s * dt;
      p.y += my * s * dt;
      p.angle = Math.atan2(my, mx);
    }
    p.x = Math.max(20, Math.min(WORLD.width - 20, p.x));
    p.y = Math.max(20, Math.min(WORLD.height - 20, p.y));
    const body = { x: p.x, y: p.y, radius: PLAYER.radius };
    resolveBuildings(city.buildings, body);
    p.x = body.x;
    p.y = body.y;
    if (input.aimX !== undefined) {
      p.aimX = input.aimX;
      p.aimY = input.aimY;
      if (p.pistol && len === 0) p.angle = Math.atan2(p.aimY - p.y, p.aimX - p.x);
    }
    let events = 0;
    if (input.punch && p.punchCd <= 0) {
      p.punchCd = 0.35;
      state.punchSound = true;
      events |= punch();
    }
    if (input.shoot && p.shootCd <= 0 && p.reloadT <= 0) {
      if (p.shotgun > 0) {
        p.shootCd = 0.7;
        p.shotgun -= 1;
        for (let i = -2; i <= 2; i += 1) {
          const a = Math.atan2(p.aimY - p.y, p.aimX - p.x) + i * 0.07;
          state.bullets.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24, vx: Math.cos(a) * 800, vy: Math.sin(a) * 800, life: 0.5, from: 'player', damage: 12 });
        }
        const ma = Math.atan2(p.aimY - p.y, p.aimX - p.x);
        burst(p.x + Math.cos(ma) * 26, p.y + Math.sin(ma) * 26, '#ffe9a3', 7, 180);
        state.shotFired = true;
        state.shotSound = true;
      } else if (p.pistol && p.mag > 0) {
        p.shootCd = 0.2;
        p.mag -= 1;
        fireBullet(p.x, p.y, p.aimX, p.aimY, 'player', PLAYER.pistolDamage, 950);
        const ma = Math.atan2(p.aimY - p.y, p.aimX - p.x);
        burst(p.x + Math.cos(ma) * 26, p.y + Math.sin(ma) * 26, '#ffe9a3', 4, 140);
        state.shotFired = true;
        state.shotSound = true;
      }
    }
    if (input.reload && p.pistol && p.mag < PLAYER.magSize && p.reloadT <= 0) p.reloadT = 0.9;
    return events;
  }

  function punch() {
    const p = state.player;
    const tryHit = (target, damage, isCrime) => {
      const d = Math.hypot(target.x - p.x, target.y - p.y);
      if (d > PLAYER.punchRange + target.radius) return false;
      const ang = Math.atan2(target.y - p.y, target.x - p.x);
      let diff = Math.abs(ang - p.angle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > 1.1) return false;
      target.health -= damage;
      target.x += Math.cos(ang) * 12.8;
      target.y += Math.sin(ang) * 12.8;
      burst(target.x, target.y, '#e8e2d4', 5, 120);
      if (isCrime) addWanted(1);
      return true;
    };
    for (const rival of state.rivals) tryHit(rival, PLAYER.punchDamage, false);
    for (const cop of state.cops) tryHit(cop, PLAYER.punchDamage, true);
    for (const ped of state.peds) {
      if (ped.down > 0) continue;
      if (tryHit(ped, 100, true)) {
        ped.down = 2;
        ped.scared = 3;
        floatText(ped.x, ped.y - 24, rng.pick(['Hey!', 'Watch it!', 'Help!', 'My car!']), '#ffffff');
      }
    }
    return 0;
  }

  function fireBullet(x, y, tx, ty, from, damage, speed) {
    if (state.bullets.length >= 60) return;
    const ang = Math.atan2(ty - y, tx - x);
    const spread = from === 'player' ? 0.015 : 0.12;
    const a = ang + (rng.next() - 0.5) * spread * 2;
    state.bullets.push({ x: x + Math.cos(a) * 24, y: y + Math.sin(a) * 24, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.9, from, damage });
  }

  function updateDriving(dt, input) {
    const p = state.player;
    const car = playerCar();
    if (!car) {
      p.onFoot = true;
      return 0;
    }
    const spec = CAR_KINDS[car.kind];
    const throttle = (input.up ? 1 : 0) - (input.down ? 0.65 : 0);
    if (throttle > 0) car.speed += spec.accel * throttle * dt;
    else if (throttle < 0) car.speed += spec.accel * throttle * dt * 1.4;
    else car.speed -= car.speed * 0.9 * dt;
    if (throttle > 0 && Math.abs(car.speed) > 120 && rng.chance(0.12)) {
      const bx = car.x - Math.cos(car.angle) * (spec.length / 2);
      const by = car.y - Math.sin(car.angle) * (spec.length / 2);
      state.particles.push({ x: bx, y: by, vx: -Math.cos(car.angle) * 40, vy: -Math.sin(car.angle) * 40, life: 0.5, maxLife: 0.5, color: '#9a9a9a', size: 3 });
    }
    if (car.health < 40 && !car.smoked && rng.chance(0.25)) {
      const fx = car.x + Math.cos(car.angle) * (spec.length / 2);
      const fy = car.y + Math.sin(car.angle) * (spec.length / 2);
      state.particles.push({ x: fx, y: fy, vx: 0, vy: -30, life: 0.7, maxLife: 0.7, color: '#666666', size: 4 });
    }
    car.speed -= car.speed * 0.12 * dt;
    car.speed = Math.max(-spec.topSpeed * 0.4, Math.min(spec.topSpeed, car.speed));
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const grip = Math.min(1, Math.abs(car.speed) / 220);
    car.angle += steer * spec.turn * grip * dt * (car.speed >= 0 ? 1 : -1);
    if (steer !== 0 && Math.abs(car.speed) > 260) {
      const fx = Math.cos(car.angle);
      const fy = Math.sin(car.angle);
      const px = -fy;
      const py = fx;
      const bx = car.x - fx * (spec.length / 2 - 4);
      const by = car.y - fy * (spec.length / 2 - 4);
      for (const side of [-1, 1]) {
        state.skids.push({ x: bx + px * side * (spec.width / 2 - 3), y: by + py * side * (spec.width / 2 - 3), angle: car.angle, life: 4 });
      }
      if (state.skids.length > 400) state.skids.splice(0, state.skids.length - 400);
      if (car.driver === 'player' && state.skidCd <= 0) {
        state.skidSound = true;
        state.skidCd = 0.8;
      }
    }
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    const before = Math.abs(car.speed);
    const body = { x: nx, y: ny, radius: 20 };
    if (resolveBuildings(city.buildings, body)) {
      if (before > 240) {
        car.health -= (before - 240) / 12;
        burst(body.x, body.y, '#ffd23d', 10, 260);
        state.crashLoud = true;
        if (car.driver === 'player') state.shake = 12;
      }
      car.speed *= 0.35;
    }
    car.x = Math.max(24, Math.min(WORLD.width - 24, body.x));
    car.y = Math.max(24, Math.min(WORLD.height - 24, body.y));
    for (const other of state.cars) {
      if (other === car) continue;
      const d = Math.hypot(other.x - car.x, other.y - car.y);
      if (d < 44 && d > 0.01) {
        const overlap = 44 - d;
        const ux = (car.x - other.x) / d;
        const uy = (car.y - other.y) / d;
        car.x += ux * overlap * 0.25;
        car.y += uy * overlap * 0.25;
        other.x -= ux * overlap * 0.75;
        other.y -= uy * overlap * 0.75;
        if (Math.abs(car.speed) > 200) {
          other.speed = car.speed * 0.4;
          car.speed *= 0.7;
          burst(car.x, car.y, '#ffd23d', 6, 200);
        }
      } else if (car.driver === 'player' && other.driver === 'traffic' && d < 75 && Math.abs(car.speed) > 300 && state.nearMissCd <= 0) {
        state.nearMissCd = 2;
        if (state.nearMissStreakT > 0) state.nearMissStreak += 1;
        else state.nearMissStreak = 1;
        state.nearMissStreakT = 5;
        const bonus = Math.min(30, 5 + state.nearMissStreak * 5);
        state.cash += bonus;
        floatText(car.x, car.y - 30, `+$${bonus}`, '#57d977');
        showBanner(state.nearMissStreak > 1 ? `Near miss x${state.nearMissStreak}!  +$${bonus}` : `Near miss!  +$${bonus}`, 1.2);
      }
    }
    for (const ped of state.peds) {
      if (ped.down > 0) continue;
      if (Math.hypot(ped.x - car.x, ped.y - car.y) < 34 && Math.abs(car.speed) > 60) {
        ped.down = 2.2;
        ped.scared = 4;
        car.speed *= 0.85;
        addWanted(WANTED.hitPed);
        burst(ped.x, ped.y, '#c94f43', 8, 160);
        floatText(ped.x, ped.y - 24, rng.pick(['Ouch!', 'My leg!', 'Call the cops!']), '#ffffff');
      }
    }
    if (car.health <= 0 && !car.smoked) {
      car.smoked = true;
      car.speed = 0;
      burst(car.x, car.y, '#888888', 16, 260);
      burst(car.x, car.y, '#ffd23d', 10, 300);
      burst(car.x, car.y, '#ff5a3c', 8, 200);
      state.shake = Math.max(state.shake, 8);
      showBanner('Your car is wrecked — find another ride', 2.5);
    }
    p.x = car.x;
    p.y = car.y;
    p.angle = car.angle;
    p.aimX = car.x + Math.cos(car.angle) * 120;
    p.aimY = car.y + Math.sin(car.angle) * 120;
    return 0;
  }

  function updateTraffic(dt) {
    const p = state.player;
    for (const car of state.cars) {
      if (car.driver !== 'traffic') continue;
      car.turnCd -= dt;
      let follow = null;
      let followDist = 110;
      for (const other of state.cars) {
        if (other === car || other.road !== car.road || other.line !== car.line || other.dir !== car.dir) continue;
        const ahead = car.road === 'v' ? (other.y - car.y) * car.dir : (other.x - car.x) * car.dir;
        if (ahead > 0 && ahead < followDist) { followDist = ahead; follow = other; }
      }
      const target = follow ? Math.max(0, follow.speed * 0.85) : car.targetSpeed;
      car.speed += Math.max(-260 * dt, Math.min(260 * dt, target - car.speed));
      const move = car.speed * dt;
      if (car.road === 'v') car.y += move * car.dir;
      else car.x += move * car.dir;
      if (car.turnCd <= 0) {
        if (car.road === 'v') {
          for (const sy of STREETS) {
            if (Math.abs(car.y - sy) < 34 && rng.chance(0.3)) {
              car.road = 'h';
              car.line = sy;
              car.dir = rng.chance(0.5) ? 1 : -1;
              car.angle = car.dir === 1 ? 0 : Math.PI;
              car.y = sy + (car.dir === 1 ? 25 : -25);
              car.turnCd = 4;
              break;
            }
          }
        } else {
          for (const ax of AVENUES) {
            if (Math.abs(car.x - ax) < 34 && rng.chance(0.3)) {
              car.road = 'v';
              car.line = ax;
              car.dir = rng.chance(0.5) ? 1 : -1;
              car.angle = car.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
              car.x = ax + (car.dir === 1 ? -25 : 25);
              car.turnCd = 4;
              break;
            }
          }
        }
      }
      if (car.x < 120 || car.x > WORLD.width - 120 || car.y < 120 || car.y > WORLD.height - 120) car.dir *= -1;
      if (car.road === 'v') car.angle = car.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      else car.angle = car.dir === 1 ? 0 : Math.PI;
      car.x = Math.max(40, Math.min(WORLD.width - 40, car.x));
      car.y = Math.max(40, Math.min(WORLD.height - 40, car.y));
    }
    for (let i = state.cars.length - 1; i >= 0; i -= 1) {
      const car = state.cars[i];
      if (car.driver === 'traffic' && Math.hypot(car.x - p.x, car.y - p.y) > 1400) {
        state.cars.splice(i, 1);
        spawnTrafficCar(p);
      }
    }
  }

  function updatePeds(dt) {
    const p = state.player;
    for (const ped of state.peds) {
      if (ped.down > 0) {
        ped.down -= dt;
        continue;
      }
      let tx = ped.target.x;
      let ty = ped.target.y;
      let speed = ped.speed;
      if (ped.scared > 0) {
        ped.scared -= dt;
        tx = ped.x + (ped.x - ped.fleeX);
        ty = ped.y + (ped.y - ped.fleeY);
        speed = 220;
      }
      const dx = tx - ped.x;
      const dy = ty - ped.y;
      const d = Math.hypot(dx, dy);
      if (d < 24) {
        ped.target = randomSidewalkPoint(rng);
        continue;
      }
      ped.angle = Math.atan2(dy, dx);
      ped.x += (dx / d) * speed * dt;
      ped.y += (dy / d) * speed * dt;
      const body = { x: ped.x, y: ped.y, radius: ped.radius };
      resolveBuildings(city.buildings, body);
      ped.x = body.x;
      ped.y = body.y;
      if (state.shotFired && Math.hypot(ped.x - p.x, ped.y - p.y) < 320) {
        ped.scared = 2.5;
        ped.fleeX = p.x;
        ped.fleeY = p.y;
      }
    }
    state.shotFired = false;
  }

  function updateCops(dt) {
    const p = state.player;
    let events = 0;
    const wantFoot = state.wanted >= 1 ? Math.min(2 + state.wanted, 5) : 0;
    const wantCars = state.wanted >= 2 ? Math.min(state.wanted, 3) : 0;
    if (state.cops.length < wantFoot && rng.chance(0.02)) spawnFootCop();
    const patrols = state.cars.filter((c) => c.driver === 'police').length;
    if (patrols < wantCars && rng.chance(0.015)) spawnPatrolCar();
    if (state.wanted >= 4) {
      state.roadblockCd -= dt;
      if (state.roadblockCd <= 0) {
        state.roadblockCd = 25;
        const ahead = 420;
        const fx = Math.cos(p.angle);
        const fy = Math.sin(p.angle);
        const bx = p.x + fx * ahead;
        const by = p.y + fy * ahead;
        const px = -fy;
        const py = fx;
        for (const side of [-45, 45]) {
          const car = spawnPatrolCar();
          car.x = bx + px * side;
          car.y = by + py * side;
          car.angle = Math.atan2(-fy, -fx);
          car.speed = 0;
        }
        showBanner('NBPD roadblock ahead!', 3);
      }
    }
    for (let i = state.cops.length - 1; i >= 0; i -= 1) {
      const cop = state.cops[i];
      if (state.wanted === 0 || cop.health <= 0) {
        if (cop.health <= 0) burst(cop.x, cop.y, '#2f6fd0', 8, 180);
        state.cops.splice(i, 1);
        continue;
      }
      const d = Math.hypot(p.x - cop.x, p.y - cop.y);
      cop.angle = Math.atan2(p.y - cop.y, p.x - cop.x);
      if (p.onFoot) {
        cop.x += Math.cos(cop.angle) * cop.speed * dt;
        cop.y += Math.sin(cop.angle) * cop.speed * dt;
        const body = { x: cop.x, y: cop.y, radius: cop.radius };
        resolveBuildings(city.buildings, body);
        cop.x = body.x;
        cop.y = body.y;
        if (d < 32) {
          cop.arrest += dt;
          if (cop.arrest >= COPS.footArrestTime) {
            events |= bustPlayer();
            return events;
          }
        } else {
          cop.arrest = Math.max(0, cop.arrest - dt * 2);
        }
      } else if (d > 700) {
        state.cops.splice(i, 1);
      }
    }
    for (const car of state.cars) {
      if (car.driver !== 'police') continue;
      if (state.wanted === 0) {
        car.driver = 'parked';
        car.speed = 0;
        continue;
      }
      const d = Math.hypot(p.x - car.x, p.y - car.y);
      const wantAngle = Math.atan2(p.y - car.y, p.x - car.x);
      let diff = wantAngle - car.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
      if (!p.onFoot) {
        const pc = playerCar();
        car.tailT = (car.tailT || 0) + dt;
        if (d > 150) {
          car.speed = Math.min(COPS.carChaseSpeed, car.speed + 420 * dt);
          car.tailT = 0;
        } else if (car.tailT > 4) {
          car.speed = Math.min(580, car.speed + 500 * dt);
          if (d < 50) car.tailT = 0;
        } else {
          const target = pc ? pc.speed * 0.95 : 0;
          car.speed += Math.max(-400 * dt, Math.min(400 * dt, target - car.speed));
        }
      } else if (d > 170) {
        car.speed = Math.min(320, car.speed + 380 * dt);
      } else {
        car.speed = Math.max(0, car.speed - 500 * dt);
        car.deployT -= dt;
        if (car.deployT <= 0 && state.cops.length < 5) {
          car.deployT = 6;
          const cop = spawnFootCop();
          cop.x = car.x;
          cop.y = car.y;
        }
      }
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      const body = { x: car.x, y: car.y, radius: 20 };
      if (resolveBuildings(city.buildings, body)) car.speed *= 0.4;
      car.x = Math.max(24, Math.min(WORLD.width - 24, body.x));
      car.y = Math.max(24, Math.min(WORLD.height - 24, body.y));
      if (!p.onFoot) {
        const pc = playerCar();
        if (pc && Math.hypot(pc.x - car.x, pc.y - car.y) < 46) {
          pc.health -= COPS.ramDamage * dt;
          pc.speed *= 0.92;
          if (rng.chance(0.02)) {
            p.health -= p.armor > 0 ? 0.5 : 1;
            state.hurtFlash = Math.max(state.hurtFlash, 0.6);
            burst(pc.x, pc.y, '#ffd23d', 4, 160);
          }
        }
      }
      if (d > 1500) {
        car.driver = 'parked';
        car.speed = 0;
      }
    }
    return events;
  }

  function bustPlayer() {
    const fine = Math.max(50, Math.floor(state.cash * 0.15));
    state.cash -= fine;
    state.wantedPoints = 0;
    state.wanted = 0;
    state.cops = [];
    state.courier = null;
    keepObjective();
    for (const car of state.cars) if (car.driver === 'police') { car.driver = 'parked'; car.speed = 0; }
    const p = state.player;
    p.health = PLAYER.health;
    if (!p.onFoot) {
      const car = playerCar();
      if (car) car.driver = 'parked';
      p.onFoot = true;
      p.carId = 0;
    }
    p.x = 2070;
    p.y = 1150;
    p.angle = -Math.PI / 2;
    showBanner(`BUSTED — NBPD took $${fine} in fines`, 3);
    return EVENT_BUSTED;
  }

  function updateRivals(dt) {
    const p = state.player;
    let events = 0;
    for (let i = state.rivals.length - 1; i >= 0; i -= 1) {
      const rival = state.rivals[i];
      if (rival.health <= 0) {
        burst(rival.x, rival.y, '#a83232', 10, 200);
        spawnPickup('cash', rival.x, rival.y, rng.int(40, 90));
        state.rivals.splice(i, 1);
        state.rivalsLeft = Math.max(0, state.rivalsLeft - 1);
        continue;
      }
      const d = Math.hypot(p.x - rival.x, p.y - rival.y);
      rival.angle = Math.atan2(p.y - rival.y, p.x - rival.x);
      if (d > 190 && d < 700) {
        rival.x += Math.cos(rival.angle) * rival.speed * dt;
        rival.y += Math.sin(rival.angle) * rival.speed * dt;
        const body = { x: rival.x, y: rival.y, radius: rival.radius };
        resolveBuildings(city.buildings, body);
        rival.x = body.x;
        rival.y = body.y;
      }
      rival.shootT -= dt;
      if (d < RIVAL.shootRange && rival.shootT <= 0 && !lineBlocked(city.buildings, rival.x, rival.y, p.x, p.y)) {
        rival.shootT = RIVAL.shootEvery + rng.range(0, 0.4);
        fireBullet(rival.x, rival.y, p.x, p.y, 'rival', RIVAL.damage, 720);
      }
    }
    return events;
  }

  function updateBullets(dt) {
    const p = state.player;
    for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
      const b = state.bullets[i];
      const px = b.x;
      const py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      let dead = b.life <= 0 || b.x < 0 || b.x > WORLD.width || b.y < 0 || b.y > WORLD.height;
      if (!dead && lineBlocked(city.buildings, px, py, b.x, b.y)) {
        burst(b.x, b.y, '#ffd23d', 3, 120);
        dead = true;
      }
      if (!dead) {
        const hitCircle = (t) => Math.hypot(t.x - b.x, t.y - b.y) < t.radius + 4;
        if (b.from === 'player') {
          for (const rival of state.rivals) {
            if (hitCircle(rival)) { rival.health -= b.damage; burst(b.x, b.y, '#a83232', 6, 160); dead = true; break; }
          }
          if (!dead) for (const cop of state.cops) {
            if (hitCircle(cop)) {
              cop.health -= b.damage;
              addWanted(1);
              burst(b.x, b.y, '#2f6fd0', 6, 160);
              dead = true;
              break;
            }
          }
          if (!dead) for (const ped of state.peds) {
            if (ped.down > 0) continue;
            if (hitCircle(ped)) {
              ped.down = 3;
              ped.scared = 4;
              addWanted(WANTED.kill);
              burst(b.x, b.y, '#c94f43', 6, 160);
              dead = true;
              break;
            }
          }
          if (!dead) for (const car of state.cars) {
            if (car.driver === 'player') continue;
            if (Math.hypot(car.x - b.x, car.y - b.y) < 24) {
              car.health -= b.damage;
              burst(b.x, b.y, '#ffd23d', 4, 140);
              if (car.driver === 'traffic') addWanted(1);
              dead = true;
              break;
            }
          }
        } else if (p.invuln <= 0 && hitCircle(p)) {
          p.health -= p.armor > 0 ? b.damage / 2 : b.damage;
          p.invuln = 0.4;
          state.hurtFlash = 1;
          burst(p.x, p.y, '#c94f43', 6, 160);
          dead = true;
          if (p.health <= 0) {
            p.health = 0;
            wastePlayer();
          }
        }
      }
      if (dead) state.bullets.splice(i, 1);
    }
  }

  function wastePlayer() {
    const lost = Math.max(25, Math.floor(state.cash * 0.08));
    state.cash -= lost;
    state.wantedPoints = 0;
    state.wanted = 0;
    state.cops = [];
    state.courier = null;
    keepObjective();
    for (const car of state.cars) if (car.driver === 'police') { car.driver = 'parked'; car.speed = 0; }
    const p = state.player;
    p.health = PLAYER.health;
    if (!p.onFoot) {
      const car = playerCar();
      if (car) car.driver = 'parked';
      p.onFoot = true;
      p.carId = 0;
    }
    p.x = 1470;
    p.y = 640;
    p.angle = -Math.PI / 2;
    showBanner(`WASTED — you wake up at Neon Bay General, $${lost} lighter`, 3);
    state.wastedFlag = true;
  }

  function updateFare(dt) {
    const p = state.player;
    const car = playerCar();
    const inTaxi = !p.onFoot && car && car.kind === 'taxi';
    if (!inTaxi) {
      if (state.fare) {
        if (state.fare.ped) state.fare.ped.hailing = false;
        state.fare = null;
        keepObjective();
      }
      return;
    }
    if (state.fare) {
      const f = state.fare;
      if (f.stage === 'pickup') {
        const ped = f.ped;
        if (!ped || ped.down > 0) {
          if (ped) ped.hailing = false;
          state.fare = null;
          return;
        }
        state.objective = { x: ped.x, y: ped.y, label: 'Taxi fare — pick up the passenger' };
        if (Math.hypot(p.x - ped.x, p.y - ped.y) < 70) {
          const dest = randomSidewalkPoint(rng);
          f.stage = 'deliver';
          f.x = dest.x; f.y = dest.y;
          f.timer = 45;
          f.reward = rng.int(80, 150);
          state.peds.splice(state.peds.indexOf(ped), 1);
          showBanner('Passenger aboard — deliver them in 45s!', 2.5);
        }
        return;
      }
      f.timer -= dt;
      state.objective = { x: f.x, y: f.y, label: `Taxi fare — ${Math.max(0, Math.ceil(f.timer))}s` };
      if (Math.hypot(p.x - f.x, p.y - f.y) < 75) {
        state.cash += f.reward;
        floatText(p.x, p.y - 30, `+$${f.reward}`, '#57d977');
        showBanner(`Fare complete — +$${f.reward}`, 2.5);
        state.fare = null;
        keepObjective();
        state.fareCd = 30;
        return;
      }
      if (f.timer <= 0) {
        showBanner('Fare expired — the passenger walked away', 2.5);
        if (f.ped) f.ped.hailing = false;
        state.fare = null;
        keepObjective();
        state.fareCd = 20;
      }
      return;
    }
    state.fareCd -= dt;
    if (state.fareCd <= 0) {
      const candidates = state.peds.filter((ped) => ped.down <= 0);
      if (candidates.length === 0) return;
      const ped = candidates[Math.floor(rng.next() * candidates.length)];
      ped.hailing = true;
      state.fare = { ped, stage: 'pickup' };
      showBanner('Taxi fare — a passenger is hailing you', 2.5);
      state.fareCd = 9999;
    }
  }

  function updateCourier(dt) {
    if (!state.storyDone) return;
    if (state.courier) {
      const c = state.courier;
      c.timer -= dt;
      state.objective = { x: c.x, y: c.y, label: `Courier delivery — ${Math.max(0, Math.ceil(c.timer))}s` };
      const p = state.player;
      if (Math.hypot(p.x - c.x, p.y - c.y) < 75) {
        state.cash += c.reward;
        floatText(p.x, p.y - 30, `+$${c.reward}`, '#57d977');
        showBanner(`Courier done — +$${c.reward}`, 2.5);
        state.courier = null;
        state.objective = null;
        state.courierCd = 35;
        return;
      }
      if (c.timer <= 0) {
        showBanner('Courier job expired — too slow', 2.5);
        state.courier = null;
        state.objective = null;
        state.courierCd = 25;
      }
      return;
    }
    state.courierCd -= dt;
    if (state.courierCd <= 0) {
      const spot = randomSidewalkPoint(rng);
      spawnPickup('courier', spot.x, spot.y, 0);
      showBanner('Courier job available — grab the package', 2.5);
      state.courierCd = 9999;
    }
  }

  function updatePickups(dt) {
    const p = state.player;
    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const item = state.pickups[i];
      item.bob += dt * 3;
      if (Math.hypot(item.x - p.x, item.y - p.y) > 46) continue;
      if (item.kind === 'repair' && p.onFoot) continue;
      state.pickupSound = true;
      if (item.kind === 'health') {
        if (p.health >= PLAYER.health) continue;
        p.health = Math.min(PLAYER.health, p.health + item.amount);
        showBanner(`Health +${item.amount}`, 1.5);
      } else if (item.kind === 'ammo') {
        if (!p.pistol) continue;
        p.mag = PLAYER.magSize;
        showBanner('Pistol reloaded', 1.5);
      } else if (item.kind === 'shotgun') {
        p.shotgun = item.amount;
        showBanner(`Shotgun acquired — ${item.amount} shells`, 2);
      } else if (item.kind === 'armor') {
        p.armor = item.amount;
        showBanner(`Armor vest — half damage for ${item.amount}s`, 2);
      } else if (item.kind === 'repair') {
        const car = playerCar();
        if (!car) continue;
        car.health = Math.min(100, car.health + item.amount);
        showBanner(`Car repaired +${item.amount} HP`, 1.5);
      } else if (item.kind === 'cash') {
        state.cash += item.amount;
        state.cashSound = true;
        state.pickupSound = false;
        floatText(p.x, p.y - 30, `+$${item.amount}`, '#57d977');
        showBanner(`+$${item.amount}`, 1.2);
        const spot = randomSidewalkPoint(rng);
        spawnPickup('cash', spot.x, spot.y, rng.int(30, 90));
      } else if (item.kind === 'crate') {
        state.hasCrate = true;
        state.wantedPoints = 8;
        state.wanted = 4;
        state.lastCrime = state.time;
        showBanner('Crate grabbed — the whole NBPD is coming!', 3);
        const mission = MISSIONS[state.missionIndex];
        const stage = mission.stages[state.stageIndex];
        state.objective = { x: stage.x, y: stage.y, label: stage.label };
      } else if (item.kind === 'courier') {
        const dest = randomSidewalkPoint(rng);
        state.courier = { x: dest.x, y: dest.y, timer: 40, reward: rng.int(120, 200) };
        state.objective = { x: dest.x, y: dest.y, label: `Courier delivery — ${Math.ceil(state.courier.timer)}s` };
        showBanner('Courier job — deliver the package in 40s!', 3);
      }
      state.pickups.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.skids.length - 1; i >= 0; i -= 1) {
      state.skids[i].life -= dt;
      if (state.skids[i].life <= 0) state.skids.splice(i, 1);
    }
  }

  function updateWanted(dt) {
    if (state.wantedPoints <= 0) return 0;
    const p = state.player;
    let nearestCop = Infinity;
    for (const cop of state.cops) nearestCop = Math.min(nearestCop, Math.hypot(cop.x - p.x, cop.y - p.y));
    for (const car of state.cars) {
      if (car.driver === 'police') nearestCop = Math.min(nearestCop, Math.hypot(car.x - p.x, car.y - p.y));
    }
    if (state.time - state.lastCrime > WANTED.coolDelay && nearestCop > WANTED.spotRange) {
      state.wantedPoints = Math.max(0, state.wantedPoints - WANTED.coolRate * dt);
      state.wanted = Math.min(5, Math.floor(state.wantedPoints / 2));
    }
    return 0;
  }

  function updateMissions(dt) {
    if (!state.missionActive) return 0;
    const mission = MISSIONS[state.missionIndex];
    const stage = mission.stages[state.stageIndex];
    const p = state.player;
    if (stage.kind === 'go') {
      if (Math.hypot(p.x - stage.x, p.y - stage.y) < 75) return completeStage();
    } else if (stage.kind === 'kill') {
      if (state.rivalsLeft <= 0 && state.rivals.length === 0) return completeStage();
      if (state.rivals.length > 0) {
        state.objective = { x: state.rivals[0].x, y: state.rivals[0].y, label: stage.label };
      }
    } else if (stage.kind === 'steal') {
      if (p.carId === state.targetCarId) return completeStage();
    } else if (stage.kind === 'deliver') {
      const car = playerCar();
      if (car && car.kind === 'sports' && Math.hypot(p.x - stage.x, p.y - stage.y) < 75) return completeStage();
    } else if (stage.kind === 'survive') {
      state.stageTimer -= dt;
      state.objective = { x: p.x, y: p.y, label: `${stage.label} — ${Math.max(0, Math.ceil(state.stageTimer))}s` };
      if (state.stageTimer <= 0) {
        state.wantedPoints = 0;
        state.wanted = 0;
        state.cops = [];
        for (const car of state.cars) if (car.driver === 'police') { car.driver = 'parked'; car.speed = 0; }
        showBanner('You shook them — now get home', 2.5);
        return completeStage();
      }
    } else if (stage.kind === 'carry') {
      if (state.hasCrate && Math.hypot(p.x - stage.x, p.y - stage.y) < 75) {
        state.hasCrate = false;
        return completeStage();
      }
    }
    return 0;
  }

  function maintainCrowd() {
    const p = state.player;
    while (state.cars.filter((c) => c.driver === 'traffic').length < TRAFFIC_COUNT) spawnTrafficCar(p);
    while (state.peds.length < PED_COUNT) spawnPed();
  }

  function saveGame() {
    const p = state.player;
    return {
      cash: state.cash,
      health: p.health,
      missionIndex: state.missionIndex,
      pistol: p.pistol,
      shotgun: p.shotgun,
      x: p.x,
      y: p.y,
      storyDone: state.storyDone,
    };
  }

  function loadGame(save) {
    reset();
    state.cash = save.cash ?? 120;
    state.player.health = save.health ?? PLAYER.health;
    state.player.pistol = !!save.pistol;
    state.player.shotgun = save.shotgun ?? 0;
    if (state.player.pistol) state.player.mag = PLAYER.magSize;
    state.player.x = save.x ?? 870;
    state.player.y = save.y ?? 640;
    state.storyDone = !!save.storyDone;
    const index = Math.min(save.missionIndex ?? 0, MISSIONS.length - 1);
    if (!state.storyDone) startMission(index);
  }

  reset();
  return {
    state, city, step, reset, startMission, nearestCar, playerCar, enterCar, exitCar, saveGame, loadGame,
    setWanted(points) {
      state.wantedPoints = points;
      state.wanted = Math.min(5, Math.floor(points / 2));
      state.lastCrime = state.time;
    },
    spawnPatrolCar,
    spawnFootCop,
    spawnParkedCar,
    wastedFlag() {
      const was = !!state.wastedFlag;
      state.wastedFlag = false;
      return was;
    },
  };
}
