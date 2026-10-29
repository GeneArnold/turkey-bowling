// The driveway as a bowling lane, and what rolls on it. Pure functions with no Phaser, so they can
// be tested on their own (node tools/test-lane.mjs).
//
// The lane is measured in inches, flat on the ground: x across (0 in the middle, negative to the
// left) and z away from the bowler (0 where the turkey is let go). The screen draws it from a high
// camera: further away is higher up the screen and a little smaller.

import { W } from "./ui.js";

export const LANE = {
  halfWidth: 26,     // past this the turkey is in the bushes
  headPin: 115,      // how far up the driveway the front pin stands (the back row sits on the crossing sidewalk)
  spacing: 14,       // how far apart the pins stand (real bowling is 12)
  end: 190,          // past the back row, the driveway ends at the garage
  turkeyR: 7,        // the turkey's size for hitting things
  pinR: 3,           // a pin's size for hitting things, around its belly
  pinLength: 15,     // how far a falling pin reaches: one falling into its neighbour takes it down too
  turkeyMass: 3,
  pinMass: 1,
  roll: 12,          // how fast the turkey slows on the driveway, inches per second per second
  slide: 90,         // how fast a knocked-down pin slides to a stop
  bush: 700,         // how fast the turkey stops once it's in the bushes
  knock: 30,         // hit harder than this (inches per second), a pin falls; softer, it wobbles
  wobble: 0.7,       // how long a pin wobbles, in seconds
};

// The camera looks down the driveway from high up. The driveway's edges come from the background
// picture (img/bg-yard.jpg): they meet at horizonY, so the driveway narrows on the way up, and things
// up there are drawn smaller, at scale s(z). Further up the screen is further away, evenly, so the
// rows of pins stay spread out.
export const VIEW = {
  nearY: 860,        // where the turkey sits, on the screen
  horizonY: 56,      // where the driveway's edges would meet, in the background picture
  yPerInch: 2.9,     // how far up the screen one inch further away is
  pxPerInch: 7.45,   // across, at nearY: the driveway there is 2 x 26 inches wide
  centerX: 268,      // the middle of the driveway in the picture
};

export function scaleAt(z) {
  return Math.max(0.05, (VIEW.nearY - z * VIEW.yPerInch - VIEW.horizonY) / (VIEW.nearY - VIEW.horizonY));
}

// Lane (x, z) → screen { x, y, s }.
export function toScreen(x, z) {
  const s = scaleAt(z);
  return { x: VIEW.centerX + x * VIEW.pxPerInch * s, y: VIEW.nearY - z * VIEW.yPerInch, s };
}

// Screen (x, y) → lane (x, z), for working out where a swipe points.
export function toLane(sx, sy) {
  const z = (VIEW.nearY - sy) / VIEW.yPerInch;
  return { x: (sx - VIEW.centerX) / (VIEW.pxPerInch * scaleAt(z)), z };
}

// Where the ten pins stand: the head pin at the front, then rows of 2, 3 and 4, as in bowling.
// Numbered 1-10 like real pins.
export function rackSpots() {
  const spots = [];
  const rowGap = LANE.spacing * Math.sqrt(3) / 2;
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k <= row; k++) {
      spots.push({ x: (k - row / 2) * LANE.spacing, z: LANE.headPin + row * rowGap });
    }
  }
  return spots;
}

// A fresh rack. A pin stands still until it is hit; then it wobbles (and maybe falls) or falls
// straight away, sliding off the way it was pushed, and a falling pin can take its neighbours down.
export function newRack() {
  return rackSpots().map((p, i) => ({
    n: i + 1, x: p.x, z: p.z, vx: 0, vz: 0,
    down: false,          // knocked down: it counts
    fallX: 0, fallZ: 1,   // which way it fell
    wobble: 0,            // seconds of wobbling left
    wobbleAmp: 0,         // how hard it's wobbling, 0..1
    willFall: false,      // whether the wobble ends with it falling over
    fallIn: -1,           // seconds until it falls, when a neighbour is falling into it
  }));
}

// The turkey as it leaves the bowler's hand. from: lane x at the foul line. aimX: the lane x it is
// heading for at the head pin. power 0..1.
export function launch(fromX, aimX, power) {
  const speed = 110 + 160 * power;
  const dx = aimX - fromX;
  const dz = LANE.headPin;
  const len = Math.hypot(dx, dz);
  return { x: fromX, z: 0, vx: (dx / len) * speed, vz: (dz / len) * speed, inBushes: false, spin: 0 };
}

const STEP = 1 / 240;

// Moves everything on by dt seconds. → a list of what happened, for drawing and sounds:
// { kind: "fall", pin } when a pin goes down, { kind: "wobble", pin } when one starts wobbling,
// { kind: "bushes" } when the turkey leaves the driveway.
export function step(turkey, pins, dt) {
  const events = [];
  for (let t = 0; t < dt; t += STEP) {
    const h = Math.min(STEP, dt - t);
    if (turkey) moveTurkey(turkey, h, events);
    for (const p of pins) movePin(p, pins, h, events);
    // The turkey can still clip a pin at the very edge until it is all the way into the hedge.
    // It rolls straight over pins that are already down.
    if (turkey && Math.abs(turkey.x) < LANE.halfWidth + LANE.turkeyR) {
      for (const p of pins) if (!p.down) bump(turkey, LANE.turkeyR, LANE.turkeyMass, p, pins, 1, events);
    }
    // A pin sliding along after it fell can hit a standing one.
    for (const p of pins) {
      if (!p.down || Math.hypot(p.vx, p.vz) < 5) continue;
      for (const q of pins) if (!q.down) bump(p, LANE.pinR, LANE.pinMass, q, pins, 2, events);
    }
  }
  return events;
}

function moveTurkey(b, h, events) {
  const speed = Math.hypot(b.vx, b.vz);
  if (speed > 0) {
    const slow = (b.inBushes ? LANE.bush : LANE.roll) * h;
    const k = Math.max(0, speed - slow) / speed;
    b.vx *= k;
    b.vz *= k;
  }
  b.x += b.vx * h;
  b.z += b.vz * h;
  b.spin += speed * h;
  if (!b.inBushes && Math.abs(b.x) > LANE.halfWidth && b.z < LANE.end) {
    b.inBushes = true;
    events.push({ kind: "bushes" });
  }
}

function movePin(p, pins, h, events) {
  if (p.fallIn >= 0) {
    p.fallIn -= h;
    if (p.fallIn < 0 && !p.down) fall(p, p.fallX, p.fallZ, 40, pins, events);
  }
  if (p.wobble > 0) {
    p.wobble -= h;
    if (p.wobble <= 0) {
      p.wobble = 0;
      if (p.willFall && !p.down) fall(p, p.fallX, p.fallZ, 15, pins, events);
    }
  }
  if (!p.down) return;
  const speed = Math.hypot(p.vx, p.vz);
  if (speed > 0) {
    const k = Math.max(0, speed - LANE.slide * h) / speed;
    p.vx *= k;
    p.vz *= k;
  }
  p.x += p.vx * h;
  p.z += p.vz * h;
}

// Something round (the turkey, or a sliding pin) running into a standing pin. Hit hard, the pin
// falls the way it was pushed; hit softly, it wobbles, and the harder the nudge the likelier it is
// to wobble over.
function bump(a, ra, ma, p, pins, ease, events) {
  const dx = p.x - a.x;
  const dz = p.z - a.z;
  const dist = Math.hypot(dx, dz);
  if (dist >= ra + LANE.pinR || dist === 0) return;
  const nx = dx / dist;
  const nz = dz / dist;
  const closing = a.vx * nx + a.vz * nz;
  if (closing <= 0) return;
  // The pin takes some of the hit: the turkey (or pin) bounces off a little.
  const mb = LANE.pinMass;
  const j = (1.6 * closing) / (1 / ma + 1 / mb);
  a.vx -= (j / ma) * nx;
  a.vz -= (j / ma) * nz;
  const pushed = (j / mb);
  // A little sideways scatter, so a rack doesn't fall the same way every time.
  const turn = (Math.random() - 0.5) * 0.5;
  const fx = nx * Math.cos(turn) - nz * Math.sin(turn);
  const fz = nx * Math.sin(turn) + nz * Math.cos(turn);
  if (closing * ease > LANE.knock) {
    fall(p, fx, fz, pushed, pins, events);
  } else if (p.wobble === 0 && !p.willFall) {
    p.wobble = LANE.wobble;
    p.wobbleAmp = Math.min(1, (closing * ease) / LANE.knock);
    p.willFall = Math.random() < p.wobbleAmp * 0.7;
    p.fallX = fx;
    p.fallZ = fz;
    events.push({ kind: "wobble", pin: p });
  }
}

// A pin goes down: it slides off the way it fell, and if it falls into a neighbour, the neighbour
// goes down a moment later, like dominoes.
function fall(p, dirX, dirZ, speed, pins, events) {
  const len = Math.hypot(dirX, dirZ) || 1;
  p.down = true;
  p.wobble = 0;
  p.fallIn = -1;
  p.fallX = dirX / len;
  p.fallZ = dirZ / len;
  const v = Math.min(speed, 220);
  p.vx = p.fallX * v;
  p.vz = p.fallZ * v;
  events.push({ kind: "fall", pin: p });
  for (const q of pins) {
    if (q.down || q.fallIn >= 0 || q === p) continue;
    const qx = q.x - p.x;
    const qz = q.z - p.z;
    const along = qx * p.fallX + qz * p.fallZ;
    const across = Math.abs(qx * p.fallZ - qz * p.fallX);
    if (along > 0 && along < LANE.pinLength + LANE.pinR && across < LANE.pinR * 2.2) {
      const turn = (Math.random() - 0.5) * 0.8;
      q.fallX = p.fallX * Math.cos(turn) - p.fallZ * Math.sin(turn);
      q.fallZ = p.fallX * Math.sin(turn) + p.fallZ * Math.cos(turn);
      q.fallIn = 0.06 + along * 0.006;
    }
  }
}

// Is everything still? (The turkey is past the pins, stopped, or in the bushes; no pin is sliding,
// wobbling or about to fall.)
export function settled(turkey, pins) {
  const pinsStill = pins.every((p) => Math.hypot(p.vx, p.vz) < 2 && p.wobble === 0 && p.fallIn < 0);
  const speed = turkey ? Math.hypot(turkey.vx, turkey.vz) : 0;
  const turkeyDone = !turkey || turkey.z > LANE.end || speed < 5;
  return pinsStill && turkeyDone;
}
