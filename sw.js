var cacheName = 'aura-weather-v9.1';
var filesToCache = ['./', './index.html', './style.css', './script.js', './manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
  }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) return caches.delete(key);
      }));
  }));
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
  }));
});
