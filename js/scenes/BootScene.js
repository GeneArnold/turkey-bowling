// Loads the pictures and the sayings, draws the stand-in art, then opens the game.
import * as cast from "../cast.js";
import * as store from "../storage.js";
import { readChallenge } from "../share.js";
import { PICTURES, makeTextures } from "../textures.js";
import { H, W, setupCamera, text } from "../ui.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    setupCamera(this);
    const status = text(this, W / 2, H / 2, "Thawing the turkey...", 30);
    this.load.json("sayings", "sayings/sayings.json");
    for (const key of PICTURES) this.load.image(key, `img/${key}.png`);
    this.load.image("bg-yard", "img/bg-yard.jpg");
    this.load.on("progress", (v) => status.setText(`Thawing the turkey... ${Math.round(v * 100)}%`));
    // A missing picture is fine: textures.js draws a stand-in.
    this.load.on("loaderror", (file) => console.info("No picture yet:", file.src));
  }

  create() {
    cast.setData(this.cache.json.get("sayings"));
    makeTextures(this);
    readChallenge();
    this.scene.start(store.get("player") ? "Title" : "Name");
  }
}
