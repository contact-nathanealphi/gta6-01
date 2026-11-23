# Neon Bay — an open-world crime game

[![gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/contact-nathanealphi/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/contact-nathanealphi/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

**Neon Bay** is a complete open-world crime game in the spirit of GTA 6, built
for [gta6-01](https://make.fun/bounty/gta6-01) on make.fun. It runs offline in a
desktop browser from static files — no network, no installs.

You play Rico Vega, a driver fresh out of the Neon Bay docks, working your way
up for Mama Rosa while the Neon Bay Police Department watches every move.

## What is in the game

- A sun-soaked modern city (Neon Bay) to explore **on foot and by car** —
  avenues and streets, a mall, a hospital, a police HQ, a port and a beach.
- **Traffic and pedestrians** living their own lives on the roads and pavements.
- **Steal any car** — parked or occupied — and drive it. Sedans, taxis, vans,
  the Dune Runner pickup, the Bay Muscle, the Neon Limo, and the Golden Comet
  sports car.
- A **wanted system with police**: commit crimes, earn stars, and the NBPD
  chases you on foot and in patrol cars. Get busted or wasted and you wake up
  at the station or the hospital, lighter in the wallet.
- **Missions and a story**: seven linked jobs, from a first delivery to the big
  score at the port — and the getaway that follows — with dialogue, markers and cash rewards.
- **Combat**: fists, a pistol and a **shotgun** (five pellets, six shells),
  **armor vests** (half damage for 20s), health and ammo pickups, and rival
  crews who shoot back.
- **Police escalation**: at four stars and up the NBPD sets roadblocks ahead
  of you — smash through or swerve around them.
- **Near-miss bonuses**: thread past traffic at speed without touching it and
  earn $10 a shave.
- **Side work**: after the story, **courier** deliveries (grab a parcel, deliver
  in 40s) pay $120–200, and driving a **taxi** earns fares ($80–150) from
  passengers who hail you.
- **Repair**: wrenches at the garage and the docks fix your car (+50 HP); a
  damaged car smokes from the hood and shows its health in the HUD.
- **A living day**: a 4-minute day cycle (morning, noon, sunset, night) with
  an in-game clock, headlights that cut through the dark, and lit windows.
- **A living city**: 22 traffic cars (sedans, taxis, vans, the Dune Runner pickup,
  the Bay Muscle and the Neon Limo) and 30 pedestrians — walkers and joggers —
  going about their day. Two new landmarks: the Neon Casino and the Neon Stadium.
- A **HUD with a minimap and a speedometer**, car health, weapon and armor
  readouts, a start screen, and **saves** (your progress, cash and mission
  state are kept in the browser).
- **Feel**: screen shake on hard crashes, skid marks on hard cornering, muzzle
  flashes, wreck explosions, exhaust puffs, speed lines, floating "+$" text,
  and **synthesized sound**: engine hum, police sirens, gunshots, crashes,
  a horn, cash cha-chings, mission jingles and a synthwave bass line — all
  made with WebAudio, no audio files.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
file server). Keyboard + mouse:

- **WASD / arrows** — move (on foot) or drive (in a car)
- **Shift** — run
- **E** — enter / exit a car (steal it)
- **Mouse + click** — aim and shoot (pistol / shotgun)
- **F** — punch · **R** — reload · **H** — horn · **P** — save · **M** — mute · **Esc** — pause

## Build

Everything here is original: the city, characters, vehicles, names, story,
art and sound. Nothing is from Rockstar Games. The game is plain JavaScript
on Canvas (no engine, no libraries), and the entrypoint (`main.ts`, Node 22,
standard library only) copies `game/` and `screenshots/` to the output and
writes `dossier.json` with the kit's `buildDossier`.

Source layout under `game/src/`:

- `tune.js` — every tuning number and colour
- `rng.js` — the seeded random generator
- `city.js` — the map: roads, blocks, buildings, landmarks, collision
- `world.js` — the rules: player, cars, traffic, pedestrians, police, rivals,
  wanted level, missions, combat, pickups, courier, taxi fares
- `input.js` — keyboard and mouse
- `audio.js` — synthesized sound with WebAudio
- `render.js` — the camera, the city, the HUD and the minimap
- `shots.js` — the four screenshot scenes (`?shot=start|drive|chase|mission`)
- `main.js` — boot, the loop, the screens and saving

`ITERATIONS-200X.md` logs the 200-iteration upgrade pass (every change, its
test result, and whether it was kept), and `neon-test.mjs` is the headless
test that verifies the rules without a browser.

## License

MIT — see `LICENSE`.
