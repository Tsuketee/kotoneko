// Service worker: ทำให้แอปเปิดได้ตอนออฟไลน์
// ⚠️ ทุกครั้งที่แก้ไฟล์แล้วจะปล่อยเวอร์ชันใหม่ ให้เพิ่มเลข VERSION ไม่งั้นเครื่องผู้ใช้จะยังเห็นไฟล์เก่า
const VERSION = 'v92';
const CACHE = 'kotoneko-' + VERSION;
const FILES = [
  './',
  'index.html',
  'about.html',
  'privacy.html',
  'terms.html',
  'css/style.css',
  'fonts/mali-thai-600-normal.woff2',
  'fonts/mali-latin-600-normal.woff2',
  'fonts/mali-thai-700-normal.woff2',
  'fonts/mali-latin-700-normal.woff2',
  'fonts/anuphan-thai-400-normal.woff2',
  'fonts/anuphan-latin-400-normal.woff2',
  'fonts/anuphan-thai-600-normal.woff2',
  'fonts/anuphan-latin-600-normal.woff2',
  'js/data/kanji-n5.js',
  'js/data/content.js',
  'js/data/strokes.js',
  'js/data/kana.js',
  'js/data/examples.js',
  'js/data/mnemonics.js',
  'js/data/pet-lines.js',
  'js/data/grammar.js',
  'js/data/places.js',
  'js/data/cloud-config.js',
  'js/level.js',
  'js/core.js',
  'js/learn.js',
  'js/dialogue.js',
  'js/write.js',
  'js/pixelcat.js',
  'js/pet.js',
  'js/place.js',
  'js/profile.js',
  'js/shop.js',
  'js/grammar.js',
  'js/stats.js',
  'js/cloud.js',
  'js/packs.js',
  'js/main.js',
  'manifest.webmanifest',
  'img/home.jpg',
  'img/kanji.jpg',
  'img/stats.jpg',
  'icons/icon.svg',
  'icons/apple-touch-icon-v2.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return; // คำขอไปคลาวด์ (Supabase) ห้ามแคช ให้ไปเน็ตตรงๆ
  // หน้าแอปที่มี ?… ต่อท้าย (เช่นกลับจากหน้าชำระเงิน ?paid=n4) ใช้ index.html ตัวเดียวกันในแคช
  e.respondWith(caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then(hit => hit || fetch(e.request)));
});
