/**
 * ILPG Frontend — db.js
 * IndexedDB wrapper untuk penyimpanan offline dan antrian sinkronisasi.
 * Digunakan oleh Driver saat lapor pengiriman tanpa koneksi.
 */

const DB = (() => {
  const DB_NAME    = 'ilpg-offline';
  const DB_VERSION = 2;
  let _db = null;

  // ============================================================
  // OPEN / INIT
  // ============================================================

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sync_queue')) {
          const s = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          s.createIndex('by_type',   'type',   { unique: false });
          s.createIndex('by_status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('draft_data')) {
          db.createObjectStore('draft_data', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror   = () => reject(req.error);
    });
  }

  // ============================================================
  // SYNC QUEUE — antrian request yang gagal/offline
  // ============================================================

  /** Tambahkan request ke antrian sinkronisasi */
  async function queueRequest(item) {
    const db    = await open();
    const tx    = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    return new Promise((resolve, reject) => {
      const req = store.add({
        ...item,
        status:     'PENDING',
        created_at: new Date().toISOString(),
        attempts:   0,
      });
      req.onsuccess = () => {
        resolve(req.result);
        // Daftarkan background sync jika tersedia
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then(sw => sw.sync.register('ilpg-sync-queue')).catch(() => {});
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** Ambil semua item antrian */
  async function getQueue() {
    const db    = await open();
    const tx    = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  /** Hapus item dari antrian setelah berhasil terkirim */
  async function removeFromQueue(id) {
    const db    = await open();
    const tx    = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /** Update status item di antrian */
  async function updateQueueItem(id, updates) {
    const db    = await open();
    const tx    = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item   = getReq.result;
        const putReq = store.put({ ...item, ...updates });
        putReq.onsuccess = () => resolve();
        putReq.onerror   = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /** Hitung jumlah item pending */
  async function getQueueCount() {
    const items = await getQueue();
    return items.filter(i => i.status === 'PENDING').length;
  }

  // ============================================================
  // DRAFT DATA — simpan data form sementara
  // ============================================================

  async function saveDraft(key, data) {
    const db    = await open();
    const tx    = db.transaction('draft_data', 'readwrite');
    const store = tx.objectStore('draft_data');
    return new Promise((resolve, reject) => {
      const req = store.put({ key, data, saved_at: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async function getDraft(key) {
    const db    = await open();
    const tx    = db.transaction('draft_data', 'readonly');
    const store = tx.objectStore('draft_data');
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror   = () => reject(req.error);
    });
  }

  async function deleteDraft(key) {
    const db    = await open();
    const tx    = db.transaction('draft_data', 'readwrite');
    const store = tx.objectStore('draft_data');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  // ============================================================
  // MANUAL SYNC — jalankan dari foreground saat online kembali
  // ============================================================

  async function flushQueue() {
    if (!navigator.onLine) return { flushed: 0, failed: 0 };
    const items = await getQueue();
    const pending = items.filter(i => i.status === 'PENDING');
    let flushed = 0, failed = 0;

    for (const item of pending) {
      try {
        await updateQueueItem(item.id, { status: 'SENDING', attempts: (item.attempts || 0) + 1 });
        const res  = await fetch(item.url, {
          method:  'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body:    JSON.stringify(item.body),
        });
        const data = await res.json();
        if (data.success) {
          await removeFromQueue(item.id);
          flushed++;
        } else {
          await updateQueueItem(item.id, { status: 'FAILED', error: data.message });
          failed++;
        }
      } catch (err) {
        await updateQueueItem(item.id, { status: 'PENDING', error: err.message });
        failed++;
      }
    }
    return { flushed, failed };
  }

  return {
    open,
    queueRequest, getQueue, removeFromQueue, updateQueueItem, getQueueCount,
    saveDraft, getDraft, deleteDraft,
    flushQueue,
  };
})();

window.DB = DB;
