// Checks the bowling rules. Run from the project folder:  node tools/test-bowling.mjs
import assert from "node:assert/strict";
import { frames, marks, next, score, strikeRun, totals } from "../js/bowling.js";

const rep = (n, v) => Array(n).fill(v);

assert.equal(score(rep(12, 10)), 300, "a perfect game is 300");
assert.equal(score(rep(20, 0)), 0, "all gutters");
assert.equal(score(rep(21, 5)), 150, "all 5-spares, then a 5");
assert.equal(score(rep(20, 4)), 80, "open frames add up");
assert.equal(score([10, 3, 4]), 24, "strike then 3, 4: 17 + 7");
assert.equal(score([7, 3, 4, 2]), 20, "spare then 4, 2: 14 + 6");

assert.deepEqual(totals([10, 3]), [null], "a strike waits for two more throws");
assert.deepEqual(totals([7, 3]), [null], "a spare waits for one more");
assert.deepEqual(totals([3, 4, 10]), [7, null]);

assert.deepEqual(next([]), { frame: 0, ball: 0, standing: 10, over: false });
assert.deepEqual(next([7]), { frame: 0, ball: 1, standing: 3, over: false });
assert.deepEqual(next([10]), { frame: 1, ball: 0, standing: 10, over: false }, "a strike ends the frame");
assert.equal(next(rep(20, 4)).over, true, "ten open frames end the game");
const nine = rep(18, 0);
assert.deepEqual(next([...nine, 10]), { frame: 9, ball: 1, standing: 10, over: false }, "a strike in the tenth gets a fresh rack");
assert.deepEqual(next([...nine, 10, 4]), { frame: 9, ball: 2, standing: 6, over: false });
assert.deepEqual(next([...nine, 6, 4]), { frame: 9, ball: 2, standing: 10, over: false }, "a spare in the tenth earns a third throw");
assert.equal(next([...nine, 6, 3]).over, true, "an open tenth has no third throw");
assert.equal(next([...nine, 10, 10, 10]).over, true);

assert.deepEqual(marks(frames([7, 3])[0], false), ["7", "/"]);
assert.deepEqual(marks(frames([0, 5])[0], false), ["-", "5"]);
assert.deepEqual(marks(frames([...nine, 10, 10, 4])[9], true), ["X", "X", "4"]);
assert.deepEqual(marks(frames([...nine, 10, 4, 6])[9], true), ["X", "4", "/"]);
assert.deepEqual(marks(frames([...nine, 3, 7, 10])[9], true), ["3", "/", "X"]);

assert.equal(strikeRun([10, 10, 10]), 3, "three in a row is a turkey");
assert.equal(strikeRun([10, 10, 3]), 0);
assert.equal(strikeRun([10, 3, 7, 10]), 1, "a spare is not a strike");

console.log("bowling tests passed");
