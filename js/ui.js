// Fun Shed kit v1.3
// Small pieces of screen shared by the scenes: text styles, speech bubbles, floating points.
export const W = 540;
export const H = 960;
export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

// The game is laid out on a 540 x 960 screen but drawn at twice that, so it stays sharp on phones.
// Every scene calls this first; positions everywhere are in the 540 x 960 layout.
export const ZOOM = 2;
export function setupCamera(scene) {
  scene.cameras.main.setZoom(ZOOM).centerOn(W / 2, H / 2);
}

// Where a finger is, in the 540 x 960 layout. (Phaser only fills in pointer.worldX for scenes with
// tappable objects, and this game has none, so it is worked out here.)
export function fingerAt(scene, pointer) {
  const p = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  return { x: p.x, y: p.y, t: performance.now() };
}

export function text(scene, x, y, str, size = 28, opts = {}) {
  return scene.add
    .text(x, y, str, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: opts.bold === false ? "normal" : "bold",
      color: opts.color || "#ffffff",
      stroke: opts.stroke || "#2b1608",
      strokeThickness: opts.strokeThickness ?? Math.round(size / 6),
      align: "center",
      resolution: ZOOM,
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
    })
    .setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);
}

// A speech bubble (no pointer, just the bubble) above a point, kept inside the screen, gone after `ms`. One at a time: a new
// bubble replaces the last one, so quick hits never stack up unreadable bubbles.
export function bubble(scene, x, y, words, ms = 1700) {
  scene.lastBubble?.destroy();
  const label = scene.add.text(0, 0, words, {
    fontFamily: FONT, fontSize: "24px", fontStyle: "bold", color: "#2b1d14", align: "center",
    wordWrap: { width: 260 }, resolution: ZOOM,
  }).setOrigin(0.5);
  const w = label.width + 32;
  const h = label.height + 22;
  const cx = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
  const cy = Math.max(h / 2 + 70, y - h / 2 - 16);
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.96);
  g.lineStyle(3, 0x2b1d14);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  const c = scene.add.container(cx, cy, [g, label]).setDepth(80).setScale(0.6);
  scene.lastBubble = c;
  scene.tweens.add({ targets: c, scale: 1, duration: 160, ease: "Back.easeOut" });
  scene.tweens.add({ targets: c, alpha: 0, delay: ms, duration: 250, onComplete: () => c.destroy() });
  return c;
}

export function floatText(scene, x, y, words, colour = "#ffe066", size = 34) {
  const t = text(scene, x, y, words, size, { color: colour }).setDepth(85);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1100, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  return t;
}

// A big rounded button with words on it. r: { x, y, w, h }
export function button(scene, r, words, colour, size = 34) {
  const g = scene.add.graphics();
  g.fillStyle(0x2b1d14).fillRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 24);
  g.fillStyle(colour).fillRoundedRect(r.x, r.y, r.w, r.h, 20);
  const label = text(scene, r.x + r.w / 2, r.y + r.h / 2, words, size);
  return { g, label };
}

// A wooden sign to put words on (the Fun Shed results screen: the score goes on one).
export function woodSign(scene, x, y, w, h) {
  const g = scene.add.graphics();
  g.fillStyle(0x5a3a1e);
  g.fillRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 14);
  g.fillStyle(0x9a6434);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  g.lineStyle(2, 0x7d4f27);
  for (let ly = y - h / 2 + h / 4; ly < y + h / 2; ly += h / 4) g.lineBetween(x - w / 2 + 6, ly, x + w / 2 - 6, ly);
  g.fillStyle(0x3b2a1e);
  for (const [nx, ny] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.fillCircle(x + nx * (w / 2 - 12), y + ny * (h / 2 - 12), 4);
  return g;
}

// Turkey Bowling's sign: a slab of polished lane, maple boards running up it and the lane's aiming
// arrows along the bottom. Like woodSign, it has thin lines across to split what's written on it.
export function laneSign(scene, x, y, w, h) {
  const g = scene.add.graphics();
  const left = x - w / 2;
  const top = y - h / 2;
  g.fillStyle(0x4a2a12).fillRoundedRect(left - 6, top - 6, w + 12, h + 12, 14);
  g.fillStyle(0xd29a5c).fillRoundedRect(left, top, w, h, 10);
  g.fillStyle(0xffffff, 0.12).fillRoundedRect(left + 6, top + 4, w - 12, h * 0.3, 8); // the shine
  g.lineStyle(1, 0xb07a40, 0.7);
  for (let bx = left + 16; bx < left + w - 8; bx += 16) g.lineBetween(bx, top + 3, bx, top + h - 3);
  g.lineStyle(2, 0x8a5428);
  if (h > 160) for (let ly = top + h / 4; ly < top + h - 1; ly += h / 4) g.lineBetween(left + 6, ly, left + w - 6, ly);
  g.fillStyle(0x4a2a12);
  for (let k = -3; k <= 3; k++) {
    const ax = x + k * (w / 9);
    const ay = top + h - 8 - (3 - Math.abs(k)) * 3;
    g.fillTriangle(ax - 6, ay, ax + 6, ay, ax, ay - 12);
  }
  return g;
}

// The menu screens' sky: an autumn evening, deep brown up top fading to orange.
export function autumnSky(scene, top = 0x2b1608, bottom = 0x9c4a1a) {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, W, H);
  return g;
}

// Autumn leaves drifting down, tumbling as they fall.
export function leaffall(scene, depth = 5) {
  return scene.add
    .particles(0, -10, "leaf", {
      x: { min: -60, max: W + 60 },
      lifespan: 9000,
      speedY: { min: 40, max: 80 },
      speedX: { min: -25, max: 25 },
      scale: { min: 0.5, max: 1 },
      rotate: { start: 0, end: 540 },
      tint: [0xd9541e, 0xe8a23a, 0xb8321e, 0xc9822c],
      alpha: { min: 0.6, max: 0.95 },
      frequency: 260,
      advance: 9000,
    })
    .setDepth(depth);
}
