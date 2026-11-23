// Round 5 probe: print real city data (casino building, palms, avenues) from the
// live game so staging coordinates are grounded, not guessed.
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
  const g = window.__game;
  return {
    cityKeys: Object.keys(g.city),
    casino: g.city.buildings.filter((b) => b.kind === 'casino'),
    kinds: [...new Set(g.city.buildings.map((b) => b.kind))],
    nBuildings: g.city.buildings.length,
    nPalms: g.city.palms.length,
    palmsBeach: g.city.palms.filter((p) => p.y > 2400).slice(0, 8),
    palmsCasino: g.city.palms.filter((p) => Math.abs(p.x - 3000) < 400 && p.y > 200 && p.y < 800),
  };
});
console.log(JSON.stringify(info, null, 1));
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
server.close();
