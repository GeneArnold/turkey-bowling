// The sayings, loaded from sayings/sayings.json, and which voice clip goes with each.

let sayings = {};

export function setData(sayingsJson) {
  sayings = sayingsJson;
}

// A random saying of one kind ("strike", "gutter", ...), avoiding the one said last time.
const lastSaid = {};
export function randomSaying(kind) {
  const list = sayings[kind] || [];
  if (list.length === 0) return { text: "" };
  let pick = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1 && pick === lastSaid[kind]) pick = list[(list.indexOf(pick) + 1) % list.length];
  lastSaid[kind] = pick;
  return pick;
}

// The recorded clip of a saying, or null when it has not been recorded.
// Clips live at sayings/voices/<voice>/<saying id>.mp3; `voices` on a saying lists which exist.
export function voiceClip(saying) {
  const recorded = saying.voices || [];
  if (!saying.id || recorded.length === 0) return null;
  return `sayings/voices/${recorded[0]}/${saying.id}.mp3`;
}
