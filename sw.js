// Gem Drop service worker: the game shell is precached on install so the
// game launches offline; everything else is cached the first time it loads.
const VERSION='gemdrop-v0.9.0-1';
const CORE=[
  './',
  'index.html',
  'styles.css',
  'game.js',
  'meta.js',
  'native.js',
  'reactive-gem-system.js',
  'manifest.webmanifest',
  'icon.svg',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'vendor/phaser-3.90.0.min.js',
  'vendor/lucide-0.468.0.min.js',
  'vendor/fonts/fonts.css',
  'vendor/fonts/cinzel-decorative-latin-700-normal.woff2',
  'vendor/fonts/cinzel-decorative-latin-900-normal.woff2',
  'vendor/fonts/fredoka-latin-600-normal.woff2',
  'vendor/fonts/fredoka-latin-700-normal.woff2',
  'vendor/fonts/manrope-latin-600-normal.woff2',
  'vendor/fonts/manrope-latin-700-normal.woff2',
  'vendor/fonts/manrope-latin-800-normal.woff2',
  'gems/reactive/01_rectangular.svg',
  'gems/reactive/02_circular_starcut.svg',
  'gems/reactive/03_emerald_stepcut.svg',
  'gems/reactive/04_rectangular_brilliant.svg',
  'gems/reactive/05_heart.svg',
  'gems/reactive/06_tanzanite.svg',
  'assets/audio/ding.ogg',
  'assets/treasures/chest-closed.png',
  'assets/treasures/chest-open.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(VERSION)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  // Pages: network first so updates arrive, cache when offline.
  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(VERSION).then(cache=>cache.put(request,copy));
          return response;
        })
        .catch(()=>caches.match(request,{ignoreSearch:true}).then(hit=>hit||caches.match('index.html')))
    );
    return;
  }

  // Everything else: cache first (versioned ?v= URLs make this safe), then
  // network, and remember what we fetched. Offline, ignore the ?v= query.
  event.respondWith(
    caches.match(request).then(hit=>{
      if(hit) return hit;
      return fetch(request)
        .then(response=>{
          if(response&&response.ok&&response.type==='basic'){
            const copy=response.clone();
            caches.open(VERSION).then(cache=>cache.put(request,copy));
          }
          return response;
        })
        .catch(()=>caches.match(request,{ignoreSearch:true}));
    })
  );
});
