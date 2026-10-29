// Checks how swipes are read. Run from the project folder:  node tools/test-flick.mjs
import assert from "node:assert/strict";
import { aimAssist, readFlick, readSwipe } from "../js/flick.js";

// A straight swipe from (x0, y0) to (x1, y1) over `ms` milliseconds, sampled at 60 Hz.
function swipe(x0, y0, x1, y1, ms) {
  const pts = [];
  const steps = Math.max(1, Math.round(ms / 16));
  for (let i = 0; i <= steps; i++) pts.push({ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps, t: (ms * i) / steps });
  return pts;
}

let f = readFlick(swipe(270, 860, 270, 660, 100));
assert.equal(f.ok, true, "fast flick up throws");
assert.ok(f.dirY < -0.99 && f.power > 0.5, "straight up, strong");

f = readFlick(swipe(270, 860, 270, 820, 400));
assert.deepEqual(f, { ok: false, reason: "gentle" }, "slow drag is too gentle");

f = readFlick(swipe(100, 860, 400, 850, 100));
assert.deepEqual(f, { ok: false, reason: "wrong-way" }, "sideways flick does not throw");

f = readFlick(swipe(270, 700, 270, 860, 100));
assert.equal(f.ok, false, "downward flick does not throw");

// A slow start followed by a quick flick still throws: only the end counts.
const slowThenFast = [...swipe(270, 900, 270, 880, 600), ...swipe(270, 880, 230, 700, 80).map((p) => ({ ...p, t: p.t + 600 }))];
f = readFlick(slowThenFast);
assert.equal(f.ok, true, "hesitant start, fast finish throws");
assert.ok(f.dirX < 0, "goes left like the end of the swipe");

// Aim help bends a near miss onto the target, but not a wide miss.
const from = { x: 270, y: 860 };
const target = { x: 300, y: 300 };
let a = aimAssist(0, -1, from, [target], 8);
assert.equal(a.target, target, "3 degrees off snaps to the target");
a = aimAssist(-0.5, -0.866, from, [target], 8);
assert.equal(a.target, null, "30 degrees off is left alone");

assert.equal(readSwipe(swipe(270, 800, 270, 500, 200)), "up");
assert.equal(readSwipe(swipe(270, 500, 270, 800, 200)), "down");
assert.equal(readSwipe(swipe(400, 500, 100, 520, 200)), "left");
assert.equal(readSwipe(swipe(270, 500, 275, 505, 100)), "tap");

console.log("flick tests passed");
