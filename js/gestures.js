// Fun Shed kit v1.3
// Menu screens are driven by one finger: swipes and taps, no buttons to aim for.
// Touches in the first half second of a screen are ignored, so the flick that ended the last
// screen does not also act on this one.
import { readSwipe } from "./flick.js";
import * as audio from "./audio.js";
import { fingerAt } from "./ui.js";

export function listenForGestures(scene, { onSwipe, onTap, lockMs = 500 }) {
  const openAt = performance.now() + lockMs;
  let id = null;
  let path = [];
  const point = (p) => fingerAt(scene, p);
  scene.input.on("pointerdown", (p) => {
    audio.unlock();
    if (performance.now() < openAt || id !== null) return;
    id = p.id;
    path = [point(p)];
  });
  scene.input.on("pointermove", (p) => {
    if (p.id === id) path.push(point(p));
  });
  const up = (p) => {
    audio.unlock(); // phones only allow sound once a touch has ended, so try again here
    if (p.id !== id) return;
    id = null;
    const end = point(p);
    path.push(end);
    const gesture = readSwipe(path);
    if (gesture === "tap") onTap?.(end.x, end.y);
    else if (gesture) onSwipe?.(gesture);
  };
  scene.input.on("pointerup", up);
  scene.input.on("pointerupoutside", up);
}

export function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
