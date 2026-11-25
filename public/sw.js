// Cleanup script to ensure any legacy service workers unregister silently without reloads
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.unregister()
  );
});
