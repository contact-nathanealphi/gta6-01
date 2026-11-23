export const PRESS_CONFIRM = 1, PRESS_PAUSE = 2, PRESS_ENTER = 4, PRESS_PUNCH = 8, PRESS_RELOAD = 16, PRESS_SAVE = 32, PRESS_MUTE = 64, PRESS_HORN = 128, PRESS_GARAGE = 256;

const HELD = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ShiftLeft: 'run', ShiftRight: 'run', Tab: 'wheel', KeyQ: 'wheel' };
const PRESS = { Space: PRESS_CONFIRM, Enter: PRESS_CONFIRM, Escape: PRESS_PAUSE, KeyE: PRESS_ENTER, KeyF: PRESS_PUNCH, KeyR: PRESS_RELOAD, KeyP: PRESS_SAVE, KeyM: PRESS_MUTE, KeyH: PRESS_HORN, KeyG: PRESS_GARAGE };

export function createInput(target) {
  const held = new Set();
  let presses = 0;
  let digits = 0;
  const mouse = { x: 0, y: 0, down: false };

  window.addEventListener('keydown', (event) => {
    const h = HELD[event.code];
    if (h) held.add(h);
    else if (PRESS[event.code] !== undefined) { if (!event.repeat) presses |= PRESS[event.code]; }
    else if (event.code.startsWith('Digit')) {
      const n = Number(event.code.slice(5));
      if (n >= 1 && n <= 6 && !event.repeat) digits |= 1 << (n - 1);
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => held.delete(HELD[event.code]));
  window.addEventListener('blur', () => { held.clear(); mouse.down = false; presses = 0; digits = 0; });
  const trackMouse = (event) => {
    const r = target.getBoundingClientRect();
    mouse.x = event.clientX - r.left;
    mouse.y = event.clientY - r.top;
  };
  target.addEventListener('pointermove', trackMouse);
  target.addEventListener('pointerdown', (event) => { trackMouse(event); mouse.down = true; });
  window.addEventListener('pointerup', () => { mouse.down = false; });
  target.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    up() { return held.has('up'); },
    down() { return held.has('down'); },
    left() { return held.has('left'); },
    right() { return held.has('right'); },
    run() { return held.has('run'); },
    shooting() { return mouse.down; },
    mouse() { return mouse; },
    wheelHeld() { return held.has('wheel'); },
    takeDigits() { const t = digits; digits = 0; return t; },
    takePresses() { const t = presses; presses = 0; return t; },
  };
}
