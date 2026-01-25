// AURA WEATHER SERVICE WORKER V2.1
// Durch Ändern dieses Namens zwingen wir das Tablet zum Update:
var cacheName = 'aura-weather-v2.1-hybrid';

var filesToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './logo.png'
];

self.addEventListener('install', function(e) {
  // Alten Cache sofort ersetzen
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  // Alte Caches löschen, die nicht mehr aktuell sind
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
      // Entweder aus dem Cache laden ODER neu aus dem Netz holen
      return response || fetch(e.request);
    })
  );
});