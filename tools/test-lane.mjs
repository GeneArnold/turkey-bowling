// Rolls lots of turkeys down the driveway to check the lane feels like bowling. Run from the
// project folder:  node tools/test-lane.mjs
import assert from "node:assert/strict";
import { LANE, launch, newRack, rackSpots, settled, step, toLane, toScreen } from "../js/lane.js";

function roll(fromX, aimX, power) {
  const turkey = launch(fromX, aimX, power);
  const pins = newRack();
  let bushes = false;
  let wobbles = 0;
  for (let t = 0; t < 8; t += 1 / 60) {
    for (const e of step(turkey, pins, 1 / 60)) {
      if (e.kind === "bushes") bushes = true;
      if (e.kind === "wobble") wobbles++;
    }
    if (t > 0.5 && settled(turkey, pins)) break;
  }
  // A pin left standing is exactly where it started: only fallen pins move.
  const spots = rackSpots();
  for (const p of pins) {
    if (!p.down) assert.ok(p.x === spots[p.n - 1].x && p.z === spots[p.n - 1].z, "a standing pin never moves");
  }
  return { down: pins.filter((p) => p.down).length, bushes, turkey, wobbles };
}

function average(fromX, aimX, power, n = 200) {
  let sum = 0;
  let strikes = 0;
  for (let i = 0; i < n; i++) {
    const r = roll(fromX, aimX, power);
    sum += r.down;
    if (r.down === 10) strikes++;
  }
  return { avg: sum / n, strikes: strikes / n };
}

// The screen and lane conversions undo each other.
const p = toScreen(10, 80);
const back = toLane(p.x, p.y);
assert.ok(Math.abs(back.x - 10) < 1e-6 && Math.abs(back.z - 80) < 1e-6, "toLane undoes toScreen");

// The gentlest throw that counts still reaches the pins.
assert.ok(roll(0, 0, 0).down > 0, "a gentle throw down the middle reaches the pins");

const pocket = average(0, 4, 1);
const middle = average(0, 0, 0.6);
const edge = average(0, 22, 0.6);
console.log("pocket, hard:", pocket, " middle, medium:", middle, " outside pin:", edge);
assert.ok(pocket.avg > 7, "a hard throw into the pocket knocks down most pins");
assert.ok(edge.avg < pocket.avg, "clipping the outside knocks down fewer");

// Clipping the edge of the rack now and then leaves a pin wobbling.
let wobbled = 0;
for (let i = 0; i < 200; i++) wobbled += roll(0, 19, 0.3).wobbles;
assert.ok(wobbled > 0, "a glancing hit makes a pin wobble");

const wide = roll(0, 40, 0.5);
assert.equal(wide.bushes, true, "a wide throw ends in the bushes");
assert.equal(wide.down, 0, "and knocks nothing down");

console.log("lane tests passed");
