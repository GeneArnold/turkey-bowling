// Bowling's rules: ten frames, two throws each, strikes and spares, and the extra throws in the
// tenth. Pure functions with no Phaser, so they can be tested on their own (node tools/test-bowling.mjs).
// A game is the list of throws so far, each the number of pins it knocked down.

export const FRAMES = 10;
export const PINS = 10;

// Splits the throws into frames. → [{ throws: [n, ...], strike, spare }]
export function frames(throws) {
  const out = [];
  let i = 0;
  while (i < throws.length && out.length < FRAMES) {
    if (out.length === FRAMES - 1) {
      // The tenth keeps every throw left: up to three after a strike or spare.
      const t = throws.slice(i, i + 3);
      out.push({ throws: t, strike: t[0] === PINS, spare: t[0] < PINS && t[0] + (t[1] ?? 0) === PINS });
      break;
    }
    if (throws[i] === PINS) {
      out.push({ throws: [PINS], strike: true, spare: false });
      i += 1;
    } else {
      const t = throws.slice(i, i + 2);
      out.push({ throws: t, strike: false, spare: t.length === 2 && t[0] + t[1] === PINS });
      i += 2;
    }
  }
  return out;
}

// The running score after each frame, or null for a frame still waiting on its bonus throws.
export function totals(throws) {
  const result = [];
  let i = 0;
  let sum = 0;
  for (let f = 0; f < FRAMES && i < throws.length; f++) {
    const a = throws[i];
    const b = throws[i + 1];
    const c = throws[i + 2];
    let add = null;
    let used;
    if (a === PINS) {
      if (b !== undefined && c !== undefined) add = PINS + b + c;
      used = 1;
    } else if (b !== undefined && a + b === PINS) {
      if (c !== undefined) add = PINS + c;
      used = 2;
    } else if (b !== undefined) {
      add = a + b;
      used = 2;
    } else {
      used = 1;
    }
    if (add === null) {
      result.push(null);
      break;
    }
    sum += add;
    result.push(sum);
    i += used;
  }
  return result;
}

export function score(throws) {
  return totals(throws).filter((t) => t !== null).at(-1) ?? 0;
}

// Where the game is: which frame (0-9) and throw within it, how many pins are standing for the next
// throw, and whether the game is over.
export function next(throws) {
  const fs = frames(throws);
  const last = fs.at(-1);
  if (!last) return { frame: 0, ball: 0, standing: PINS, over: false };
  const f = fs.length - 1;
  if (f < FRAMES - 1) {
    const done = last.strike || last.throws.length === 2;
    if (done) return { frame: f + 1, ball: 0, standing: PINS, over: false };
    return { frame: f, ball: 1, standing: PINS - last.throws[0], over: false };
  }
  // The tenth frame.
  const [a, b] = last.throws;
  const n = last.throws.length;
  if (n === 1) return { frame: f, ball: 1, standing: a === PINS ? PINS : PINS - a, over: false };
  if (n === 2) {
    if (a === PINS) return { frame: f, ball: 2, standing: b === PINS ? PINS : PINS - b, over: false };
    if (a + b === PINS) return { frame: f, ball: 2, standing: PINS, over: false };
  }
  return { frame: f, ball: n, standing: 0, over: true };
}

// How each throw of a frame is written on the score sheet: "X", "/", "-" (none) or a number.
export function marks(frame, isTenth) {
  const t = frame.throws;
  const out = [];
  for (let k = 0; k < t.length; k++) {
    const freshRack = k === 0 || (isTenth && (t[k - 1] === PINS || (k === 2 && t[0] + t[1] === PINS && t[0] !== PINS)));
    if (t[k] === PINS && freshRack) out.push("X");
    else if (!freshRack && t[k - 1] + t[k] === PINS) out.push("/");
    else out.push(t[k] === 0 ? "-" : String(t[k]));
  }
  return out;
}

// Three strikes in a row is called a "turkey". → how many strikes in a row end with this throw list.
export function strikeRun(throws) {
  const fs = frames(throws);
  // Count strike throws in a row at the end, in order of the frames (the tenth's throws count too).
  const flat = [];
  fs.forEach((fr, i) => {
    const m = marks(fr, i === FRAMES - 1);
    for (const x of m) flat.push(x === "X");
  });
  let n = 0;
  for (let k = flat.length - 1; k >= 0 && flat[k]; k--) n++;
  return n;
}
