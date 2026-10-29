// The front yard, drawn in code until the cartoon background arrives: an autumn evening sky, a
// house with its garage at the top of the driveway, lawns, hedges and leaf piles down the sides.
// With img/bg-yard.jpg present, that picture is used instead and only the driveway's edges are
// lined up on it.
import { LANE, VIEW, toScreen } from "./lane.js";
import { H, W } from "./ui.js";

export function paintYard(scene) {
  if (scene.textures.exists("bg-yard")) {
    scene.add.image(W / 2, H / 2, "bg-yard").setDisplaySize(W, H).setDepth(0);
    return;
  }
  const g = scene.add.graphics().setDepth(0);
  const far = toScreen(0, LANE.end);

  // Sky, fading from deep blue into an orange sunset low down.
  g.fillGradientStyle(0x2c3e75, 0x2c3e75, 0xf0a04b, 0xf0a04b, 1);
  g.fillRect(0, 0, W, far.y + 10);

  // The lawn.
  g.fillGradientStyle(0x6d8a2c, 0x6d8a2c, 0x4f6b1e, 0x4f6b1e, 1);
  g.fillRect(0, far.y, W, H - far.y);

  // Fallen leaves on the lawn.
  for (let k = 0; k < 70; k++) {
    const x = (k * 137) % W;
    const y = far.y + 20 + ((k * 89) % (H - far.y - 20));
    g.fillStyle([0xd9541e, 0xe8a23a, 0xb8321e][k % 3], 0.85);
    g.fillEllipse(x, y, 10, 6);
  }

  // The house and garage at the top of the driveway.
  const gw = (LANE.halfWidth + 14) * 2 * VIEW.pxPerInch * far.s;
  g.fillStyle(0x8c4a32);
  g.fillRect(W / 2 - 200, far.y - 110, 400, 110);
  g.fillStyle(0x4a2a1e);
  g.fillTriangle(W / 2 - 220, far.y - 108, W / 2 + 220, far.y - 108, W / 2, far.y - 190);
  g.fillStyle(0xd8c7a0);
  g.fillRect(W / 2 - gw / 2, far.y - 70, gw, 70);
  g.lineStyle(2, 0xa89770);
  for (let k = 1; k < 5; k++) g.lineBetween(W / 2 - gw / 2, far.y - 70 + k * 14, W / 2 + gw / 2, far.y - 70 + k * 14);
  g.fillStyle(0xffd27a);
  g.fillRect(W / 2 - 170, far.y - 85, 50, 40);
  g.fillRect(W / 2 + 120, far.y - 85, 50, 40);

  // The driveway, in perspective.
  const quad = (x1, x2, z1, z2, colour) => {
    const a = toScreen(x1, z1);
    const b = toScreen(x2, z1);
    const c = toScreen(x2, z2);
    const d = toScreen(x1, z2);
    g.fillStyle(colour);
    g.fillPoints([a, b, c, d], true);
  };
  quad(-LANE.halfWidth - 3, LANE.halfWidth + 3, -80, LANE.end, 0x6e6a66);
  quad(-LANE.halfWidth, LANE.halfWidth, -80, LANE.end, 0x8f8a84);
  // Cracks between the concrete slabs.
  g.lineStyle(2, 0x6e6a66);
  for (let z = 0; z < LANE.end; z += 45) {
    const a = toScreen(-LANE.halfWidth, z);
    const b = toScreen(LANE.halfWidth, z);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  // Hedges along both sides: where a gutter ball ends up.
  for (const side of [-1, 1]) {
    for (let z = LANE.end; z >= -60; z -= 14) {
      const p = toScreen(side * (LANE.halfWidth + 13), z);
      const r = 8 * VIEW.pxPerInch * p.s;
      g.fillStyle(0x2f4f17);
      g.fillCircle(p.x, p.y - r * 0.6, r * 1.05);
      g.fillStyle(0x3f6b1f);
      g.fillCircle(p.x - r * 0.2, p.y - r * 0.8, r * 0.75);
    }
  }

}
