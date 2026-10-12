/* sw.js — service worker ทำนายฝน v1.2
   shell: cache-first (เปิดแอปออฟไลน์ได้) · API/แผนที่: network-first (ข้อมูลสดเป็นหลัก) */
const C='rain-v1.2';
const SHELL=['./','index.html','style.css','manifest.json','icon-192.png','icon-512.png'];
const LIVE=[/api\.open-meteo\.com/,/geocoding-api\.open-meteo\.com/,/nominatim\.openstreetmap\.org/,/tile\.openstreetmap\.org/];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(LIVE.some(r=>r.test(url.hostname))){
  // network-first + cache สำรองตอนออฟไลน์
  e.respondWith(fetch(e.request).then(r=>{
   const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;
  }).catch(()=>caches.match(e.request)));
 }else if(url.origin===location.origin){
  // shell: cache-first แล้วดึงเน็ตมาอัปเดต cache
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
   const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;
  })));
 }
});
