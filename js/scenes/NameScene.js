// Arcade-style initials, once, the first time the game is opened (and again from the title).
// Swipe up or down to change a letter, right for the next letter, left to go back; swipe right on
// the last letter (or tap DONE) to finish. Taps work too: above or below a letter changes it.
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { listenForGestures } from "../gestures.js";
import { W, autumnSky, leaffall, setupCamera, text } from "../ui.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SLOT_X = [150, 270, 390];
const SLOT_Y = 430;
const DONE = { x: W / 2 - 110, y: 600, w: 220, h: 80 };

export class NameScene extends Phaser.Scene {
  constructor() {
    super("Name");
  }

  create() {
    setupCamera(this);
    autumnSky(this);
    leaffall(this, 1);
    const current = store.get("player")?.initials || "AAA";
    this.letters = current.padEnd(3, "A").split("").map((c) => Math.max(0, LETTERS.indexOf(c)));
    this.cursor = 0;

    text(this, W / 2, 110, "WHO'S BOWLING?", 44, { color: "#ffe066" });
    text(this, W / 2, 166, "Enter your initials", 26, { color: "#ffffff" });
    this.slots = SLOT_X.map((x) => text(this, x, SLOT_Y, "A", 110, { color: "#ffffff" }));
    this.arrows = this.add.graphics();
    this.underline = this.add.graphics();
    const done = this.add.graphics();
    done.fillStyle(0x2a9d3a);
    done.fillRoundedRect(DONE.x, DONE.y, DONE.w, DONE.h, 20);
    this.doneText = text(this, W / 2, DONE.y + DONE.h / 2, "DONE", 40);
    text(this, W / 2, 760, "tap ▲ ▼ to change a letter\ntap a letter to pick it", 22, { color: "#f3dcc0", strokeThickness: 3 });
    this.draw();

    listenForGestures(this, {
      lockMs: 300,
      onSwipe: (dir) => {
        if (dir === "up") this.change(1);
        else if (dir === "down") this.change(-1);
        else if (dir === "right") this.cursor === 2 ? this.finish() : this.move(1);
        else this.move(-1);
      },
      onTap: (x, y) => {
        if (x > DONE.x && x < DONE.x + DONE.w && y > DONE.y && y < DONE.y + DONE.h) return this.finish();
        const slot = SLOT_X.findIndex((sx) => Math.abs(x - sx) < 60);
        if (slot < 0 || Math.abs(y - SLOT_Y) > 150) return;
        if (slot !== this.cursor) this.move(slot - this.cursor);
        else this.change(y < SLOT_Y ? 1 : -1);
      },
    });
  }

  change(step) {
    this.letters[this.cursor] = (this.letters[this.cursor] + step + LETTERS.length) % LETTERS.length;
    audio.play("pop");
    this.draw();
    const slot = this.slots[this.cursor];
    this.tweens.add({ targets: slot, y: SLOT_Y - step * 14, duration: 70, yoyo: true });
  }

  move(step) {
    this.cursor = Phaser.Math.Clamp(this.cursor + step, 0, 2);
    audio.play("boing");
    this.draw();
  }

  draw() {
    this.slots.forEach((s, i) => s.setText(LETTERS[this.letters[i]]).setColor(i === this.cursor ? "#ffe066" : "#ffffff"));
    const x = SLOT_X[this.cursor];
    this.arrows.clear().fillStyle(0xffe066);
    this.arrows.fillTriangle(x - 22, SLOT_Y - 84, x + 22, SLOT_Y - 84, x, SLOT_Y - 112);
    this.arrows.fillTriangle(x - 22, SLOT_Y + 84, x + 22, SLOT_Y + 84, x, SLOT_Y + 112);
    this.underline.clear().fillStyle(0xffe066);
    this.underline.fillRect(x - 40, SLOT_Y + 66, 80, 6);
  }

  finish() {
    const initials = this.letters.map((i) => LETTERS[i]).join("");
    store.setInitials(initials);
    audio.play("cheer");
    this.doneText.setText(`HI ${initials}!`);
    this.time.delayedCall(700, () => this.scene.start("Title"));
  }
}
