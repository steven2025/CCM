/* v31: interactive chapter HTML; cache ONLY the neutral offline explanation page. */
'use strict';
const BASE = new URL('./', self.location.href);
const CACHE_PREFIX = 'ccm-pwa-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE_NAME = CACHE_PREFIX + 'v31';
const OFFLINE_URL = new URL('offline.html', BASE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(OFFLINE_URL, { cache: 'reload' });
    if (!response.ok) throw new Error('CCM offline page unavailable');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(OFFLINE_URL, response);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Never intercept API/COS requests, credentials, POSTs, media or other apps.
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== BASE.origin) return;
  if (url.pathname !== BASE.pathname && url.pathname !== new URL('index.html', BASE).pathname) return;
  event.respondWith((async () => {
    try {
      // Do not save the course HTML or silently serve an old version.
      return await fetch(request, { cache: 'no-store' });
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(OFFLINE_URL) || new Response('网络不可用 / Internet connection required', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
