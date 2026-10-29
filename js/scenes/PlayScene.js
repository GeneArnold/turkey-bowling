// A game of bowling: ten frames of swiping a round cartoon turkey up the driveway at a rack of lawn
// ornaments. Touch the turkey, slide it sideways to line up, and flick up: the direction aims it,
// the speed sets how hard. A flick too gentle to count costs nothing.
import * as audio from "../audio.js";
import * as bowling from "../bowling.js";
import * as cast from "../cast.js";
import * as store from "../storage.js";
import { readFlick } from "../flick.js";
import { inside } from "../gestures.js";
import { LANE, VIEW, launch, newRack, settled, step, toLane, toScreen } from "../lane.js";
import { ScoreSheet, SHEET_H } from "../sheet.js";
import { paintYard } from "../yard.js";
import { H, W, bubble, button, fingerAt, floatText, setupCamera, text, laneSign } from "../ui.js";

const ZONE_TOP = 700;     // a swipe starts anywhere below this line
const THROW_LINE = 620;   // a finger dragged above this line lets go straight away
const AIM_DAMP = 0.55;    // how much of the swipe's sideways angle the turkey follows; lower is easier
const ASSIST_IN = 6;      // a throw heading within this many inches of a standing pin is nudged onto it
const PIN_HEIGHT = 15;    // how tall a pin is drawn, in inches
const TURKEY_SIZE = 15;   // how wide the turkey picture is drawn (wings and all), in inches
const PAUSE = { x: W - 84, y: SHEET_H + 6, w: 80, h: 76 };
const KEEP = { x: W / 2 - 150, y: 410, w: 300, h: 84 };
const SOUND = { x: W / 2 - 150, y: 520, w: 300, h: 70 };
const QUIT = { x: W / 2 - 150, y: 616, w: 300, h: 84 };

const depthAt = (z) => 30 + (LANE.end + 200 - z) / 10;

export class PlayScene extends Phaser.Scene {
  constructor() {
    super("Play");
  }

  create() {
    setupCamera(this);
    this.tweens.resumeAll(); // Phaser keeps a scene's clock and tweens paused into its next start
    this.time.paused = false;
    this.challenge = store.get("challenge");
    paintYard(this);

    this.throws = [];
    this.strikes = 0;
    this.spares = 0;
    this.turkeys = 0;
    this.turkey = null;      // the rolling turkey, in lane inches (js/lane.js)
    this.pins = [];
    this.rolling = false;
    this.ready = false;
    this.finished = false;
    this.paused = null;
    this.pointerId = null;
    this.path = [];
    this.startX = 0;         // where on the foul line the turkey sits, in lane inches

    this.makeCard();
    this.turkeyImg = this.add.image(0, 0, "turkey-normal").setOrigin(0.5, 0.6);
    this.trail = this.add.graphics().setDepth(90);
    this.hint = text(this, W / 2, 940, "slide the turkey, then swipe up!", 22, { strokeThickness: 4 }).setDepth(92);
    this.listen();
    const away = () => document.hidden && this.pause();
    document.addEventListener("visibilitychange", away);
    this.events.once("shutdown", () => document.removeEventListener("visibilitychange", away));

    this.setRack(newRack());
    this.updateCard();
    if (this.challenge) {
      const c = this.challenge;
      const dare = text(this, W / 2, 420, `BEAT ${c.initials}'S ${c.score}!`, 40, { color: "#ff9ec4" }).setDepth(95);
      this.tweens.add({ targets: dare, alpha: 0, delay: 1600, duration: 400, onComplete: () => dare.destroy() });
    }
    audio.startMusic();
    this.newTurkey();
  }

  // ---------------------------------------------------------------------------------------------
  // The score sheet and the pause button

  makeCard() {
    this.sheet = new ScoreSheet(this, 0);
    this.status = text(this, 16, SHEET_H + 30, "", 22, { originX: 0, strokeThickness: 4 }).setDepth(95);
    this.scoreText = text(this, 16, SHEET_H + 60, "", 20, { originX: 0, color: "#ffe066", strokeThickness: 4 }).setDepth(95);

    const pause = this.add.graphics().setDepth(95);
    const cx = PAUSE.x + PAUSE.w / 2;
    const cy = PAUSE.y + PAUSE.h / 2;
    pause.fillStyle(0x000000, 0.35);
    pause.fillRoundedRect(cx - 30, cy - 30, 60, 60, 14);
    pause.fillStyle(0xffffff, 0.9);
    pause.fillRoundedRect(cx - 13, cy - 15, 9, 30, 3);
    pause.fillRoundedRect(cx + 4, cy - 15, 9, 30, 3);
  }

  updateCard() {
    const at = bowling.next(this.throws);
    this.sheet.update(this.throws, at.over ? null : at.frame);
    if (!at.over) {
      // In the tenth, a strike or spare earns extra throws: say so, or they come as a surprise.
      const tenth = bowling.frames(this.throws)[bowling.FRAMES - 1];
      const bonus = at.frame === bowling.FRAMES - 1 && (at.ball === 2 || (at.ball === 1 && tenth?.strike));
      this.status.setText(bonus ? "FRAME 10 · BONUS BALL!" : `FRAME ${at.frame + 1} · BALL ${at.ball + 1}`);
      this.status.setColor(bonus ? "#7CFC9A" : "#ffffff");
    }
    this.scoreText.setText(`SCORE ${bowling.score(this.throws)}`);
  }

  // Paused: everything stops. KEEP BOWLING, SOUND on or off, or QUIT, which ends the game here and
  // saves the score so far.
  pause() {
    if (this.paused || this.finished) return;
    this.pointerId = null;
    this.path = [];
    this.trail.clear();
    if (this.ready) this.placeTurkey();
    this.tweens.pauseAll();
    this.time.paused = true;
    audio.stopMusic();
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.6);
    dim.fillRect(0, 0, W, H);
    const parts = [dim, laneSign(this, W / 2, 304, 360, 118), text(this, W / 2, 300, "PAUSED", 56, { color: "#ffe066" })];
    for (const [r, colour, words] of [[KEEP, 0x2a9d3a, "KEEP BOWLING"], [SOUND, 0x2a6f9d, ""], [QUIT, 0xe63946, "QUIT"]]) {
      const b = button(this, r, words, colour, 32);
      parts.push(b.g, b.label);
      if (r === SOUND) this.soundLabel = b.label;
    }
    this.showSound();
    parts.push(text(this, W / 2, QUIT.y + QUIT.h + 44, "Quitting ends the game.\nYour score is still saved.", 20, { color: "#ffffff", strokeThickness: 4 }));
    this.paused = this.add.container(0, 0, parts).setDepth(200);
  }

  showSound() {
    this.soundLabel.setText(store.get("sound") ? "🔊 SOUND ON" : "🔇 SOUND OFF");
  }

  tapWhilePaused(at) {
    if (inside(at.x, at.y, QUIT)) {
      this.tweens.resumeAll();
      this.time.paused = false;
      this.finished = true;
      audio.play("groan");
      this.finishGame();
    } else if (inside(at.x, at.y, SOUND)) {
      const on = !store.get("sound");
      store.set("sound", on);
      audio.setEnabled(on);
      this.showSound();
      audio.play("pop");
    } else if (inside(at.x, at.y, KEEP)) {
      this.paused.destroy();
      this.paused = null;
      this.tweens.resumeAll();
      this.time.paused = false;
      audio.startMusic();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Pins

  // Puts up pins: a fresh rack, or the ones still standing for a second throw.
  setRack(pins) {
    for (const p of this.pins) p.img?.destroy();
    this.pins = pins;
    for (const p of pins) {
      p.img = this.add.image(0, 0, "pin").setOrigin(0.5, 0.95);
      p.tilt = 0;     // how far it has tipped over, in degrees, toward the way it fell
      p.lying = 0;    // 0 standing up .. 1 lying flat
      this.drawPin(p, 0);
    }
  }

  // A standing pin is upright, or rocking while it wobbles. A fallen one lies the way it fell: a pin
  // that fell sideways shows its full length, one that fell away from you looks shorter.
  drawPin(p, time) {
    const pos = toScreen(p.x, p.z);
    const tex = p.img.texture.getSourceImage();
    const h = PIN_HEIGHT * VIEW.pxPerInch * pos.s;
    let angle = p.tilt;
    if (p.wobble > 0) angle = Math.sin(time * 0.03) * 14 * p.wobbleAmp * (p.wobble / LANE.wobble + 0.3);
    const shorten = 1 - p.lying * (1 - (0.35 + 0.65 * Math.abs(p.fallX)));
    p.img
      .setPosition(pos.x, pos.y)
      .setDisplaySize((h * tex.width) / tex.height, h * shorten)
      .setDepth(depthAt(p.z))
      .setAngle(angle)
      .setVisible(p.z < LANE.end + 4);
  }

  // A pin going down tips over the way it was knocked.
  topple(p) {
    const angle = Phaser.Math.RadToDeg(Math.atan2(p.fallX, p.fallZ));
    this.tweens.add({ targets: p, tilt: angle, lying: 1, duration: 240, ease: "Quad.easeIn" });
  }

  // ---------------------------------------------------------------------------------------------
  // The turkey and the swipe

  newTurkey() {
    this.turkey = null;
    this.startX = 0;
    this.turkeyImg.setTexture("turkey-normal").setAngle(0).setAlpha(1).setVisible(true);
    this.placeTurkey();
    const y = this.turkeyImg.y;
    this.turkeyImg.y = H + 120;
    this.tweens.add({ targets: this.turkeyImg, y, duration: 320, ease: "Back.easeOut", onComplete: () => (this.ready = true) });
  }

  // The turkey sitting at the foul line, where the player has slid it.
  placeTurkey() {
    this.drawTurkey(this.startX, 0, 0);
  }

  drawTurkey(x, z, angle) {
    const pos = toScreen(x, z);
    const w = TURKEY_SIZE * VIEW.pxPerInch * pos.s;
    const tex = this.turkeyImg.texture.getSourceImage();
    this.turkeyImg
      .setPosition(pos.x, pos.y - LANE.turkeyR * VIEW.pxPerInch * pos.s * 0.9)
      .setDisplaySize(w, (w * tex.height) / tex.width)
      .setAngle(angle)
      .setDepth(depthAt(z) + 0.5);
  }

  listen() {
    this.input.on("pointerdown", (p) => {
      audio.unlock();
      const at = fingerAt(this, p);
      if (this.paused) return this.tapWhilePaused(at);
      if (inside(at.x, at.y, PAUSE)) return this.pause();
      if (!this.ready || this.pointerId !== null || at.y < ZONE_TOP) return;
      this.pointerId = p.id;
      this.path = [at];
      this.slideTo(at.x);
    });
    this.input.on("pointermove", (p) => {
      if (p.id !== this.pointerId) return;
      const at = fingerAt(this, p);
      this.path.push(at);
      if (this.path.length > 40) this.path.shift();
      this.drawTrail();
      // Below the throwing area the finger slides the turkey sideways to line it up.
      if (at.y > ZONE_TOP + 40) this.slideTo(at.x);
      if (at.y < THROW_LINE) this.release();
    });
    const up = (p) => {
      audio.unlock(); // phones only allow sound once a touch has ended
      if (p.id !== this.pointerId) return;
      this.path.push(fingerAt(this, p));
      this.release();
    };
    this.input.on("pointerup", up);
    this.input.on("pointerupoutside", up);
  }

  slideTo(screenX) {
    const lane = toLane(screenX, VIEW.nearY);
    const edge = LANE.halfWidth - LANE.turkeyR;
    this.startX = Phaser.Math.Clamp(lane.x, -edge, edge);
    this.placeTurkey();
  }

  drawTrail() {
    const pts = this.path.slice(-12);
    this.trail.clear().setAlpha(1);
    for (let i = 1; i < pts.length; i++) {
      const k = i / pts.length;
      this.trail.lineStyle(4 + 12 * k, 0xfff3c4, 0.15 + 0.6 * k);
      this.trail.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
  }

  release() {
    this.pointerId = null;
    const flick = readFlick(this.path);
    const pushedUp = this.path.length > 1 && this.path[0].y - this.path.at(-1).y > 60;
    this.path = [];
    this.tweens.add({ targets: this.trail, alpha: 0, duration: 220 });
    if (flick.ok) {
      this.roll(flick);
      return;
    }
    // A slide with no flick at the end just lines the turkey up. A soft flick gets a nudge.
    if (flick.reason === "gentle" && pushedUp) {
      audio.play("boing");
      floatText(this, W / 2, 640, cast.randomSaying("gentle").text, "#ffffff", 26);
    }
  }

  // Where the swipe points: carried on up the screen to the head pin's row, then turned into lane
  // inches there. Only part of the sideways angle is followed (AIM_DAMP), so aiming isn't twitchy,
  // and a throw that's nearly on a standing pin is nudged onto it.
  aimFor(flick) {
    const from = toScreen(this.startX, 0);
    const head = toScreen(0, LANE.headPin);
    const sx = from.x + (flick.dirX / -flick.dirY) * (from.y - head.y);
    const raw = toLane(sx, head.y).x;
    let aim = this.startX + (raw - this.startX) * AIM_DAMP;
    const standing = this.pins.filter((p) => !p.down);
    const near = standing
      .map((p) => ({ p, d: Math.abs(p.x - aim) }))
      .filter((n) => n.d < ASSIST_IN && Math.abs(aim) < LANE.halfWidth)
      .sort((a, b) => a.d - b.d)[0];
    if (near) aim = Phaser.Math.Linear(aim, near.p.x, 0.5);
    return aim;
  }

  roll(flick) {
    this.ready = false;
    this.hint?.destroy();
    this.hint = null;
    this.turkey = launch(this.startX, this.aimFor(flick), flick.power);
    this.downBefore = this.pins.filter((p) => p.down).length;
    this.hitSomething = false;
    this.inBushesSaid = false;
    this.rollTime = 0;
    this.rolling = true;
    audio.play("whoosh");
    audio.play("roll", 1.3);
    if (Math.random() < 0.5) this.time.delayedCall(200, () => audio.play("gobble"));
  }

  // ---------------------------------------------------------------------------------------------
  // The loop

  update(time, delta) {
    if (this.paused) return;
    const dt = Math.min(0.05, delta / 1000);
    for (const p of this.pins) this.drawPin(p, time);
    if (!this.rolling) return;
    this.rollTime += dt;
    const t = this.turkey;
    for (const e of step(t, this.pins, dt)) this.happened(e);
    // The turkey's face: scared as the pins get close, dizzy once it has hit them.
    if (!t.inBushes && !this.hitSomething && t.z > LANE.headPin - 50) this.turkeyImg.setTexture("turkey-scared");
    if (t.z < LANE.end + 5) {
      this.drawTurkey(t.x, t.z, t.spin * 4);
    } else {
      this.turkeyImg.setVisible(false); // into the garage
    }
    if ((this.rollTime > 1 && settled(t, this.pins)) || this.rollTime > 6) this.endThrow();
  }

  happened(e) {
    if (e.kind === "wobble") {
      audio.play("wobble");
    } else if (e.kind === "fall") {
      this.topple(e.pin);
      if (!this.hitSomething) {
        this.hitSomething = true;
        this.turkeyImg.setTexture("turkey-dizzy");
        this.cameras.main.shake(140, 0.004);
        navigator.vibrate?.(30);
      }
      audio.play("crash", 1);
    } else if (e.kind === "bushes") {
      this.turkeyImg.setTexture("turkey-oops");
      audio.play("rustle");
      this.leafBurst(this.turkeyImg.x, this.turkeyImg.y);
    }
  }

  leafBurst(x, y) {
    const burst = this.add
      .particles(x, y, "leaf", {
        speed: { min: 80, max: 260 }, angle: { min: 200, max: 340 }, lifespan: 900, gravityY: 500,
        rotate: { start: 0, end: 360 }, tint: [0xd9541e, 0xe8a23a, 0x3f6b1f], emitting: false,
      })
      .setDepth(91);
    burst.explode(18);
    this.time.delayedCall(1100, () => burst.destroy());
  }

  feathers() {
    const burst = this.add
      .particles(W / 2, 420, "feather", {
        speed: { min: 150, max: 420 }, angle: { min: 0, max: 360 }, lifespan: 1600, gravityY: 200,
        rotate: { start: 0, end: 720 }, tint: [0xe8a23a, 0xb8321e, 0xd9541e, 0x7a3b12], emitting: false,
      })
      .setDepth(97);
    burst.explode(50);
    this.time.delayedCall(1800, () => burst.destroy());
  }

  // Everything has stopped: count the pins, say something, and set up the next throw.
  endThrow() {
    this.rolling = false;
    const before = bowling.next(this.throws);
    const knocked = this.pins.filter((p) => p.down).length - this.downBefore;
    this.throws.push(knocked);
    const after = bowling.next(this.throws);
    this.updateCard();

    const freshRack = before.standing === bowling.PINS;
    const strike = freshRack && knocked === bowling.PINS;
    const spare = !freshRack && knocked === before.standing;
    const run = bowling.strikeRun(this.throws);
    let big = null;
    let colour = "#ffe066";
    let kind;
    if (strike) {
      this.strikes++;
      big = "STRIKE!";
      kind = "strike";
      if (run > 0 && run % 3 === 0) {
        // Three strikes in a row is called a turkey. Of course it is.
        this.turkeys++;
        big = "🦃 TURKEY! 🦃";
        colour = "#ff9e3d";
        kind = "turkey";
        audio.play("fanfare");
        this.feathers();
      } else {
        audio.play("cheer");
      }
    } else if (spare) {
      this.spares++;
      big = "SPARE!";
      colour = "#7CFC9A";
      kind = "spare";
      audio.play("cheer");
    } else if (this.turkey.inBushes && knocked === 0) {
      big = "GUTTER BALL";
      colour = "#ff9e9e";
      kind = "gutter";
      audio.play("groan");
    } else if (knocked === 0) {
      kind = "none";
      audio.play("groan");
    } else {
      kind = "some";
      floatText(this, W / 2, 460, `${knocked} PIN${knocked === 1 ? "" : "S"}`, "#ffffff", 44);
    }
    if (big) {
      const t = text(this, W / 2, 440, big, 72, { color: colour }).setDepth(97).setScale(0.3);
      this.tweens.add({ targets: t, scale: 1, duration: 300, ease: "Back.easeOut" });
      this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 300, onComplete: () => t.destroy() });
    }
    this.react(kind);

    if (after.over) {
      this.finished = true;
      audio.stopMusic();
      this.time.delayedCall(1800, () => this.finishGame());
      return;
    }
    this.time.delayedCall(1700, () => {
      // The fallen pins are swept away; a new frame (or a strike or spare in the tenth) gets a full rack.
      const standing = this.pins.filter((p) => !p.down);
      this.sweep(this.pins.filter((p) => p.down));
      if (after.standing === bowling.PINS) {
        for (const p of standing) p.img.destroy();
        this.pins = [];
        this.setRack(newRack());
      } else {
        this.pins = standing;
      }
      this.newTurkey();
    });
  }

  // After each throw the turkey pops up big from the bottom, pulling a face that fits the throw,
  // and says something about it.
  react(kind) {
    const face = { strike: "normal", turkey: "normal", spare: "normal", some: "dizzy", none: "scared", gutter: "oops" }[kind];
    const img = this.add.image(0, 0, `turkey-${face}`);
    img.setScale(230 / img.height);
    const card = this.add.container(W / 2, 700, [img]).setDepth(98).setScale(0.2);
    this.tweens.add({ targets: card, scale: 1, duration: 300, ease: "Back.easeOut" });
    this.tweens.add({ targets: card, scale: 0, alpha: 0, delay: 1150, duration: 220, ease: "Quad.easeIn", onComplete: () => card.destroy() });
    const saying = cast.randomSaying(kind);
    if (saying.text) {
      this.time.delayedCall(150, () => bubble(this, W / 2, 570, saying.text, 1000));
      const clip = cast.voiceClip(saying);
      if (clip) audio.playVoice(clip);
    }
    if (kind === "gutter" || kind === "none") audio.play("gobble");
  }

  sweep(pins) {
    for (const p of pins) {
      const img = p.img;
      p.img = null;
      this.tweens.add({ targets: img, alpha: 0, duration: 250, onComplete: () => img.destroy() });
    }
  }

  finishGame() {
    const score = bowling.score(this.throws);
    const result = store.recordRound(store.GAME_BOARD, score);
    this.scene.start("Results", {
      score, strikes: this.strikes, spares: this.spares, turkeys: this.turkeys, throws: this.throws,
      challenge: this.challenge, ...result,
    });
  }
}

