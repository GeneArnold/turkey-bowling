// Sound: effects and music made with the Web Audio API, plus recorded voice lines when a
// saying has a "voice" file. Browsers only allow sound after a tap, so unlock() runs on the first touch.
let ctx = null;
let enabled = true;
let noiseBuffer = null;
const voices = new Map(); // url → decoded AudioBuffer

export function setEnabled(on) {
  enabled = on;
  if (!on) stopMusic();
}

export function unlock() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  // The music may have been asked for before sound was allowed: it starts now.
  if (ctx.state === "running") playWantedMusic();
  else ctx.resume().then(playWantedMusic, () => {});
}

function ready() {
  return enabled && ctx && ctx.state === "running";
}

function tone(freq, duration, { type = "square", volume = 0.06, slideTo = null, delay = 0, at = null, out = null } = {}) {
  if (!ready()) return;
  const t0 = at ?? ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(out || ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration, { volume = 0.15, filter = 1200, type = "lowpass", delay = 0, at = null, out = null } = {}) {
  if (!ready()) return;
  const t0 = at ?? ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(f).connect(gain).connect(out || ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  whoosh() {
    noise(0.35, { volume: 0.12, filter: 900, type: "bandpass" });
  },
  // The turkey rumbling up the driveway; `seconds` is about how long it will roll.
  roll(seconds = 1.2) {
    noise(seconds, { volume: 0.09, filter: 180 });
  },
  // Pins clattering: a quick run of wooden knocks, more of them for more pins.
  crash(pins = 5) {
    for (let i = 0; i < Math.min(10, pins + 2); i++) {
      noise(0.07, { volume: 0.18, filter: 2200 + Math.random() * 1800, type: "bandpass", delay: i * 0.035 + Math.random() * 0.02 });
      tone(300 + Math.random() * 500, 0.06, { type: "triangle", volume: 0.05, delay: i * 0.035 });
    }
  },
  // A pin rocking on its base: a couple of hollow wooden knocks.
  wobble() {
    [0, 0.16, 0.3].forEach((d, i) => tone(240 - i * 20, 0.05, { type: "triangle", volume: 0.06, delay: d }));
  },
  // A turkey's gobble: a fast warble that wobbles down.
  gobble() {
    for (let i = 0; i < 7; i++) tone(520 - i * 30 + (i % 2) * 140, 0.06, { type: "sawtooth", volume: 0.035, delay: i * 0.055 });
  },
  rustle() {
    noise(0.45, { volume: 0.2, filter: 3000, type: "highpass" });
  },
  thud() {
    tone(110, 0.25, { type: "sine", volume: 0.2, slideTo: 45 });
    noise(0.12, { volume: 0.1, filter: 300 });
  },
  pop() {
    tone(500, 0.08, { type: "sine", volume: 0.06, slideTo: 900 });
  },
  boing() {
    tone(220, 0.35, { type: "sine", volume: 0.1, slideTo: 520 });
  },
  cheer() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, { type: "triangle", volume: 0.07, delay: i * 0.12 }));
  },
  // Three strikes in a row: a big brassy fanfare.
  fanfare() {
    [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i === 6 ? 0.6 : 0.12, { type: "square", volume: 0.05, delay: i * 0.11 }));
  },
  groan() {
    tone(300, 0.6, { type: "sawtooth", volume: 0.04, slideTo: 120 });
  },
};

export function play(name) {
  SOUNDS[name]?.();
}

// ---------------------------------------------------------------------------------------------
// Music: old public-domain tunes played quietly behind the game, one after another, with a light
// tap on the beat. A note is [name, beats]; notes are queued a little ahead so they stay in time.

// Thanksgiving tunes, public domain only. A note is [name, beats].
const SONGS = [
  // Traditional American fiddle tune, 1820s. Notes from thesession.org/tunes/2638 (setting 1), in G.
  { name: "Turkey in the Straw", bpm: 176, notes: [
    ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5], ["G4", 0.5], ["A4", 0.5], ["G4", 1], ["B3", 0.5], ["C4", 0.5], ["D4", 0.5], ["E4", 0.5], ["D4", 0.5],
    ["B3", 0.5], ["D4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 1], ["B4", 1], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["A4", 0.5], ["B4", 1], ["A4", 1],
    ["A4", 1], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5], ["G4", 0.5], ["A4", 0.5], ["G4", 1], ["B3", 0.5], ["C4", 0.5], ["D4", 0.5], ["E4", 0.5],
    ["D4", 0.5], ["B3", 0.5], ["D4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["D5", 1], ["E5", 0.5], ["D5", 0.5], ["B4", 0.5], ["G4", 0.5], ["A4", 0.5],
    ["B4", 1], ["A4", 1], ["G4", 1],
    ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5], ["G4", 0.5], ["A4", 0.5], ["G4", 1], ["B3", 0.5], ["C4", 0.5], ["D4", 0.5], ["E4", 0.5], ["D4", 0.5],
    ["B3", 0.5], ["D4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 1], ["B4", 1], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["A4", 0.5], ["B4", 1], ["A4", 1],
    ["A4", 1], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5], ["G4", 0.5], ["A4", 0.5], ["G4", 1], ["B3", 0.5], ["C4", 0.5], ["D4", 0.5], ["E4", 0.5],
    ["D4", 0.5], ["B3", 0.5], ["D4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["D5", 1], ["E5", 0.5], ["D5", 0.5], ["B4", 0.5], ["G4", 0.5], ["A4", 0.5],
    ["B4", 1], ["A4", 1], ["G4", 1],
    ["D5", 1], ["B4", 0.5], ["D5", 1], ["B4", 0.5], ["D5", 1], ["D5", 1], ["B4", 0.5], ["D5", 1], ["B4", 0.5], ["D5", 1], ["D5", 1], ["C5", 0.5],
    ["E5", 1], ["C5", 0.5], ["E5", 1], ["E5", 1], ["C5", 0.5], ["E5", 1], ["C5", 0.5], ["E5", 1], ["E5", 1], ["G5", 1], ["G5", 1], ["D5", 1],
    ["D5", 1], ["B4", 1], ["B4", 1], ["A4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["D5", 1], ["E5", 0.5], ["D5", 0.5], ["B4", 0.5], ["G4", 0.5],
    ["A4", 0.5], ["B4", 1], ["A4", 1], ["G4", 1],
    ["D5", 1], ["B4", 0.5], ["D5", 1], ["B4", 0.5], ["D5", 1], ["D5", 1], ["B4", 0.5], ["D5", 1], ["B4", 0.5], ["D5", 1], ["D5", 1], ["C5", 0.5],
    ["E5", 1], ["C5", 0.5], ["E5", 1], ["E5", 1], ["C5", 0.5], ["E5", 1], ["C5", 0.5], ["E5", 1], ["E5", 1], ["G5", 1], ["G5", 1], ["D5", 1],
    ["D5", 1], ["B4", 1], ["B4", 1], ["A4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["D5", 1], ["E5", 0.5], ["D5", 0.5], ["B4", 0.5], ["G4", 0.5],
    ["A4", 0.5], ["B4", 1], ["A4", 1], ["G4", 1],
  ] },
];

const STEPS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function pitch(name) {
  const [, letter, sharp, octave] = /^([A-G])(#?)(\d)$/.exec(name);
  return 440 * 2 ** ((STEPS[letter] + (sharp ? 1 : 0) + (octave - 4) * 12) / 12);
}

const music = { wanted: false, on: false, out: null, timer: null, song: Math.floor(Math.random() * Math.max(1, SONGS.length)), i: 0, t: 0, bell: 0 };

// Starts the music, or carries on where it stopped. It keeps playing from one level into the next.
// Asked for before sound is allowed (no touch yet), it starts as soon as unlock() gets it going.
export function startMusic() {
  music.wanted = true;
  playWantedMusic();
}

function playWantedMusic() {
  if (!music.wanted || music.on || !ready() || SONGS.length === 0) return;
  music.on = true;
  music.out = ctx.createGain();
  music.out.gain.value = 1;
  music.out.connect(ctx.destination);
  music.t = music.bell = ctx.currentTime + 0.15;
  queueMusic();
}

export function stopMusic() {
  music.wanted = false;
  silence();
}

// Stops what's playing but keeps wanting it, so the next unlock() picks it up again.
function silence() {
  if (!music.on) return;
  music.on = false;
  clearTimeout(music.timer);
  const out = music.out;
  out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
  setTimeout(() => out.disconnect(), 500);
}

function queueMusic() {
  if (!music.on || !ready()) {
    silence();
    return;
  }
  const ahead = ctx.currentTime + 0.5;
  let song = SONGS[music.song];
  let beat = 60 / song.bpm;
  while (music.t < ahead) {
    if (music.i >= song.notes.length) {
      // A breath between tunes, then the next one.
      music.song = (music.song + 1) % SONGS.length;
      music.i = 0;
      music.t += beat * 2;
      song = SONGS[music.song];
      beat = 60 / song.bpm;
      continue;
    }
    const [name, beats] = song.notes[music.i++];
    tone(pitch(name), beats * beat * 0.85, { type: "triangle", volume: 0.05, at: music.t, out: music.out });
    tone(pitch(name) * 2, Math.min(0.12, beats * beat * 0.5), { type: "square", volume: 0.008, at: music.t, out: music.out });
    music.t += beats * beat;
  }
  while (music.bell < ahead) {
    noise(0.07, { volume: 0.025, filter: 7000, type: "highpass", at: music.bell, out: music.out });
    music.bell += beat;
  }
  music.timer = setTimeout(queueMusic, 200);
}

// Plays a recorded line, fetched and decoded the first time it is needed.
let speaking = null;

export async function playVoice(url) {
  if (!url || !ready()) return false;
  try {
    let buffer = voices.get(url);
    if (!buffer) {
      const bytes = await (await fetch(url)).arrayBuffer();
      buffer = await ctx.decodeAudioData(bytes);
      voices.set(url, buffer);
    }
    // One voice at a time: a new line cuts off the last one.
    try {
      speaking?.stop();
    } catch {
      // it had already finished
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
    speaking = src;
    return true;
  } catch {
    return false;
  }
}
