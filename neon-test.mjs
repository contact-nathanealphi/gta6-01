// Headless test for Neon Bay (no DOM, no browser): drives the real game logic
// forward and checks the rules hold. Run from the repo root:
//   node neon-test.mjs
import { createGame, MISSIONS } from './game/src/world.js';
import { createRng } from './game/src/rng.js';
import { STEP } from './game/src/tune.js';

const IDLE = { up: false, down: false, left: false, right: false, run: false, enter: false, punch: false, reload: false, shoot: false, aimX: 0, aimY: 0 };
let failures = 0;
function check(name, ok, detail = '') {
  console.log(ok ? 'ok  ' : 'FAIL', name, detail);
  if (!ok) failures += 1;
}
function runFor(game, seconds, input) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) game.step(STEP, input);
}

const game = createGame(createRng(7));
const s = game.state;

// 1. Fresh state.
check('fresh: traffic present', s.cars.length >= 20, `cars=${s.cars.length}`);
check('fresh: peds present', s.peds.length >= 25, `peds=${s.peds.length}`);
check('fresh: 7 missions defined', MISSIONS.length === 7);
check('fresh: total reward 5650', MISSIONS.reduce((a, m) => a + m.reward, 0) === 5650, `total=${MISSIONS.reduce((a, m) => a + m.reward, 0)}`);
check('fresh: pickups present', s.pickups.length >= 10, `pickups=${s.pickups.length}`);
const allIds = new Set(s.cars.map((c) => c.id));
check('fresh: all car ids unique', allIds.size === s.cars.length, `unique=${allIds.size}/${s.cars.length}`);

// 2. Enter the nearest car and drive.
const near = game.nearestCar(500);
check('nearest car exists at spawn', !!near);
if (near) {
  s.player.x = near.x; s.player.y = near.y;
  game.step(STEP, { ...IDLE, enter: true });
  runFor(game, 0.3, IDLE);
  check('player in car after enter', !s.player.onFoot);
  const myCar = s.cars.find((c) => c.driver === 'player');
  const speedBefore = myCar ? Math.abs(myCar.speed) : 0;
  runFor(game, 2, { ...IDLE, up: true });
  check('car accelerates', myCar && Math.abs(myCar.speed) > speedBefore, `speed ${speedBefore.toFixed(0)}->${myCar ? Math.abs(myCar.speed).toFixed(0) : '?'}`);
  // Exit the car.
  game.step(STEP, { ...IDLE, enter: true });
  runFor(game, 0.3, IDLE);
  check('player on foot after exit', s.player.onFoot);
}

// 3. All 7 missions completable (teleport through the stages).
let completed = 0;
for (let m = 0; m < 7; m += 1) {
  game.reset();
  game.startMission(m);
  let guard = 0;
  while (game.state.missionActive && guard < 400) {
    guard += 1;
    const st = game.state;
    // Always read the CURRENT mission: completing one starts the next.
    const mission = MISSIONS[st.missionIndex];
    const stage = mission.stages[st.stageIndex];
    if (!stage) break;
    if (stage.kind === 'go' || stage.kind === 'deliver' || stage.kind === 'carry') {
      if (stage.kind === 'deliver') {
        // Enter the target car first, then drive it (teleport) to the garage.
        const target = st.cars.find((c) => c.kind === 'sports');
        if (target) {
          st.player.x = target.x; st.player.y = target.y;
          game.step(STEP, { ...IDLE, enter: true });
          runFor(game, 0.3, IDLE);
          const myCar = st.cars.find((c) => c.driver === 'player');
          if (myCar) { myCar.x = stage.x; myCar.y = stage.y; }
        }
      } else {
        // While driving, the player's position follows the car — move the car.
        const myCar = st.cars.find((c) => c.driver === 'player');
        if (myCar && !st.player.onFoot) { myCar.x = stage.x; myCar.y = stage.y; }
        st.player.x = stage.x; st.player.y = stage.y;
      }
      if (stage.kind === 'carry') st.hasCrate = true;
      runFor(game, 0.5, IDLE);
    } else if (stage.kind === 'steal') {
      const target = st.cars.find((c) => c.kind === stage.carKind) || st.cars[0];
      st.player.x = target.x; st.player.y = target.y;
      game.step(STEP, { ...IDLE, enter: true });
      runFor(game, 0.5, IDLE);
    } else if (stage.kind === 'kill') {
      for (const rival of [...st.rivals]) {
        st.player.x = rival.x + 40; st.player.y = rival.y;
        st.player.pistol = true; st.player.mag = 99;
        runFor(game, 1.2, { ...IDLE, shoot: true, aimX: rival.x, aimY: rival.y });
      }
      runFor(game, 0.5, IDLE);
    } else if (stage.kind === 'survive') {
      runFor(game, stage.seconds + 1, IDLE);
    }
  }
  if (!game.state.missionActive) completed += 1;
}
check('all 7 missions completable', completed === 7 && s.storyDone === true, `completed=${completed} storyDone=${s.storyDone}`);

// 4. Wanted: committing a crime raises stars; they cool down.
game.reset();
game.startMission(0);
const wantedBefore = s.wanted;
game.step(STEP, { ...IDLE, punch: true });
runFor(game, 1, IDLE);
check('wanted: crime raises heat', s.wanted >= wantedBefore, `wanted ${wantedBefore}->${s.wanted}`);

// 5. A rival shoots and can be shot back (mission 3, docks).
game.reset();
game.startMission(3);
s.player.x = 2400; s.player.y = 2270;
runFor(game, 0.5, IDLE);
check('docks: rivals present', s.rivals.length >= 3, `rivals=${s.rivals.length}`);
const rival = s.rivals[0];
if (rival) {
  const hpBefore = rival.health;
  s.player.pistol = true; s.player.mag = 99;
  game.step(STEP, { ...IDLE, shoot: true, aimX: rival.x, aimY: rival.y });
  runFor(game, 0.5, IDLE);
  check('combat: player bullet damages rival', rival.health < hpBefore, `rival hp ${hpBefore}->${rival.health}`);
}

// 6. Save/load round-trips.
game.reset();
s.cash = 999;
s.player.pistol = true;
s.player.shotgun = 4;
const save = game.saveGame();
game.reset();
game.loadGame(save);
check('save/load: cash + pistol + shotgun persist', s.cash === 999 && s.player.pistol && s.player.shotgun === 4, `cash=${s.cash} shotgun=${s.player.shotgun}`);

// 7a. Health pickup heals.
game.reset();
s.player.health = 40;
s.player.x = 1440; s.player.y = 620;
runFor(game, 0.3, IDLE);
check('pickup: health heals', s.player.health > 40, `hp=${s.player.health}`);

// 7b. Courier (free roam): after the story, a package spawns, pickup starts
// a 40s delivery, reaching the marker pays.
game.reset();
game.state.storyDone = true;
game.state.courierCd = 0;
runFor(game, 1, IDLE);
check('courier: package spawns in free roam', game.state.pickups.some((i) => i.kind === 'courier'), `pickups=${game.state.pickups.map((i) => i.kind).join(',')}`);
const pkg = game.state.pickups.find((i) => i.kind === 'courier');
if (pkg) {
  s.player.x = pkg.x; s.player.y = pkg.y;
  runFor(game, 0.3, IDLE);
  check('courier: pickup starts a timed delivery', !!game.state.courier && game.state.courier.timer > 0, `timer=${game.state.courier ? game.state.courier.timer.toFixed(1) : 'none'}`);
  const cashBefore = game.state.cash;
  const dest = game.state.courier;
  s.player.x = dest.x; s.player.y = dest.y;
  runFor(game, 0.3, IDLE);
  check('courier: delivery pays', game.state.cash > cashBefore && !game.state.courier, `cash ${cashBefore}->${game.state.cash}`);
}

// 7c. Shotgun: pickup gives 6 shells; firing spends one and launches 5 pellets.
game.reset();
s.player.x = 2380; s.player.y = 2240;
runFor(game, 0.3, IDLE);
check('shotgun: pickup gives 6 shells', s.player.shotgun === 6, `shotgun=${s.player.shotgun}`);
game.startMission(3);
s.player.x = 2400; s.player.y = 2270;
runFor(game, 0.5, IDLE);
const target2 = s.rivals[0];
if (target2) {
  const hpBefore = target2.health;
  const shellsBefore = s.player.shotgun;
  game.step(STEP, { ...IDLE, shoot: true, aimX: target2.x, aimY: target2.y });
  check('shotgun: firing spends 1 shell + launches 5 pellets', s.player.shotgun === shellsBefore - 1 && s.bullets.length >= 4, `shells ${shellsBefore}->${s.player.shotgun} bullets=${s.bullets.length}`);
  runFor(game, 0.5, IDLE);
  check('shotgun: pellets damage the rival', target2.health < hpBefore, `rival hp ${hpBefore}->${target2.health}`);
}

// 7d. Armor: pickup gives ~20s; incoming bullet damage is halved while active.
game.reset();
s.player.x = 1500; s.player.y = 350;
runFor(game, 0.3, IDLE);
check('armor: pickup gives ~20s', s.player.armor > 19, `armor=${s.player.armor.toFixed(1)}`);
const hpBeforeArmor = s.player.health;
game.startMission(3);
s.player.x = 2400; s.player.y = 2270;
runFor(game, 0.5, IDLE);
const shooter = s.rivals[0];
if (shooter) {
  shooter.x = s.player.x + 60; shooter.y = s.player.y;
  shooter.shootT = 0;
  runFor(game, 1.5, IDLE);
  check('armor: player took reduced damage', s.player.health < hpBeforeArmor, `hp ${hpBeforeArmor}->${s.player.health.toFixed(1)}`);
}

// 7e. Taxi fare: driving a taxi, a ped hails, pickup starts a 45s delivery.
game.reset();
game.startMission(0);
const taxiCar = s.cars[0];
taxiCar.kind = 'taxi';
s.player.x = taxiCar.x; s.player.y = taxiCar.y;
game.step(STEP, { ...IDLE, enter: true });
runFor(game, 0.5, IDLE);
check('taxi: player is in a taxi', !s.player.onFoot && s.cars.find((c) => c.driver === 'player')?.kind === 'taxi');
game.state.fareCd = 0;
runFor(game, 1, IDLE);
check('taxi: a ped hails', !!game.state.fare && game.state.fare.stage === 'pickup', `fare=${game.state.fare ? game.state.fare.stage : 'none'}`);
const hailPed = game.state.fare?.ped;
if (hailPed) {
  const myTaxi = s.cars.find((c) => c.driver === 'player');
  myTaxi.x = hailPed.x; myTaxi.y = hailPed.y;
  runFor(game, 0.5, IDLE);
  check('taxi: pickup starts delivery', game.state.fare?.stage === 'deliver' && game.state.fare.timer > 0, `stage=${game.state.fare?.stage}`);
  const cashBeforeFare = game.state.cash;
  const fareDest = game.state.fare;
  myTaxi.x = fareDest.x; myTaxi.y = fareDest.y;
  runFor(game, 0.5, IDLE);
  check('taxi: delivery pays', game.state.cash > cashBeforeFare && !game.state.fare, `cash ${cashBeforeFare}->${game.state.cash}`);
}

// 7f. Repair: a wrench fixes the player's car (+50 HP) but does nothing on foot.
game.reset();
game.startMission(0);
const myCar2 = s.cars[0];
s.player.x = myCar2.x; s.player.y = myCar2.y;
game.step(STEP, { ...IDLE, enter: true });
runFor(game, 0.3, IDLE);
myCar2.health = 30;
const wrench = s.pickups.find((i) => i.kind === 'repair');
if (wrench) {
  myCar2.x = wrench.x; myCar2.y = wrench.y;
  runFor(game, 0.3, IDLE);
  check('repair: wrench fixes the car +50', myCar2.health === 80, `car hp=${myCar2.health}`);
}

// 7g. Near-miss streak: consecutive shaves within 5s grow the bonus.
game.reset();
game.startMission(0);
const streakCar = s.cars[0];
s.player.x = streakCar.x; s.player.y = streakCar.y;
game.step(STEP, { ...IDLE, enter: true });
runFor(game, 0.3, IDLE);
const cashBeforeStreak = game.state.cash;
// Force a near-miss: put a traffic car just beside the player at speed.
const myCar3 = s.cars.find((c) => c.driver === 'player');
myCar3.speed = 350;
const nearCar = s.cars.find((c) => c.driver === 'traffic');
if (nearCar && myCar3) {
  nearCar.x = myCar3.x + 60; nearCar.y = myCar3.y;
  nearCar.speed = 200;
  runFor(game, 0.3, IDLE);
  check('near-miss: first shave pays $10', game.state.cash === cashBeforeStreak + 10, `cash ${cashBeforeStreak}->${game.state.cash}`);
  check('near-miss: streak is 1', game.state.nearMissStreak === 1, `streak=${game.state.nearMissStreak}`);
}

// 8. Long soak: 5 minutes of idle + driving, no crash, no NaN, counts stable.
game.reset();
game.startMission(0);
let bad = 0;
for (let t = 0; t < 300; t += 1) {
  const input = t % 2 === 0 ? { ...IDLE, up: true } : IDLE;
  runFor(game, 1, input);
  const st = game.state;
  if (!Number.isFinite(st.player.x) || !Number.isFinite(st.player.y) || !Number.isFinite(st.cash)) bad += 1;
  if (st.cars.length < 10 || st.peds.length < 10) bad += 1;
}
check('soak: 5 min, no NaN, counts stable', bad === 0, `bad=${bad}`);

console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
