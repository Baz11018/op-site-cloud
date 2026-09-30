// OP Site Management - Office v1.5.23
// Instant launch from local shell; refresh shell in background for the next launch.
const SHELL_CACHE = 'op-site-office-shell';
const INDEX_URL = new URL('./index.html', self.location).href;

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isNavigation = req.mode === 'navigate';
  const isIndex = url.href === INDEX_URL || (url.origin === self.location.origin && url.pathname.endsWith('/index.html'));
  if (!isNavigation && !isIndex) return;

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(INDEX_URL);

    const updatePromise = fetch(INDEX_URL, {cache:'no-store'}).then(async response => {
      if (response && response.ok) await cache.put(INDEX_URL, response.clone());
      return response;
    }).catch(() => null);

    event.waitUntil(updatePromise.then(() => undefined));

    if (cached) return cached;
    const fresh = await updatePromise;
    if (fresh) return fresh;
    return new Response('OP Site Management - Office is offline. Reopen once online to prepare offline startup.', {
      status:503,
      headers:{'Content-Type':'text/plain; charset=utf-8'}
    });
  })());
});
