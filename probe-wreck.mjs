// HD2 wreck diagnostic: load the staged chase shot, remove all police cars
// and foot cops (so nothing can occlude the wreck), then screenshot.
// If the wreck's flames are visible here, the issue is occlusion, not rendering.
// Usage: node probe-wreck.mjs
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
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?shot=chase&seed=7&cam=action&tod=night&v=hd2`, { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 30000 });
const info = await page.evaluate(() => {
  const g = window.__game, s = g.state;
  const pc = g.playerCar();
  s.cars = s.cars.filter((c) => c === pc);
  s.cops = [];
  s.dialogue = [];
  return { wrecks: s.wrecks, onFoot: s.player.onFoot, heli: s.air.heli ? { x: s.air.heli.x, y: s.air.heli.y, z: s.air.heli.z, spotX: s.air.heli.spotX, spotY: s.air.heli.spotY, angle: s.air.heli.angle } : null, player: { x: s.player.x, y: s.player.y }, car: pc ? { x: pc.x, y: pc.y, angle: pc.angle } : null, wanted: s.wanted };
});
console.log(JSON.stringify(info, null, 1));
await page.waitForTimeout(4000);
await page.screenshot({ path: '/tmp/wreck-test.jpg', type: 'jpeg', quality: 85 });
console.log('wreck-test.jpg:', Math.round(fs.statSync('/tmp/wreck-test.jpg').size / 1024), 'KiB, errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.close();
