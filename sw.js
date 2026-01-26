// AURA WEATHER SERVICE WORKER V3.1
// VERSION ERHÖHT -> ZWINGT TABLET ZUM UPDATE
var cacheName = 'aura-weather-v3.1-fix-gear';

var filesToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo.png',
  './01d.gif', './01n.gif', './02d.gif', './02n.gif',
  './03d.gif', './03n.gif', './04d.gif', './04n.gif',
  './09d.gif', './09n.gif', './10d.gif', './10n.gif',
  './11d.gif', './11n.gif', './13d.gif', './13n.gif',
  './50d.gif', './50n.gif'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});