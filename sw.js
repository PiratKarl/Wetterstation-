// AURA WEATHER SERVICE WORKER V2.9 - TICKER TALK EDITION
// Das Hochsetzen der Version zwingt das Tablet, alle Dateien neu zu laden.
var cacheName = 'aura-weather-v2.9-ticker-talk';

// Hier listen wir alles auf, was "unkaputtbar" auf dem Tablet liegen soll:
var filesToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo.png',
  // Hier die gängigsten Wetter-Icons, damit sie offline funktionieren:
  './01d.gif', './01n.gif',
  './02d.gif', './02n.gif',
  './03d.gif', './03n.gif',
  './04d.gif', './04n.gif',
  './09d.gif', './09n.gif',
  './10d.gif', './10n.gif',
  './11d.gif', './11n.gif',
  './13d.gif', './13n.gif',
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
      // Priorität: Cache (blitzschnell), falls nicht da: Netzwerk.
      return response || fetch(e.request);
    })
  );
});
