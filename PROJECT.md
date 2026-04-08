# UA Defense

## Overview

`ua-defense` is a browser game about defending Ukrainian cities from mixed air attacks.
It is built as a lightweight React + canvas project with most gameplay behavior driven from plain JavaScript data tables.

This file is the top-level project brief.
The same pattern is worth reusing in other repos: one stable `PROJECT.md` that explains what the project is, how it is structured, and where the important moving parts live.

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
3. Start a wave and survive a mixed incoming attack.
4. Repair, reposition, and spend the next reward window.
5. Repeat until campaign victory, infrastructure collapse, or endless defeat in `kobayashiMaru`.

## Technical Structure

- [`src/data`](/Users/stark/projects/ua-defense/src/data): static configs for cities, units, difficulties, enemies, quips, and other tunable values.
- [`src/game`](/Users/stark/projects/ua-defense/src/game): runtime systems such as engine loop, combat, spawning, events, state, rendering helpers, and endless-wave logic.
- [`src/ui`](/Users/stark/projects/ua-defense/src/ui): React screens and HUD components.
- [`src/lib`](/Users/stark/projects/ua-defense/src/lib): external integrations such as the leaderboard client.
- [`tests`](/Users/stark/projects/ua-defense/tests): node-based regression tests for bugs, balance, and endless-mode scaffolding.
- [`docs/plans`](/Users/stark/projects/ua-defense/docs/plans): implementation plans and balance-pass notes.

## Key Files

- [`src/App.jsx`](/Users/stark/projects/ua-defense/src/App.jsx): top-level app flow, phase switching, and player actions.
- [`src/game/engine.js`](/Users/stark/projects/ua-defense/src/game/engine.js): wave lifecycle, update loop orchestration, win/loss checks.
- [`src/game/spawner.js`](/Users/stark/projects/ua-defense/src/game/spawner.js): wave flattening, controlled-chaos sequencing, enemy instantiation.
- [`src/game/waves.js`](/Users/stark/projects/ua-defense/src/game/waves.js): finite-vs-endless wave contract, Kobayashi Maru generation, endless stat ramping.
- [`src/game/state.js`](/Users/stark/projects/ua-defense/src/game/state.js): persistent game state, telemetry, roster tracking, economy bookkeeping.
- [`src/data/difficulty.js`](/Users/stark/projects/ua-defense/src/data/difficulty.js): mode presets and campaign definitions.

## Endless Mode Contract

- Endless mode is opt-in through `mode.endless`.
- Engine code should ask `hasMoreWaves()` and `getWaveDef()` instead of directly indexing `mode.waves`.
- UI should render wave totals through `getWaveDisplayTotal()`.
- Enemy scaling in endless mode should go through `getEnemySpawnProfile()`.
- `kobayashiMaru` should remain an endless challenge layered on top of the existing game, not a rewrite of campaign modes.
- Leaderboard ranking for `kobayashiMaru` is survival-first: stored score encodes `wavesSurvived` first and raw run score second so deeper runs outrank cleaner but shorter runs.

## Balance Notes

- Campaign wave pacing uses controlled chaos: random order with guardrails against unreadable degeneracy.
- `kobayashiMaru` should escalate mainly through raid density, spawn tempo, mixed composition, and event pressure before relying on raw stat inflation.
- Reward growth should lag behind threat growth so endless mode trends toward eventual overmatch.

## Commands

```bash
npm run dev
npm run build
npm run lint
node --test tests/bugfixes.test.js
node --test tests/game-balance.test.js
node --test tests/endless-mode.test.js
```

## External Services

- Leaderboard submissions and reads go through Supabase in [`src/lib/supabase.js`](/Users/stark/projects/ua-defense/src/lib/supabase.js).

## Working Notes

- Prefer small, data-driven balance changes before refactoring core systems.
- Treat `PROJECT.md` as the stable project briefing; treat `docs/plans/*.md` as temporary execution plans.
- If a new feature changes player-facing rules, update this file and the relevant plan doc together.
