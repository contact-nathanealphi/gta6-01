import { AVENUES, CAR_KINDS, COPS, PALETTE, PED_COUNT, PLAYER, RIVAL, STREETS, TRAFFIC_COUNT, WANTED, WORLD } from './tune.js';
import { buildCity, lineBlocked, randomRoadPoint, randomSidewalkPoint, resolveBuildings } from './city.js';
import { PoliceAirSupportSystem, spawnBurningWreck } from './police-air-support.js';
import { WeaponWheelSystem, detonateHydraRpg } from './weapon-wheel.js';
import { DistrictStandingSystem } from './district-fixer.js';
import { CrewAbilitySystem, NeonCustomsGarage, StreetRaceCircuit, ProceduralFmRadio } from './crew-garage-race.js';

export const EVENT_BUSTED = 1;
export const EVENT_WASTED = 2;
export const EVENT_MISSION = 4;
export const EVENT_STORY = 8;

const MISSIONS_RAW = [
  ['First Delivery', "Mama Rosa", ['Take the package to Bayfront Mall. No stops.'], [['go', 870, 550, "Pick up the package at Mama Rosa's"], ['go', 1470, 1550, 'Deliver it to Bayfront Mall']], 150, 'Fast. Good.'],
  ['A Quiet Word', "Mama Rosa", ['Grab the pistol, then have a word with the Harbor Boys lookouts.'], [['go', 870, 1550, "Pick up the pistol at Rico's Garage"], ['kill', 3, [[1300, 1450], [1380, 1620], [1240, 1680]], 'Deal with the 3 lookouts']], 250, 'Three lookouts, one word.'],
  ['The Golden Comet', 'Mama Rosa', ['A Golden Comet sits in the mall lot. Its owner owes me. Take it.'], [['steal', 'sports', 1350, 1650, 'Steal the Golden Comet from the mall lot'], ['deliver', '', 870, 1550, "Bring the Comet to Rico's Garage"]], 400, 'You always liked the fast ones.'],
  ['Dockside Trouble', 'Mama Rosa', ['They took my shipment at the port. Five, armed. Bring my crates back.'], [['go', 2400, 2270, 'Reach the Port of Neon Bay'], ['kill', 5, [[2350, 2200], [2450, 2180], [2520, 2260], [2300, 2300], [2470, 2330]], 'Clear the 5 at the docks']], 600, 'Five of them, and you walked out.'],
  ['Shake the Heat', 'Mama Rosa', ['NBPD saw your face. Three stars. Survive the chase, then come home.'], [['survive', 30, 'Survive the police chase — 30 seconds'], ['go', 870, 550, "Get back to Mama Rosa's Diner"]], 750, 'Three stars, and you are still here.'],
  ['The Big Score', 'Mama Rosa', ['One crate at the port. Rosa gold. Grab it and run.'], [['go', 2400, 2270, 'Reach the port docks'], ['carry', 870, 1550, "Carry the crate to Rico's Garage", 2400, 2270, 'Grab the crate']], 2500, 'The crate is ours. The NBPD is furious.'],
  ['The Getaway', 'Mama Rosa', ['The crate is ours, but NBPD locked the city down. Four stars. Shake them, run for the beach boat.'], [['survive', 20, 'Survive the lockdown chase — 20 seconds'], ['go', 1800, 2560, 'Reach the boat at the south beach']], 1000, 'Neon Bay is yours, Rico. Go.'],
  ["Viper's Cut", 'Elena "Viper" Cruz', ['Viper here. Four Syndicate defectors hide at Lighthouse Point. Make them disappear.'], [['go', 3150, 2400, 'Reach Lighthouse Point'], ['kill', 4, [[3150, 2380], [3250, 2420], [3200, 2480], [3300, 2440]], 'Silence the 4 defectors']], 1850, 'Clean. The Syndicate notices that.'],
  ['The Neon Limo', 'Elena "Viper" Cruz', ["The mayor's limo. Tonight it is Syndicate property — take it, no scratches."], [['steal', 'limo', 1800, 1300, "Steal the mayor's limo"], ['deliver', 'limo', 870, 1550, "Bring the limo to Rico's Garage"]], 2500, 'The mayor walks tonight. We ride.'],
  ['The Grand Casino Heist', 'Elena "Viper" Cruz', ['One vault. Rosa gold. The Neon Casino, tonight. Grab it and run.'], [['go', 3000, 760, 'Reach the Neon Casino'], ['carry', 870, 1550, "Carry the casino gold to Rico's Garage", 3000, 760, 'Grab the casino gold']], 5000, 'The biggest score in Neon Bay history. We did it.'],
];

const ST = (s) => {
  const o = { kind: s[0] };
  if (s[0] === 'go') { o.x = s[1]; o.y = s[2]; o.label = s[3]; }
  else if (s[0] === 'kill') { o.count = s[1]; o.at = s[2].map((p) => ({ x: p[0], y: p[1] })); o.label = s[3]; }
  else if (s[0] === 'steal' || s[0] === 'deliver') { o.carKind = s[1]; o.x = s[2]; o.y = s[3]; o.label = s[4]; }
  else if (s[0] === 'survive') { o.seconds = s[1]; o.label = s[2]; }
  else if (s[0] === 'carry') { o.x = s[1]; o.y = s[2]; o.label = s[3]; o.cx = s[4]; o.cy = s[5]; o.carryLabel = s[6]; }
  return o;
};
export const MISSIONS = MISSIONS_RAW.map((m) => ({ title: m[0], giver: m[1], brief: m[2], stages: m[3].map(ST), reward: m[4], quip: m[5] }));

let nextCarId = 1;

export function createGame(rng) {
  const city = buildCity(rng);
  function freshState() {
    return { time: 106.2, cash: 120, wantedPoints: 0, wanted: 0, lastCrime: -999, cars: [], peds: [], cops: [], rivals: [], pickups: [], bullets: [], particles: [], skids: [], missionIndex: 0, stageIndex: 0, missionActive: false, stageTimer: 0, hasCrate: false, targetCarId: 0, rivalsLeft: 0, objective: null, banner: null, bannerTimer: 0, dialogue: [], dialogueTimer: 0, storyDone: false, roadblockCd: 0, nearMissCd: 0, nearMissStreak: 0, nearMissStreakT: 0, courier: null, courierCd: 20, fare: null, fareCd: 15, floaters: [], skidSound: false, skidCd: 0, air: { heli: null, heliT: 0, swat: false }, wrecks: [], rep: {}, crewCd: [0, 0, 0], race: { active: false, circuit: 0, gate: 0, lap: 1, laps: 2, reward: 0 }, nitrousT: 0, radioToast: null, garageOpen: false, garagePoint: null };
  }
  const state = { ...freshState(), player: null, muted: false, shotFired: false, shotSound: false, punchSound: false, pickupSound: false, cashSound: false, crashLoud: false, sirenOn: false, shake: 0, wantedFlash: 0, hurtFlash: 0 };
  const fx = {
    burst, fireBullet, showBanner, floatText, addWanted,
    spawnPoliceCar: spawnPatrolCar, spawnAlly: spawnAllyCar, spawnRaceCar,
  };
  const air = new PoliceAirSupportSystem(state, fx);
  const wheel = new WeaponWheelSystem(state);
  const district = new DistrictStandingSystem(state);
  const crew = new CrewAbilitySystem(state, fx);
  const garage = new NeonCustomsGarage(state);
  const race = new StreetRaceCircuit(state, fx);
  const radio = new ProceduralFmRadio(state);
  state.upgrades = garage.levels;

  function newPlayer(x, y) {
    return { x, y, angle: -Math.PI / 2, speed: 0, onFoot: true, carId: 0, radius: PLAYER.radius, health: PLAYER.health, pistol: false, mag: 0, shotgun: 0, weapon: 2, rpg: 3, armor: 0, punchCd: 0, shootCd: 0, reloadT: 0, invuln: 0, aimX: x, aimY: y - 100 };
  }

  function newCar(kind, x, y, angle, driver) {
    const spec = CAR_KINDS[kind];
    const car = { id: nextCarId++, kind, x, y, angle, speed: 0, color: spec.color, driver, health: 100, smoked: false, radius: 22, road: null, line: 0, dir: 1, targetSpeed: 0, turnCd: 0, deployT: 0 };
    return car;
  }

  function spawnTrafficCar(near) {
    const point = randomRoadPoint(rng, near, 500);
    const vertical = Math.abs(point.x - AVENUES[0]) < 40 || rng.chance(0.5);
    const car = newCar(rng.pick(['sedan', 'sedan', 'taxi', 'van', 'pickup', 'muscle', 'limo']), point.x, point.y, 0, 'traffic');
    const roads = vertical ? AVENUES : STREETS;
    const along = vertical ? point.x : point.y;
    car.road = vertical ? 'v' : 'h';
    car.line = roads.reduce((best, v) => (Math.abs(v - along) < Math.abs(best - along) ? v : best), roads[0]);
    car.dir = rng.chance(0.5) ? 1 : -1;
    if (vertical) { car.angle = car.dir === 1 ? Math.PI / 2 : -Math.PI / 2; car.x = car.line + (car.dir === 1 ? -25 : 25); }
    else { car.angle = car.dir === 1 ? 0 : Math.PI; car.y = car.line + (car.dir === 1 ? 25 : -25); }
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
    const ped = { x: point.x, y: point.y, angle: rng.range(0, Math.PI * 2), speed: 0, target: randomSidewalkPoint(rng), down: 0, scared: 0, fleeX: 0, fleeY: 0, radius: 12, shirt: rng.pick(['#e8e2d4', '#7fb3d5', '#d4693c', '#c2a06a', '#8a4d9e', '#f2c94c']), jogger: rng.chance(0.15) };
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

  function spawnPatrolCar(kind) {
    const point = randomRoadPoint(rng, state.player, 550);
    const car = newCar(kind || 'patrol', point.x, point.y, 0, 'police');
    car.angle = Math.atan2(state.player.y - point.y, state.player.x - point.x);
    car.targetSpeed = COPS.carChaseSpeed;
    state.cars.push(car);
    return car;
  }

  function spawnAllyCar() {
    const p = state.player;
    const car = newCar('muscle', p.x + 120, p.y, p.angle, 'ally');
    car.targetSpeed = 480; car.allyT = 30; car.hitT = 0;
    state.cars.push(car);
    return car;
  }

  function spawnRaceCar(kind, x, y) {
    const car = newCar(kind, x, y, Math.PI / 2, 'race');
    car.targetSpeed = 430; car.raceGate = 0; car.raceLap = 1;
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
      const cx = stage.cx ?? 2400, cy = stage.cy ?? 2270;
      spawnPickup('crate', cx, cy, 0);
      state.objective = { x: cx, y: cy, label: stage.carryLabel || 'Grab the crate at the port' };
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
      state.player.weapon = 2;
      state.player.mag = PLAYER.magSize;
      showBanner('Pistol acquired', 3);
    }
    if (state.stageIndex >= mission.stages.length) {
      state.cash += mission.reward;
      const d = district.grant(state.player.x, state.player.y, 12);
      floatText(state.player.x, state.player.y - 56, d.name + ' +12%', '#ff2e88');
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
    const s = state;
    s.time += dt;
    const dec = (k, r) => { if (s[k] > 0) s[k] = Math.max(0, s[k] - dt * r); };
    dec('shake', 26);
    dec('wantedFlash', 1);
    dec('hurtFlash', 2.5);
    dec('skidCd', 1);
    if (s.nearMissCd > 0) s.nearMissCd -= dt;
    if (s.nearMissStreakT > 0) {
      s.nearMissStreakT -= dt;
      if (s.nearMissStreakT <= 0) s.nearMissStreak = 0;
    }
    if (s.bannerTimer > 0) s.bannerTimer -= dt;
    if (s.dialogue.length > 0) {
      s.dialogueTimer += dt;
      if (s.dialogueTimer > 2.6) {
        s.dialogue.shift();
        s.dialogueTimer = 0;
      }
    }
    const p = s.player;
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
    air.update(dt);
    crew.tick(dt);
    race.update(dt);
    updateAllies(dt);
    updateBullets(dt);
    if (s.wastedFlag) {
      s.wastedFlag = false;
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
    s.sirenOn = s.wanted > 0 && (s.cops.length > 0 || s.cars.some((c) => c.driver === 'police'));
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
      const w = p.weapon || 1;
      const ma = Math.atan2(p.aimY - p.y, p.aimX - p.x);
      const muzzle = (n, r) => burst(p.x + Math.cos(ma) * 26, p.y + Math.sin(ma) * 26, '#ffe9a3', n, r);
      let fired = true;
      if (w === 6 && p.rpg > 0) {
        p.shootCd = 1.1; p.rpg -= 1;
        fireBullet(p.x, p.y, p.aimX, p.aimY, 'player', 120, 700, true);
      } else if (w === 3) {
        p.shootCd = 0.09;
        fireBullet(p.x, p.y, p.aimX, p.aimY, 'player', 10, 1000);
      } else if (w === 5 && p.pistol && p.mag > 0) {
        p.shootCd = 0.28; p.mag -= 1;
        fireBullet(p.x, p.y, p.aimX, p.aimY, 'player', 34, 1100);
      } else if (w === 4 && p.shotgun > 0) {
        p.shootCd = 0.7;
        p.shotgun -= 1;
        for (let i = -2; i <= 2; i += 1) {
          const a = ma + i * 0.07;
          state.bullets.push({ x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24, vx: Math.cos(a) * 800, vy: Math.sin(a) * 800, life: 0.5, from: 'player', damage: 12 });
        }
        muzzle(7, 180);
      } else if (w === 2 && p.pistol && p.mag > 0) {
        p.shootCd = 0.2;
        p.mag -= 1;
        fireBullet(p.x, p.y, p.aimX, p.aimY, 'player', PLAYER.pistolDamage, 950);
        muzzle(4, 140);
      } else fired = false;
      if (fired) { state.shotFired = true; state.shotSound = true; }
    }
    if (input.reload && p.pistol && p.mag < PLAYER.magSize && p.reloadT <= 0) p.reloadT = 0.9;
    return events;
  }

  function punch() {
    const p = state.player;
    const range = p.weapon === 1 ? 70 : PLAYER.punchRange;
    const dmg = p.weapon === 1 ? 30 : PLAYER.punchDamage;
    const tryHit = (target, damage, isCrime) => {
      const d = Math.hypot(target.x - p.x, target.y - p.y);
      if (d > range + target.radius) return false;
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
    for (const rival of state.rivals) tryHit(rival, dmg, false);
    for (const cop of state.cops) tryHit(cop, dmg, true);
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

  function fireBullet(x, y, tx, ty, from, damage, speed, rocket) {
    if (state.bullets.length >= 60) return;
    const ang = Math.atan2(ty - y, tx - x);
    const spread = from === 'player' ? 0.015 : 0.12;
    const a = ang + (rng.next() - 0.5) * spread * 2;
    state.bullets.push({ x: x + Math.cos(a) * 24, y: y + Math.sin(a) * 24, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.9, from, damage, rocket: !!rocket });
  }

  function updateDriving(dt, input) {
    const p = state.player;
    const car = playerCar();
    if (!car) {
      p.onFoot = true;
      return 0;
    }
    const s = state;
    const spec = CAR_KINDS[car.kind];
    const L = spec.length, W = spec.width;
    let ca = Math.cos(car.angle), sa = Math.sin(car.angle);
    const top = spec.topSpeed * (1 + 0.15 * (s.upgrades.engine || 0));
    const throttle = (input.up ? 1 : 0) - (input.down ? 0.65 : 0);
    if (throttle > 0) car.speed += spec.accel * throttle * dt;
    else if (throttle < 0) car.speed += spec.accel * throttle * dt * 1.4;
    else car.speed -= car.speed * 0.9 * dt;
    if (throttle > 0 && Math.abs(car.speed) > 120 && rng.chance(0.12)) {
      s.particles.push({ x: car.x - ca * (L / 2), y: car.y - sa * (L / 2), vx: -ca * 40, vy: -sa * 40, life: 0.5, maxLife: 0.5, color: '#9a9a9a', size: 3 });
    }
    if (car.health < 40 && !car.smoked && rng.chance(0.25)) {
      s.particles.push({ x: car.x + ca * (L / 2), y: car.y + sa * (L / 2), vx: 0, vy: -30, life: 0.7, maxLife: 0.7, color: '#3a3a3a', size: 4 });
    }
    car.speed -= car.speed * 0.12 * dt;
    car.speed = Math.max(-top * 0.4, Math.min(top, car.speed));
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const grip = Math.min(1, Math.abs(car.speed) / 220);
    car.angle += steer * spec.turn * grip * dt * (car.speed >= 0 ? 1 : -1);
    ca = Math.cos(car.angle); sa = Math.sin(car.angle);
    if (steer !== 0 && Math.abs(car.speed) > 260) {
      const px = -sa, py = ca;
      const bx = car.x - ca * (L / 2 - 4), by = car.y - sa * (L / 2 - 4);
      for (const side of [-1, 1]) s.skids.push({ x: bx + px * side * (W / 2 - 3), y: by + py * side * (W / 2 - 3), angle: car.angle, life: 4 });
      if (s.skids.length > 400) s.skids.splice(0, s.skids.length - 400);
      if (car.driver === 'player' && s.skidCd <= 0) { s.skidSound = true; s.skidCd = 0.8; }
    }
    if (s.nitrousT > 0) {
      s.nitrousT -= dt;
      car.speed = Math.min(top * 1.6, car.speed + 900 * dt);
      s.particles.push({ x: car.x - ca * (L / 2), y: car.y - sa * (L / 2), vx: -ca * 120, vy: -sa * 120, life: 0.4, maxLife: 0.4, color: '#2e7bff', size: 4 });
    }
    if (input.shoot && p.weapon === 3 && p.shootCd <= 0) {
      p.shootCd = 0.12;
      fireBullet(car.x, car.y, input.aimX !== undefined ? input.aimX : p.aimX, input.aimY !== undefined ? input.aimY : p.aimY, 'player', 10, 1000);
      s.shotSound = true;
    }
    const nx = car.x + ca * car.speed * dt, ny = car.y + sa * car.speed * dt;
    const before = Math.abs(car.speed);
    const body = { x: nx, y: ny, radius: 20 };
    if (resolveBuildings(city.buildings, body)) {
      if (before > 240) {
        car.health -= (before - 240) / 12;
        burst(body.x, body.y, '#ffd23d', 10, 260);
        s.crashLoud = true;
        if (car.driver === 'player') s.shake = 12;
      }
      car.speed *= 0.35;
    }
    car.x = Math.max(24, Math.min(WORLD.width - 24, body.x));
    car.y = Math.max(24, Math.min(WORLD.height - 24, body.y));
    for (const other of s.cars) {
      if (other === car) continue;
      const d = Math.hypot(other.x - car.x, other.y - car.y);
      if (d < 44 && d > 0.01) {
        const overlap = 44 - d, ux = (car.x - other.x) / d, uy = (car.y - other.y) / d;
        car.x += ux * overlap * 0.25;
        car.y += uy * overlap * 0.25;
        other.x -= ux * overlap * 0.75;
        other.y -= uy * overlap * 0.75;
        if (Math.abs(car.speed) > 200) {
          other.speed = car.speed * 0.4;
          car.speed *= 0.7;
          burst(car.x, car.y, '#ffd23d', 6, 200);
        }
      } else if (car.driver === 'player' && other.driver === 'traffic' && d < 75 && Math.abs(car.speed) > 300 && s.nearMissCd <= 0) {
        s.nearMissCd = 2;
        if (s.nearMissStreakT > 0) s.nearMissStreak += 1;
        else s.nearMissStreak = 1;
        s.nearMissStreakT = 5;
        const bonus = Math.min(30, 5 + s.nearMissStreak * 5);
        s.cash += bonus;
        floatText(car.x, car.y - 30, `+$${bonus}`, '#57d977');
        showBanner(s.nearMissStreak > 1 ? `Near miss x${s.nearMissStreak}!  +$${bonus}` : `Near miss!  +$${bonus}`, 1.2);
      }
    }
    for (const ped of s.peds) {
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
      spawnBurningWreck(s, car.x, car.y, car.angle);
      car.speed = 0;
      burst(car.x, car.y, '#888888', 16, 260);
      burst(car.x, car.y, '#ffd23d', 10, 300);
      burst(car.x, car.y, '#ff5a3c', 8, 200);
      s.shake = Math.max(s.shake, 8);
      showBanner('Wrecked — find another ride', 2.5);
    }
    p.x = car.x;
    p.y = car.y;
    p.angle = car.angle;
    p.aimX = car.x + ca * 120;
    p.aimY = car.y + sa * 120;
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
        const roads = car.road === 'v' ? STREETS : AVENUES;
        const pos = car.road === 'v' ? car.y : car.x;
        for (const line of roads) {
          if (Math.abs(pos - line) < 34 && rng.chance(0.3)) {
            car.road = car.road === 'v' ? 'h' : 'v';
            car.line = line;
            car.dir = rng.chance(0.5) ? 1 : -1;
            if (car.road === 'h') { car.angle = car.dir === 1 ? 0 : Math.PI; car.y = line + (car.dir === 1 ? 25 : -25); }
            else { car.angle = car.dir === 1 ? Math.PI / 2 : -Math.PI / 2; car.x = line + (car.dir === 1 ? -25 : 25); }
            car.turnCd = 4;
            break;
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

  function updateAllies(dt) {
    for (const car of state.cars) {
      if (car.driver !== 'ally') continue;
      car.allyT -= dt;
      if (car.allyT <= 0) { car.driver = 'traffic'; car.targetSpeed = 220; continue; }
      let target = null, best = 800;
      for (const cop of state.cops) { const d = Math.hypot(cop.x - car.x, cop.y - car.y); if (d < best) { best = d; target = cop; } }
      for (const rival of state.rivals) { const d = Math.hypot(rival.x - car.x, rival.y - car.y); if (d < best) { best = d; target = rival; } }
      if (!target) continue;
      const want = Math.atan2(target.y - car.y, target.x - car.x);
      let diff = want - car.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff));
      car.speed = Math.min(520, car.speed + 480 * dt);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
      car.hitT -= dt;
      if (best < 48 && car.hitT <= 0) {
        car.hitT = 0.6;
        target.health -= 30;
        burst(target.x, target.y, '#ffd23d', 8, 200);
        car.speed *= 0.5;
      }
    }
  }

  function clearHeat(x, y) {
    const s = state, p = s.player;
    s.wantedPoints = 0;
    s.wanted = 0;
    s.cops = [];
    s.courier = null;
    keepObjective();
    for (const car of s.cars) if (car.driver === 'police') { car.driver = 'parked'; car.speed = 0; }
    p.health = PLAYER.health;
    if (!p.onFoot) {
      const car = playerCar();
      if (car) car.driver = 'parked';
      p.onFoot = true;
      p.carId = 0;
    }
    p.x = x;
    p.y = y;
    p.angle = -Math.PI / 2;
  }

  function bustPlayer() {
    const fine = Math.min(state.cash, Math.max(50, Math.floor(state.cash * 0.15)));
    state.cash -= fine;
    clearHeat(2070, 1150);
    showBanner(`BUSTED — NBPD took $${fine} in fines`, 3);
    return EVENT_BUSTED;
  }

  function updateRivals(dt) {
    const p = state.player, s = state;
    for (let i = s.rivals.length - 1; i >= 0; i -= 1) {
      const rival = s.rivals[i];
      if (rival.health <= 0) {
        burst(rival.x, rival.y, '#a83232', 10, 200);
        spawnPickup('cash', rival.x, rival.y, rng.int(40, 90));
        s.rivals.splice(i, 1);
        s.rivalsLeft = Math.max(0, s.rivalsLeft - 1);
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
    return 0;
  }

  function updateBullets(dt) {
    const p = state.player, s = state;
    for (let i = s.bullets.length - 1; i >= 0; i -= 1) {
      const b = s.bullets[i];
      const px = b.x, py = b.y;
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
          for (const rival of s.rivals) {
            if (hitCircle(rival)) { rival.health -= b.damage; burst(b.x, b.y, '#a83232', 6, 160); dead = true; break; }
          }
          if (!dead) for (const cop of s.cops) {
            if (hitCircle(cop)) {
              cop.health -= b.damage;
              addWanted(1);
              burst(b.x, b.y, '#2f6fd0', 6, 160);
              dead = true;
              break;
            }
          }
          if (!dead) for (const ped of s.peds) {
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
          if (!dead) for (const car of s.cars) {
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
          s.hurtFlash = 1;
          burst(p.x, p.y, '#c94f43', 6, 160);
          dead = true;
          if (p.health <= 0) {
            p.health = 0;
            wastePlayer();
          }
        }
      }
      if (dead) {
        if (b.rocket) detonateHydraRpg(s, b.x, b.y);
        s.bullets.splice(i, 1);
      }
    }
  }

  function wastePlayer() {
    const s = state;
    const lost = Math.min(s.cash, Math.max(25, Math.floor(s.cash * 0.08)));
    s.cash -= lost;
    clearHeat(1470, 640);
    showBanner(`WASTED — Neon Bay General, $${lost} lighter`, 3);
    s.wastedFlag = true;
  }

  function updateFare(dt) {
    const p = state.player, s = state;
    const car = playerCar();
    const inTaxi = !p.onFoot && car && car.kind === 'taxi';
    if (!inTaxi) {
      if (s.fare) {
        if (s.fare.ped) s.fare.ped.hailing = false;
        s.fare = null;
        keepObjective();
      }
      return;
    }
    if (s.fare) {
      const f = s.fare;
      if (f.stage === 'pickup') {
        const ped = f.ped;
        if (!ped || ped.down > 0) {
          if (ped) ped.hailing = false;
          s.fare = null;
          return;
        }
        s.objective = { x: ped.x, y: ped.y, label: 'Taxi: pick up the passenger' };
        if (Math.hypot(p.x - ped.x, p.y - ped.y) < 70) {
          const dest = randomSidewalkPoint(rng);
          f.stage = 'deliver';
          f.x = dest.x; f.y = dest.y;
          f.timer = 45;
          f.reward = rng.int(80, 150);
          s.peds.splice(s.peds.indexOf(ped), 1);
          showBanner('Passenger aboard — deliver in 45s!', 2.5);
        }
        return;
      }
      f.timer -= dt;
      s.objective = { x: f.x, y: f.y, label: `Taxi fare — ${Math.max(0, Math.ceil(f.timer))}s` };
      if (Math.hypot(p.x - f.x, p.y - f.y) < 75) {
        s.cash += f.reward;
        floatText(p.x, p.y - 30, `+$${f.reward}`, '#57d977');
        showBanner(`Fare complete — +$${f.reward}`, 2.5);
        s.fare = null;
        keepObjective();
        s.fareCd = 30;
        return;
      }
      if (f.timer <= 0) {
        showBanner('Fare expired', 2.5);
        if (f.ped) f.ped.hailing = false;
        s.fare = null;
        keepObjective();
        s.fareCd = 20;
      }
      return;
    }
    s.fareCd -= dt;
    if (s.fareCd <= 0) {
      const candidates = s.peds.filter((ped) => ped.down <= 0);
      if (candidates.length === 0) return;
      const ped = candidates[Math.floor(rng.next() * candidates.length)];
      ped.hailing = true;
      s.fare = { ped, stage: 'pickup' };
      showBanner('Taxi fare — passenger hailing you', 2.5);
      s.fareCd = 9999;
    }
  }

  function updateCourier(dt) {
    const s = state;
    if (!s.storyDone) return;
    if (s.courier) {
      const c = s.courier;
      c.timer -= dt;
      s.objective = { x: c.x, y: c.y, label: `Courier delivery — ${Math.max(0, Math.ceil(c.timer))}s` };
      const p = s.player;
      if (Math.hypot(p.x - c.x, p.y - c.y) < 75) {
        s.cash += c.reward;
        floatText(p.x, p.y - 30, `+$${c.reward}`, '#57d977');
        showBanner(`Courier done — +$${c.reward}`, 2.5);
        s.courier = null;
        s.objective = null;
        s.courierCd = 35;
        return;
      }
      if (c.timer <= 0) {
        showBanner('Courier job expired', 2.5);
        s.courier = null;
        s.objective = null;
        s.courierCd = 25;
      }
      return;
    }
    s.courierCd -= dt;
    if (s.courierCd <= 0) {
      const spot = randomSidewalkPoint(rng);
      spawnPickup('courier', spot.x, spot.y, 0);
      showBanner('Courier job — grab the package', 2.5);
      s.courierCd = 9999;
    }
  }

  function updatePickups(dt) {
    const p = state.player, s = state;
    for (let i = s.pickups.length - 1; i >= 0; i -= 1) {
      const item = s.pickups[i];
      item.bob += dt * 3;
      if (Math.hypot(item.x - p.x, item.y - p.y) > 46) continue;
      if (item.kind === 'repair' && p.onFoot) continue;
      s.pickupSound = true;
      if (item.kind === 'health') {
        if (p.health >= PLAYER.health) continue;
        p.health = Math.min(PLAYER.health, p.health + item.amount);
        showBanner(`Health +${item.amount}`, 1.5);
      } else if (item.kind === 'ammo') {
        p.mag = PLAYER.magSize;
        p.rpg = Math.min(5, p.rpg + 2);
        showBanner('Ammo restocked', 1.5);
      } else if (item.kind === 'shotgun') {
        p.shotgun = item.amount;
        showBanner('Shotgun acquired', 2);
      } else if (item.kind === 'armor') {
        p.armor = item.amount;
        showBanner('Armor vest — half damage', 2);
      } else if (item.kind === 'repair') {
        const car = playerCar();
        if (!car) continue;
        car.health = Math.min(100, car.health + item.amount);
        showBanner(`Car repaired +${item.amount} HP`, 1.5);
      } else if (item.kind === 'cash') {
        s.cash += item.amount;
        s.cashSound = true;
        s.pickupSound = false;
        floatText(p.x, p.y - 30, `+$${item.amount}`, '#57d977');
        showBanner(`+$${item.amount}`, 1.2);
        const spot = randomSidewalkPoint(rng);
        spawnPickup('cash', spot.x, spot.y, rng.int(30, 90));
      } else if (item.kind === 'crate') {
        s.hasCrate = true;
        s.wantedPoints = 8;
        s.wanted = 4;
        s.lastCrime = s.time;
        showBanner('Crate grabbed — NBPD is coming!', 3);
        const mission = MISSIONS[s.missionIndex];
        const stage = mission.stages[s.stageIndex];
        s.objective = { x: stage.x, y: stage.y, label: stage.label };
      } else if (item.kind === 'courier') {
        const dest = randomSidewalkPoint(rng);
        s.courier = { x: dest.x, y: dest.y, timer: 40, reward: rng.int(120, 200) };
        s.objective = { x: dest.x, y: dest.y, label: `Courier delivery — ${Math.ceil(s.courier.timer)}s` };
        showBanner('Courier job — deliver in 40s!', 3);
      }
      s.pickups.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    const s = state;
    for (let i = s.particles.length - 1; i >= 0; i -= 1) {
      const pt = s.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      pt.life -= dt;
      if (pt.life <= 0) s.particles.splice(i, 1);
    }
    for (let i = s.skids.length - 1; i >= 0; i -= 1) {
      s.skids[i].life -= dt;
      if (s.skids[i].life <= 0) s.skids.splice(i, 1);
    }
  }

  function updateWanted(dt) {
    const s = state;
    if (s.wantedPoints <= 0) return 0;
    const p = s.player;
    let nearestCop = Infinity;
    for (const cop of s.cops) nearestCop = Math.min(nearestCop, Math.hypot(cop.x - p.x, cop.y - p.y));
    for (const car of s.cars) if (car.driver === 'police') nearestCop = Math.min(nearestCop, Math.hypot(car.x - p.x, car.y - p.y));
    if (s.time - s.lastCrime > WANTED.coolDelay && nearestCop > WANTED.spotRange) {
      s.wantedPoints = Math.max(0, s.wantedPoints - WANTED.coolRate * dt);
      s.wanted = Math.min(5, Math.floor(s.wantedPoints / 2));
    }
    return 0;
  }

  function updateMissions(dt) {
    if (!state.missionActive) return 0;
    const s = state;
    const mission = MISSIONS[s.missionIndex];
    const stage = mission.stages[s.stageIndex];
    const p = s.player;
    if (stage.kind === 'go') {
      if (Math.hypot(p.x - stage.x, p.y - stage.y) < 75) return completeStage();
    } else if (stage.kind === 'kill') {
      if (s.rivalsLeft <= 0 && s.rivals.length === 0) return completeStage();
      if (s.rivals.length > 0) s.objective = { x: s.rivals[0].x, y: s.rivals[0].y, label: stage.label };
    } else if (stage.kind === 'steal') {
      if (p.carId === s.targetCarId) return completeStage();
    } else if (stage.kind === 'deliver') {
      const car = playerCar();
      if (car && car.kind === (stage.carKind || 'sports') && Math.hypot(p.x - stage.x, p.y - stage.y) < 75) return completeStage();
    } else if (stage.kind === 'survive') {
      s.stageTimer -= dt;
      s.objective = { x: p.x, y: p.y, label: `${stage.label} — ${Math.max(0, Math.ceil(s.stageTimer))}s` };
      if (s.stageTimer <= 0) {
        s.wantedPoints = 0;
        s.wanted = 0;
        s.cops = [];
        for (const car of s.cars) if (car.driver === 'police') { car.driver = 'parked'; car.speed = 0; }
        showBanner('You shook them — now get home', 2.5);
        return completeStage();
      }
    } else if (stage.kind === 'carry') {
      if (s.hasCrate && Math.hypot(p.x - stage.x, p.y - stage.y) < 75) {
        s.hasCrate = false;
        return completeStage();
      }
    }
    return 0;
  }

  function maintainCrowd() {
    const p = state.player;
    const near = (e) => Math.hypot(e.x - p.x, e.y - p.y) < 1000;
    let nearCars = 0, nearPeds = 0;
    for (const c of state.cars) if (c.driver === 'traffic' && near(c)) nearCars += 1;
    for (const ped of state.peds) if (near(ped)) nearPeds += 1;
    while (nearCars < 14 && state.cars.length < 34) { spawnTrafficCar(p); nearCars += 1; }
    while (state.cars.filter((c) => c.driver === 'traffic').length < TRAFFIC_COUNT) spawnTrafficCar(p);
    while (nearPeds < 18 && state.peds.length < 44) { spawnPed(); nearPeds += 1; }
    while (state.peds.length < PED_COUNT) spawnPed();
  }

  function saveGame() {
    const p = state.player;
    return { cash: state.cash, health: p.health, missionIndex: state.missionIndex, pistol: p.pistol, shotgun: p.shotgun, x: p.x, y: p.y, storyDone: state.storyDone };
  }

  function loadGame(save) {
    reset();
    const pl = state.player;
    state.cash = save.cash ?? 120;
    pl.health = save.health ?? PLAYER.health;
    pl.pistol = !!save.pistol;
    if (pl.pistol) pl.weapon = 2;
    pl.shotgun = save.shotgun ?? 0;
    if (pl.pistol) pl.mag = PLAYER.magSize;
    pl.x = save.x ?? 870;
    pl.y = save.y ?? 640;
    state.storyDone = !!save.storyDone;
    const index = Math.min(save.missionIndex ?? 0, MISSIONS.length - 1);
    if (!state.storyDone) startMission(index);
  }

  reset();
  return {
    state, city, step, reset, startMission, nearestCar, playerCar, enterCar, exitCar, saveGame, loadGame,
    sys: { air, wheel, district, crew, garage, race, radio },
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
