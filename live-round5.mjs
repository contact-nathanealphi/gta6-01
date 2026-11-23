// Round 5 live-play: real keyboard/mouse input in headless Chromium.
// Checks: 5x enter/exit car with [E] (the Round 4 bug: one press toggled twice
// when a slow frame ran many world steps), sharp turn, shoot, wheel [Tab],
// camera [V], radio [R], Mission #1 completion, FPS + draw calls, 0 errors.
// Usage: node live-round5.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/home/hatch/workspace/makefun-trial/shot-playwright/package.json');
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.join(HERE, 'game');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glsl': 'text/plain', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(GAME, url === '/' ? 'index.html' : url);
  if (!fp.startsWith(GAME) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));
await page.addInitScript(() => {
  window.__drawCalls = 0; window.__rafTicks = 0;
  for (const P of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
    const orig = P.drawArrays;
    if (orig && !orig.__counted) {
      const wrap = function (...a) { window.__drawCalls += 1; return orig.apply(this, a); };
      wrap.__counted = true;
      P.drawArrays = wrap;
    }
  }
  const tick = () => { window.__rafTicks += 1; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
await page.goto(`http://127.0.0.1:${port}/index.html?seed=7`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2500);
const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
console.log('canvases (2 = 3D on):', canvases);
const state = () => page.evaluate(() => {
  const g = window.__game, s = g.state, p = s.player;
  const car = g.playerCar();
  return { x: p.x, y: p.y, angle: p.angle, onFoot: p.onFoot, health: p.health, mission: s.missionIndex, stage: s.stageIndex, active: s.missionActive, cash: s.cash, wanted: s.wanted, hurt: s.hurtFlash, obj: s.objective ? { x: s.objective.x, y: s.objective.y, label: s.objective.label } : null, carSpeed: car ? car.speed : 0, carKind: car ? car.kind : null, cars: s.cars.length, peds: s.peds.length };
});
const held = new Set();
async function setKeys(want) {
  for (const k of [...held]) if (!want.has(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of want) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}
async function releaseAll() { await setKeys(new Set()); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (d) => { while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

// Start game from title.
await page.keyboard.press('Enter');
await sleep(1000);
let st = await state();
console.log('after Enter:', JSON.stringify(st));

// Mission 1 stage 0: walk to (870,550) on foot.
async function driveTo(tx, ty, timeoutMs, inCar) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    st = await state();
    if (!st.obj && st.mission !== 0) return 'mission-advanced';
    const d = Math.hypot(tx - st.x, ty - st.y);
    if (d < 70) return 'arrived';
    const keys = new Set();
    if (inCar) {
      const want = Math.atan2(ty - st.y, tx - st.x);
      const diff = norm(want - st.angle);
      if (Math.abs(diff) > 0.5) { keys.add('w'); if (diff > 0) keys.add('d'); else keys.add('a'); }
      else keys.add('w');
      if (Math.abs(diff) > 1.2) keys.add('s');
    } else {
      if (tx - st.x > 15) keys.add('d'); else if (tx - st.x < -15) keys.add('a');
      if (ty - st.y > 15) keys.add('s'); else if (ty - st.y < -15) keys.add('w');
    }
    await setKeys(keys);
    await sleep(120);
  }
  await releaseAll();
  return 'timeout';
}
console.log('walk to pickup:', await driveTo(870, 550, 20000, false));
await releaseAll();
await sleep(300);
st = await state();
console.log('stage after walk:', st.stage, 'mission:', st.mission, 'obj:', JSON.stringify(st.obj));

// Get a car: walk to parked sedan (830,700), press E.
console.log('walk to sedan:', await driveTo(830, 700, 20000, false));
await releaseAll();
async function tryEnterCar() {
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('e');
    await sleep(700);
    st = await state();
    if (!st.onFoot) return true;
    await driveTo(830, 700, 4000, false);
    await releaseAll();
  }
  await driveTo(950, 700, 8000, false);
  await releaseAll();
  await page.keyboard.press('e');
  await sleep(700);
  st = await state();
  return !st.onFoot;
}
console.log('in car?', await tryEnterCar(), 'kind:', st.carKind);

// 5x enter/exit car with [E]: each press must toggle exactly once.
let ePass = 0;
for (let i = 1; i <= 5; i += 1) {
  await page.keyboard.press('e');
  await sleep(600);
  st = await state();
  const exited = st.onFoot === true;
  await page.keyboard.press('e');
  await sleep(600);
  st = await state();
  let entered = st.onFoot === false;
  if (!entered) {
    await driveTo(830, 700, 4000, false);
    await releaseAll();
    await page.keyboard.press('e');
    await sleep(600);
    st = await state();
    entered = st.onFoot === false;
  }
  const ok = exited && entered;
  if (ok) ePass += 1;
  console.log(`E cycle ${i}: exit=${exited} enter=${entered} -> ${ok ? 'PASS' : 'FAIL'}`);
}
console.log(`E 5x: ${ePass}/5`);

// Sharp turn test: full lock left then right while driving.
await setKeys(new Set(['w', 'a']));
await sleep(1500);
await setKeys(new Set(['w', 'd']));
await sleep(1500);
await releaseAll();
st = await state();
console.log('after sharp turns: speed', Math.round(st.carSpeed), 'pos', Math.round(st.x), Math.round(st.y));

// Shoot (drive-by SMG) + punch test on foot later; shoot now from car.
await page.mouse.move(900, 300);
await page.mouse.down(); await sleep(300); await page.mouse.up();
await sleep(300);

// Weapon wheel [Tab] hold + pick slot 6, then release.
await page.keyboard.down('Tab');
await sleep(600);
await page.keyboard.press('6');
await sleep(400);
await page.keyboard.up('Tab');
await sleep(300);
st = await state();
console.log('weapon after wheel:', await page.evaluate(() => window.__game.state.player.weapon));

// Camera [V] cycle x3.
for (let i = 0; i < 3; i += 1) { await page.keyboard.press('v'); await sleep(400); }
console.log('camera [V] pressed 3x, no errors');

// Radio [R] while driving.
await page.keyboard.press('r');
await sleep(500);
console.log('radio toast:', await page.evaluate(() => window.__game.state.radioToast && window.__game.state.radioToast.name));

// Drive to Bayfront Mall (1470,1550) to finish Mission #1.
console.log('drive to mall:', await driveTo(1470, 1550, 120000, true));
await releaseAll();
await sleep(800);
st = await state();
console.log('after mall run: mission', st.mission, 'stage', st.stage, 'cash', st.cash, 'active', st.active);
const mission1Done = st.mission >= 1;

// Exit car + punch.
await page.keyboard.press('e');
await sleep(500);
st = await state();
console.log('exited car?', st.onFoot);
await page.keyboard.press('f');
await sleep(300);

// FPS + draw calls over 12s of live driving.
await page.keyboard.press('e'); // back in car if near
await sleep(400);
const base = await page.evaluate(() => ({ d: window.__drawCalls, r: window.__rafTicks }));
await setKeys(new Set(['w']));
await sleep(12000);
await releaseAll();
const after = await page.evaluate(() => ({ d: window.__drawCalls, r: window.__rafTicks }));
const frames = after.r - base.r;
const fps = frames / 12;
const drawPerFrame = frames ? (after.d - base.d) / frames : 0;
console.log(`FPS(headless SwiftShader): ${fps.toFixed(1)} over ${frames} frames; drawArrays/frame: ${drawPerFrame.toFixed(1)}`);
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
console.log(JSON.stringify({ mission1Done, ePass, fps: +fps.toFixed(1), drawPerFrame: +drawPerFrame.toFixed(1), canvases, errors: errors.length }));
await browser.close();
server.close();
process.exit(errors.length === 0 && mission1Done && ePass === 5 ? 0 : 1);
