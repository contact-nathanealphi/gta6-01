// HD2 missions smoke: start each of the 10 missions live in headless
// Chromium, let the game run 2s each, record missionActive + objective + errors.
// Smoke test (mission starts and runs without errors), not a full playthrough.
// Usage: node missions-hd2.mjs
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
page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));
await page.goto(`http://127.0.0.1:${port}/index.html?seed=7`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2000);
await page.keyboard.press('Enter');
await page.waitForTimeout(800);
let pass = 0;
for (let i = 0; i < 10; i += 1) {
  const res = await page.evaluate((mi) => {
    const g = window.__game;
    try {
      g.reset();
      g.startMission(mi);
      const s = g.state;
      return { ok: true, mission: s.missionIndex, active: s.missionActive, obj: s.objective ? s.objective.label : null, stage: s.stageIndex };
    } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  }, i);
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => {
    const s = window.__game.state;
    return { mission: s.missionIndex, active: s.missionActive, obj: s.objective ? s.objective.label : null, health: s.player.health };
  });
  const ok = res.ok && after.active && !!after.obj && errors.length === 0;
  if (ok) pass += 1;
  console.log(`mission ${i + 1}/10: start=${JSON.stringify(res)} after2s=${JSON.stringify(after)} -> ${ok ? 'PASS' : 'FAIL'}`);
}
console.log(`missions: ${pass}/10, errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
server.close();
process.exit(pass === 10 && errors.length === 0 ? 0 : 1);
