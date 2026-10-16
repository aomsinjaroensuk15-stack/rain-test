/* sw.js — ทำนายฝน v1.4
   shell (index.html, css, manifest, ไอคอน): STALE-WHILE-REVALIDATE
     → ตอบของ cache ทันทีให้เร็ว แต่ดึงเน็ตเบื้องหลังอัปเดต cache เสมอ (แก้บั๊กติดเวอร์ชันเก่าถาวร)
   API (open-meteo, nominatim): NETWORK-FIRST → ออฟไลน์ค่อยใช้ cache
   tile แผนที่: ไม่เก็บ cache (กันพื้นที่บวม) */
const C='rain-v1.4'; // ← ทุกครั้งที่แก้ไฟล์ shell ให้ bump เวอร์ชันนี้
const SHELL=['./','index.html','style.css','manifest.json','icon-192.png','icon-512.png'];
const APIH=/api\.open-meteo\.com|geocoding-api\.open-meteo\.com|nominatim\.openstreetmap\.org/;

self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.pathname.endsWith('sw.js'))return; // อย่า cache ตัวเอง เด็ดขาด (กันอัปเดตตัวเองไม่ได้)
 if(APIH.test(url.hostname)){ // API: network-first
  e.respondWith(fetch(e.request).then(r=>{
   if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}
   return r;
  }).catch(()=>caches.match(e.request)));
 }else if(url.origin===location.origin){ // shell: stale-while-revalidate
  e.respondWith(caches.match(e.request).then(hit=>{
   const net=fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit);
   return hit||net;
  }));
 }
 // tile.openstreetmap.org ตกไป default: ไม่ cache
});
