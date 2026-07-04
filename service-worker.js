/**
 * ILPG Service Worker
 * Strategi: Cache-first untuk aset statis, Network-first untuk API.
 * IndexedDB queue untuk data yang gagal dikirim saat offline.
 */

const SW_VERSION   = 'ilpg-v1.3';
const STATIC_CACHE = `${SW_VERSION}-static`;
const API_CACHE    = `${SW_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pages/login',
  '/pages/hrd-dashboard.html',
  '/pages/operator-dashboard.html',
  '/pages/driver-dashboard.html',
  '/pages/staff-dashboard.html',
  '/pages/absensi.html',
  '/pages/laporan.html',
  '/pages/users.html',
  '/pages/jadwal.html',
  '/pages/pangkalan.html',
  '/pages/pembayaran.html',
  '/pages/stok.html',
  '/pages/catatan.html',
  '/pages/tugas.html',
  '/pages/piket.html',
  '/pages/perusahaan.html',
  '/pages/monitoring.html',
  '/pages/register-pt.html',
  '/js/api.js',
  '/js/auth.js',
  '/js/camera.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/ui.js',
  '/js/hrd-dashboard.js',
  '/js/operator-dashboard.js',
  '/js/driver-dashboard.js',
  '/js/staff-dashboard.js',
  '/manifest.json',
];

// ============================================================
// INSTALL — cache aset statis
// ============================================================
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ============================================================
// ACTIVATE — hapus cache lama
// ============================================================
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH — strategi per jenis request
// ============================================================
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Abaikan chrome-extension dan non-http
  if (!url.protocol.startsWith('http')) return;

  // API calls (ke Google Apps Script) → Network-first, fallback ke cache
  if (url.hostname.includes('script.google.com')) {
    e.respondWith(networkFirstWithCache(request));
    return;
  }

  // Aset statis → Cache-first, fallback ke network
  e.respondWith(cacheFirstWithNetwork(request));
});

async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Jika offline dan tidak ada cache, return offline page
    const offlinePage = await caches.match('/index.html');
    return offlinePage || new Response('Offline - Tidak ada koneksi internet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({
      success: false, code: 503,
      message: 'Tidak ada koneksi internet. Data mungkin belum terbaru.',
      data: null,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

// ============================================================
// BACKGROUND SYNC — kirim data offline yang tertunda
// ============================================================
self.addEventListener('sync', (e) => {
  if (e.tag === 'ilpg-sync-queue') {
    e.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const db     = await openIDB();
  const tx     = db.transaction('sync_queue', 'readwrite');
  const store  = tx.objectStore('sync_queue');
  const items  = await idbGetAll(store);

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(item.body),
      });
      if (res.ok) {
        await idbDelete(store, item.id);
        // Notify client bahwa sync berhasil
        self.clients.matchAll().then(clients =>
          clients.forEach(c => c.postMessage({ type: 'SYNC_SUCCESS', item }))
        );
      }
    } catch (err) {
      // Masih offline, coba lagi nanti
      console.log('[SW] Sync gagal, akan dicoba ulang:', item.url);
    }
  }
  await tx.done;
}

// ============================================================
// PUSH NOTIFICATIONS (placeholder untuk future)
// ============================================================
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'ILPG', body: 'Ada notifikasi baru.' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'ILPG', {
      body: data.body,
      icon: '/assets/icon-192.png',
      badge: '/assets/icon-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});

// ============================================================
// IndexedDB helpers (minimal, digunakan oleh SW)
// ============================================================
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ilpg-offline', 2);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('draft_data')) {
        db.createObjectStore('draft_data', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbDelete(store, id) {
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
