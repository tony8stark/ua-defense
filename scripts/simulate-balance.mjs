#!/usr/bin/env node

import { CITIES } from '../src/data/cities.js';
import { MODES } from '../src/data/difficulty.js';
import { runBatchSimulation } from '../src/game/simulation.js';

function parseArgs(argv) {
  const options = {
    mode: 'realistic',
    city: 'all',
    seeds: 50,
    maxWaves: 6,
    clearWeather: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--mode') options.mode = argv[++i];
    else if (arg === '--city') options.city = argv[++i];
    else if (arg === '--seeds') options.seeds = Number(argv[++i]);
    else if (arg === '--max-waves') options.maxWaves = Number(argv[++i]);
    else if (arg === '--clear-weather') options.clearWeather = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help') options.help = true;
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/simulate-balance.mjs [options]

Options:
  --mode realistic|training|hell|kobayashiMaru
  --city kyiv|odesa|all
  --seeds <count>
  --max-waves <count>
  --clear-weather
  --json
`);
}

function formatPct(value) {
  return `${Math.round(value * 100)}%`;
}

function printSummary(summary) {
  console.log(`${summary.cityId.toUpperCase()} | ${summary.modeId} | runs=${summary.totalRuns} | maxWaves=${summary.maxWaves} | weather=${summary.clearWeather ? 'clear-only' : 'live'}`);
  console.log(`avg=${summary.avgWavesCompleted} median=${summary.medianWavesCompleted} p10=${summary.p10WavesCompleted} p90=${summary.p90WavesCompleted} buildingHp=${formatPct(summary.avgRemainingBuildingHpPct)}`);
  console.log(`survival ${Object.entries(summary.survivalByWave).map(([wave, value]) => `W${wave}:${formatPct(value)}`).join(' ')}`);
  const losses = Object.keys(summary.lossHistogram).length
    ? Object.entries(summary.lossHistogram).map(([wave, count]) => `W${wave}:${count}`).join(' ')
    : 'none';
  console.log(`losses   ${losses}`);
  console.log('');
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

const mode = MODES[options.mode];
if (!mode) {
  console.error(`Unknown mode: ${options.mode}`);
  process.exit(1);
}

const cityIds = options.city === 'all' ? ['kyiv', 'odesa'] : [options.city];
for (const cityId of cityIds) {
  if (!CITIES[cityId]) {
    console.error(`Unknown city: ${cityId}`);
    process.exit(1);
  }
}

const summaries = cityIds.map(cityId => runBatchSimulation({
  city: CITIES[cityId],
  mode,
  seeds: options.seeds,
  maxWaves: options.maxWaves,
  clearWeather: options.clearWeather,
}));

if (options.json) {
  console.log(JSON.stringify(summaries, null, 2));
} else {
  summaries.forEach(printSummary);
}
