const VERSION = 'nile-fern-v1';
const SHELL = ['/','/offline.html','/mark.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION+'-assets').then(cache=>cache.addAll(SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('nile-fern-')&&!key.startsWith(VERSION)).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  const request=event.request;const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/operator-studio')||url.pathname.startsWith('/api/')||url.pathname.includes('/functions/'))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok){const cache=await caches.open(VERSION+'-pages');await cache.put(request,response.clone());}return response;}catch{return await caches.match(request)||await caches.match('/')||await caches.match('/offline.html');}})());return;
  }
  if(/^\/(assets|fonts|images|icons)\//.test(url.pathname)||['/mark.svg','/manifest.webmanifest'].includes(url.pathname))event.respondWith((async()=>{const saved=await caches.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok){const cache=await caches.open(VERSION+'-assets');await cache.put(request,response.clone());}return response;})());
});
