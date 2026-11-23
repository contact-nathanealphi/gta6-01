// Keyboard and pointer input: held keys move/drive, one-shot presses queue as bit flags.

export const PRESS_CONFIRM = 1;
export const PRESS_PAUSE = 2;
export const PRESS_ENTER = 4;
export const PRESS_PUNCH = 8;
export const PRESS_RELOAD = 16;
export const PRESS_SAVE = 32;
export const PRESS_MUTE = 64;
export const PRESS_HORN = 128;
export const PRESS_GARAGE = 256;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['Escape']);
const ENTER_CAR = new Set(['KeyE']);
const PUNCH = new Set(['KeyF']);
const RELOAD = new Set(['KeyR']);
const SAVE = new Set(['KeyP']);
const MUTE = new Set(['KeyM']);
const HORN = new Set(['KeyH']);
const GARAGE = new Set(['KeyG']);
const WHEEL = new Set(['Tab', 'KeyQ']);

export function createInput(target) {
  const held = new Set();
  let presses = 0;
  let digits = 0;
  const mouse = { x: 0, y: 0, down: false };

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code) || RUN.has(event.code) || WHEEL.has(event.code)) {
      held.add(event.code);
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) presses |= PRESS_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) presses |= PRESS_PAUSE;
    } else if (ENTER_CAR.has(event.code)) {
      if (!event.repeat) presses |= PRESS_ENTER;
    } else if (PUNCH.has(event.code)) {
      if (!event.repeat) presses |= PRESS_PUNCH;
    } else if (RELOAD.has(event.code)) {
      if (!event.repeat) presses |= PRESS_RELOAD;
    } else if (SAVE.has(event.code)) {
      if (!event.repeat) presses |= PRESS_SAVE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) presses |= PRESS_MUTE;
    } else if (HORN.has(event.code)) {
      if (!event.repeat) presses |= PRESS_HORN;
    } else if (GARAGE.has(event.code)) {
      if (!event.repeat) presses |= PRESS_GARAGE;
    } else if (event.code.startsWith('Digit')) {
      const n = Number(event.code.slice(5));
      if (n >= 1 && n <= 6 && !event.repeat) digits |= 1 << (n - 1);
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    held.clear();
    mouse.down = false;
  });
  target.addEventListener('pointermove', (event) => {
    const rect = target.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.down = true;
  });
  window.addEventListener('pointerup', () => {
    mouse.down = false;
  });
  target.addEventListener('contextmenu', (event) => event.preventDefault());

  function anyHeld(set) {
    for (const code of set) if (held.has(code)) return true;
    return false;
  }

  return {
    up() { return anyHeld(UP); },
    down() { return anyHeld(DOWN); },
    left() { return anyHeld(LEFT); },
    right() { return anyHeld(RIGHT); },
    run() { return anyHeld(RUN); },
    shooting() { return mouse.down; },
    mouse() { return mouse; },
    wheelHeld() { return held.has('Tab') || held.has('KeyQ'); },
    takeDigits() {
      const taken = digits;
      digits = 0;
      return taken;
    },
    /** The one-shot presses since the last call, as PRESS_* flags. */
    takePresses() {
      const taken = presses;
      presses = 0;
      return taken;
    },
  };
}
