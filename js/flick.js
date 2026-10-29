// Reads a finger's path: a flick becomes a throw, and on the menus a swipe becomes a direction.
// Pure functions with no Phaser, so they can be tested on their own (node tools/test-flick.mjs).
// A path is a list of points { x, y, t } in game pixels and milliseconds.

export const FLICK = {
  windowMs: 90,    // only the end of the swipe counts, so a hesitant start does not matter
  minSpeed: 0.45,  // pixels per millisecond; slower than this is "too gentle"
  maxSpeed: 2.8,   // this fast or faster is a full-power throw
  minUpward: 0.3,  // how much the flick must point up the screen (0 = sideways, 1 = straight up)
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// → { ok: true, dirX, dirY, power 0..1 } or { ok: false, reason: "gentle" | "wrong-way" }
export function readFlick(points) {
  if (points.length < 2) return { ok: false, reason: "gentle" };
  const last = points.at(-1);
  let first = points[0];
  for (let i = points.length - 2; i >= 0; i--) {
    first = points[i];
    if (last.t - first.t >= FLICK.windowMs) break;
  }
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const dist = Math.hypot(dx, dy);
  const speed = dist / Math.max(1, last.t - first.t);
  if (dist < 8 || speed < FLICK.minSpeed) return { ok: false, reason: "gentle" };
  const dirX = dx / dist;
  const dirY = dy / dist;
  if (-dirY < FLICK.minUpward) return { ok: false, reason: "wrong-way" };
  return { ok: true, dirX, dirY, power: clamp((speed - FLICK.minSpeed) / (FLICK.maxSpeed - FLICK.minSpeed), 0, 1) };
}

// Aim help: a flick that points within `maxDeg` of a target is turned to point straight at it.
// targets: [{ x, y }]. → { dirX, dirY, target } (target is null when nothing was close enough)
export function aimAssist(dirX, dirY, from, targets, maxDeg) {
  let best = null;
  let bestAngle = (maxDeg * Math.PI) / 180;
  for (const t of targets) {
    const tx = t.x - from.x;
    const ty = t.y - from.y;
    const len = Math.hypot(tx, ty);
    if (len < 1) continue;
    const angle = Math.acos(clamp((tx * dirX + ty * dirY) / len, -1, 1));
    if (angle <= bestAngle) {
      bestAngle = angle;
      best = { target: t, dirX: tx / len, dirY: ty / len };
    }
  }
  return best || { dirX, dirY, target: null };
}

// A menu gesture → "up" | "down" | "left" | "right" | "tap" | null
export function readSwipe(points) {
  if (points.length === 0) return null;
  const a = points[0];
  const b = points.at(-1);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.hypot(dx, dy) < 30) return b.t - a.t < 600 ? "tap" : null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
