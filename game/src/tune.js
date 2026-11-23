export const WORLD = { width: 3600, height: 2700 };

export const STEP = 1 / 60;

export const AVENUES = [300, 900, 1500, 2100, 2700, 3300];
export const STREETS = [300, 800, 1300, 1800, 2300];
export const ROAD_HALF = 60;
export const WALK = 26;

export const PLAYER = {
  radius: 14,
  walkSpeed: 250,
  runSpeed: 375,
  health: 100,
  punchDamage: 15,
  punchRange: 46,
  pistolDamage: 28,
  magSize: 14,
};

export const CAR_KINDS = {
  sedan: { label: 'Bayside Sedan', topSpeed: 430, accel: 540, turn: 2.6, color: '#c94f43', length: 44, width: 22 },
  sports: { label: 'Golden Comet', topSpeed: 600, accel: 680, turn: 3.1, color: '#f2c94c', length: 46, width: 22 },
  taxi: { label: 'Bay Cab', topSpeed: 420, accel: 480, turn: 2.6, color: '#f2d13d', length: 44, width: 22 },
  van: { label: 'Harbor Van', topSpeed: 350, accel: 380, turn: 2.2, color: '#7d8aa0', length: 52, width: 24 },
  pickup: { label: 'Dune Runner', topSpeed: 460, accel: 520, turn: 2.5, color: '#5a7d4a', length: 48, width: 23 },
  patrol: { label: 'NBPD Interceptor', topSpeed: 530, accel: 620, turn: 3, color: '#2f6fd0', length: 46, width: 22 },
  muscle: { label: 'Bay Muscle', topSpeed: 500, accel: 620, turn: 2.6, color: '#d4693c', length: 48, width: 23 },
  limo: { label: 'Neon Limo', topSpeed: 380, accel: 400, turn: 2, color: '#3a3a4a', length: 58, width: 24 },
};

export const TRAFFIC_COUNT = 22;
export const PED_COUNT = 30;
export const WANTED = {
  stealOccupied: 2,
  hitPed: 2,
  shoot: 1,
  kill: 3,
  maxPoints: 10,
  coolDelay: 13,
  coolRate: 0.5,
  spotRange: 520,
};

export const COPS = {
  footSpeed: 255,
  footArrestTime: 1.9,
  footHealth: 50,
  carChaseSpeed: 550,
  ramDamage: 8,
};

export const RIVAL = { health: 50, shootRange: 340, shootEvery: 1.2, damage: 5 };

export const PALETTE = {
  grass: '#6f9e57',
  sand: '#e2cd96',
  water: '#1f7d9e',
  asphalt: '#3c414d',
  lane: '#d8c96a',
  sidewalk: '#9a8f7d',
  player: '#ff5a3c',
  cop: '#2f6fd0',
  rival: '#a83232',
  hudPanel: 'rgba(12, 16, 26, 0.72)',
  hudText: '#f4f1e6',
  hudMuted: '#b9b3a4',
  gold: '#f2c94c',
  danger: '#ff4d4d',
  health: '#57d977',
  marker: '#ffd23d',
};

export const FONT = 'system-ui, sans-serif';

export const SAVE_KEY = 'neon-bay.save.v1';
