// The bowling score sheet: ten boxes across, each with its throws (X, /, -, numbers) on top and the
// running total below. Drawn across the top of play, and on the results screen.
import * as bowling from "./bowling.js";
import { W, text } from "./ui.js";

export const SHEET_H = 74;

export class ScoreSheet {
  constructor(scene, y, depth = 95) {
    this.y = y;
    const g = scene.add.graphics().setDepth(depth);
    g.fillStyle(0xfff8e8, 0.95);
    g.fillRect(0, y, W, SHEET_H);
    g.lineStyle(2, 0x2b1608);
    const cell = W / bowling.FRAMES;
    for (let f = 0; f < bowling.FRAMES; f++) {
      g.strokeRect(f * cell, y, cell, SHEET_H);
      g.lineBetween(f * cell, y + 34, (f + 1) * cell, y + 34);
    }
    this.highlight = scene.add.graphics().setDepth(depth);
    const style = { color: "#2b1608", strokeThickness: 0 };
    this.marks = [];
    this.totals = [];
    for (let f = 0; f < bowling.FRAMES; f++) {
      this.marks.push(text(scene, (f + 0.5) * cell, y + 17, "", 18, style).setDepth(depth + 1));
      this.totals.push(text(scene, (f + 0.5) * cell, y + 54, "", 20, style).setDepth(depth + 1));
    }
  }

  // Fills in the throws so far; `current` (a frame number, or null) is shaded as the one being bowled.
  update(throws, current = null) {
    const fs = bowling.frames(throws);
    const totals = bowling.totals(throws);
    for (let f = 0; f < bowling.FRAMES; f++) {
      this.marks[f].setText(fs[f] ? bowling.marks(fs[f], f === bowling.FRAMES - 1).join(" ") : "");
      this.totals[f].setText(totals[f] != null ? String(totals[f]) : "");
    }
    const cell = W / bowling.FRAMES;
    this.highlight.clear();
    if (current != null) {
      this.highlight.fillStyle(0xffd166, 0.55);
      this.highlight.fillRect(current * cell + 1, this.y + 1, cell - 2, SHEET_H - 2);
    }
  }
}
