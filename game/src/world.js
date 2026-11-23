// Neon Bay — the game's rules and state, with no drawing and no browser in it:
// the player on foot and in cars, traffic, pedestrians, police, rivals, the
// wanted system, missions and combat. step() advances one fixed step and returns
// what happened as bit flags, so the caller can react without the world knowing
// about screens or sound. Nothing here allocates after createGame returns.

import { AVENUES, CAR_KINDS, COPS, PED_COUNT, PLAYER, RIVAL, STREETS, TRAFFIC_COUNT, WANTED, WORLD } from './tune.js';
import { buildCity, lineBlocked, nearestRoadPoint, randomRoadPoint, randomSidewalkPoint, resolveBuildings } from './city.js';

export const EVENT_BUSTED = 1;
export const EVENT_WASTED = 2;
export const EVENT_MISSION = 4;
export const EVENT_STORY = 8;
export const EVENT_CRIME = 16;

/** Six linked jobs. Each stage is one objective; the last stage pays the reward. */
export const MISSIONS = [
  {
    title: 'First Delivery',
    giver: "Mama Rosa",
    brief: ["Rico, welcome back to Neon Bay. The docks don't pay like they used to.",
      'Take this package from my diner to the Bayfront Mall. No questions, no stops.'],
    stages: [
      { kind: 'go', x: 870, y: 550, label: "Pick up the package at Mama Rosa's" },
      { kind: 'go', x: 1470, y: 1550, label: 'Deliver the package to Bayfront Mall' },
    ],
    reward: 150,
  },
  {
    title: 'A Quiet Word',
    giver: "Mama Rosa",
    brief: ['The Harbor Boys are leaning on my suppliers. A word, they said.',
      'Pick up the pistol at your garage, then have that word with their lookouts by the mall.'],
    stages: [
      { kind: 'go', x: 870, y: 1550, label: "Pick up the pistol at Rico's Garage" },
      { kind: 'kill', count: 3, at: [{ x: 1300, y: 1450 }, { x: 1380, y: 1620 }, { x: 1240, y: 1680 }], label: 'Deal with the 3 Harbor Boys lookouts' },
    ],
    reward: 250,
  },
  {
    title: 'The Golden Comet',
    giver: 'Mama Rosa',
    brief: ['A Golden Comet sports car sits in the mall lot. Its owner owes me. A lot.',
      'Take it. Bring it to your garage. Parked cars do not argue.'],
    stages: [
      { kind: 'steal', carKind: 'sports', x: 1350, y: 1650, label: 'Steal the Golden Comet from the mall lot' },
      { kind: 'deliver', x: 870, y: 1550, label: "Bring the Comet to Rico's Garage" },
    ],
    reward: 400,
  },
  {
    title: 'Dockside Trouble',
    giver: 'Mama Rosa',
    brief: ['The Harbor Boys took my shipment at the port. Five of them, all armed.',
      'Go to the docks. Bring my crates back — or at least make them regret it.'],
    stages: [
      { kind: 'go', x: 2400, y: 2270, label: 'Reach the Port of Neon Bay' },
      { kind: 'kill', count: 5, at: [{ x: 2350, y: 2200 }, { x: 2450, y: 2180 }, { x: 2520, y: 2260 }, { x: 2300, y: 2300 }, { x: 2470, y: 2330 }], label: 'Clear the 5 Harbor Boys at the docks' },
    ],
    reward: 600,
  },
  {
    title: 'Shake the Heat',
    giver: 'Mama Rosa',
    brief: ['The NBPD saw your face at the docks. Three stars, Rico. Three.',
      'Survive the chase, then come home to the diner. Do not lead them here.'],
    stages: [
      { kind: 'survive', seconds: 30, label: 'Survive the police chase — 30 seconds' },
      { kind: 'go', x: 870, y: 550, label: "Get back to Mama Rosa's Diner" },
    ],
    reward: 750,
  },
  {
    title: 'The Big Score',
    giver: 'Mama Rosa',
    brief: ['One crate at the port. Rosa gold, they call it. Enough to buy the docks.',
      'Grab it and run for the garage. The whole NBPD will be on you. Make it count.'],
    stages: [
      { kind: 'go', x: 2400, y: 2270, label: 'Reach the port docks' },
      { kind: 'carry', x: 870, y: 1550, label: "Carry the crate to Rico's Garage" },
    ],
    reward: 2500,
  },
  {
    title: 'The Getaway',
    giver: 'Mama Rosa',
    brief: ['The crate is ours — but the NBPD locked the city down. Four stars, Rico.',
      'Shake the chase, then run for the beach. A boat is waiting at the south shore.'],
    stages: [
      { kind: 'survive', seconds: 20, label: 'Survive the lockdown chase — 20 seconds' },
      { kind: 'go', x: 1800, y: 2560, label: 'Reach the boat at the south beach' },
    ],
    reward: 1000,
  },
];

let nextCarId = 1;

export function createGame(rng) {
  const city = buildCity(rng);
  const state = {
    time: 0,
    cash: 120,
    wantedPoints: 0,
    wanted: 0,
    lastCrime: -999,
    player: null,
    cars: [],
    peds: [],
    cops: [],
    rivals: [],
    pickups: [],
    bullets: [],
    particles: [],
    skids: [],
    missionIndex: 0,
    stageIndex: 0,
    missionActive: false,
    stageTimer: 0,
    hasCrate: false,
    targetCarId: 0,
    rivalsLeft: 0,
    objective: null,
    banner: null,
    bannerTimer: 0,
    dialogue: [],
    dialogueTimer: 0,
    storyDone: false,
    muted: false,
    shotFired: false,
    shotSound: false,
    punchSound: false,
    pickupSound: false,
    cashSound: false,
    crashLoud: false,
    sirenOn: false,
    shake: 0,
    roadblockCd: 0,
    nearMissCd: 0,
  };

  function newPlayer(x, y) {
    return {
      x, y, angle: -Math.PI / 2, speed: 0, onFoot: true, carId: 0, radius: PLAYER.radius,
      health: PLAYER.health, pistol: false, mag: 0, punchCd: 0, shootCd: 0, reloadT: 0, invuln: 0,
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
    car.targetSpeed = rng.range(160, 250);
    car.speed = car.targetSpeed;
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
    // Joggers move about twice as fast as walkers.
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
    if (level > state.wanted) state.wanted = level;
    return EVENT_CRIME;
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = rng.range(0, Math.PI * 2);
      const v = rng.range(speed * 0.4, speed);
      state.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rng.range(0.25, 0.6), maxLife: 0.6, color, size: rng.range(2, 5) });
    }
  }

  function reset() {
    state.time = 0;
    state.cash = 120;
    state.wantedPoints = 0;
    state.wanted = 0;
    state.lastCrime = -999;
    state.cars = [];
    state.peds = [];
    state.cops = [];
    state.rivals = [];
    state.pickups = [];
    state.bullets = [];
    state.particles = [];
    state.skids = [];
    state.roadblockCd = 0;
    state.nearMissCd = 0;
    state.missionIndex = 0;
    state.stageIndex = 0;
    state.missionActive = false;
    state.stageTimer = 0;
    state.hasCrate = false;
    state.targetCarId = 0;
    state.rivalsLeft = 0;
    state.objective = null;
    state.banner = null;
    state.bannerTimer = 0;
    state.dialogue = [];
    state.dialogueTimer = 0;
    state.storyDone = false;
    state.player = newPlayer(870, 640);
    // The street outside the diner, ready to roll.
    spawnParkedCar('sedan', 830, 700, Math.PI / 2);
    spawnParkedCar('taxi', 950, 700, Math.PI / 2);
    // The new rides, parked where they belong: a muscle car by the casino,
    // a limo by the mall.
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
    startMission(0);
  }

  function startMission(index) {
    const mission = MISSIONS[index];
    if (!mission) return;
    state.missionIndex = index;
    state.stageIndex = 0;
    state.missionActive = true;
    state.dialogue = mission.brief.slice();
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
    // Mission 2's first stage ends at the garage, where the pistol waits.
    if (state.missionIndex === 1 && state.stageIndex === 1 && !state.player.pistol) {
      state.player.pistol = true;
      state.player.mag = PLAYER.magSize;
      showBanner('Pistol acquired — click to shoot, F to punch', 3);
    }
    if (state.stageIndex >= mission.stages.length) {
      state.cash += mission.reward;
      state.missionActive = false;
      state.objective = null;
      showBanner(`Mission complete — ${mission.title}  +$${mission.reward}`, 3.5);
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
      // The driver bails and runs; stealing an occupied car is a crime.
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

  /** One fixed step. `input` carries the held keys, the mouse aim in world pixels and the one-shot presses. */
  function step(dt, input) {
    let events = 0;
    state.time += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
    if (state.nearMissCd > 0) state.nearMissCd -= dt;
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
    updateParticles(dt);
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
      const speed = input.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
      p.x += mx * speed * dt;
      p.y += my * speed * dt;
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
    if (input.shoot && p.pistol && p.mag > 0 && p.shootCd <= 0 && p.reloadT <= 0) {
      p.shootCd = 0.2;
      p.mag -= 1;
      fireBullet(p.x, p.y, p.aimX, p.aimY, 'player', PLAYER.pistolDamage, 950);
      // Muzzle flash at the gun tip.
      const ma = Math.atan2(p.aimY - p.y, p.aimX - p.x);
      burst(p.x + Math.cos(ma) * 26, p.y + Math.sin(ma) * 26, '#ffe9a3', 4, 140);
      state.shotFired = true;
      state.shotSound = true;
    }
    if (input.reload && p.pistol && p.mag < PLAYER.magSize && p.reloadT <= 0) p.reloadT = 0.9;
    return events;
  }

  function punch() {
    const p = state.player;
    const reach = PLAYER.punchRange;
    let hit = false;
    const tryHit = (target, damage, isCrime) => {
      const d = Math.hypot(target.x - p.x, target.y - p.y);
      if (d > reach + target.radius) return false;
      const ang = Math.atan2(target.y - p.y, target.x - p.x);
      let diff = Math.abs(ang - p.angle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > 1.1) return false;
      target.health -= damage;
      const kx = Math.cos(ang) * 160;
      const ky = Math.sin(ang) * 160;
      target.x += kx * 0.08;
      target.y += ky * 0.08;
      burst(target.x, target.y, '#e8e2d4', 5, 120);
      if (isCrime) addWanted(1);
      return true;
    };
    for (const rival of state.rivals) if (tryHit(rival, PLAYER.punchDamage, false)) hit = true;
    for (const cop of state.cops) if (tryHit(cop, PLAYER.punchDamage, true)) hit = true;
    for (const ped of state.peds) {
      if (ped.down > 0) continue;
      if (tryHit(ped, 100, true)) {
        ped.down = 2;
        ped.scared = 3;
        hit = true;
      }
    }
    return hit ? EVENT_CRIME : 0;
  }

  function fireBullet(x, y, tx, ty, from, damage, speed) {
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
    // Exhaust puff when pulling away hard.
    if (throttle > 0 && Math.abs(car.speed) > 120 && rng.chance(0.12)) {
      const bx = car.x - Math.cos(car.angle) * (spec.length / 2);
      const by = car.y - Math.sin(car.angle) * (spec.length / 2);
      state.particles.push({ x: bx, y: by, vx: -Math.cos(car.angle) * 40, vy: -Math.sin(car.angle) * 40, life: 0.5, maxLife: 0.5, color: '#9a9a9a', size: 3 });
    }
    car.speed -= car.speed * 0.12 * dt;
    car.speed = Math.max(-spec.topSpeed * 0.4, Math.min(spec.topSpeed, car.speed));
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const grip = Math.min(1, Math.abs(car.speed) / 220);
    car.angle += steer * spec.turn * grip * dt * (car.speed >= 0 ? 1 : -1);
    // Hard cornering at speed leaves skid marks at the rear wheels.
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
    // Bumping other cars. The player's car is heavy: a patrol car shoving it
    // moves the patrol car far more than it moves the player.
    for (const other of state.cars) {
      if (other === car) continue;
      const d = Math.hypot(other.x - car.x, other.y - car.y);
      if (d < 44 && d > 0.01) {
        const overlap = 44 - d;
        const myMass = 3;
        const otherMass = 1;
        const ux = (car.x - other.x) / d;
        const uy = (car.y - other.y) / d;
        car.x += ux * overlap * (otherMass / (myMass + otherMass));
        car.y += uy * overlap * (otherMass / (myMass + otherMass));
        other.x -= ux * overlap * (myMass / (myMass + otherMass));
        other.y -= uy * overlap * (myMass / (myMass + otherMass));
        if (Math.abs(car.speed) > 200) {
          other.speed = car.speed * 0.4;
          car.speed *= 0.7;
          burst(car.x, car.y, '#ffd23d', 6, 200);
        }
      } else if (car.driver === 'player' && other.driver === 'traffic' && d < 75 && Math.abs(car.speed) > 300 && state.nearMissCd <= 0) {
        // A close shave at speed, without touching: a small cash bonus.
        state.nearMissCd = 2;
        state.cash += 10;
        showBanner('Near miss!  +$10', 1.2);
      }
    }
    // Running over a pedestrian is a crime.
    for (const ped of state.peds) {
      if (ped.down > 0) continue;
      if (Math.hypot(ped.x - car.x, ped.y - car.y) < 34 && Math.abs(car.speed) > 60) {
        ped.down = 2.2;
        ped.scared = 4;
        car.speed *= 0.85;
        addWanted(WANTED.hitPed);
        burst(ped.x, ped.y, '#c94f43', 8, 160);
      }
    }
    if (car.health <= 0 && !car.smoked) {
      car.smoked = true;
      car.speed = 0;
      // A wrecked car blows its doors off: a burst of smoke and sparks.
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
      // Slow down for a car ahead on the same lane.
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
      // At a crossing, sometimes turn onto the other road.
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
      // Turn around at the edge of town instead of leaving it.
      if (car.x < 120 || car.x > WORLD.width - 120 || car.y < 120 || car.y > WORLD.height - 120) car.dir *= -1;
      if (car.road === 'v') car.angle = car.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      else car.angle = car.dir === 1 ? 0 : Math.PI;
      car.x = Math.max(40, Math.min(WORLD.width - 40, car.x));
      car.y = Math.max(40, Math.min(WORLD.height - 40, car.y));
    }
    // Keep the streets alive: replace cars that drifted far away.
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
      // A gunshot nearby sends everyone running.
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
    // Reinforcements arrive while the heat is on.
    const wantFoot = state.wanted >= 1 ? Math.min(2 + state.wanted, 5) : 0;
    const wantCars = state.wanted >= 2 ? Math.min(state.wanted, 3) : 0;
    if (state.cops.length < wantFoot && rng.chance(0.02)) spawnFootCop();
    const patrols = state.cars.filter((c) => c.driver === 'police').length;
    if (patrols < wantCars && rng.chance(0.015)) spawnPatrolCar();
    // At four stars and up the NBPD sets a roadblock ahead of the player.
    if (state.wanted >= 4) {
      state.roadblockCd -= dt;
      if (state.roadblockCd <= 0) {
        state.roadblockCd = 25;
        const p = state.player;
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
        if (cop.health <= 0) {
          burst(cop.x, cop.y, '#2f6fd0', 8, 180);
          state.cash = Math.max(0, state.cash + 0);
        }
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
        // Too far behind a speeding car: give up the foot chase.
        state.cops.splice(i, 1);
      }
    }
    // Patrol cars chase the player's car and ram it; near a player on foot they
    // stop and send a foot cop out.
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
        // Tail the player: close in fast, then match speed and sit on the bumper.
        // After a few seconds of tailing, a short PIT burst tries to spin the car.
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
            p.health -= 1;
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
          p.health -= b.damage;
          p.invuln = 0.4;
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

  function updatePickups(dt) {
    const p = state.player;
    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const item = state.pickups[i];
      item.bob += dt * 3;
      if (Math.hypot(item.x - p.x, item.y - p.y) > 46) continue;
      state.pickupSound = true;
      if (item.kind === 'health') {
        if (p.health >= PLAYER.health) continue;
        p.health = Math.min(PLAYER.health, p.health + item.amount);
        showBanner(`Health +${item.amount}`, 1.5);
      } else if (item.kind === 'ammo') {
        if (!p.pistol) continue;
        p.mag = PLAYER.magSize;
        showBanner('Pistol reloaded', 1.5);
      } else if (item.kind === 'cash') {
        state.cash += item.amount;
        state.cashSound = true;
        state.pickupSound = false;
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
    // Skid marks fade slowly off the asphalt.
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
    /** Staging helpers for the screenshot scenes: the same spawns the game itself uses. */
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
