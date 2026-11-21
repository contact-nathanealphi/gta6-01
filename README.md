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
  streets, sidewalks, a mall, a hospital, a police HQ, a port and a beach.
- **Traffic and pedestrians** living their own lives on the roads and pavements.
- **Steal any car** — parked or occupied — and drive it.
- A **wanted system with police**: commit crimes, earn stars, and the NBPD
  chases you on foot and in patrol cars. Get busted or wasted and you wake up
  at the station or the hospital, lighter in the wallet.
- **Missions and a story**: six linked jobs, from a first delivery to the big
  score at the port, with dialogue, markers and cash rewards.
- **Combat**: fists and a pistol, health packs, and rival crews who shoot back.
- A **HUD with a minimap**, a start screen, and **saves** (your progress,
  cash and mission state are kept in the browser).

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
file server). Keyboard + mouse:

- **WASD / arrows** — move (on foot) or drive (in a car)
- **Shift** — run
- **E** — enter / exit a car (steal it)
- **Mouse + click** — aim and shoot (pistol)
- **F** — punch · **R** — reload · **P** — save · **M** — mute · **Esc** — pause

## Build

Everything here is original: the city, characters, vehicles, names, story,
art, sound and music. Nothing is from Rockstar Games. The game is plain
JavaScript on Canvas (no engine, no libraries), and the entrypoint
(`main.ts`, Node 22, standard library only) copies `game/` and `screenshots/`
to the output and writes `dossier.json` with the kit's `buildDossier`.

## License

MIT — see `LICENSE`.
