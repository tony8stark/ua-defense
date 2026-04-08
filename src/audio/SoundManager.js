// Procedural sound effects using Web Audio API
// All sounds generated from oscillators and noise - no external files

let ctx = null;
let masterGain = null;
let _muted = false;
let _volume = 0.5;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function out() {
  getCtx();
  return masterGain;
}

export function setVolume(v) {
  _volume = v;
  if (masterGain) masterGain.gain.value = _muted ? 0 : v;
  try {
    localStorage.setItem('ua-vol', v);
  } catch {
    // Ignore storage failures and keep audio controls functional.
  }
}

export function setMuted(m) {
  _muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : _volume;
  try {
    localStorage.setItem('ua-muted', m ? '1' : '0');
  } catch {
    // Ignore storage failures and keep audio controls functional.
  }
}

export function isMuted() { return _muted; }
export function getVolume() { return _volume; }

// Load saved preferences
try {
  const sv = localStorage.getItem('ua-vol');
  if (sv !== null) _volume = parseFloat(sv);
  _muted = localStorage.getItem('ua-muted') === '1';
} catch {
  // Ignore storage failures and fall back to in-memory defaults.
}

// Resume audio context on first user interaction
export function resumeOnInteraction() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// === SOUND GENERATORS ===

function noise(duration, volume = 0.3) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  return buffer;
}

// Turret fire: short sharp burst
export function playShoot() {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(800, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.1);
}

// FPV launch: rising whoosh
export function playFPVLaunch() {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
  gain.gain.setValueAtTime(0.08, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.2);
}

// Explosion: thud + noise
export function playExplosion(big = false) {
  if (_muted) return;
  const c = getCtx();
  const dur = big ? 0.4 : 0.2;
  const vol = big ? 0.25 : 0.12;

  // Low thud
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(big ? 80 : 120, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + dur);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + dur);

  // Noise crackle
  const src = c.createBufferSource();
  src.buffer = noise(dur, vol * 0.6);
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(vol * 0.5, c.currentTime);
  nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.connect(nGain).connect(out());
  src.start(c.currentTime);
}

// Iskander siren: rising-falling alarm
export function playSiren() {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.setValueAtTime(0.12, c.currentTime + 0.8);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0);
  // Two-tone siren
  osc.frequency.setValueAtTime(600, c.currentTime);
  osc.frequency.linearRampToValueAtTime(900, c.currentTime + 0.25);
  osc.frequency.linearRampToValueAtTime(600, c.currentTime + 0.5);
  osc.frequency.linearRampToValueAtTime(900, c.currentTime + 0.75);
  osc.frequency.linearRampToValueAtTime(600, c.currentTime + 1.0);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 1.0);
}

// Wave complete: ascending chime
export function playWaveComplete() {
  if (_muted) return;
  const c = getCtx();
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain).connect(out());
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

// Game over: descending somber tone
export function playGameOver() {
  if (_muted) return;
  const c = getCtx();
  const notes = [392, 330, 262]; // G4, E4, C4
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + i * 0.3;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain).connect(out());
    osc.start(t);
    osc.stop(t + 0.6);
  });
}

// F-16 jet flyby: filtered noise swoosh
export function playJetFlyby() {
  if (_muted) return;
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = noise(1.5, 0.4);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.5);
  filter.frequency.exponentialRampToValueAtTime(400, c.currentTime + 1.5);
  filter.Q.value = 2;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.15, c.currentTime + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);
  src.connect(filter).connect(gain).connect(out());
  src.start(c.currentTime);
}

// EW activation: electronic buzz
export function playEWBuzz() {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 60;
  osc2.type = 'square';
  osc2.frequency.value = 120;
  gain.gain.setValueAtTime(0.08, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(out());
  osc.start(c.currentTime);
  osc2.start(c.currentTime);
  osc.stop(c.currentTime + 0.6);
  osc2.stop(c.currentTime + 0.6);
}

// Patriot launch: deep rising whoosh + sharp crack
export function playPatriotLaunch() {
  if (_muted) return;
  const c = getCtx();

  // Rising whoosh
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.6);
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.8);

  // Intercept crack (delayed)
  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(3000, c.currentTime + 0.55);
  osc2.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.75);
  gain2.gain.setValueAtTime(0, c.currentTime);
  gain2.gain.setValueAtTime(0.2, c.currentTime + 0.55);
  gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.85);
  osc2.connect(gain2).connect(out());
  osc2.start(c.currentTime + 0.55);
  osc2.stop(c.currentTime + 0.85);

  // Noise burst at intercept
  const src = c.createBufferSource();
  src.buffer = noise(0.3, 0.4);
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(0, c.currentTime);
  nGain.gain.setValueAtTime(0.15, c.currentTime + 0.55);
  nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.85);
  src.connect(nGain).connect(out());
  src.start(c.currentTime + 0.55);
}

// Place tower: confirmation click
export function playPlace() {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.08, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.08);
}

// Sell: cash register ding
export function playSell() {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, c.currentTime);
  osc.frequency.setValueAtTime(1600, c.currentTime + 0.06);
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain).connect(out());
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
}
