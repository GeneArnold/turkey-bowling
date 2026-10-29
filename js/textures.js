// Art drawn in code at start-up: the turkey's faces, the lawn-ornament pins, leaves. These are
// stand-ins until the cartoon pictures arrive: BootScene loads the pictures first (PICTURES), and a
// drawing is skipped when its picture is there, so a new picture only has to land in img/.

// The turkey's faces: rolling along, scared as it nears the pins, dizzy after a crash, and
// embarrassed in the bushes.
export const TURKEY_FACES = ["normal", "scared", "dizzy", "oops"];
export const PICTURES = [...TURKEY_FACES.map((f) => `turkey-${f}`), "pin"];

function draw(scene, key, w, h, paint) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  paint(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

const OUTLINE = 0x2b1608;

// A round cartoon turkey tucked into a ball, 160 x 160, its tail fanned out behind.
function turkey(g, face) {
  const c = 80;
  const feathers = [0xb8321e, 0xe8a23a, 0xd9541e, 0x7a3b12, 0xe8a23a, 0xb8321e, 0xd9541e];
  feathers.forEach((col, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / feathers.length;
    g.fillStyle(OUTLINE);
    g.fillEllipse(c + Math.cos(a) * 52, c + 6 + Math.sin(a) * 52, 34, 58);
    g.fillStyle(col);
    g.fillEllipse(c + Math.cos(a) * 52, c + 6 + Math.sin(a) * 52, 28, 52);
  });
  g.fillStyle(OUTLINE);
  g.fillCircle(c, c + 10, 54);
  g.fillStyle(0x8a4b1f);
  g.fillCircle(c, c + 10, 50);
  g.fillStyle(0xa8622c);
  g.fillCircle(c - 10, c + 2, 30);
  // Eyes.
  const eye = (x, y) => {
    g.fillStyle(OUTLINE);
    g.fillCircle(x, y, 14);
    g.fillStyle(0xffffff);
    g.fillCircle(x, y, 12);
  };
  eye(c - 18, c - 6);
  eye(c + 18, c - 6);
  g.fillStyle(OUTLINE);
  if (face === "normal") {
    g.fillCircle(c - 15, c - 4, 5);
    g.fillCircle(c + 21, c - 4, 5);
  } else if (face === "scared") {
    g.fillCircle(c - 18, c - 6, 3);
    g.fillCircle(c + 18, c - 6, 3);
  } else if (face === "dizzy") {
    g.lineStyle(3, OUTLINE);
    for (const x of [c - 18, c + 18]) {
      g.lineBetween(x - 7, c - 13, x + 7, c + 1);
      g.lineBetween(x + 7, c - 13, x - 7, c + 1);
    }
  } else {
    // oops: eyes squeezed shut and red cheeks
    g.fillStyle(0xffffff);
    g.fillCircle(c - 18, c - 6, 12);
    g.fillCircle(c + 18, c - 6, 12);
    g.lineStyle(4, OUTLINE);
    g.lineBetween(c - 28, c - 6, c - 8, c - 6);
    g.lineBetween(c + 8, c - 6, c + 28, c - 6);
    g.fillStyle(0xff6b6b, 0.8);
    g.fillCircle(c - 32, c + 12, 8);
    g.fillCircle(c + 32, c + 12, 8);
  }
  // Beak, open when scared.
  g.fillStyle(OUTLINE);
  g.fillTriangle(c - 11, c + 6, c + 11, c + 6, c, c + 24);
  g.fillStyle(0xf2b134);
  g.fillTriangle(c - 8, c + 8, c + 8, c + 8, c, c + 21);
  if (face === "scared") {
    g.fillStyle(OUTLINE);
    g.fillEllipse(c, c + 30, 14, 12);
  }
  // The red wattle.
  g.fillStyle(0xd62828);
  g.fillEllipse(c + 7, c + 26, 9, 16);
}

// A bowling pin in Thanksgiving colours, 60 x 160: white, with an orange and a brown band at the neck.
function pin(g) {
  const shape = (inset) => {
    const pts = [];
    // The pin's outline, from the base up one side: [height from the bottom, half-width].
    const profile = [[0, 14], [20, 22], [50, 26], [80, 20], [100, 10], [112, 9], [128, 13], [146, 12], [156, 6], [158, 0]];
    for (const [y, hw] of profile) pts.push({ x: 30 - Math.max(0, hw - inset), y: 160 - y - (y === 0 ? -inset * 0 : 0) });
    for (const [y, hw] of [...profile].reverse()) pts.push({ x: 30 + Math.max(0, hw - inset), y: 160 - y });
    return pts;
  };
  g.fillStyle(OUTLINE);
  g.fillPoints(shape(-3), true);
  g.fillStyle(0xfbf7ee);
  g.fillPoints(shape(0), true);
  g.fillStyle(0xe8731e);
  g.fillRect(19, 52, 22, 7);
  g.fillStyle(0x6b3a1c);
  g.fillRect(20, 61, 20, 5);
  g.fillStyle(0xffffff, 0.8);
  g.fillEllipse(22, 100, 6, 30);
}

export function makeTextures(scene) {
  for (const f of TURKEY_FACES) draw(scene, `turkey-${f}`, 160, 160, (g) => turkey(g, f));
  draw(scene, "pin", 60, 160, pin);

  draw(scene, "leaf", 18, 14, (g) => {
    g.fillStyle(0xffffff);
    g.fillEllipse(9, 7, 16, 10);
  });

  draw(scene, "feather", 10, 24, (g) => {
    g.fillStyle(0xe8a23a);
    g.fillEllipse(5, 12, 9, 22);
  });

  draw(scene, "star", 28, 28, (g) => {
    g.fillStyle(0xffe066);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 6 : 13;
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      pts.push({ x: 14 + r * Math.cos(a), y: 14 + r * Math.sin(a) });
    }
    g.fillPoints(pts, true);
  });
}
