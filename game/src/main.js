// Boot and the one loop. ?seed=N fixes the city; ?shot= stages a scene for screenshots.
import { SAVE_KEY, STEP } from './tune.js';
import { createRng } from './rng.js';
import { createGame, EVENT_BUSTED, EVENT_MISSION, EVENT_STORY, EVENT_WASTED } from './world.js';
import { createInput, PRESS_CONFIRM, PRESS_ENTER, PRESS_GARAGE, PRESS_HORN, PRESS_MUTE, PRESS_PAUSE, PRESS_PUNCH, PRESS_RELOAD, PRESS_SAVE } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_BUSTED, SCREEN_COMPLETE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WASTED } from './render.js';
import { createWebGL3DViceDuskRenderer } from './renderer/webgl3d.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRng(seed));
window.__game = game;
const timeParam = Number.parseInt(params.get('time') ?? '', 10);
if (Number.isInteger(timeParam) && timeParam >= 0) game.state.time = timeParam;
const renderer = createRenderer(canvas);
const audio = createAudio();
game.sys.radio.attach(audio);
let gl3d = null;
const gl3dReady = createWebGL3DViceDuskRenderer(canvas).then((r) => {
  gl3d = r;
  if (gl3d) gl3d.init(game.city);
  return gl3d;
}).catch(() => { gl3d = null; return null; });

function syncWorld3D(state, screen) {
  if (!gl3d) return;
  gl3d.draw(state, game.city, screen);
  const is3d = gl3d.mode !== 2;
  renderer.setWorld3D(is3d);
  gl3d.setVisible(is3d);
}

function readSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSave() {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(game.saveGame()));
    return true;
  } catch {
    return false;
  }
}

async function runShot(name) {
  const scene = stageShot(name, game);
  if (Number.isInteger(timeParam) && timeParam >= 0) game.state.time = timeParam;
  await Promise.race([gl3dReady, new Promise((res) => setTimeout(res, 3000))]);
  let painted = 0;
  function paint() {
    const nearCar = game.state.player.onFoot ? game.nearestCar(85) : null;
    syncWorld3D(game.state, scene.screen);
    renderer.draw(game.state, game.city, scene.screen, { hasSave: false, nearCar: nearCar ? `Steal the ${nearCar.kind}` : null, mouse: null, sys: game.sys });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let save = readSave();
  let accumulator = 0;
  let last = performance.now();
  let wheelWasOpen = false;
  let pendingSlot = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startFresh() {
    game.reset();
    save = null;
    try { window.localStorage.removeItem(SAVE_KEY); } catch { /* storage can be off */ }
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Neon Bay. Mission 1: First Delivery.');
  }

  function startContinued() {
    const kept = readSave();
    if (kept) game.loadGame(kept);
    else game.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Neon Bay. Welcome back, Rico.');
  }

  function handleTitle(presses) {
    if (presses & PRESS_CONFIRM) {
      if (save) startContinued();
      else startFresh();
    } else if ((presses & PRESS_RELOAD) && save) {
      startFresh();
    }
  }

  function handleOver(presses) {
    if (presses & PRESS_CONFIRM) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function stepWorld(presses) {
    const state = game.state;
    const p = state.player;
    const mouse = input.mouse();
    const cam = renderer.camera(state);
    const worldInput = {
      up: input.up(),
      down: input.down(),
      left: input.left(),
      right: input.right(),
      run: input.run(),
      enter: !!(presses & PRESS_ENTER),
      punch: !!(presses & PRESS_PUNCH),
      reload: !!(presses & PRESS_RELOAD) && state.player.onFoot,
      shoot: input.shooting(),
      aimX: cam.x + mouse.x,
      aimY: cam.y + mouse.y,
    };
    const events = game.step(STEP, worldInput);
    if (events & EVENT_BUSTED) {
      screen = SCREEN_BUSTED;
      audio.busted();
      announce('Busted by the NBPD.');
    } else if (events & EVENT_WASTED) {
      screen = SCREEN_WASTED;
      audio.busted();
      announce('Wasted. You wake up at Neon Bay General.');
    } else if (events & EVENT_STORY) {
      screen = SCREEN_COMPLETE;
      audio.story();
      writeSave();
      announce('Story complete. The big score is yours.');
    } else if (events & EVENT_MISSION) {
      audio.mission();
      writeSave();
    }
    if (state.shotSound) {
      state.shotSound = false;
      audio.shot();
    }
    if (state.punchSound) {
      state.punchSound = false;
      audio.punch();
    }
    if (state.pickupSound) {
      state.pickupSound = false;
      audio.pickup();
    }
    if (state.cashSound) {
      state.cashSound = false;
      audio.cash();
    }
    if (state.skidSound) {
      state.skidSound = false;
      audio.screech();
    }
    if (state.crashLoud) {
      state.crashLoud = false;
      audio.crash();
    }
    const car = game.playerCar();
    audio.engine(car ? Math.min(1, Math.abs(car.speed) / 520) : 0, !!car);
    audio.siren(state.sirenOn);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const wheelOpen = input.wheelHeld();
    accumulator += Math.min((now - last) / 1000, MAX_FRAME) * (wheelOpen ? 0.2 : 1);
    last = now;
    const presses = input.takePresses();
    if (screen !== SCREEN_PLAY) input.takeDigits();
    if (presses & PRESS_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Sound off.' : 'Sound on.');
    }
    if (presses & PRESS_HORN) audio.horn();
    if (screen === SCREEN_TITLE) {
      handleTitle(presses);
      // The city lives behind the title: traffic and pedestrians keep moving.
      while (accumulator >= STEP) {
        game.step(STEP, { up: false, down: false, left: false, right: false, run: false, enter: false, punch: false, reload: false, shoot: false });
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      const digits = input.takeDigits();
      if (game.state.garageOpen) {
        accumulator = 0;
        if (presses & (PRESS_GARAGE | PRESS_PAUSE)) game.state.garageOpen = false;
        else if (digits) for (let i = 0; i < 4; i += 1) if (digits & (1 << i)) game.sys.garage.buy(i);
      } else if (presses & PRESS_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (presses & PRESS_SAVE) {
        if (writeSave()) game.state.banner = 'Progress saved';
        else game.state.banner = 'Save failed — storage is off';
        game.state.bannerTimer = 2;
      } else {
        if (presses & PRESS_GARAGE) {
          const pt = game.sys.garage.near();
          if (pt) { game.state.garageOpen = true; game.state.garagePoint = pt; }
        }
        if ((presses & PRESS_RELOAD) && !game.state.player.onFoot) game.sys.radio.next();
        if (wheelOpen) {
          if (digits) for (let i = 0; i < 6; i += 1) if (digits & (1 << i)) pendingSlot = i + 1;
        } else if (wheelWasOpen) {
          if (pendingSlot) game.sys.wheel.select(pendingSlot);
          pendingSlot = 0;
        } else if (digits) {
          for (let i = 0; i < 3; i += 1) if (digits & (1 << i)) game.sys.crew.use(i);
          if (digits & 8) game.sys.race.start(0);
          if (digits & 16) game.sys.race.start(1);
        }
        while (accumulator >= STEP) {
          stepWorld(presses);
          accumulator -= STEP;
          if (screen !== SCREEN_PLAY) break;
        }
      }
      if (screen !== SCREEN_PLAY) accumulator = 0;
    } else if (screen === SCREEN_PAUSED) {
      accumulator = 0;
      if (presses & (PRESS_PAUSE | PRESS_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    } else {
      accumulator = 0;
      handleOver(presses);
    }
    wheelWasOpen = wheelOpen;
    const state = game.state;
    const nearCar = state.player.onFoot ? game.nearestCar(85) : null;
    const mouse = input.mouse();
    syncWorld3D(state, screen);
    renderer.draw(state, game.city, screen, {
      hasSave: !!save,
      saveCash: save ? save.cash : 0,
      saveMission: save ? save.missionIndex : 0,
      saveStoryDone: save ? !!save.storyDone : false,
      nearCar: nearCar ? `Steal the ${nearCar.kind === 'patrol' ? 'NBPD Interceptor' : nearCar.kind}` : null,
      mouse,
      sys: game.sys,
      wheelOpen,
      wheelSlot: wheelOpen ? pendingSlot : 0,
    });
  }

  window.addEventListener('pointerdown', () => audio.ensure(), { once: true });
  window.addEventListener('keydown', () => audio.ensure(), { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Neon Bay. Press Enter to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
