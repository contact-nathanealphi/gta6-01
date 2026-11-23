import { AVENUES, CAR_KINDS, FONT, PALETTE, PLAYER, STREETS, WORLD } from './tune.js';
import { MISSIONS } from './world.js';
import { renderChopperSearchlight, renderNbpdDispatchBoard } from './police-air-support.js';
import { renderRadialWeaponWheel } from './weapon-wheel.js';
import { CITY_DISTRICTS_6, rankFor, renderFixerDialogueBox } from './district-fixer.js';
import { renderCrewHud, renderGarageShowroom, renderRaceHud, renderRadioToast } from './crew-garage-race.js';

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
  let world3D = false;
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
    ctx.fillText(value, x, y);
  }

  const hud = {
    w: 0, h: 0, text,
    rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); },
    circ(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); },
    ring(x, y, r, c) { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); },
  };

  function camera(state) {
    const p = state.player;
    const cl = (v, m, vw) => (vw >= m ? (m - vw) / 2 : Math.max(0, Math.min(m - vw, v)));
    return { x: cl(p.x - viewW / 2, WORLD.width, viewW), y: cl(p.y - viewH / 2, WORLD.height, viewH), w: viewW, h: viewH };
  }

  function playerCar(state) {
    for (const car of state.cars) if (car.driver === 'player') return car;
    return null;
  }

  function inView(cam, x, y, margin) {
    return x > cam.x - margin && x < cam.x + cam.w + margin && y > cam.y - margin && y < cam.y + cam.h + margin;
  }
  function drawFallbackWorld(state, city, cam) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    R(cam.x, cam.y, cam.w, cam.h, PALETTE.grass);
    R(cam.x, 2440, cam.w, WORLD.height - 2440, PALETTE.sand);
    R(cam.x, 2630, cam.w, WORLD.height - 2630, PALETTE.water);
    for (const ax of AVENUES) { R(ax - 86, 0, 172, WORLD.height, PALETTE.sidewalk); R(ax - 60, 0, 120, WORLD.height, PALETTE.asphalt); }
    for (const sy of STREETS) { R(0, sy - 86, WORLD.width, 172, PALETTE.sidewalk); R(0, sy - 60, WORLD.width, 120, PALETTE.asphalt); }
    ctx.strokeStyle = PALETTE.lane;
    ctx.lineWidth = 3;
    ctx.setLineDash([26, 30]);
    ctx.beginPath();
    for (const ax of AVENUES) { ctx.moveTo(ax, 0); ctx.lineTo(ax, WORLD.height); }
    for (const sy of STREETS) { ctx.moveTo(0, sy); ctx.lineTo(WORLD.width, sy); }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const b of city.buildings) {
      if (!inView(cam, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h))) continue;
      R(b.x + 8, b.y + 10, b.w, b.h, 'rgba(0,0,0,0.25)');
      R(b.x, b.y, b.w, b.h, b.color);
      R(b.x + 8, b.y + 8, b.w - 16, 14, b.glass);
      if (b.name) text(b.name, b.x + b.w / 2, b.y + b.h / 2 + 5, 15, '#ffffff', 'center', true);
    }
    const dot = (x, y, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const palm of city.palms) if (inView(cam, palm.x, palm.y, 40)) dot(palm.x + 4, palm.y - 26, 12, '#3f7d3a');
    for (const item of state.pickups) {
      if (!inView(cam, item.x, item.y, 30)) continue;
      dot(item.x, item.y, 9, item.kind === 'health' ? '#e5484d' : item.kind === 'cash' ? '#2fae5f' : PALETTE.gold);
    }
    for (const ped of state.peds) if (inView(cam, ped.x, ped.y, 30) && ped.down <= 0) dot(ped.x, ped.y, 11, ped.shirt);
    for (const cop of state.cops) if (inView(cam, cop.x, cop.y, 30)) dot(cop.x, cop.y, 13, PALETTE.cop);
    for (const rival of state.rivals) if (inView(cam, rival.x, rival.y, 30)) dot(rival.x, rival.y, 13, PALETTE.rival);
    for (const car of state.cars) {
      if (!inView(cam, car.x, car.y, 60)) continue;
      const spec = CAR_KINDS[car.kind];
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = car.color;
      ctx.fillRect(-spec.length / 2, -spec.width / 2, spec.length, spec.width);
      ctx.fillStyle = 'rgba(180,220,240,0.85)';
      ctx.fillRect(spec.length / 2 - 14, -spec.width / 2 + 3, 8, spec.width - 6);
      ctx.restore();
      if (car.driver === 'player') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(car.x, car.y, 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (car.driver === 'player' && state.upgrades && state.upgrades.glow > 0) {
        ctx.fillStyle = 'rgba(0,229,255,0.35)';
        ctx.beginPath(); ctx.arc(car.x, car.y, 34, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const w of state.wrecks || []) {
      ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.angle);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-22, -11, 44, 22);
      ctx.fillStyle = '#ff7a18'; ctx.fillRect(-8, -14, 16, 8);
      ctx.restore();
    }
    renderChopperSearchlight(ctx, state);
    const p = state.player;
    if (p.onFoot && inView(cam, p.x, p.y, 40)) dot(p.x, p.y, 14, PALETTE.player);
    for (const b of state.bullets) {
      if (!inView(cam, b.x, b.y, 30)) continue;
      ctx.strokeStyle = '#ffe9a3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const f of state.floaters) {
      if (!inView(cam, f.x, f.y, 40)) continue;
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      text(f.label, f.x, f.y, 17, f.color, 'center', true);
    }
    ctx.globalAlpha = 1;
    const obj = state.objective;
    if (obj && inView(cam, obj.x, obj.y, 60)) {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.marker;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.restore();
    }
  }

  function drawMinimap(state) {
    const x0 = viewW - MINIMAP.w - 14, y0 = 14;
    const sx = MINIMAP.w / WORLD.width, sy = MINIMAP.h / WORLD.height;
    const R = hud.rect;
    R(x0 - 6, y0 - 6, MINIMAP.w + 12, MINIMAP.h + 12, PALETTE.hudPanel);
    R(x0, y0, MINIMAP.w, MINIMAP.h, '#2c4a2c');
    for (const d of CITY_DISTRICTS_6) R(x0 + d.x * sx, y0 + d.y * sy, d.w * sx, d.h * sy, d.color + '22');
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
    R(x0, y0 + 2440 * sy, MINIMAP.w, 12, PALETTE.sand);
    const carDot = { traffic: '#9a9a9a', police: '#4d8dff' };
    for (const car of state.cars) {
      if (car.driver === 'player') continue;
      R(x0 + car.x * sx - 2, y0 + car.y * sy - 2, 4, 4, carDot[car.driver] || '#d8d8d8');
    }
    for (const rival of state.rivals) R(x0 + rival.x * sx - 2, y0 + rival.y * sy - 2, 4, 4, '#ff5a5a');
    const pickupColor = { health: '#57d977', cash: '#2fae5f', ammo: '#f2c94c', courier: '#ffffff', shotgun: '#ff8c42', repair: '#2fae5f' };
    for (const item of state.pickups) R(x0 + item.x * sx - 2, y0 + item.y * sy - 2, 4, 4, pickupColor[item.kind] || '#8a6f4d');
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
    const p = state.player, s = state, R = hud.rect;
    R(14, 14, 250, 190, PALETTE.hudPanel);
    text(`$${s.cash.toLocaleString('en-US')}`, 28, 46, 28, PALETTE.gold, 'left', true);
    R(28, 58, 180, 12, '#333');
    R(28, 58, 180 * Math.max(0, Math.min(1, p.health / PLAYER.health)), 12, p.health > 35 ? PALETTE.health : PALETTE.danger);
    text(`${Math.ceil(p.health)}`, 216, 70, 14, PALETTE.hudText, 'left', true);
    for (let i = 0; i < 5; i += 1) {
      const flash = s.wantedFlash > 0 && i === s.wanted - 1;
      text('★', 28 + i * 26, 96, 20, flash ? PALETTE.danger : (i < s.wanted ? PALETTE.gold : '#555'), 'left');
    }
    if (s.wantedPoints > 0) {
      R(28, 102, 130, 5, 'rgba(0,0,0,0.5)');
      R(28, 102, 130 * Math.min(1, s.wantedPoints / 10), 5, PALETTE.danger);
      const heatNames = ['', 'Spotted', 'Chased', 'Hunted', 'Lockdown', 'Citywide manhunt'];
      text(heatNames[s.wanted], 168, 108, 13, PALETTE.danger, 'left', true);
    }
    if (p.onFoot) {
      if (p.shotgun > 0) {
        text(`Shotgun  ${p.shotgun} shells`, 28, 122, 15, PALETTE.gold, 'left', true);
      } else if (p.pistol) {
        const lowAmmo = p.mag <= 3 && p.reloadT <= 0;
        text(`Pistol  ${p.mag}/${PLAYER.magSize}`, 28, 122, 15, lowAmmo ? PALETTE.danger : PALETTE.hudText, 'left', true);
        if (p.reloadT > 0) text('Reloading…', 150, 122, 15, PALETTE.gold, 'left');
        else if (lowAmmo) text('LOW AMMO — press R', 150, 122, 15, PALETTE.danger, 'left', true);
      }
      if (p.armor > 0) text(`Armor  ${Math.ceil(p.armor)}s`, 28, 140, 15, '#4d8dff', 'left', true);
    }
    if (s.nearMissStreak > 1 && s.nearMissStreakT > 0) text(`Near-miss streak x${s.nearMissStreak}`, viewW - 28, viewH - 48, 16, PALETTE.gold, 'right', true);
    if (!p.onFoot) {
      const myCar = playerCar(s);
      if (myCar) {
        text(`${Math.round(Math.abs(myCar.speed) * 0.32)} km/h${s.nitrousT > 0 ? ' · NITRO' : ''}`, 28, 126, 20, s.nitrousT > 0 ? '#2e7bff' : PALETTE.hudText, 'left', true);
        text(myCar.kind === 'patrol' ? 'NBPD Interceptor' : (CAR_KINDS[myCar.kind] ? CAR_KINDS[myCar.kind].label : myCar.kind), 28, 148, 13, PALETTE.hudMuted, 'left');
        if (p.armor > 0) text(`Armor  ${Math.ceil(p.armor)}s`, 150, 148, 13, '#4d8dff', 'left');
        text('VEHICLE', 28, 168, 11, PALETTE.hudMuted, 'left');
        R(72, 172, 160, 9, 'rgba(0,0,0,0.5)');
        R(72, 172, 160 * Math.min(1, Math.max(0, myCar.health) / 100), 9, myCar.health > 50 ? '#57d977' : myCar.health > 25 ? '#f2c94c' : '#ff4d4d');
        if (myCar.kind === 'taxi') {
          R(28, 176, 44, 16, PALETTE.gold);
          text('TAXI', 50, 188, 11, '#222', 'center', true);
          text('fares pay — watch hails', 80, 188, 13, PALETTE.hudMuted, 'left');
        }
      }
    }
    drawMinimap(s);
    hud.w = viewW; hud.h = viewH;
    const sys = ui.sys;
    if (sys) {
      const d = sys.district.current();
      const rep = sys.district.rep(d.name);
      R(14, 212, 250, 48, PALETTE.hudPanel);
      R(14, 212, 6, 48, d.color);
      text(d.name, 30, 232, 15, '#ffffff', 'left', true);
      text(rankFor(rep).name + '  ·  ' + rep + '%', 30, 252, 13, PALETTE.hudMuted, 'left');
      if (s.wanted > 0) renderNbpdDispatchBoard(hud, s);
      renderCrewHud(hud, s);
      renderRadioToast(hud, s);
      renderRaceHud(hud, s);
      if (s.garageOpen) renderGarageShowroom(hud, s, sys.garage);
      if (ui.wheelOpen) renderRadialWeaponWheel(hud, s, ui.wheelSlot || s.player.weapon || 1, ui.wheelPos || null);
    }
    const clock = (8 + s.time / 10) % 24, hours = Math.floor(clock), mins = Math.floor((clock % 1) * 60);
    const night = hours < 6 || hours >= 18;
    text(`${night ? '☾' : '☀'} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, viewW - 14, 14 + MINIMAP.h + 28, 15, PALETTE.hudText, 'right', true);
    const m = MISSIONS[s.missionIndex];
    const fixer = s.missionActive && m && m.giver.includes('Viper');
    if (s.objective) {
      R(14, viewH - 76, fixer && s.dialogue.length > 0 ? 280 : 430, 62, PALETTE.hudPanel);
      text(s.missionActive ? `Mission ${s.missionIndex + 1} of ${MISSIONS.length}` : 'Free roam', 28, viewH - 52, 14, PALETTE.hudMuted, 'left', true);
      const dist = Math.round(Math.hypot(s.objective.x - p.x, s.objective.y - p.y));
      text(`${s.objective.label}  ·  ${dist}m`, 28, viewH - 28, 17, PALETTE.hudText, 'left');
    }
    if (fixer && s.dialogue.length > 0) renderFixerDialogueBox(hud, s);
    else if (s.dialogue.length > 0) {
      const line = s.dialogue[0];
      ctx.font = font(17, false);
      const w = Math.min(720, ctx.measureText(line).width + 40);
      R((viewW - w) / 2, viewH - 132, w, 40, PALETTE.hudPanel);
      text(line, viewW / 2, viewH - 105, 17, '#ffe9c4', 'center');
    }
    if (s.banner && s.bannerTimer > 0) {
      ctx.font = font(26, true);
      const w = ctx.measureText(s.banner).width + 48;
      R((viewW - w) / 2, 18, w, 44, 'rgba(12,16,26,0.8)');
      text(s.banner, viewW / 2, 48, 26, PALETTE.gold, 'center', true);
    }
    const pill = (label, y, color) => {
      ctx.font = font(18, true);
      const w = ctx.measureText(label).width + 36;
      R((viewW - w) / 2, y, w, 40, PALETTE.hudPanel);
      text(label, viewW / 2, y + 27, 18, color, 'center', true);
    };
    if (ui.nearCar) pill(`E — ${ui.nearCar}`, viewH - 190, PALETTE.gold);
    if (sys && !s.garageOpen && sys.garage.near()) pill('G — Neon Customs: upgrade your ride', viewH - 240, '#ff2e88');
    text('WASD move/drive · E car · F punch · Click shoot · H horn · P save · M mute · Esc', viewW - 16, viewH - 16, 13, PALETTE.hudMuted, 'right');
    if (p.onFoot && (p.pistol || p.shotgun > 0) && ui.mouse) {
      const mx = ui.mouse.x, my = ui.mouse.y, wx = cam.x + mx, wy = cam.y + my;
      let onTarget = false;
      for (const rival of s.rivals) if (Math.hypot(rival.x - wx, rival.y - wy) < 26) { onTarget = true; break; }
      if (!onTarget) for (const cop of s.cops) if (Math.hypot(cop.x - wx, cop.y - wy) < 26) { onTarget = true; break; }
      ctx.strokeStyle = onTarget ? PALETTE.danger : '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 11, 0, Math.PI * 2);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        ctx.moveTo(mx + dx * 16, my + dy * 16);
        ctx.lineTo(mx + dx * 6, my + dy * 6);
      }
      ctx.stroke();
    }
    if (p.health < 35) {
      ctx.strokeStyle = `rgba(255,40,40,${0.35 + 0.3 * Math.sin(s.time * 5)})`;
      ctx.lineWidth = 26;
      ctx.strokeRect(0, 0, viewW, viewH);
    }
    if (s.hurtFlash > 0) {
      ctx.strokeStyle = `rgba(255,40,40,${0.45 * s.hurtFlash})`;
      ctx.lineWidth = 34;
      ctx.strokeRect(0, 0, viewW, viewH);
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    const ac = accent || PALETTE.gold, w = 640, h = 220 + lines.length * 32, x = (viewW - w) / 2, y = (viewH - h) / 2;
    hud.rect(0, 0, viewW, viewH, 'rgba(8,10,20,0.55)');
    hud.rect(x, y, w, h, 'rgba(12,16,26,0.92)');
    ctx.strokeStyle = ac; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    text(title, viewW / 2, y + 74, 46, ac, 'center', true);
    for (let i = 0; i < lines.length; i += 1) text(lines[i], viewW / 2, y + 122 + i * 32, 19, PALETTE.hudText, 'center');
    text(prompt, viewW / 2, y + h - 30, 20, PALETTE.gold, 'center', true);
  }

  function draw(state, city, screen, ui) {
    const cam = camera(state);
    const sh = Math.max(0, state.shake);
    const shX = sh > 0 ? (Math.random() - 0.5) * sh : 0;
    const shY = sh > 0 ? (Math.random() - 0.5) * sh : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (world3D) {
      ctx.clearRect(0, 0, viewW, viewH);
    } else {
    ctx.fillStyle = '#0b0e18';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.save();
    ctx.translate(-cam.x + shX, -cam.y + shY);
    drawFallbackWorld(state, city, cam);
    ctx.restore();
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
    }
    if (screen === SCREEN_TITLE) {
      hud.rect(0, 0, viewW, viewH, 'rgba(8,10,20,0.18)');
      text('NEON BAY', viewW / 2, 150, 64, PALETTE.gold, 'center', true);
      text('VICE DUSK', viewW / 2, 192, 26, '#ff2e88', 'center', true);
      text('Ten jobs. One big score.', viewW / 2, 232, 16, PALETTE.hudText, 'center');
      const bw = 300, bx = (viewW - bw) / 2;
      hud.rect(bx, 300, bw, 56, PALETTE.gold);
      text('▶  ENTER — PLAY', viewW / 2, 336, 22, '#1a1a22', 'center', true);
      if (ui.hasSave) text(ui.saveStoryDone ? `Saved game: $${ui.saveCash.toLocaleString('en-US')} — story complete` : `Saved game: $${ui.saveCash.toLocaleString('en-US')} — mission ${ui.saveMission + 1} of ${MISSIONS.length}`, viewW / 2, 280, 15, PALETTE.hudMuted, 'center');
      const pills = ['THE GRAND CASINO HEIST — $5,000', '6 DISTRICTS · 3 CREW · 2 RACES', 'WANTED ★★★★★ · 3 RADIO'];
      const pw = 360, gap = 16, px0 = (viewW - (pw * 3 + gap * 2)) / 2, py = viewH - 80;
      for (let i = 0; i < 3; i += 1) {
        hud.rect(px0 + i * (pw + gap), py, pw, 44, 'rgba(12,16,26,0.85)');
        text(pills[i], px0 + i * (pw + gap) + pw / 2, py + 28, 15, '#ffffff', 'center', true);
      }
      return;
    }
    drawHud(state, ui, cam);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', [`Mission ${state.missionIndex + 1} of ${MISSIONS.length} — ${state.missionActive ? 'in progress' : 'free roam'}`, `Cash: $${state.cash.toLocaleString('en-US')}   ·   Wanted: ${'★'.repeat(state.wanted)}${'☆'.repeat(5 - state.wanted)}`, 'WASD move · E car · F punch · Click shoot · H horn · P save'], 'Press Esc or Enter to keep playing');
    } else if (screen === SCREEN_BUSTED) {
      drawPanel('BUSTED', ['The NBPD caught up with you.', state.banner || ''], 'Press Enter to keep playing', '#4d8dff');
    } else if (screen === SCREEN_WASTED) {
      drawPanel('WASTED', ['You wake up at the hospital.', state.banner || ''], 'Press Enter to keep playing', PALETTE.danger);
    } else if (screen === SCREEN_COMPLETE) {
      const mins = Math.floor(state.time / 60);
      const secs = Math.floor(state.time % 60);
      drawPanel('THE BIG SCORE', [`You did it, Rico. The crate is Rosa's.`, `Cash: $${state.cash.toLocaleString('en-US')}   ·   Missions: ${MISSIONS.length}/${MISSIONS.length}`, `Time: ${mins}:${String(secs).padStart(2, '0')}   ·   Wanted: ${'★'.repeat(state.wanted)}${'☆'.repeat(5 - state.wanted)}`, 'Free roam: courier and taxi fares pay.'], 'Press Enter to keep roaming', PALETTE.gold);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, camera, setWorld3D(v) { world3D = !!v; }, viewSize() { return { w: viewW, h: viewH }; } };
}
