// OP Site Management - Office v1.5.6
// Fast startup: serve the last app shell immediately, then refresh it in background.
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

    // Start the network update immediately, but do not make the user wait for it.
    const update = fetch(INDEX_URL, { cache: 'no-store' }).then(async response => {
      if (response && response.ok) await cache.put(INDEX_URL, response.clone());
      return response;
    }).catch(() => null);
    event.waitUntil(update.then(() => undefined));

    // Normal case: instant local launch. New code is ready for the next launch.
    if (cached) return cached;

    // First controlled launch only: no shell cached yet, so use network.
    const fresh = await update;
    if (fresh) return fresh;
    return new Response('OP Site Management - Office is offline. Reopen once online to prepare offline startup.', {
      status: 503,
      headers: {'Content-Type':'text/plain; charset=utf-8'}
    });
  })());
});
