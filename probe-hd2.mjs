// HD2 probe: print real city data (bounds, coast, casino, palms, boats,
// roads) from the live game so staging coordinates are grounded, not guessed.
// Usage: node probe-hd2.mjs
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
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/index.html?seed=7`, { waitUntil: 'load', timeout: 30000 });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const g = window.__game, c = g.city, s = g.state;
  const pick = (a, n) => a.slice(0, n);
  const out = { cityKeys: Object.keys(c), stateKeys: Object.keys(s).slice(0, 40) };
  if (c.buildings) {
    out.nBuildings = c.buildings.length;
    out.kinds = [...new Set(c.buildings.map((b) => b.kind))];
    out.casino = c.buildings.filter((b) => b.kind === 'casino');
    out.tallest = [...c.buildings].sort((a, b) => (b.h || 0) - (a.h || 0)).slice(0, 5).map((b) => ({ k: b.kind, x: b.x, y: b.y, w: b.w, h: b.h }));
    const xs = c.buildings.map((b) => b.x), ys = c.buildings.map((b) => b.y);
    out.bx = [Math.min(...xs), Math.max(...xs)]; out.by = [Math.min(...ys), Math.max(...ys)];
  }
  if (c.palms) { out.nPalms = c.palms.length; out.palmsNE = c.palms.filter((p) => p.x > 2600 && p.y < 1200).slice(0, 10); out.palmsBeach = c.palms.filter((p) => p.y > 2300).slice(0, 10); }
  for (const k of ['roads', 'avenues', 'streets', 'beach', 'coast', 'water', 'ocean', 'boats', 'yachts', 'piers', 'docks', 'boardwalk']) if (c[k] !== undefined) out[k] = Array.isArray(c[k]) ? pick(c[k], 8) : c[k];
  if (s.boats) out.stateBoats = pick(s.boats, 8);
  if (s.yachts) out.stateYachts = pick(s.yachts, 8);
  out.player = { x: s.player.x, y: s.player.y };
  return out;
});
console.log(JSON.stringify(info, null, 1));
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.close();
