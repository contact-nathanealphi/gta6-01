// Neon Bay — every tuning number and colour in one place.
// The world is a fixed 3600x2700 logical city; the camera follows the player,
// so nothing below depends on the screen size.

export const WORLD = { width: 3600, height: 2700 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Avenues run north-south, streets run east-west. Road half-width is 60, so a road is 120 wide. */
export const AVENUES = [300, 900, 1500, 2100, 2700, 3300];
export const STREETS = [300, 800, 1300, 1800, 2300];
export const ROAD_HALF = 60;
export const WALK = 26;

export const PLAYER = {
  radius: 14,
  walkSpeed: 235,
  runSpeed: 355,
  health: 100,
  punchDamage: 12,
  punchRange: 46,
  pistolDamage: 25,
  magSize: 12,
};

export const CAR_KINDS = {
  sedan: { label: 'Bayside Sedan', topSpeed: 430, accel: 500, turn: 2.6, color: '#c94f43', length: 44, width: 22 },
  sports: { label: 'Golden Comet', topSpeed: 580, accel: 680, turn: 3.1, color: '#f2c94c', length: 46, width: 22 },
  taxi: { label: 'Bay Cab', topSpeed: 420, accel: 480, turn: 2.6, color: '#f2d13d', length: 44, width: 22 },
  van: { label: 'Harbor Van', topSpeed: 350, accel: 380, turn: 2.2, color: '#7d8aa0', length: 52, width: 24 },
  pickup: { label: 'Dune Runner', topSpeed: 460, accel: 520, turn: 2.5, color: '#5a7d4a', length: 48, width: 23 },
  patrol: { label: 'NBPD Interceptor', topSpeed: 520, accel: 620, turn: 3.0, color: '#2f6fd0', length: 46, width: 22 },
};

export const TRAFFIC_COUNT = 22;
export const PED_COUNT = 30;

export const WANTED = {
  /** Points per crime; level is floor(points / 2), capped at 5. */
  stealOccupied: 2,
  hitPed: 2,
  shoot: 1,
  kill: 3,
  maxPoints: 10,
  /** Seconds with no crime before the heat starts cooling off. */
  coolDelay: 18,
  coolRate: 0.4,
  /** A cop must be this close to spot the player and keep the heat on. */
  spotRange: 520,
};

export const COPS = {
  footSpeed: 265,
  footArrestTime: 1.6,
  footHealth: 50,
  carChaseSpeed: 540,
  ramDamage: 8,
};

export const RIVAL = { health: 50, shootRange: 340, shootEvery: 0.9, damage: 7 };

export const PALETTE = {
  grass: '#6f9e57',
  sand: '#e2cd96',
  water: '#2e7fa8',
  asphalt: '#3c414d',
  lane: '#d8c96a',
  sidewalk: '#9a8f7d',
  curb: '#6e6455',
  buildingRoof: '#b08954',
  player: '#ff5a3c',
  playerDark: '#c22e18',
  cop: '#2f6fd0',
  copDark: '#1d4a8a',
  rival: '#a83232',
  ped: '#e8e2d4',
  hudPanel: 'rgba(12, 16, 26, 0.72)',
  hudText: '#f4f1e6',
  hudMuted: '#b9b3a4',
  gold: '#f2c94c',
  danger: '#ff4d4d',
  health: '#57d977',
  marker: '#ffd23d',
  night: 'rgba(10, 12, 30, 0.35)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the save lives between visits (this browser only). */
export const SAVE_KEY = 'neon-bay.save.v1';
