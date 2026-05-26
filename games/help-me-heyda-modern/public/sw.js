const CACHE_NAME = "help-me-heyda-2026-v38";
const ASSETS = [
  "./index.html",
  "./report.html",
  "../src/styles.css",
  "../src/game2026.js",
  "./manifest.webmanifest",
  "./assets/title_modi.png",
  "./assets/title_bgm.mp3",
  "./assets/icon.png",
  "./assets/background-forest-2026.png",
  "./assets/nomal_game_bgm.mp3",
  "./assets/menu-dial-2026.png",
  "./assets/main_menu_bgm.mp3",
  "./assets/ChatGPT Image 2026년 5월 22일 오후 12_00_32.png",
  "./assets/menu_storymode.png",
  "./assets/menu_survivalmode.png",
  "./assets/menu_guide.png",
  "./assets/menu_setting.png",
  "./assets/story1.png",
  "./assets/story2.png",
  "./assets/story3.png",
  "./assets/story4.png",
  "./assets/chapter1-boss-intro.png",
  "./assets/heyda-idle.png",
  "./assets/heyda-push.png",
  "./assets/heyda-action.png",
  "./assets/block-leaf.png",
  "./assets/block-sun.png",
  "./assets/block-wave.png",
  "./assets/block-mountain.png",
  "./assets/block-fire.png",
  "./assets/block-cloud.png",
  "./assets/block-moon.png",
  "./assets/block-rain.png",
  "./assets/block-snow.png",
  "./assets/block-wind.png",
  "./assets/clear-screen.png",
  "./assets/ChatGPT Image 2026년 5월 22일 오후 01_30_42 (2).png",
  "./assets/totem-guardian.png",
  "./assets/tent.png",
  "./assets/buldoder.png",
  "./assets/asu.png",
  "./assets/boss-flag-supervisor.png",
  "./assets/boss-red-flag-marker.png",
  "./assets/bgm-chapter1-boss.mp3",
  "./assets/sfx-boss-warning.mp3",
  "./assets/sfx-boss-defeat.mp3",
  "./assets/button_click.mp3",
  "./assets/menu_select.mp3",
  "./assets/block_sliding.mp3",
  "./assets/block_matching.mp3",
  "./assets/nomal_stage_clear.mp3",
  "./assets/game_over.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
