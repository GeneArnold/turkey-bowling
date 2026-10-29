# Turkey Bowling

A Fun Shed game for Thanksgiving 2026, started 2026-10-28: swipe a round cartoon turkey up the
driveway at a rack of bowling pins, ten-pin bowling style.

## What Gene decided (2026-10-28)

- Release: **Monday Nov 16, 2026** (moved up from Nov 30 by Gene on 2026-10-29; the calendar is
  `/mnt/storage/Workspace/thefunshed/wiki/calendar.md`). Address: `bowling.thefunshed.com`
  (`turkey.` is Turkey Escape's).
- 10 frames, real scoring (strikes, spares, the tenth's bonus throws). Three strikes in a row is a
  "TURKEY!" with a fanfare.
- View from high above, everything on one screen (changed 2026-10-28 after looking at old Atari /
  Intellivision / arcade bowling games: the whole rack must read at a glance). The background is
  driveway "D" (`img/bg-yard.jpg`, from `art/source/gen/bg-yard-4.png`); `VIEW` in `js/lane.js` is
  fitted to its edges.
- The ball is a **live cartoon turkey tucked into a round ball**, not a frozen one ("we're bowling
  the big round turkey and the turkey could make funny faces"). The turkey on the lane is small;
  after each throw a big turkey face pops up with the result (happy, dizzy, scared, embarrassed).
- Pins: classic white bowling pins in Thanksgiving colours (`img/pin.png`), "simple, easy to change
  later". Gene: "make the game work like real bowling": pins wobble, fall into each other, and a
  standing pin never moves. Lawn ornaments (they piled into a cluster) and pumpkins (they got pushed,
  not knocked over) were tried and dropped.
- Swipe sets aim and power only. No curve or spin.
- Off the side of the driveway is a gutter ball: into the hedge with a gag line.
- Spoken lines: one squawky turkey voice (Chatterbox "Henry.wav", sped up 1.25x), recorded by
  `node tools/make-voices.mjs` into `sayings/voices/v0/`.
- Music: "Turkey in the Straw" (traditional, public domain), notes from thesession.org/tunes/2638
  setting 1, in `SONGS` in `js/audio.js`. Plays during a game.
- Results screen (2026-10-29): Turkey Escape's layout, which Gene made the Fun Shed standard: a wood sign
  (`woodSign` in `js/ui.js`) holding the score and headline, then the score sheet, a dark box with
  Strikes / Spares / Turkeys rows, PLAY AGAIN, TRASH TALK, and SCORES and MENU side by side.
- Shared screens follow the Fun Shed house kit (`/mnt/storage/Workspace/thefunshed/wiki/kit.md`,
  applied **kit v1.4** on 2026-10-29; Turkey Escape is the reference): ▶ BOWL! / HIGH SCORES on the title,
  Pause with KEEP BOWLING / SOUND / QUIT (QUIT ends the game and saves the score so far), the
  results screen (🎳 BOWL AGAIN), BACK on high scores, buttons over swipes, the "how to install" link to
  thefunshed.com/install. Kit changes are suggestions, not orders (Gene, 2026-10-29): when funshed sends one,
  reply yes / yes with changes / no with the reason; Gene decides. Our exceptions (no day card, the
  score sheet on Results) are listed in the kit. Our own ideas go to funshed as suggestions. The kit sets
  layout and function; the look and words are the game's own (kit v1.4): bowling's sign is a slab of
  polished lane (`laneSign` in `js/ui.js`: maple boards, aiming arrows), not Turkey Escape's barn wood.
  **Next time `js/ui.js` is touched:** copy the reference ui.js (it has the `THEME` hook, used by
  `text()`, `button()` and NameScene) and keep our own pieces (`laneSign`, `autumnSky`, `leaffall`,
  `bubble`, ...) below a `// game-only` line, so the shared part matches every game. No day card: bowling
  has no days.
- **Scores are phone-only** (Gene, 2026-10-29, kit v1.2: cheat bots and rude initials on open-source
  games). No online code at all; each phone keeps its own top 10. The only thing sent is `&app=1` on the
  `version.json` check when played from the home screen. TRASH TALK is the social part.
- Icon: the grinning turkey on orange (`python3 tools/make-icons.py art/source/big/turkey.png`).

## How it works

- `js/bowling.js`: the rules, pure (`node tools/test-bowling.mjs`).
- `js/lane.js`: the driveway in inches (x across, z away), the perspective (`VIEW`), and the
  physics (`node tools/test-lane.mjs` rolls hundreds of throws). A hit pin falls (hard) or wobbles
  (soft, and may wobble over); a falling pin knocks down pins within its length, domino style; a
  fallen pin slides and can hit standing ones. Tuning lives in `LANE` (`knock`, `pinLength`, ...).
- `js/scenes/PlayScene.js`: the swipe (slide the turkey sideways at the bottom, flick up), aim help
  (`AIM_DAMP`, `ASSIST_IN`), the score sheet, pause, the end of a throw.
- `js/yard.js`: the background drawn in code until `img/bg-yard.jpg` exists.
- `js/textures.js`: stand-in art drawn in code for any `img/` picture that's missing.
- Shared with Fruitcake (copied, not linked): update/version/install, gestures, flick, storage,
  share, audio, NameScene.
- `js/sheet.js`: the score sheet, on play and on the results screen.

## Testing

`python3 tools/serve.py` serves on port **8794**: http://192.168.40.235:8794/ from the phone.
Keep it running the whole time the session is open, so Gene can test on his phone anytime (Gene,
2026-10-29): start it when the session starts, restart it if it stops, and never change the port (the
list is in `/mnt/storage/Workspace/thefunshed/wiki/games.md` › Test addresses).
In the test browser, `game.loop.sleep()` then `game.step(t, 16)` to fast-forward; the PlayScene
has `roll({ dirX, dirY, power })` to throw from code.

## Art

Prompts are in `tools/art-prompts.py` (turkey sheet, pins one per picture, yard background).
Tries land in `art/source/gen/` (gitignored); show Gene a lettered choice page before wiring
anything in. Cut out with `tools/cutout.py`.

## Gene's rules

- AWS only (Amplify, Route 53). Commit and push only when Gene asks; a push to `main` is a release.
- Free, no ads, MIT. Keep `art/source/` gitignored. No real people's photos.
- Simple and amusing, not amazing. Plain buttons with words; cut confusing things rather than
  explain them.

## Going live

1. GitHub repo GeneArnold/turkey-bowling (public).
2. Gene creates an Amplify app in the Entertainment AWS account (Ohio), Gen2 Backend unticked.
3. The funshed session attaches `bowling.thefunshed.com` and adds the home page card (`homeUrl` in
   `js/config.js` already points there).
