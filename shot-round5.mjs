// Round 5 capture: serves game/, screenshots the 4 staged shots at 1280x720,
// then builds contact_sheet_preview.jpg (2x2) from the same server.
// Written fresh for REC_V5. Usage: node shot-round5.mjs [--quality N]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/home/hatch/workspace/makefun-trial/shot-playwright/package.json');
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.join(HERE, 'game');
const SHOTS = path.join(HERE, 'screenshots');
const quality = Number(process.argv.find((a) => a.startsWith('--quality='))?.split('=')[1] || 85);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glsl': 'text/plain', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/sheet') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<html><body style="margin:0;background:#111"><div style="display:grid;grid-template-columns:640px 640px;grid-template-rows:360px 360px"><img src="/shots/01_start.jpg" style="width:640px;height:360px"><img src="/shots/02_drive.jpg" style="width:640px;height:360px"><img src="/shots/03_chase.jpg" style="width:640px;height:360px"><img src="/shots/04_mission.jpg" style="width:640px;height:360px"></div></body></html>`);
    return;
  }
  if (url.startsWith('/shots/')) {
    const fp = path.join(SHOTS, url.slice(7));
    if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'image/jpeg' });
    fs.createReadStream(fp).pipe(res);
    return;
  }
  const fp = path.join(GAME, url === '/' ? 'index.html' : url);
  if (!fp.startsWith(GAME) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log('serving game/ on', port);

const shots = JSON.parse(fs.readFileSync(path.join(HERE, 'shots.json'), 'utf8'));
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--mute-audio'],
});
let failures = 0;
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url()));
  await page.goto(`http://127.0.0.1:${port}/index.html${s.query}`, { waitUntil: 'load', timeout: 30000 });
  try {
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 20000 });
  } catch { errors.push('TIMEOUT waiting __shotReady'); failures += 1; }
  await page.waitForTimeout(400);
  const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
  const out = path.join(SHOTS, s.name);
  await page.screenshot({ path: out, type: 'jpeg', quality });
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${s.name}: ${kb} KiB, canvases=${canvases}, errors=${errors.length}${errors.length ? ' :: ' + errors.join(' | ') : ''}`);
  if (errors.length) failures += 1;
  await page.close();
}
const sheet = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await sheet.goto(`http://127.0.0.1:${port}/sheet`, { waitUntil: 'load', timeout: 15000 });
await sheet.waitForTimeout(600);
await sheet.screenshot({ path: path.join(SHOTS, 'contact_sheet_preview.jpg'), type: 'jpeg', quality });
console.log('contact_sheet_preview.jpg:', Math.round(fs.statSync(path.join(SHOTS, 'contact_sheet_preview.jpg')).size / 1024), 'KiB');
await sheet.close();
await browser.close();
server.close();
console.log(failures === 0 ? 'CAPTURE OK' : `CAPTURE FAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
