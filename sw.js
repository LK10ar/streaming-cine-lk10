/* Ciné LK10 — service worker minimal : rend le site installable (« Ajouter à l'écran d'accueil »).
   Il ne met RIEN en cache : le site reste toujours à jour, comme avant. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () { /* réseau direct */ });
