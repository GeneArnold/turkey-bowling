// The service worker: on the first visit it stores every file of the game on the phone, and from
// then on it answers from that copy, so the game starts with no internet at all. Voice clips are read
// from sayings.json, so adding a clip needs no change here.
// VERSION must change whenever any file changes; the next online visit then fetches the new copy.
// Amplify does that on every release (amplify.yml stamps in the commit); "dev" is for local runs.
const VERSION = "turkey-bowling-dev";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "vendor/phaser.min.js",
  "js/main.js",
  "js/audio.js",
  "js/bowling.js",
  "js/cast.js",
  "js/config.js",
  "js/flick.js",
  "js/gestures.js",
  "js/install.js",
  "js/lane.js",
  "js/share.js",
  "js/sheet.js",
  "js/storage.js",
  "js/textures.js",
  "js/ui.js",
  "js/update.js",
  "js/version.js",
  "js/yard.js",
  "js/scenes/BoardScene.js",
  "js/scenes/BootScene.js",
  "js/scenes/NameScene.js",
  "js/scenes/PlayScene.js",
  "js/scenes/ResultsScene.js",
  "js/scenes/TitleScene.js",
  "sayings/sayings.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  // the cartoon art (tools/art-prompts.py)
  "img/bg-yard.jpg",
  "img/pin.png",
  "img/turkey-dizzy.png",
  "img/turkey-normal.png",
  "img/turkey-oops.png",
  "img/turkey-scared.png",
];

async function mediaFiles() {
  const sayings = await (await fetch("sayings/sayings.json", { cache: "no-store" })).json();
  return Object.values(sayings)
    .filter(Array.isArray)
    .flat()
    .flatMap((s) => (s.voices || []).map((v) => `sayings/voices/${v}/${s.id}.mp3`));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll([...FILES, ...(await mediaFiles())]);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: the stored copy answers at once, online or not.
self.addEventListener("fetch", (event) => {
  // Only the game's own files; the family score service must always be asked fresh.
  // version.json, which says whether a newer release is out, is never answered from the stored copy.
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("/version.json")) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)),
  );
});
