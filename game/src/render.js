// Drawing only: the world's state and the current screen in, pixels out. A
// camera follows the player across the 3600x2700 city; the HUD (cash, health,
// wanted stars, objective, minimap) is drawn in screen space on top. Flat shapes
// and canvas text — no images, no assets.

import { AVENUES, CAR_KINDS, FONT, PALETTE, PLAYER, STREETS, WORLD } from './tune.js';
import { MISSIONS } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_WASTED = 'wasted';
export const SCREEN_COMPLETE = 'complete';

const MINIMAP = { w: 210, h: 156 };

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let viewW = 1280;
  let viewH = 800;
  const fonts = new Map();
  // The static ground (grass, beach, water, roads, lane dashes) is painted
  // once to an offscreen canvas and blitted each frame, instead of redrawing
  // hundreds of shapes 60 times a second.
  let groundCanvas = null;

  function buildGround() {
    try {
      groundCanvas = document.createElement('canvas');
      groundCanvas.width = WORLD.width;
      groundCanvas.height = WORLD.height;
      const g = groundCanvas.getContext('2d');
      g.fillStyle = PALETTE.grass;
      g.fillRect(0, 0, WORLD.width, WORLD.height);
      g.fillStyle = PALETTE.sand;
      g.fillRect(0, 2440, WORLD.width, WORLD.height - 2440);
      g.fillStyle = PALETTE.water;
      g.fillRect(0, 2630, WORLD.width, WORLD.height - 2630);
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.lineWidth = 2;
      g.beginPath();
      for (let x = 0; x < WORLD.width; x += 90) {
        g.moveTo(x, 2632);
        g.quadraticCurveTo(x + 22, 2626, x + 45, 2632);
      }
      g.stroke();
      for (const ax of AVENUES) {
        g.fillStyle = PALETTE.sidewalk;
        g.fillRect(ax - 86, 0, 172, WORLD.height);
      }
      for (const sy of STREETS) {
        g.fillStyle = PALETTE.sidewalk;
        g.fillRect(0, sy - 86, WORLD.width, 172);
      }
      for (const ax of AVENUES) {
        g.fillStyle = PALETTE.asphalt;
        g.fillRect(ax - 60, 0, 120, WORLD.height);
      }
      for (const sy of STREETS) {
        g.fillStyle = PALETTE.asphalt;
        g.fillRect(0, sy - 60, WORLD.width, 120);
      }
      g.strokeStyle = PALETTE.lane;
      g.lineWidth = 3;
      g.setLineDash([26, 30]);
      g.beginPath();
      for (const ax of AVENUES) {
        g.moveTo(ax, 0);
        g.lineTo(ax, WORLD.height);
      }
      for (const sy of STREETS) {
        g.moveTo(0, sy);
        g.lineTo(WORLD.width, sy);
      }
      g.stroke();
      g.setLineDash([]);
    } catch {
      groundCanvas = null;
    }
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    viewW = canvas.clientWidth || window.innerWidth;
    viewH = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
  }

  function font(size, bold) {
    const key = `${size}:${bold ? 1 : 0}`;
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    return fonts.get(key);
  }

  function text(value, x, y, size, color, align, bold) {
    ctx.font = font(size, bold);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function camera(state) {
    const p = state.player;
    let x = p.x - viewW / 2;
    let y = p.y - viewH / 2;
    x = viewW >= WORLD.width ? (WORLD.width - viewW) / 2 : Math.max(0, Math.min(WORLD.width - viewW, x));
    y = viewH >= WORLD.height ? (WORLD.height - viewH) / 2 : Math.max(0, Math.min(WORLD.height - viewH, y));
    return { x, y, w: viewW, h: viewH };
  }

  function inView(cam, x, y, margin) {
    return x > cam.x - margin && x < cam.x + cam.w + margin && y > cam.y - margin && y < cam.y + cam.h + margin;
  }

  function drawGround(cam) {
    if (groundCanvas) {
      ctx.drawImage(groundCanvas, cam.x, cam.y, cam.w, cam.h, cam.x, cam.y, cam.w, cam.h);
      return;
    }
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(cam.x, cam.y, cam.w, cam.h);
    // Beach along the south edge, water at its foot.
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(cam.x, 2440, cam.w, WORLD.height - 2440);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(cam.x, 2630, cam.w, WORLD.height - 2630);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < WORLD.width; x += 90) {
      ctx.moveTo(x, 2632);
      ctx.quadraticCurveTo(x + 22, 2626, x + 45, 2632);
    }
    ctx.stroke();
    // Sidewalks first, then asphalt on top of them.
    for (const ax of AVENUES) {
      ctx.fillStyle = PALETTE.sidewalk;
      ctx.fillRect(ax - 86, 0, 172, WORLD.height);
    }
    for (const sy of STREETS) {
      ctx.fillStyle = PALETTE.sidewalk;
      ctx.fillRect(0, sy - 86, WORLD.width, 172);
    }
    for (const ax of AVENUES) {
      ctx.fillStyle = PALETTE.asphalt;
      ctx.fillRect(ax - 60, 0, 120, WORLD.height);
    }
    for (const sy of STREETS) {
      ctx.fillStyle = PALETTE.asphalt;
      ctx.fillRect(0, sy - 60, WORLD.width, 120);
    }
    // Lane dashes down every road.
    ctx.strokeStyle = PALETTE.lane;
    ctx.lineWidth = 3;
    ctx.setLineDash([26, 30]);
    ctx.beginPath();
    for (const ax of AVENUES) {
      ctx.moveTo(ax, 0);
      ctx.lineTo(ax, WORLD.height);
    }
    for (const sy of STREETS) {
      ctx.moveTo(0, sy);
      ctx.lineTo(WORLD.width, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSkids(state, cam) {
    for (const s of state.skids) {
      if (!inView(cam, s.x, s.y, 30)) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.globalAlpha = Math.min(0.5, (s.life / 4) * 0.5);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-7, -2, 14, 4);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawBuildings(state, city, cam) {
    for (const b of city.buildings) {
      if (!inView(cam, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h))) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      if (b.kind === 'lighthouse') {
        // A lighthouse: red-white stripes and a rotating beam of light.
        ctx.fillStyle = '#c94f43';
        ctx.fillRect(b.x, b.y + 18, b.w, 12);
        ctx.fillRect(b.x, b.y + 44, b.w, 12);
        ctx.fillStyle = '#ffd23d';
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + 4, 8, 0, Math.PI * 2);
        ctx.fill();
        const beam = (state.time * 0.9) % (Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 233, 163, 0.18)';
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, b.y + 4);
        ctx.lineTo(b.x + b.w / 2 + Math.cos(beam) * 260, b.y + 4 + Math.sin(beam) * 260);
        ctx.lineTo(b.x + b.w / 2 + Math.cos(beam + 0.35) * 260, b.y + 4 + Math.sin(beam + 0.35) * 260);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = b.glass;
        ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 14);
      } else {
        ctx.fillStyle = b.glass;
        ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 14);
      }
      // Lit windows: a fixed pattern per building (from its position, so it
      // never flickers), a few warm dots on the roof face.
      ctx.fillStyle = 'rgba(255, 220, 130, 0.75)';
      const cols = Math.max(1, Math.floor((b.w - 20) / 26));
      for (let i = 0; i < cols; i += 1) {
        const lit = ((b.x * 7 + b.y * 13 + i * 17) % 5) < 2;
        if (lit) ctx.fillRect(b.x + 12 + i * 26, b.y + 30, 10, 12);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      if (b.name) {
        text(b.name, b.x + b.w / 2, b.y + b.h / 2 + 5, 15, '#ffffff', 'center', true);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(b.x, b.y + b.h - 10, b.w, 10);
      }
    }
    // Shipping containers by the port docks.
    const containers = ['#c94f43', '#2f6fd0', '#f2c94c', '#57d977', '#7d8aa0'];
    for (let i = 0; i < 8; i += 1) {
      const x = 2220 + (i % 4) * 90;
      const y = 2360 + Math.floor(i / 4) * 40;
      ctx.fillStyle = containers[i % containers.length];
      ctx.fillRect(x, y, 78, 30);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(x, y, 78, 30);
    }
    for (const palm of city.palms) {
      if (!inView(cam, palm.x, palm.y, 40)) continue;
      ctx.strokeStyle = '#5a4632';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(palm.x, palm.y);
      ctx.lineTo(palm.x + 4, palm.y - 22);
      ctx.stroke();
      ctx.fillStyle = '#3f7d3a';
      ctx.beginPath();
      ctx.arc(palm.x + 4, palm.y - 26, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCarShape(car, isPlayer) {
    const spec = CAR_KINDS[car.kind];
    const len = spec.length;
    const wid = spec.width;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-len / 2 + 3, -wid / 2 + 4, len, wid);
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(-len / 2, -wid / 2, len, wid, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Windshield and roof.
    ctx.fillStyle = 'rgba(180,220,240,0.85)';
    ctx.fillRect(len / 2 - 14, -wid / 2 + 3, 8, wid - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-6, -wid / 2 + 3, 14, wid - 6);
    // Headlights.
    ctx.fillStyle = '#ffe9a3';
    ctx.fillRect(len / 2 - 2, -wid / 2 + 2, 3, 5);
    ctx.fillRect(len / 2 - 2, wid / 2 - 7, 3, 5);
    // Brake lights glow red at the rear when the car is reversing.
    if (car.speed < -20) {
      ctx.fillStyle = '#ff2a2a';
      ctx.fillRect(-len / 2 - 1, -wid / 2 + 2, 3, 5);
      ctx.fillRect(-len / 2 - 1, wid / 2 - 7, 3, 5);
    }
    if (car.kind === 'patrol') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-len / 2 + 2, -wid / 2 + 2, 10, wid - 4);
      const flash = Math.floor(performance.now() / 280) % 2 === 0;
      ctx.fillStyle = flash ? '#ff3b30' : '#2f7bff';
      ctx.fillRect(-2, -wid / 2 - 3, 8, 5);
      ctx.fillStyle = flash ? '#2f7bff' : '#ff3b30';
      ctx.fillRect(-2, wid / 2 - 2, 8, 5);
    }
    if (car.kind === 'taxi') {
      ctx.fillStyle = '#222222';
      for (let i = 0; i < 5; i += 1) ctx.fillRect(-14 + i * 6, -wid / 2 + 1, 4, 4);
    }
    if (car.smoked) {
      ctx.fillStyle = 'rgba(120,120,120,0.55)';
      const t = performance.now() / 300;
      ctx.beginPath();
      ctx.arc(-len / 4 + Math.sin(t) * 6, -8 + Math.cos(t) * 4, 9, 0, Math.PI * 2);
      ctx.arc(len / 4, 6 + Math.sin(t + 2) * 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (isPlayer) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(car.x, car.y, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawPickups(state, cam) {
    for (const item of state.pickups) {
      if (!inView(cam, item.x, item.y, 30)) continue;
      const bob = Math.sin(item.bob) * 3;
      const y = item.y + bob;
      if (item.kind === 'health') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(item.x - 11, y - 11, 22, 22);
        ctx.fillStyle = '#e5484d';
        ctx.fillRect(item.x - 3, y - 8, 6, 16);
        ctx.fillRect(item.x - 8, y - 3, 16, 6);
      } else if (item.kind === 'ammo') {
        ctx.fillStyle = PALETTE.gold;
        ctx.fillRect(item.x - 11, y - 8, 22, 16);
        ctx.fillStyle = '#222';
        ctx.fillRect(item.x - 6, y - 4, 4, 8);
        ctx.fillRect(item.x, y - 4, 4, 8);
        ctx.fillRect(item.x + 6, y - 4, 4, 8);
      } else if (item.kind === 'shotgun') {
        // A shotgun: a dark barrel with a wooden pump.
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(item.x - 14, y - 4, 28, 8);
        ctx.fillStyle = '#8a6f4d';
        ctx.fillRect(item.x - 4, y - 5, 10, 10);
        ctx.fillStyle = PALETTE.gold;
        ctx.fillRect(item.x + 10, y - 3, 4, 6);
      } else if (item.kind === 'armor') {
        // An armor vest: a blue shield.
        ctx.fillStyle = '#2f6fd0';
        ctx.beginPath();
        ctx.moveTo(item.x, y - 12);
        ctx.lineTo(item.x + 11, y - 7);
        ctx.lineTo(item.x + 11, y + 4);
        ctx.lineTo(item.x, y + 12);
        ctx.lineTo(item.x - 11, y + 4);
        ctx.lineTo(item.x - 11, y - 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        text('A', item.x, y + 5, 12, '#ffffff', 'center', true);
      } else if (item.kind === 'repair') {
        // A repair wrench: a grey spanner on a green square.
        ctx.fillStyle = '#2fae5f';
        ctx.fillRect(item.x - 12, y - 12, 24, 24);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(item.x - 3, y - 3, 5, 0.5, Math.PI * 1.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(item.x + 1, y + 1);
        ctx.lineTo(item.x + 8, y + 8);
        ctx.stroke();
      } else if (item.kind === 'cash') {
        ctx.fillStyle = '#2fae5f';
        ctx.beginPath();
        ctx.arc(item.x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        text('$', item.x, y + 5, 14, '#ffffff', 'center', true);
      } else if (item.kind === 'crate') {
        ctx.fillStyle = '#8a6f4d';
        ctx.fillRect(item.x - 14, y - 14, 28, 28);
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 3;
        ctx.strokeRect(item.x - 14, y - 14, 28, 28);
      } else if (item.kind === 'courier') {
        // A courier parcel: a white envelope with a gold seal.
        ctx.fillStyle = '#f4f1e6';
        ctx.fillRect(item.x - 13, y - 9, 26, 18);
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x - 13, y - 9, 26, 18);
        ctx.beginPath();
        ctx.moveTo(item.x - 13, y - 9);
        ctx.lineTo(item.x, y + 2);
        ctx.lineTo(item.x + 13, y - 9);
        ctx.stroke();
      }
    }
  }

  function drawPeople(state, cam) {
    for (const ped of state.peds) {
      if (!inView(cam, ped.x, ped.y, 30)) continue;
      if (ped.down > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(ped.x, ped.y, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.fillStyle = ped.shirt;
      ctx.beginPath();
      ctx.arc(ped.x, ped.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#e8b98a';
      ctx.beginPath();
      ctx.arc(ped.x + Math.cos(ped.angle) * 4, ped.y + Math.sin(ped.angle) * 4, 5, 0, Math.PI * 2);
      ctx.fill();
      // A hailing passenger waves a yellow TAXI sign above their head.
      if (ped.hailing) {
        ctx.fillStyle = PALETTE.gold;
        ctx.fillRect(ped.x - 16, ped.y - 34, 32, 13);
        text('TAXI', ped.x, ped.y - 23, 10, '#222', 'center', true);
      }
    }
    for (const cop of state.cops) {
      if (!inView(cam, cop.x, cop.y, 30)) continue;
      ctx.fillStyle = PALETTE.cop;
      ctx.beginPath();
      ctx.arc(cop.x, cop.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.copDark;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cop.x, cop.y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      if (cop.arrest > 0) {
        ctx.fillStyle = PALETTE.danger;
        ctx.fillRect(cop.x - 14, cop.y - 26, 28 * (cop.arrest / 1.6), 5);
      }
    }
    for (const rival of state.rivals) {
      if (!inView(cam, rival.x, rival.y, 30)) continue;
      ctx.fillStyle = PALETTE.rival;
      ctx.beginPath();
      ctx.arc(rival.x, rival.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5e1a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rival.x, rival.y);
      ctx.lineTo(rival.x + Math.cos(rival.angle) * 20, rival.y + Math.sin(rival.angle) * 20);
      ctx.stroke();
      ctx.fillStyle = PALETTE.danger;
      ctx.fillRect(rival.x - 13, rival.y - 24, 26 * (rival.health / 50), 4);
    }
  }

  function drawPlayer(state, cam) {
    const p = state.player;
    if (!p.onFoot || !inView(cam, p.x, p.y, 40)) return;
    if (p.invuln > 0 && Math.floor(p.invuln * 10) % 2 === 0) return;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.playerDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.angle) * 5, p.y + Math.sin(p.angle) * 5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Armor: a pulsing blue ring while it lasts.
    if (p.armor > 0) {
      ctx.strokeStyle = `rgba(47,111,208,${0.5 + 0.3 * Math.sin(state.time * 6)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.shotgun > 0) {
      // A shotgun is drawn longer and thicker than the pistol.
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * 30, p.y + Math.sin(p.angle) * 30);
      ctx.stroke();
      ctx.strokeStyle = '#8a6f4d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(p.angle) * 12, p.y + Math.sin(p.angle) * 12);
      ctx.lineTo(p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20);
      ctx.stroke();
    } else if (p.pistol) {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * 24, p.y + Math.sin(p.angle) * 24);
      ctx.stroke();
    }
    if (state.hasCrate) {
      ctx.fillStyle = '#8a6f4d';
      ctx.fillRect(p.x - 9, p.y - 26, 18, 12);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 9, p.y - 26, 18, 12);
    }
  }

  function drawBulletsAndParticles(state, cam) {
    for (const b of state.bullets) {
      if (!inView(cam, b.x, b.y, 30)) continue;
      ctx.strokeStyle = '#ffe9a3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const pt of state.particles) {
      if (!inView(cam, pt.x, pt.y, 20)) continue;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters(state, cam) {
    for (const f of state.floaters) {
      if (!inView(cam, f.x, f.y, 40)) continue;
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      text(f.label, f.x, f.y, 17, f.color, 'center', true);
    }
    ctx.globalAlpha = 1;
  }

  function drawHeadlights(state, cam) {
    // At night, every car throws a pale cone of light ahead of it.
    const hour = (8 + state.time / 10) % 24;
    const dayness = Math.sin(((hour - 6) / 12) * Math.PI);
    if (dayness > -0.1) return;
    const strength = Math.min(1, (-dayness - 0.1) / 0.6);
    for (const car of state.cars) {
      if (!inView(cam, car.x, car.y, 200)) continue;
      const spec = CAR_KINDS[car.kind];
      const fx = Math.cos(car.angle);
      const fy = Math.sin(car.angle);
      const px = -fy;
      const py = fx;
      const reach = 170;
      const spread = 46;
      ctx.fillStyle = `rgba(255, 233, 163, ${0.10 * strength})`;
      ctx.beginPath();
      ctx.moveTo(car.x + fx * (spec.length / 2), car.y + fy * (spec.length / 2));
      ctx.lineTo(car.x + fx * (spec.length / 2 + reach) + px * spread, car.y + fy * (spec.length / 2 + reach) + py * spread);
      ctx.lineTo(car.x + fx * (spec.length / 2 + reach) - px * spread, car.y + fy * (spec.length / 2 + reach) - py * spread);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawMarker(state, cam) {
    const obj = state.objective;
    if (!obj) return;
    const pulse = 1 + Math.sin(state.time * 4) * 0.15;
    if (inView(cam, obj.x, obj.y, 60)) {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.marker;
      const s = 13 * pulse;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,210,61,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, 26 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,210,61,0.25)';
      ctx.fillRect(obj.x - 3, obj.y - 120, 6, 110);
    } else {
      // Off-screen: an arrow on the view edge points at it.
      const cx = cam.x + cam.w / 2;
      const cy = cam.y + cam.h / 2;
      const ang = Math.atan2(obj.y - cy, obj.x - cx);
      const ex = cx + Math.cos(ang) * (Math.min(cam.w, cam.h) / 2 - 40);
      const ey = cy + Math.sin(ang) * (Math.min(cam.w, cam.h) / 2 - 40);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      ctx.fillStyle = PALETTE.marker;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const dist = Math.round(Math.hypot(obj.x - state.player.x, obj.y - state.player.y));
      text(`${dist}m`, ex, ey - 18, 15, PALETTE.marker, 'center', true);
    }
  }

  function drawMinimap(state) {
    const x0 = viewW - MINIMAP.w - 14;
    const y0 = 14;
    const sx = MINIMAP.w / WORLD.width;
    const sy = MINIMAP.h / WORLD.height;
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(x0 - 6, y0 - 6, MINIMAP.w + 12, MINIMAP.h + 12);
    ctx.fillStyle = '#2c4a2c';
    ctx.fillRect(x0, y0, MINIMAP.w, MINIMAP.h);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (const ax of AVENUES) {
      ctx.beginPath();
      ctx.moveTo(x0 + ax * sx, y0);
      ctx.lineTo(x0 + ax * sx, y0 + MINIMAP.h);
      ctx.stroke();
    }
    for (const sy2 of STREETS) {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + sy2 * sy);
      ctx.lineTo(x0 + MINIMAP.w, y0 + sy2 * sy);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(x0, y0 + 2440 * sy, MINIMAP.w, 12);
    for (const car of state.cars) {
      if (car.driver === 'traffic') ctx.fillStyle = '#9a9a9a';
      else if (car.driver === 'police') ctx.fillStyle = '#4d8dff';
      else if (car.driver === 'player') continue;
      else ctx.fillStyle = '#d8d8d8';
      ctx.fillRect(x0 + car.x * sx - 2, y0 + car.y * sy - 2, 4, 4);
    }
    for (const rival of state.rivals) {
      ctx.fillStyle = '#ff5a5a';
      ctx.fillRect(x0 + rival.x * sx - 2, y0 + rival.y * sy - 2, 4, 4);
    }
    // Pickups on the minimap: health green, cash gold, crate brown.
    for (const item of state.pickups) {
      if (item.kind === 'health') ctx.fillStyle = '#57d977';
      else if (item.kind === 'cash') ctx.fillStyle = '#2fae5f';
      else if (item.kind === 'ammo') ctx.fillStyle = '#f2c94c';
      else if (item.kind === 'courier') ctx.fillStyle = '#ffffff';
      else if (item.kind === 'shotgun') ctx.fillStyle = '#ff8c42';
      else if (item.kind === 'repair') ctx.fillStyle = '#2fae5f';
      else ctx.fillStyle = '#8a6f4d';
      ctx.fillRect(x0 + item.x * sx - 2, y0 + item.y * sy - 2, 4, 4);
    }
    if (state.objective) {
      ctx.fillStyle = PALETTE.marker;
      ctx.beginPath();
      ctx.arc(x0 + state.objective.x * sx, y0 + state.objective.y * sy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    const p = state.player;
    ctx.save();
    ctx.translate(x0 + p.x * sx, y0 + p.y * sy);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 - 6, y0 - 6, MINIMAP.w + 12, MINIMAP.h + 12);
  }

  function drawHud(state, ui, cam) {
    const p = state.player;
    // Cash, health and wanted stars, top-left. The panel is tall enough for
    // the weapon, armor and car-health lines below the stars.
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(14, 14, 250, 168);
    text(`$${state.cash.toLocaleString('en-US')}`, 28, 46, 28, PALETTE.gold, 'left', true);
    ctx.fillStyle = '#333';
    ctx.fillRect(28, 58, 180, 12);
    ctx.fillStyle = p.health > 35 ? PALETTE.health : PALETTE.danger;
    ctx.fillRect(28, 58, 180 * (p.health / PLAYER.health), 12);
    text(`${Math.ceil(p.health)}`, 216, 70, 14, PALETTE.hudText, 'left', true);
    for (let i = 0; i < 5; i += 1) {
      // A fresh star flashes red briefly when the heat rises.
      const flash = state.wantedFlash > 0 && i === state.wanted - 1;
      text('★', 28 + i * 26, 96, 20, flash ? PALETTE.danger : (i < state.wanted ? PALETTE.gold : '#555'), 'left');
    }
    // A thin heat meter under the stars: total wanted points (0–10).
    if (state.wantedPoints > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(28, 102, 130, 5);
      ctx.fillStyle = PALETTE.danger;
      ctx.fillRect(28, 102, 130 * Math.min(1, state.wantedPoints / 10), 5);
    }
    if (p.shotgun > 0) {
      text(`Shotgun  ${p.shotgun} shells`, 28, 122, 15, PALETTE.gold, 'left', true);
    } else if (p.pistol) {
      text(`Pistol  ${p.mag}/${PLAYER.magSize}`, 28, 122, 15, PALETTE.hudText, 'left');
      if (p.reloadT > 0) text('Reloading…', 150, 122, 15, PALETTE.gold, 'left');
    }
    if (p.armor > 0) {
      text(`Armor  ${Math.ceil(p.armor)}s`, 28, 140, 15, '#4d8dff', 'left', true);
    }
    // Speedometer when driving: the player's car speed in km/h.
    if (!p.onFoot) {
      let myCar = null;
      for (const car of state.cars) if (car.driver === 'player') { myCar = car; break; }
      if (myCar) {
        const kmh = Math.round(Math.abs(myCar.speed) * 0.32);
        text(`${kmh} km/h`, 28, 122, 15, PALETTE.hudText, 'left');
        text(myCar.kind === 'patrol' ? 'NBPD Interceptor' : (CAR_KINDS[myCar.kind] ? CAR_KINDS[myCar.kind].label : myCar.kind), 150, 122, 15, PALETTE.hudMuted, 'left');
        // Car health bar, so the player knows when to find a repair wrench.
        text('CAR', 28, 168, 13, PALETTE.hudMuted, 'left');
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(72, 158, 160, 9);
        ctx.fillStyle = myCar.health > 50 ? '#57d977' : myCar.health > 25 ? '#f2c94c' : '#ff4d4d';
        ctx.fillRect(72, 158, 160 * Math.max(0, myCar.health) / 100, 9);
      }
    }
    drawMinimap(state);
    // In-game clock: the 4-minute day cycle reads as a 24-hour clock, starting at 08:00.
    const hours = Math.floor((8 + state.time / 10) % 24);
    const mins = Math.floor((((8 + state.time / 10) % 24) % 1) * 60);
    const night = hours < 6 || hours >= 18;
    text(`${night ? '☾' : '☀'} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, viewW - 14, 14 + MINIMAP.h + 28, 15, PALETTE.hudText, 'right', true);
    // Objective, bottom-left.
    if (state.objective) {
      ctx.fillStyle = PALETTE.hudPanel;
      ctx.fillRect(14, viewH - 76, 430, 62);
      text(state.missionActive ? `Mission ${state.missionIndex + 1} of ${MISSIONS.length}` : 'Free roam', 28, viewH - 52, 14, PALETTE.hudMuted, 'left', true);
      const dist = Math.round(Math.hypot(state.objective.x - p.x, state.objective.y - p.y));
      text(`${state.objective.label}  ·  ${dist}m`, 28, viewH - 28, 17, PALETTE.hudText, 'left');
    }
    // Dialogue line, bottom-centre.
    if (state.dialogue.length > 0) {
      const line = state.dialogue[0];
      ctx.font = font(17, false);
      const w = Math.min(720, ctx.measureText(line).width + 40);
      ctx.fillStyle = PALETTE.hudPanel;
      ctx.fillRect((viewW - w) / 2, viewH - 132, w, 40);
      text(line, viewW / 2, viewH - 105, 17, '#ffe9c4', 'center');
    }
    // Banner, top-centre.
    if (state.banner && state.bannerTimer > 0) {
      ctx.font = font(26, true);
      const w = ctx.measureText(state.banner).width + 48;
      ctx.fillStyle = 'rgba(12,16,26,0.8)';
      ctx.fillRect((viewW - w) / 2, 18, w, 44);
      text(state.banner, viewW / 2, 48, 26, PALETTE.gold, 'center', true);
    }
    // Near-car prompt.
    if (ui.nearCar) {
      ctx.fillStyle = PALETTE.hudPanel;
      const label = `E — ${ui.nearCar}`;
      ctx.font = font(18, true);
      const w = ctx.measureText(label).width + 36;
      ctx.fillRect((viewW - w) / 2, viewH - 190, w, 40);
      text(label, viewW / 2, viewH - 163, 18, PALETTE.gold, 'center', true);
    }
    // Controls hint, bottom-right.
    text('WASD move / drive · E car · F punch · Click shoot · H horn · P save · M mute · Esc pause', viewW - 16, viewH - 16, 13, PALETTE.hudMuted, 'right');
    // Crosshair when a gun is out on foot. It turns red over a rival
    // or a cop, so the player knows the shot will land on a target.
    if (p.onFoot && (p.pistol || p.shotgun > 0) && ui.mouse) {
      const mx = ui.mouse.x;
      const my = ui.mouse.y;
      const wx = cam.x + mx;
      const wy = cam.y + my;
      let onTarget = false;
      for (const rival of state.rivals) {
        if (Math.hypot(rival.x - wx, rival.y - wy) < 26) { onTarget = true; break; }
      }
      if (!onTarget) {
        for (const cop of state.cops) {
          if (Math.hypot(cop.x - wx, cop.y - wy) < 26) { onTarget = true; break; }
        }
      }
      ctx.strokeStyle = onTarget ? PALETTE.danger : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 11, 0, Math.PI * 2);
      ctx.moveTo(mx - 16, my);
      ctx.lineTo(mx - 6, my);
      ctx.moveTo(mx + 6, my);
      ctx.lineTo(mx + 16, my);
      ctx.moveTo(mx, my - 16);
      ctx.lineTo(mx, my - 6);
      ctx.moveTo(mx, my + 6);
      ctx.lineTo(mx, my + 16);
      ctx.stroke();
    }
    // Low-health vignette.
    if (p.health < 35) {
      ctx.strokeStyle = `rgba(255,40,40,${0.35 + 0.3 * Math.sin(state.time * 5)})`;
      ctx.lineWidth = 26;
      ctx.strokeRect(0, 0, viewW, viewH);
    }
    // A red flash at the screen edge when the player is just hit.
    if (state.hurtFlash > 0) {
      ctx.strokeStyle = `rgba(255,40,40,${0.45 * state.hurtFlash})`;
      ctx.lineWidth = 34;
      ctx.strokeRect(0, 0, viewW, viewH);
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    ctx.fillStyle = 'rgba(8,10,20,0.55)';
    ctx.fillRect(0, 0, viewW, viewH);
    const width = 640;
    const height = 150 + lines.length * 32 + 70;
    const x = (viewW - width) / 2;
    const y = (viewH - height) / 2;
    ctx.fillStyle = 'rgba(12,16,26,0.92)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = accent || PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    text(title, viewW / 2, y + 74, 46, accent || PALETTE.gold, 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], viewW / 2, y + 122 + i * 32, 19, PALETTE.hudText, 'center');
    }
    text(prompt, viewW / 2, y + height - 30, 20, PALETTE.gold, 'center', true);
  }

  /** Paint one frame: the world, then the HUD or a panel for the screen the game is on. */
  function draw(state, city, screen, ui) {
    const cam = camera(state);
    // Screen shake after a hard crash: a decaying random offset on the camera.
    const sh = state.shake > 0 ? state.shake : 0;
    const shX = sh > 0 ? (Math.random() - 0.5) * sh : 0;
    const shY = sh > 0 ? (Math.random() - 0.5) * sh : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b0e18';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.save();
    ctx.translate(-cam.x + shX, -cam.y + shY);
    drawGround(cam);
    drawSkids(state, cam);
    drawBuildings(state, city, cam);
    drawPickups(state, cam);
    drawPeople(state, cam);
    for (const car of state.cars) {
      if (!inView(cam, car.x, car.y, 60)) continue;
      drawCarShape(car, car.driver === 'player');
    }
    drawPlayer(state, cam);
    drawBulletsAndParticles(state, cam);
    drawFloaters(state, cam);
    drawMarker(state, cam);
    ctx.restore();
    // Speed lines at very high speed: short streaks near the screen edges.
    if (!state.player.onFoot) {
      let myCar = null;
      for (const car of state.cars) if (car.driver === 'player') { myCar = car; break; }
      if (myCar && Math.abs(myCar.speed) > 420) {
        const strength = Math.min(1, (Math.abs(myCar.speed) - 420) / 160);
        ctx.strokeStyle = `rgba(255,255,255,${0.25 * strength})`;
        ctx.lineWidth = 2;
        const cx = viewW / 2;
        const cy = viewH / 2;
        for (let i = 0; i < 10; i += 1) {
          const a = (i / 10) * Math.PI * 2 + state.time * 0.7;
          const r1 = Math.min(viewW, viewH) * 0.42;
          const r2 = r1 + 26 + strength * 20;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
          ctx.stroke();
        }
      }
    }
    // A slow day cycle (4 minutes = 24 in-game hours, starting at 08:00):
    // the wash over the city shifts from clear noon to a warm sunset,
    // then a dark blue night, and back to a pale dawn.
    const hour = (8 + state.time / 10) % 24;
    const dayness = Math.sin(((hour - 6) / 12) * Math.PI);
    if (dayness > 0.35) {
      ctx.fillStyle = 'rgba(255,150,60,0.03)';
    } else if (dayness > -0.25) {
      ctx.fillStyle = `rgba(255,120,50,${(0.08 * (0.35 - dayness) / 0.6).toFixed(3)})`;
    } else {
      ctx.fillStyle = `rgba(10,12,40,${(0.26 * Math.min(1, (-dayness - 0.25) / 0.75)).toFixed(3)})`;
    }
    ctx.fillRect(0, 0, viewW, viewH);
    // Headlights shine through the night overlay: re-apply the camera
    // transform and draw them in world space, after the overlay.
    ctx.save();
    ctx.translate(-cam.x + shX, -cam.y + shY);
    drawHeadlights(state, cam);
    ctx.restore();
    if (screen === SCREEN_TITLE) {
      drawPanel('NEON BAY', [
        'Rico Vega is back in Neon Bay — and Mama Rosa has work for him.',
        'Seven jobs. One big score. The whole NBPD watching.',
        '',
        'WASD / arrows — move and drive      E — enter / steal a car',
        'Mouse + click — aim and shoot      F — punch      R — reload',
        'H — horn      Shift — run      P — save      M — mute      Esc — pause',
      ], ui.hasSave ? 'ENTER — Continue your story    ·    R — Start over' : 'ENTER — Start the story');
      text('A complete open-world crime game · built for make.fun', viewW / 2, viewH - 40, 15, PALETTE.hudMuted, 'center');
      return;
    }
    drawHud(state, ui, cam);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', [`Mission ${state.missionIndex + 1} of ${MISSIONS.length} — ${state.missionActive ? 'in progress' : 'free roam'}`, `Cash: $${state.cash.toLocaleString('en-US')}   ·   Wanted: ${'★'.repeat(state.wanted)}${'☆'.repeat(5 - state.wanted)}`, 'WASD move · E car · F punch · Click shoot · H horn · P save'], 'Press Esc or Enter to keep playing');
    } else if (screen === SCREEN_BUSTED) {
      drawPanel('BUSTED', ['The NBPD caught up with you.', state.banner || ''], 'Press Enter to keep playing', '#4d8dff');
    } else if (screen === SCREEN_WASTED) {
      drawPanel('WASTED', ['You wake up at Neon Bay General.', state.banner || ''], 'Press Enter to keep playing', PALETTE.danger);
    } else if (screen === SCREEN_COMPLETE) {
      const mins = Math.floor(state.time / 60);
      const secs = Math.floor(state.time % 60);
      drawPanel('THE BIG SCORE', [`You did it, Rico. The crate is Rosa's, the city is yours.`, `Cash: $${state.cash.toLocaleString('en-US')}   ·   Missions: ${MISSIONS.length}/${MISSIONS.length}`, `Time: ${mins}:${String(secs).padStart(2, '0')}   ·   Wanted: ${'★'.repeat(state.wanted)}${'☆'.repeat(5 - state.wanted)}`, 'Free roam: keep driving, keep the heat low. Courier and taxi fares pay, too.'], 'Press Enter to keep roaming', PALETTE.gold);
    }
  }

  resize();
  buildGround();
  window.addEventListener('resize', resize);
  return { draw, camera, viewSize() { return { w: viewW, h: viewH }; } };
}
