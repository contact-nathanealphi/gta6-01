// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play, paused,
// busted, wasted and story complete. Progress is saved to localStorage.
//
// ?seed=N fixes the city and the traffic. ?shot=start|drive|chase|mission (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.
import { SAVE_KEY, STEP } from './tune.js';
import { createRng } from './rng.js';
import { createGame, EVENT_BUSTED, EVENT_MISSION, EVENT_STORY, EVENT_WASTED } from './world.js';
import { createInput, PRESS_CONFIRM, PRESS_ENTER, PRESS_HORN, PRESS_MUTE, PRESS_PAUSE, PRESS_PUNCH, PRESS_RELOAD, PRESS_SAVE } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_BUSTED, SCREEN_COMPLETE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WASTED } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRng(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

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

function runShot(name) {
  const scene = stageShot(name, game);
  let painted = 0;
  function paint() {
    const nearCar = game.state.player.onFoot ? game.nearestCar(85) : null;
    renderer.draw(game.state, game.city, scene.screen, { hasSave: false, nearCar: nearCar ? `Steal the ${nearCar.kind}` : null, mouse: null });
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

  // Screen readers (and anyone watching the page's text) hear the screen changes.
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
      reload: !!(presses & PRESS_RELOAD),
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
      audio.mission();
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
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const presses = input.takePresses();
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
      if (presses & PRESS_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (presses & PRESS_SAVE) {
        if (writeSave()) game.state.banner = 'Progress saved';
        else game.state.banner = 'Save failed — storage is off';
        game.state.bannerTimer = 2;
      } else {
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
    const state = game.state;
    const nearCar = state.player.onFoot ? game.nearestCar(85) : null;
    const mouse = input.mouse();
    renderer.draw(state, game.city, screen, {
      hasSave: !!save,
      nearCar: nearCar ? `Steal the ${nearCar.kind === 'patrol' ? 'NBPD Interceptor' : nearCar.kind}` : null,
      mouse,
    });
  }

  // The first gesture unlocks sound; the game itself never waits for it.
  window.addEventListener('pointerdown', () => audio.ensure(), { once: true });
  window.addEventListener('keydown', () => audio.ensure(), { once: true });

  // Leaving the tab pauses a running game rather than letting the city run unseen.
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
