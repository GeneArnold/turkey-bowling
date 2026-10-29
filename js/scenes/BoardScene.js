// The high scores, arcade style: this phone's top 10 games. A BACK button (or a tap anywhere) goes back to the title.
import * as store from "../storage.js";
import { listenForGestures } from "../gestures.js";
import { W, autumnSky, button, setupCamera, text } from "../ui.js";

const BACK = { x: W / 2 - 110, y: 846, w: 220, h: 64 };
const MEDALS = ["#ffd700", "#d9e1ea", "#e0995e"];

export class BoardScene extends Phaser.Scene {
  constructor() {
    super("Board");
  }

  create() {
    setupCamera(this);
    autumnSky(this);
    this.content = this.add.container(0, 0);
    button(this, BACK, "BACK", 0x7d5a3c, 30);
    listenForGestures(this, { onTap: () => this.scene.start("Title"), onSwipe: () => this.scene.start("Title") });

    this.drawScores(store.board());
  }

  put(obj) {
    this.content.add(obj);
    return obj;
  }

  drawScores(rows) {
    const me = store.get("player");
    this.put(text(this, W / 2, 80, "HIGH SCORES", 56, { color: "#ffb84d" }));
    this.put(text(this, W / 2, 140, "ON THIS PHONE", 16, { color: "#f3dcc0", strokeThickness: 3 }));
    if (rows.length === 0) {
      this.put(text(this, W / 2, 440, "Nobody yet.\nBe the first!", 36, { color: "#ffffff" }));
      return;
    }
    rows.slice(0, 10).forEach((r, i) => {
      const y = 214 + i * 62;
      const mine = r.initials === me.initials;
      const colour = MEDALS[i] || (mine ? "#7CFC9A" : "#ffffff");
      if (mine) {
        const g = this.put(this.add.graphics());
        g.fillStyle(0xffffff, 0.12);
        g.fillRoundedRect(40, y - 26, W - 80, 52, 12);
      }
      this.put(text(this, 96, y, `${i + 1}`.padStart(2, " "), 32, { color: colour, originX: 1 }));
      this.put(text(this, 140, y, r.initials, 36, { color: colour, originX: 0 }));
      this.put(text(this, W - 60, y, String(r.score), 36, { color: colour, originX: 1 }));
    });
  }
}
