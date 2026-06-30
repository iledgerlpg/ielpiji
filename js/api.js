/**
 * ILPG Frontend — api.js
 * Klien API terpusat: semua request ke GAS backend melewati file ini.
 * Menangani: token injection, retry, offline queue, error parsing.
 */

const API = (() => {
  // ============================================================
  // CONFIG
  // ============================================================
  const BASE_URL = window.ILPG_CONFIG?.API_URL || 'https://script.google.com/macros/s/GANTI_DENGAN_DEPLOYMENT_ID/exec';

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================

  /** Ambil session dari localStorage */
  function getSession() {
    try { return JSON.parse(localStorage.getItem('ilpg_session') || 'null'); }
    catch { return null; }
  }

  /** Buat URL dengan query params */
  function buildUrl(path, params = {}) {
    const url = new URL(BASE_URL);
    url.searchParams.set('path', path.replace(/^\//, ''));
    const session = getSession();
    if (session?.token) url.searchParams.set('token', session.token);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  }

  /** Parse respons JSON dari GAS */
  async function parseResponse(res) {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { success: false, message: 'Respons server tidak valid.', data: null }; }
  }

  /** Cek apakah browser sedang online */
  function isOnline() { return navigator.onLine; }

  // ============================================================
  // CORE REQUEST
  // ============================================================

  /**
   * Lakukan GET request ke GAS API.
   * @param {string} path - API path (e.g. 'hrd/dashboard')
   * @param {Object} params - Query parameters
   */
  async function get(path, params = {}) {
    if (!isOnline()) {
      return { success: false, code: 503, message: 'Tidak ada koneksi. Data mungkin belum terbaru.', data: null };
    }
    try {
      const res = await fetch(buildUrl(path, params), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const data = await parseResponse(res);
      if (data.code === 401) { Auth.handleUnauthorized(); }
      return data;
    } catch (err) {
      return { success: false, code: 0, message: `Koneksi gagal: ${err.message}`, data: null };
    }
  }

  /**
   * Lakukan POST request ke GAS API.
   * @param {string} path - API path
   * @param {Object} body - Request body (akan disertakan token otomatis)
   * @param {Object} opts - { offlineQueue: true|false, queueType: string }
   */
  async function post(path, body = {}, opts = {}) {
    const session = getSession();
    const payload = { ...body };
    if (session?.token) payload._token = session.token;

    if (!isOnline()) {
      if (opts.offlineQueue) {
        await DB.queueRequest({ url: buildUrl(path), body: payload, type: opts.queueType || path });
        return { success: true, code: 202, message: 'Tersimpan offline. Akan dikirim otomatis saat online.', data: null };
      }
      return { success: false, code: 503, message: 'Tidak ada koneksi internet.', data: null };
    }

    try {
      const res = await fetch(buildUrl(path), {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payload),
      });
      const data = await parseResponse(res);
      if (data.code === 401) { Auth.handleUnauthorized(); }
      return data;
    } catch (err) {
      // Jika gagal karena offline, queue jika diminta
      if (opts.offlineQueue && !isOnline()) {
        await DB.queueRequest({ url: buildUrl(path), body: payload, type: opts.queueType || path });
        return { success: true, code: 202, message: 'Tersimpan offline. Akan dikirim saat online.', data: null };
      }
      return { success: false, code: 0, message: `Koneksi gagal: ${err.message}`, data: null };
    }
  }

  // ============================================================
  // UPLOAD GAMBAR
  // ============================================================

  /**
   * Upload gambar ke Google Drive via GAS.
   * @param {string} base64Image - Data URL atau pure base64
   * @param {string} imageType - ABSEN_MASUK | ABSEN_PULANG | PENGIRIMAN | RETUR | PANGKALAN | BUKTI_TF
   * @returns {Promise<{success: boolean, data: {file_url: string}}>}
   */
  async function uploadImage(base64Image, imageType) {
    return post('upload/image', { base64_image: base64Image, image_type: imageType });
  }

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================
  const auth = {
    registerPT:     (body) => post('auth/register-pt', body),
    login:          (body) => post('auth/login', body),
    logout:         ()     => post('auth/logout'),
    resetPassword:  (body) => post('auth/reset-password', body),
    confirmReset:   (body) => post('auth/confirm-reset', body),
  };

  // ============================================================
  // HRD ENDPOINTS
  // ============================================================
  const hrd = {
    getDashboard:       (p) => get('hrd/dashboard', p),
    getUsers:           (p) => get('hrd/users', p),
    createUser:         (b) => post('hrd/users', b),
    updateUser:         (b) => post('hrd/users/update', b),
    deleteUser:         (b) => post('hrd/users/delete', b),
    approveUser:        (b) => post('hrd/users/approve', b),
    getAbsensi:         (p) => get('hrd/absensi', p),
    getPerusahaan:      ()  => get('hrd/perusahaan'),
    updatePerusahaan:   (b) => post('hrd/perusahaan', b),
    getTugasAdmin:      (p) => get('hrd/tugas-admin', p),
    createTugasAdmin:   (b) => post('hrd/tugas-admin', b),
    getJadwalPiket:     (p) => get('hrd/jadwal-piket', p),
    createJadwalPiket:  (b) => post('hrd/jadwal-piket', b),
    getCatatan:         (p) => get('hrd/catatan', p),
    createCatatan:      (b) => post('hrd/catatan', b),
  };

  // ============================================================
  // OPERATOR ENDPOINTS
  // ============================================================
  const operator = {
    getDashboard:              (p) => get('operator/dashboard', p),
    getJadwalHarian:           (p) => get('operator/jadwal-harian', p),
    createJadwalHarian:        (b) => post('operator/jadwal-harian', b),
    updateJadwalHarian:        (b) => post('operator/jadwal-harian/update', b),
    deleteJadwalHarian:        (b) => post('operator/jadwal-harian/delete', b),
    importJadwalHarian:        (b) => post('operator/jadwal-harian/import', b),
    getMasterSA:               (p) => get('operator/master-sa', p),
    importMasterSA:            (b) => post('operator/master-sa/import', b),
    getLaporanPengiriman:      (p) => get('operator/laporan-pengiriman', p),
    updateLaporanPengiriman:   (b) => post('operator/laporan-pengiriman/update', b),
    deleteLaporanPengiriman:   (b) => post('operator/laporan-pengiriman/delete', b),
    getMonitoringPengiriman:   (p) => get('operator/monitoring-pengiriman', p),
    getPembayaranRefill:       (p) => get('operator/pembayaran-refill', p),
    createPembayaranRefill:    (b) => post('operator/pembayaran-refill', b),
    getPembayaranBagiHasil:    (p) => get('operator/pembayaran-bagi-hasil', p),
    createPembayaranBagiHasil: (b) => post('operator/pembayaran-bagi-hasil', b),
    getMonitoringPembayaran:   (p) => get('operator/monitoring-pembayaran', p),
    getStokGudang:             (p) => get('operator/stok-gudang', p),
    createPembelianStok:       (b) => post('operator/pembelian-stok', b),
    updatePembelianStok:       (b) => post('operator/pembelian-stok/update', b),
    deletePembelianStok:       (b) => post('operator/pembelian-stok/delete', b),
    getPangkalan:              (p) => get('operator/pangkalan', p),
    createPangkalan:           (b) => post('operator/pangkalan', b),
    updatePangkalan:           (b) => post('operator/pangkalan/update', b),
    deletePangkalan:           (b) => post('operator/pangkalan/delete', b),
    importPangkalan:           (b) => post('operator/pangkalan/import', b),
    getSPBE:                   (p) => get('operator/spbe', p),
    createSPBE:                (b) => post('operator/spbe', b),
    updateSPBE:                (b) => post('operator/spbe/update', b),
    deleteSPBE:                (b) => post('operator/spbe/delete', b),
  };

  // ============================================================
  // DRIVER ENDPOINTS
  // ============================================================
  const driver = {
    getDashboard:           ()  => get('driver/dashboard'),
    absenMasuk:             (b) => post('driver/absen-masuk', b, { offlineQueue: true, queueType: 'ABSEN_MASUK' }),
    absenPulang:            (b) => post('driver/absen-pulang', b, { offlineQueue: true, queueType: 'ABSEN_PULANG' }),
    getJadwalSaya:          (p) => get('driver/jadwal-saya', p),
    getJadwalGlobal:        (p) => get('driver/jadwal-global', p),
    submitLaporan:          (b) => post('driver/laporan-pengiriman', b, { offlineQueue: true, queueType: 'LAPORAN' }),
    getRiwayatLaporan:      (p) => get('driver/riwayat-laporan', p),
  };

  // ============================================================
  // STAFF ENDPOINTS
  // ============================================================
  const staff = {
    getDashboard:           ()  => get('staff/dashboard'),
    absenMasuk:             (b) => post('staff/absen-masuk', b, { offlineQueue: true, queueType: 'ABSEN_MASUK' }),
    absenPulang:            (b) => post('staff/absen-pulang', b, { offlineQueue: true, queueType: 'ABSEN_PULANG' }),
    getTugas:               (p) => get('staff/tugas', p),
    updateStatusTugas:      (b) => post('staff/tugas/update-status', b),
    getCatatan:             (p) => get('staff/catatan', p),
    createCatatan:          (b) => post('staff/catatan', b),
    getJadwalPiket:         (p) => get('staff/jadwal-piket', p),
  };

  return { get, post, uploadImage, auth, hrd, operator, driver, staff };
})();

// Expose ke window
window.API = API;
