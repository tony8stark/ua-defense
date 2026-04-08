# Balance Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebalance unit efficiency, wave pacing, and event pressure so each defense option has a real role and each difficulty ramps cleanly.

**Architecture:** Keep the current data-driven structure. Make balance changes primarily in static configs and a small number of shared combat helpers so tuning stays localized and measurable.

**Tech Stack:** Vite, React, canvas game loop, plain JavaScript data tables

---

### Task 1: Add lightweight balance telemetry

**Files:**
- Modify: `src/game/state.js`
- Modify: `src/ui/ResultsScreen.jsx`
- Test: `tests/game-balance.test.js`

**Step 1: Write the failing test**

Add a test that expects the game state to expose enough summary data to compare unit effectiveness and civilian damage between runs.

**Step 2: Run test to verify it fails**

Run: `node --test tests/game-balance.test.js`
Expected: FAIL because the required telemetry fields are missing.

**Step 3: Write minimal implementation**

Track per-unit spend, repair spend, and additional end-of-run summary fields without changing combat behavior.

**Step 4: Run test to verify it passes**

Run: `node --test tests/game-balance.test.js`
Expected: PASS

### Task 2: Normalize unit efficiency bands

**Files:**
- Modify: `src/data/difficulty.js`
- Modify: `src/data/units.js`
- Test: `tests/game-balance.test.js`

**Step 1: Write the failing test**

Add assertions for target efficiency bands by role:
- `turret` baseline generalist
- `mvg` anti-fast specialist
- `crew` high-risk burst option
- `airfield` map-control utility, not worst-in-class by a wide margin
- `hawk/gepard/irist` strong specialists but not dominant in all cases

**Step 2: Run test to verify it fails**

Run: `node --test tests/game-balance.test.js`
Expected: FAIL because current coefficients overshoot for `gepard/irist` and undershoot for `airfield/crew`.

**Step 3: Write minimal implementation**

Adjust only the numeric values needed to bring expected value and constraints closer together.

**Step 4: Run test to verify it passes**

Run: `node --test tests/game-balance.test.js`
Expected: PASS

### Task 3: Improve wave pacing and composition readability

**Files:**
- Modify: `src/data/difficulty.js`
- Modify: `src/game/spawner.js`
- Test: `tests/game-balance.test.js`

**Step 1: Write the failing test**

Add tests that preserve uncertainty while bounding extremes: keep stochastic composition, but prevent degenerate full-shuffle outcomes that erase readable pressure. The target is controlled chaos, not scripted attack phases.

**Step 2: Run test to verify it fails**

Run: `node --test tests/game-balance.test.js`
Expected: FAIL because the current implementation fully shuffles every wave.

**Step 3: Write minimal implementation**

Replace full-wave randomization with weighted uncertainty that still feels like a real, adaptive mass attack. Avoid deterministic “TD lanes” or fixed phase scripting.

**Step 4: Run test to verify it passes**

Run: `node --test tests/game-balance.test.js`
Expected: PASS

**Design guardrails for Task 3**
- Keep raw randomness as the base layer; only repair degenerate extremes after shuffling.
- Guarantee at least one lower-pressure target in the opener when the wave actually contains lower-pressure targets.
- Break shock streaks only while calmer targets still exist later in the same wave.
- Preserve oppressive all-shock openers when the composition itself gives the player no easier targets.
- Future follow-up knobs, if needed: soft same-type streak caps, rolling pressure budget, spawn-timer jitter by enemy class rather than fixed scripting.

### Task 4: Re-tune pressure events against each difficulty

**Files:**
- Modify: `src/game/events.js`
- Modify: `src/game/iskander.js`
- Modify: `src/ui/Tutorial.jsx`
- Test: `tests/game-balance.test.js`

**Step 1: Write the failing test**

Add tests for bounded event pressure:
- `EW` should disrupt but not nullify FPV builds
- `Iskander` should punish clustering without becoming free repeated reposition bait
- tutorial text should match actual weapon behavior

**Step 2: Run test to verify it fails**

Run: `node --test tests/game-balance.test.js`
Expected: FAIL because current event tuning and copy do not meet those constraints.

**Step 3: Write minimal implementation**

Adjust event coefficients and tutorial copy only where needed to align the rules and the player-facing explanation.

**Step 4: Run test to verify it passes**

Run: `node --test tests/game-balance.test.js`
Expected: PASS
