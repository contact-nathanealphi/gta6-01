// V7 probe: load the drive shot, report ped + player-car positions at shot time.
// Usage: node probe-v7.mjs
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
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${port}/index.html?shot=drive&seed=7&cam=race&tod=gold&v=v7`, { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 30000 });
const snap = async (tag) => console.log(tag, JSON.stringify(await page.evaluate(() => {
  const g = window.__game, s = g.state, car = g.playerCar();
  const px = s.player.x, pz = s.player.y;
  const near = s.cars.filter((c) => { const dx = c.x - px, dz = c.y - pz; return dx * dx + dz * dz <= 1200 * 1200; }).length;
  return { car: car ? { x: Math.round(car.x), y: Math.round(car.y) } : null, carsTotal: s.cars.length, carsNear: near, pedsTotal: s.peds.length, cops: s.cops.length, peds: s.peds.filter((p) => p.x > 1400 && p.x < 1600 && p.y > 2000 && p.y < 2400).map((p) => [Math.round(p.x), Math.round(p.y)]) };
})));
await snap('t0-ready');
await page.waitForTimeout(600);
await snap('t1-shot');
await page.waitForTimeout(2000);
await snap('t2+2s');
const info = await page.evaluate(() => {
  const g = window.__game, s = g.state, car = g.playerCar();
  return { car: car ? { x: Math.round(car.x), y: Math.round(car.y), angle: +car.angle.toFixed(2), speed: Math.round(car.speed) } : null, player: { x: Math.round(s.player.x), y: Math.round(s.player.y), onFoot: s.player.onFoot }, peds: s.peds.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), down: p.down })), shotCam: s.shotCam, time: s.time };
});
console.log(JSON.stringify(info, null, 1));
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.close();
