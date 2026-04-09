# UA Defense

## Overview

`ua-defense` is a browser game about defending Ukrainian cities from mixed air attacks.
It is built as a lightweight React 19 + Vite + canvas project with most gameplay behavior driven from plain JavaScript data tables.

This file is the top-level project brief.
The same pattern is worth reusing in other repos: one stable `PROJECT.md` that explains what the project is, how it is structured, and where the important moving parts live.

## Current State

- Production is live on [ua-defense.vercel.app](https://ua-defense.vercel.app).
- Campaign modes `training`, `realistic`, and `hell` are playable.
- `kobayashiMaru` is a live endless challenge mode with generated waves, enemy stat ramping, survival-first leaderboard encoding, and wave-based pressure ramps against player air defense.
- Balance telemetry is wired into the end-of-run screen.
- Enemy pacing uses controlled-chaos sequencing instead of raw full-shuffle.
- Deep-ingress routing is implemented for part of the drone roster and for cruise missiles, so threats can penetrate deep into the map before turning onto targets.
- Guided enemies use waypoint-based navigation instead of the old wobbling drift.
- `Iskander` interception can trigger a short cinematic freeze-frame with a dedicated `Patriot` convergence shot.
- Battle log funding/upkeep text and battlefield callouts have difficulty-aware sarcastic flavor.
- Air-defense units can now be repaired directly from the context menu, including during a live wave; destroyed buildings can be emergency-rebuilt between waves at partial HP.
- Fullscreen non-battle screens use their own scroll shell, so tall menus and results pages remain usable on smaller viewports.
- Enemy art now supports mixed sprite sources: most enemies still use inline SVG, while selected ones such as `shahed` and `lancet` can use PNG assets when available.

## Design Pillars

- Controlled chaos instead of deterministic tower-defense scripting.
- Mixed-pressure raids where the player can prepare partially, but never perfectly.
- Some damage and losses must remain unavoidable on harder settings.
- Balance should stay data-driven and measurable, not hidden in large engine rewrites.
- Endless challenge should feel like attrition and saturation, not just inflated HP bars.

## Game Modes

- `training`: forgiving onboarding mode with generous hit chances and lighter waves.
- `realistic`: main campaign balance with harsher probabilities and denser mixed attacks.
- `hell`: short, punishing campaign with stronger enemy pressure and faster collapse states.
- `kobayashiMaru`: endless challenge mode. There is no victory state. Waves are generated on the fly, enemy pressure escalates, and eventual defeat is part of the design.

## Gameplay Loop

1. Choose a city and difficulty.
2. Place and upgrade defenses during downtime.
3. Start a wave and survive a mixed incoming attack with weather, EW, deep-ingress routes, and occasional special events.
4. Sell, repair, and react during the wave if defenses start collapsing.
5. Repair buildings, emergency-rebuild destroyed infrastructure, reposition, upgrade, and spend the next reward window.
6. Repeat until campaign victory, infrastructure collapse, or endless defeat in `kobayashiMaru`.

## Technical Structure

- [`src/data`](/Users/stark/projects/ua-defense/src/data): static configs for cities, units, difficulties, enemies, quips, and other tunable values.
- [`src/game`](/Users/stark/projects/ua-defense/src/game): runtime systems such as engine loop, combat, spawning, events, state, rendering helpers, and endless-wave logic.
- [`src/game/renderer`](/Users/stark/projects/ua-defense/src/game/renderer): canvas rendering for buildings, enemies, units, HUD overlays, warnings, and battle callouts.
- [`src/ui`](/Users/stark/projects/ua-defense/src/ui): React screens and HUD components.
- [`src/lib`](/Users/stark/projects/ua-defense/src/lib): external integrations such as the leaderboard client.
- [`tests`](/Users/stark/projects/ua-defense/tests): node-based regression tests for bugs, balance, endless-mode scaffolding, pressure systems, and repair behavior.
- [`docs/plans`](/Users/stark/projects/ua-defense/docs/plans): implementation plans and balance-pass notes.

## Key Files

- [`src/App.jsx`](/Users/stark/projects/ua-defense/src/App.jsx): top-level app flow, phase switching, and player actions.
- [`src/game/engine.js`](/Users/stark/projects/ua-defense/src/game/engine.js): wave lifecycle, update loop orchestration, win/loss checks.
- [`src/game/spawner.js`](/Users/stark/projects/ua-defense/src/game/spawner.js): wave flattening, controlled-chaos sequencing, enemy instantiation.
- [`src/game/enemy-ai.js`](/Users/stark/projects/ua-defense/src/game/enemy-ai.js): rule-based enemy behavior such as deep ingress, retaliation targeting, and guided waypoints.
- [`src/game/waves.js`](/Users/stark/projects/ua-defense/src/game/waves.js): finite-vs-endless wave contract, Kobayashi Maru generation, endless stat ramping.
- [`src/game/state.js`](/Users/stark/projects/ua-defense/src/game/state.js): persistent game state, telemetry, roster tracking, economy bookkeeping.
- [`src/data/units.js`](/Users/stark/projects/ua-defense/src/data/units.js): unit metadata, upgrade trees, sell values, repair costs, and building rebuild rules.
- [`src/data/difficulty.js`](/Users/stark/projects/ua-defense/src/data/difficulty.js): mode presets and campaign definitions.
- [`src/data/battleQuips.js`](/Users/stark/projects/ua-defense/src/data/battleQuips.js): funding/upkeep quips and mode-aware battle callout text.
- [`src/ui/ContextMenu.jsx`](/Users/stark/projects/ua-defense/src/ui/ContextMenu.jsx): contextual tower/building actions including sell, upgrade, repair, and emergency rebuilds.

## Endless Mode Contract

- Endless mode is opt-in through `mode.endless`.
- Engine code should ask `hasMoreWaves()` and `getWaveDef()` instead of directly indexing `mode.waves`.
- UI should render wave totals through `getWaveDisplayTotal()`.
- Enemy scaling in endless mode should go through `getEnemySpawnProfile()`.
- Endless anti-PPO pressure is layered: initial tower-target preference is ramped separately from retaliation targeting after a unit opens fire.
- `kobayashiMaru` should remain an endless challenge layered on top of the existing game, not a rewrite of campaign modes.
- Leaderboard ranking for `kobayashiMaru` is survival-first: stored score encodes `wavesSurvived` first and raw run score second so deeper runs outrank cleaner but shorter runs.
- Mixed leaderboard views must sort decoded `kobayashiMaru` scores client-side so encoded endless values do not float above campaign scores by accident.

## Balance Notes

- Campaign wave pacing uses controlled chaos: random order with guardrails against unreadable degeneracy.
- `kobayashiMaru` should escalate mainly through raid density, spawn tempo, mixed composition, and event pressure before relying on raw stat inflation.
- Early endless aggression toward player air defense is intentionally softer than late-game pressure: retaliation starts low and ramps by wave so the player is not bankrupted on waves 1-3.
- Tower targeting pressure in endless is wave-ramped and capped instead of using a flat always-hostile probability from the opener.
- Tower repair is now part of live-wave survival, while destroyed buildings can only come back through expensive between-wave emergency rebuilds.
- Upkeep is currently disabled; attrition pressure comes from losses, repairs, targeting pressure, and denser late-wave raids instead of passive between-wave taxation.
- Reward growth should lag behind threat growth so endless mode trends toward eventual overmatch.
- `realistic` and `kobayashiMaru` still need live playtest-driven hardening until high kill-rate runs stop feeling routine.

## Active Priorities

- Continue hardening `realistic` and `kobayashiMaru` from actual runs, especially around tower uptime, repair economy, and saturation pressure.
- Keep early endless anti-PPO aggression survivable while preserving harsh late-wave collapse states.
- Re-tune `EW`, weather, and `Iskander` so pressure stays high without becoming gimmicky or trivial to exploit.
- Expand regression coverage whenever a new player-facing rule changes repair, targeting, stealth, or leaderboard behavior.
- Keep selective enemy sprite upgrades incremental instead of migrating the whole art pipeline to PNG.

## Commands

```bash
npm run dev
npm run build
npm run lint
node --test tests/bugfixes.test.js
node --test tests/game-balance.test.js
node --test tests/endless-mode.test.js
node --test tests/pressure-systems.test.js
node --test tests/repair-systems.test.js
```

## External Services

- Leaderboard submissions and reads go through Supabase in [`src/lib/supabase.js`](/Users/stark/projects/ua-defense/src/lib/supabase.js).

## Working Notes

- Prefer small, data-driven balance changes before refactoring core systems.
- Treat `PROJECT.md` as the stable project briefing; treat `docs/plans/*.md` as temporary execution plans.
- If a new feature changes player-facing rules, update this file and the relevant plan doc together.
