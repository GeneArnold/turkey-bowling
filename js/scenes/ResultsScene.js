// After a game, laid out like every Fun Shed results screen: a wooden sign with the score and the
// headline (a dare's outcome, a new high score or the board), the score sheet, a box of how it went,
// then BOWL AGAIN, TRASH TALK, and HIGH SCORES and MENU side by side (swipe up also plays again).
// Scores stay on this phone.
import * as audio from "../audio.js";
import * as bowling from "../bowling.js";
import * as store from "../storage.js";
import { shareRound, snapshot } from "../share.js";
import { ScoreSheet } from "../sheet.js";
import { inside, listenForGestures } from "../gestures.js";
import { W, autumnSky, button, leaffall, setupCamera, text, laneSign } from "../ui.js";

const PLAY = { x: W / 2 - 170, y: 616, w: 340, h: 84 };
const SHARE = { x: W / 2 - 170, y: 722, w: 340, h: 70 };
const BOARD = { x: W / 2 - 170, y: 816, w: 160, h: 60 };
const MENU = { x: W / 2 + 10, y: 816, w: 160, h: 60 };

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create({ score, strikes, spares, turkeys, throws, rank, previousTop, challenge }) {
    setupCamera(this);
    autumnSky(this);
    leaffall(this, 1);
    this.round = { score, strikes, turkeys };
    const me = store.get("player");
    const where = bowling.next(throws);
    const frames = where.over ? 10 : where.frame; // fewer when the game was quit

    laneSign(this, W / 2, 182, 470, 286);
    text(this, W / 2, 80, "FINAL SCORE", 46, { color: "#ffe066" });
    text(this, W / 2, 124, `${me.initials} · ${frames} of 10 frames`, 22, { color: "#fff3c4", strokeThickness: 4 });
    const scoreText = text(this, W / 2, 192, "0", 90, { color: "#ffffff", strokeThickness: 10 });
    const countUp = Math.min(1200, 300 + score * 4);
    this.tweens.addCounter({
      from: 0, to: score, duration: countUp, ease: "Cubic.easeOut",
      onUpdate: (t) => scoreText.setText(String(Math.round(t.getValue()))),
    });

    // The headline: a dare's outcome first, then a new high score, then the board.
    let headline;
    let colour = "#ffe066";
    let cheer = score > 0;
    if (challenge) {
      const won = score > challenge.score;
      headline = won ? `YOU BEAT ${challenge.initials}!` : `${challenge.initials} STILL RULES (${challenge.score})`;
      colour = won ? "#7CFC9A" : "#ff9e9e";
      cheer = won;
      store.set("challenge", null);
    } else if (score > previousTop && score > 0) {
      headline = "NEW HIGH SCORE!";
      colour = "#7CFC9A";
    } else if (rank) {
      headline = `#${rank} ON THIS PHONE`;
    } else {
      headline = `YOUR BEST ${previousTop}`;
      cheer = false;
    }
    const head = text(this, W / 2, 272, headline, 30, { color: colour, strokeThickness: 6 });
    if (colour === "#7CFC9A") this.tweens.add({ targets: head, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    audio.play(cheer ? "cheer" : score > 0 ? "gobble" : "groan");

    new ScoreSheet(this, 340, 5).update(throws);

    // How it went: one row each, a picture, the words, the number.
    const rows = [
      ["pin", "Strikes", strikes],
      ["pin", "Spares", spares],
      ["turkey-normal", "Turkeys", turkeys],
    ];
    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.35).fillRoundedRect(70, 432, W - 140, 160, 20);
    rows.forEach(([picture, words, n], k) => {
      const y = 466 + k * 46;
      const icon = this.add.image(116, y, picture);
      icon.setScale(38 / icon.height);
      text(this, 150, y, words, 26, { originX: 0, strokeThickness: 5 });
      text(this, W - 100, y, String(n), 32, { originX: 1, color: "#ffe066", strokeThickness: 5 });
    });

    this.shareText = [
      button(this, PLAY, "🎳 BOWL AGAIN", 0x2a9d3a, 38),
      button(this, SHARE, "📣 TRASH TALK", 0xe63946, 30),
      button(this, BOARD, "HIGH SCORES", 0x2a6f9d, 20),
      button(this, MENU, "MENU", 0x7d5a3c, 24),
    ][1].label;

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => snapshot(this.game).then((png) => (this.picture = png)));

    listenForGestures(this, {
      lockMs: 900,
      onTap: (x, y) => {
        if (inside(x, y, PLAY)) this.playAgain();
        else if (inside(x, y, SHARE)) this.share();
        else if (inside(x, y, BOARD)) this.scene.start("Board");
        else if (inside(x, y, MENU)) this.scene.start("Title");
      },
      onSwipe: (dir) => dir === "up" && this.playAgain(),
    });
  }

  playAgain() {
    audio.play("gobble");
    this.scene.start("Play");
  }

  async share() {
    audio.play("pop");
    const outcome = await shareRound({ ...this.round, picture: this.picture || null });
    if (outcome !== "cancelled") this.shareText.setText("📣 SENT! AGAIN?");
  }
}
