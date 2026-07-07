/**
 * ILPG Frontend — driver-dashboard.js
 * Semua logika Driver/Kernet: dashboard, absensi (foto kamera depan + GPS anti-fake),
 * jadwal harian, laporan pengiriman (3 foto + GPS), dan riwayat.
 */

const SESSION = Auth.guard(['DRIVER', 'KERNET']);
if (!SESSION) throw new Error('Unauthorized');

let activeSection  = 'dashboard';
let capturedPhotos = {}; // { ABSEN_MASUK, ABSEN_PULANG, PENGIRIMAN, RETUR, PANGKALAN }
let currentGPS     = null;
let pangkalanList  = [];

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',         icon: 'home' },
  { id: 'absensi',    label: 'Absensi',            icon: 'clock' },
  { id: 'jadwal',     label: 'Jadwal Saya',        icon: 'list' },
  { id: 'jadwal-all', label: 'Jadwal Semua',       icon: 'globe' },
  { id: 'laporan',    label: 'Laporan Pengiriman', icon: 'truck' },
  { id: 'riwayat',    label: 'Riwayat Laporan',   icon: 'history' },
];

const ICONS = {
  home:    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  clock:   '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  list:    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
  globe:   '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>',
  truck:   '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m8-11h3l3 5v4h-3m-3 1H9m0-10v10"/></svg>',
  history: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  UI.init();
  document.getElementById('topbar-title').textContent = 'Driver Dashboard';
  showSection('dashboard');
  prefetchPangkalan();
});

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS.map(n => `
    <button class="nav-item w-full text-left" id="nav-${n.id}" onclick="showSection('${n.id}')">
      ${ICONS[n.icon] || ''}
      <span class="nav-label">${n.label}</span>
    </button>`).join('');
}

function showSection(id) {
  activeSection = id;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${id}`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = NAV_ITEMS.find(n => n.id === id)?.label || 'Driver';

  const loaders = {
    dashboard:  loadDashboard,
    absensi:    loadAbsensi,
    jadwal:     loadJadwalSaya,
    'jadwal-all': loadJadwalGlobal,
    laporan:    loadFormLaporan,
    riwayat:    loadRiwayat,
  };
  if (loaders[id]) loaders[id]();
}

async function prefetchPangkalan() {
  // Tidak ada endpoint GET pangkalan untuk driver, tapi bisa ambil dari jadwal
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Halo, ${UI.escapeHtml(SESSION.nama)}! 👋</h2>
      <p class="page-sub">Ringkasan aktivitas Anda hari ini</p>
    </div>
    <div id="dash-content" class="space-y-4">
      ${skeletonCards()}
    </div>`;

  const res = await API.driver.getDashboard();
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const { absensi_hari, jadwal_hari, laporan_hari } = res.data;

  const absenStatus = absensi_hari
    ? (absensi_hari.jam_pulang ? 'SELESAI' : 'MASUK')
    : 'BELUM';

  const absenColor = { BELUM: 'red', MASUK: 'amber', SELESAI: 'green' }[absenStatus];
  const absenLabel = { BELUM: 'Belum Absen', MASUK: 'Sudah Masuk', SELESAI: 'Sudah Pulang' }[absenStatus];

  document.getElementById('dash-content').innerHTML = `
    <!-- Absensi Card -->
    <div class="card border-l-4 border-${absenColor}-500">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status Absensi Hari Ini</div>
          <div class="text-lg font-bold text-slate-900 dark:text-white mt-1">${absenLabel}</div>
          ${absensi_hari ? `
            <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Masuk: <span class="font-mono font-medium">${absensi_hari.jam_masuk}</span>
              ${absensi_hari.jam_pulang ? ` · Pulang: <span class="font-mono font-medium">${absensi_hari.jam_pulang}</span>` : ''}
            </div>` : ''}
        </div>
        <div class="text-3xl">${absenStatus === 'SELESAI' ? '✅' : absenStatus === 'MASUK' ? '⏰' : '⚠️'}</div>
      </div>
      ${absenStatus !== 'SELESAI' ? `
        <div class="mt-3">
          <button class="btn-primary text-sm py-2" onclick="showSection('absensi')">
            ${absenStatus === 'BELUM' ? '📍 Absen Masuk Sekarang' : '📍 Absen Pulang Sekarang'}
          </button>
        </div>` : ''}
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4">
      <div class="stat-card">
        <div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📋</div>
        <div>
          <div class="stat-label">Jadwal Hari Ini</div>
          <div class="stat-value">${jadwal_hari.length}</div>
          <div class="stat-sub">pengiriman</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div>
        <div>
          <div class="stat-label">Laporan Terkirim</div>
          <div class="stat-value">${laporan_hari.length}</div>
          <div class="stat-sub">hari ini</div>
        </div>
      </div>
    </div>

    <!-- Jadwal hari ini -->
    ${jadwal_hari.length ? `
      <div class="card">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-3">📦 Jadwal Pengiriman Hari Ini</h3>
        <div class="space-y-2">
          ${jadwal_hari.map(j => {
            const sudahLapor = laporan_hari.some(l => l.jadwal_id === j.jadwal_id);
            return `
              <div class="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <div class="font-medium text-slate-900 dark:text-white text-sm">Rit ${j.rit} — ${UI.escapeHtml(j.pangkalan_nama)}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${j.jumlah_kirim} tabung · ${UI.escapeHtml(j.spbe_nama || '')}</div>
                </div>
                <div>
                  ${sudahLapor
                    ? '<span class="badge badge-green">✓ Dilaporkan</span>'
                    : `<button class="btn-primary text-xs py-1 px-3" onclick="showSection('laporan')">Lapor</button>`}
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>` : ''}

    <!-- Offline queue indicator -->
    <div id="queue-indicator"></div>`;

  // Cek antrian offline
  const qCount = await DB.getQueueCount();
  if (qCount > 0) {
    document.getElementById('queue-indicator').innerHTML = `
      <div class="card border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
        <div class="flex items-center gap-3">
          <div class="text-2xl">⏳</div>
          <div class="flex-1">
            <div class="font-semibold text-amber-900 dark:text-amber-400">${qCount} data menunggu dikirim</div>
            <div class="text-sm text-amber-700 dark:text-amber-500 mt-0.5">Data offline akan otomatis terkirim saat koneksi kembali.</div>
          </div>
          <button class="btn-secondary text-xs" onclick="manualSync()">Kirim</button>
        </div>
      </div>`;
  }
}

async function manualSync() {
  const btn = event.target;
  UI.setLoading(btn, true, 'Mengirim...');
  const result = await DB.flushQueue();
  UI.setLoading(btn, false);
  UI.toast(`${result.flushed} data berhasil dikirim.`, 'success');
  UI.updateQueueBadge();
  loadDashboard();
}

// ============================================================
// ABSENSI
// ============================================================

async function loadAbsensi() {
  const main = document.getElementById('main-content');

  // Cek status absensi hari ini
  const dashRes = await API.driver.getDashboard();
  const absenHari = dashRes.success ? dashRes.data.absensi_hari : null;
  const sudahMasuk  = !!absenHari?.jam_masuk;
  const sudahPulang = !!absenHari?.jam_pulang;

  main.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Absensi</h2>
      <p class="page-sub">Catat kehadiran Anda dengan foto dan lokasi GPS.</p>
    </div>

    <!-- Status hari ini -->
    <div class="card mb-4">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Status Hari Ini</h3>
      <div class="flex gap-4">
        <div class="flex-1 text-center py-3 rounded-xl ${sudahMasuk ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800'}">
          <div class="text-2xl mb-1">${sudahMasuk ? '✅' : '⏳'}</div>
          <div class="text-xs font-medium text-slate-700 dark:text-slate-300">Absen Masuk</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">${absenHari?.jam_masuk || '—'}</div>
        </div>
        <div class="flex-1 text-center py-3 rounded-xl ${sudahPulang ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800'}">
          <div class="text-2xl mb-1">${sudahPulang ? '✅' : '⏳'}</div>
          <div class="text-xs font-medium text-slate-700 dark:text-slate-300">Absen Pulang</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">${absenHari?.jam_pulang || '—'}</div>
        </div>
      </div>
    </div>

    <!-- Form Absensi -->
    ${sudahPulang ? `
      <div class="card text-center py-10">
        <div class="text-4xl mb-3">✅</div>
        <div class="font-semibold text-slate-900 dark:text-white">Absensi hari ini sudah lengkap!</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">Masuk: ${absenHari.jam_masuk} · Pulang: ${absenHari.jam_pulang}</div>
      </div>` : `
      <div class="card space-y-4">
        <h3 class="font-semibold text-slate-900 dark:text-white">
          ${!sudahMasuk ? '📍 Absen Masuk' : '📍 Absen Pulang'}
        </h3>
        <div class="text-sm text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-950/30 rounded-xl px-4 py-3">
          ℹ️ Pastikan Wajah Terlihat Jelas <strong> </strong>. Mohon tidak meninggalkan halaman ketika absen berlangsung.
        </div>

        <!-- Foto preview -->
        <div>
          <label class="form-label">Foto Selfie *</label>
          <div id="abs-photo-preview" class="relative bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onclick="openAbsenCamera()">
            <div id="abs-photo-placeholder" class="text-center space-y-2">
              <div class="text-3xl">📷</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Tap untuk ambil foto</div>
            </div>
            <img id="abs-photo-img" class="hidden absolute inset-0 w-full h-full object-cover" src="" alt="Foto absensi"/>
          </div>
        </div>


 
        <div id="abs-error" class="hidden bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400"></div>

        <button id="abs-submit-btn" class="btn-primary w-full justify-center py-3" onclick="submitAbsensi('${!sudahMasuk ? 'masuk' : 'pulang'}')">
          ${!sudahMasuk ? 'Kirim Absen Masuk' : 'Kirim Absen Pulang'}
        </button>
      </div>`}`;
}

let _absenPhotoB64 = null;

async function openAbsenCamera() {
  const video  = document.getElementById('camera-video');
  const modal  = document.getElementById('camera-modal');
  const title  = document.getElementById('camera-modal-title');
  title.textContent = 'Foto Selfie Absensi';

UI.openModal('camera-modal');
  try {
    await Camera.init(video, 'user');
    document.getElementById('camera-capture-btn').onclick = async () => {
      const result = await Camera.capture();
      _absenPhotoB64 = result.base64;

      // Tampilkan preview
      const img  = document.getElementById('abs-photo-img');
      const ph   = document.getElementById('abs-photo-placeholder');
      img.src    = result.base64;
      img.classList.remove('hidden');
      ph.classList.add('hidden');

      Camera.stop();
      UI.closeModal('camera-modal');
      UI.toast(`📸 Foto diambil (${result.sizeKB}KB)`, 'success');
    };
  } catch (err) {
    Camera.stop();
    UI.closeModal('camera-modal');
    UI.toast(err.message, 'error');
  }
}


async function submitAbsensi(tipe) {
  const btn   = document.getElementById('abs-submit-btn');
  const errEl = document.getElementById('abs-error');
  errEl.classList.add('hidden');

  if (!_absenPhotoB64) {
    errEl.textContent = 'Foto selfie wajib diambil terlebih dahulu.';
    errEl.classList.remove('hidden');
    return;
  }

  UI.setLoading(btn, true, 'Mendeteksi lokasi...');
  try {
    currentGPS = await Camera.getLocation(100, 20000);
  } catch (err) {
    UI.setLoading(btn, false);
    errEl.textContent = 'Gagal mendeteksi lokasi: ' + err.message;
    errEl.classList.remove('hidden');
    return;
  }

  UI.setLoading(btn, true, 'Mengupload foto...');

  // Upload foto ke Drive
  const imgType = tipe === 'masuk' ? 'ABSEN_MASUK' : 'ABSEN_PULANG';
  const uploadRes = await API.uploadImage(_absenPhotoB64, imgType);
  if (!uploadRes.success) {
    UI.setLoading(btn, false);
    errEl.textContent = `Gagal upload foto: ${uploadRes.message}`;
    errEl.classList.remove('hidden');
    return;
  }

  UI.setLoading(btn, true, 'Mengirim absensi...');
  const body = {
    [`foto_${tipe}_url`]:    uploadRes.data.file_url,
    [`lat_${tipe}`]:         currentGPS.lat,
    [`lng_${tipe}`]:         currentGPS.lng,
    [`akurasi_${tipe}`]:     currentGPS.akurasi,
  };

  const endpoint = tipe === 'masuk' ? API.driver.absenMasuk : API.driver.absenPulang;
  const res = await endpoint(body);
  UI.setLoading(btn, false);

  if (res.success || res.code === 202) {
    _absenPhotoB64 = null; currentGPS = null;
    UI.toast(res.message, 'success');
    setTimeout(() => showSection('dashboard'), 1000);
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

// ============================================================
// JADWAL SAYA
// ============================================================

async function loadJadwalSaya() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Jadwal Saya</h2><p class="page-sub">Tugas pengiriman yang ditugaskan kepada Anda.</p></div>
    <div class="filter-bar">
      <input type="date" id="jadwal-tgl" class="form-input w-44" value="${UI.todayInputValue()}" onchange="fetchJadwalSaya()"/>
    </div>
    <div id="jadwal-list" class="space-y-3">
      ${skeletonList(3)}
    </div>`;
  await fetchJadwalSaya();
}

async function fetchJadwalSaya() {
  const el  = document.getElementById('jadwal-list');
  el.innerHTML = skeletonList(3);
  const res = await API.driver.getJadwalSaya({ tanggal: document.getElementById('jadwal-tgl')?.value });
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  el.innerHTML = res.data.jadwal.length ? res.data.jadwal.map(j => `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-slate-900 dark:text-white">Rit ${j.rit}</span>
            <span class="badge badge-blue">${UI.escapeHtml(j.pangkalan_nama)}</span>
            ${j.sudah_lapor ? '<span class="badge badge-green">✓ Sudah Dilaporkan</span>' : ''}
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div class="text-slate-500 dark:text-slate-400">SPBE: <span class="font-medium text-slate-700 dark:text-slate-300">${UI.escapeHtml(j.spbe_nama || '-')}</span></div>
            <div class="text-slate-500 dark:text-slate-400">Target Kirim: <span class="font-medium text-slate-700 dark:text-slate-300">${j.jumlah_kirim} tabung</span></div>
            <div class="text-slate-500 dark:text-slate-400">Tanggal: <span class="font-medium text-slate-700 dark:text-slate-300">${UI.formatDate(j.tanggal)}</span></div>
            ${j.keterangan ? `<div class="text-slate-500 dark:text-slate-400 col-span-2">Ket: <span class="font-medium">${UI.escapeHtml(j.keterangan)}</span></div>` : ''}
            ${j.sudah_lapor && j.dilaporkan_oleh ? `<div class="text-slate-500 dark:text-slate-400 col-span-2">Dilaporkan oleh: <span class="font-medium">${UI.escapeHtml(j.dilaporkan_oleh)}</span></div>` : ''}
          </div>
        </div>
${j.sudah_lapor
          ? `<span class="badge badge-gray shrink-0 self-start">Selesai</span>`
          : `<button class="btn-primary shrink-0 text-xs py-2 px-3" onclick="prefillJadwal('${j.jadwal_id}','${encodeURIComponent(j.pangkalan_nama)}',${j.jumlah_kirim},'${j.tanggal}');showSection('laporan')">
              Lapor
            </button>`}
      </div>
    </div>`).join('') : UI.emptyState('Tidak ada jadwal untuk tanggal ini.', '📋');
}

// ============================================================
// JADWAL GLOBAL
// ============================================================

async function loadJadwalGlobal() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Jadwal Semua Driver</h2><p class="page-sub">Daftar semua jadwal pengiriman hari ini.</p></div>
    <div class="filter-bar">
      <input type="date" id="jadwal-global-tgl" class="form-input w-44" value="${UI.todayInputValue()}" onchange="fetchJadwalGlobal()"/>
    </div>
    <div id="jadwal-global-list" class="table-wrapper">
      <table><thead><tr><th>Rit</th><th>Pangkalan</th><th>Target Kirim</th><th>Driver 1</th><th>Driver 2</th></tr></thead>
      <tbody id="jadwal-global-tbody"></tbody></table>
    </div>`;
  await fetchJadwalGlobal();
}

async function fetchJadwalGlobal() {
  const tbody = document.getElementById('jadwal-global-tbody');
  tbody.innerHTML = `<tr><td colspan="5">${skeletonLine()}</td></tr>`;
  const res = await API.driver.getJadwalGlobal({ tanggal: document.getElementById('jadwal-global-tgl')?.value });
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  tbody.innerHTML = res.data.jadwal.length ? res.data.jadwal.map(j => `
    <tr>
      <td class="font-semibold">Rit ${j.rit}</td>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(j.pangkalan_nama)}</td>
      <td>${j.jumlah_kirim} tabung</td>
      <td>${UI.escapeHtml(j.driver1_nama)}</td>
      <td class="text-slate-500">${j.driver2_nama !== '-' ? UI.escapeHtml(j.driver2_nama) : '—'}</td>
    </tr>`).join('') : `<tr><td colspan="5">${UI.emptyState('Belum ada jadwal.','📋')}</td></tr>`;
}

// ============================================================
// FORM LAPORAN PENGIRIMAN
// ============================================================

let _laporanPhotos  = {};
let _laporanGPS     = null;
let _prefillData    = null;

function prefillJadwal(jadwalId, pangkalanNamaEncoded, jumlahKirim, tanggalJadwal) {
  _prefillData = { jadwalId, pangkalanNama: decodeURIComponent(pangkalanNamaEncoded), jumlahKirim, tanggalJadwal };
}
async function loadFormLaporan() {
  const main = document.getElementById('main-content');
  _laporanPhotos = {};
  _laporanGPS    = null;

// Ambil SEMUA jadwal milik driver ini (lintas tanggal), lalu tampilkan
  // yang BELUM dilaporkan saja di dropdown — supaya driver bisa pilih jadwal
  // dari hari manapun yang masih perlu dilaporkan, tidak cuma hari ini.
  const jadwalRes  = await API.driver.getJadwalSaya({});
  if (activeSection !== 'laporan') return;
  const jadwalList = (jadwalRes.success ? jadwalRes.data.jadwal : []).filter(j => !j.sudah_lapor);

  const pangkalanOpts = jadwalList.map(j => {
    const namaDriver   = j.driver1_nama === SESSION.nama ? j.driver1_nama : (j.driver2_nama || j.driver1_nama);
    const tglFormatted = UI.formatDate(j.tanggal);
    const label = `${namaDriver}, ${j.pangkalan_nama} ${j.rit}, Jadwal Tgl ${tglFormatted}`;
    return `<option value="${UI.escapeHtml(j.pangkalan_nama)}" data-jumlah="${j.jumlah_kirim}" data-jadwal="${j.jadwal_id}" data-tanggal-jadwal="${j.tanggal}">${UI.escapeHtml(label)}</option>`;
  }).join('');

  const tanggalLaporanDefault = _prefillData?.tanggalJadwal || UI.todayInputValue();

  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Laporan Pengiriman</h2><p class="page-sub">Kirim laporan pengiriman dengan foto bukti dan lokasi GPS.</p></div>
    <div class="card space-y-5">

<!-- Pangkalan & Info Tanggal -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Pangkalan *</label>
          <select id="lp-pangkalan" class="form-select" onchange="handlePangkalanChange()">
            <option value="">-- Pilih Pangkalan --</option>
            ${pangkalanOpts}
            <option value="MANUAL">Lainnya (input manual)</option>
          </select>
          <input id="lp-pangkalan-manual" type="text" class="form-input mt-2 hidden" placeholder="Ketik nama pangkalan..."/>
          <p id="lp-tgl-jadwal-info" class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 hidden"></p>
        </div>
        <div>
          <label class="form-label">Tanggal Dilaporkan</label>
          <div class="form-input bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed">
            ${UI.formatDate(UI.todayInputValue())} <span class="text-xs">(otomatis, saat ini)</span>
          </div>
        </div>
      </div>

      <!-- Jumlah -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Jumlah Terkirim *</label>
          <input id="lp-kirim" type="number" class="form-input" placeholder="0" min="0"/>
        </div>
        <div>
          <label class="form-label">Jumlah Retur</label>
          <input id="lp-retur" type="number" class="form-input" placeholder="0" min="0"/>
        </div>
      </div>

      <!-- 3 Foto Wajib -->
      <div>
        <label class="form-label">Foto Bukti <span class="text-slate-400 font-normal">(3 foto, kamera belakang)</span></label>
        <div class="grid grid-cols-3 gap-3">
          ${['PENGIRIMAN','RETUR','PANGKALAN'].map(type => `
            <div class="text-center">
              <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center" onclick="openLaporanCamera('${type}')">
                <div id="lp-photo-ph-${type}" class="text-center space-y-1 p-2">
                  <div class="text-2xl">📷</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">${type === 'PENGIRIMAN' ? 'Tabung Kirim' : type === 'RETUR' ? 'Tabung Retur' : 'Pangkalan'}</div>
                </div>
                <img id="lp-photo-img-${type}" class="hidden absolute inset-0 w-full h-full object-cover" src="" alt="Foto ${type}"/>
                <div id="lp-photo-ok-${type}" class="hidden absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${type === 'PENGIRIMAN' ? 'Pengiriman*' : type === 'RETUR' ? 'Retur' : 'Pangkalan*'}</div>
            </div>`).join('')}
        </div>
      </div>

      <div id="lp-error" class="hidden bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400"></div>

      <button id="lp-submit-btn" class="btn-primary w-full justify-center py-3" onclick="submitLaporan()">
        📤 Kirim Laporan Pengiriman
      </button>
      <p class="text-xs text-slate-500 dark:text-slate-400 text-center">Jika tidak ada sinyal, laporan akan disimpan dan dikirim otomatis saat online.</p>
    </div>`;

  // Prefill jika dari jadwal (tombol "Lapor")
  if (_prefillData) {
    const sel = document.getElementById('lp-pangkalan');
    const opt = Array.from(sel.options).find(o => o.value === _prefillData.pangkalanNama);
    if (opt) {
      sel.value = _prefillData.pangkalanNama;
      document.getElementById('lp-kirim').value = _prefillData.jumlahKirim;
      showTanggalJadwalInfo(_prefillData.tanggalJadwal);
    }
    _prefillData = null;
  }
}

function showTanggalJadwalInfo(tanggalJadwal) {
  const infoEl = document.getElementById('lp-tgl-jadwal-info');
  if (!infoEl) return;
  if (tanggalJadwal) {
    infoEl.textContent = `📅 Jadwal untuk tanggal: ${UI.formatDate(tanggalJadwal)}`;
    infoEl.classList.remove('hidden');
  } else {
    infoEl.classList.add('hidden');
  }
}
function handlePangkalanChange() {
  const sel        = document.getElementById('lp-pangkalan');
  const manualInput = document.getElementById('lp-pangkalan-manual');
  const opt        = sel.options[sel.selectedIndex];

  if (sel.value === 'MANUAL') {
    manualInput.classList.remove('hidden');
    manualInput.value = '';
    manualInput.focus();
    showTanggalJadwalInfo(null);
  } else if (sel.value === '') {
    manualInput.classList.add('hidden');
    manualInput.value = '';
    showTanggalJadwalInfo(null);
  } else {
    manualInput.classList.add('hidden');
    manualInput.value = '';
    if (opt?.dataset.jumlah) document.getElementById('lp-kirim').value = opt.dataset.jumlah;
    showTanggalJadwalInfo(opt?.dataset.tanggalJadwal || null);
  }
}

async function openLaporanCamera(photoType) {
  const video = document.getElementById('camera-video');
  const title = document.getElementById('camera-modal-title');
  const labels = { PENGIRIMAN: 'Foto Tabung Terkirim', RETUR: 'Foto Tabung Retur', PANGKALAN: 'Foto Kondisi Pangkalan' };
  title.textContent = labels[photoType] || 'Ambil Foto';

UI.openModal('camera-modal');
  try {
    await Camera.init(video, 'environment');
    document.getElementById('camera-capture-btn').onclick = async () => {
      const result = await Camera.capture();
      _laporanPhotos[photoType] = result.base64;

      const img = document.getElementById(`lp-photo-img-${photoType}`);
      const ph  = document.getElementById(`lp-photo-ph-${photoType}`);
      const ok  = document.getElementById(`lp-photo-ok-${photoType}`);
      img.src = result.base64;
      img.classList.remove('hidden');
      ph.classList.add('hidden');
      ok.classList.remove('hidden');

      Camera.stop();
      UI.closeModal('camera-modal');
      UI.toast(`Foto ${photoType.toLowerCase()} diambil (${result.sizeKB}KB)`, 'success');
    };
  } catch (err) {
    Camera.stop();
    UI.closeModal('camera-modal');
    UI.toast(err.message, 'error');
  }
}


async function submitLaporan() {
  const btn    = document.getElementById('lp-submit-btn');
  const errEl  = document.getElementById('lp-error');
  errEl.classList.add('hidden');

const pangkalanEl   = document.getElementById('lp-pangkalan');
  const isManual      = pangkalanEl.value === 'MANUAL';
  const pangkalanNama = isManual
    ? document.getElementById('lp-pangkalan-manual').value.trim()
    : pangkalanEl.value;
  const jumlahKirim   = Number(document.getElementById('lp-kirim').value);
  const jumlahRetur   = Number(document.getElementById('lp-retur').value || 0);
  const tanggal       = UI.todayInputValue(); // realtime — selalu tanggal & saat form ini disubmit
  const jadwalId      = isManual ? '' : (pangkalanEl.options[pangkalanEl.selectedIndex]?.dataset?.jadwal || '');

  if (!pangkalanEl.value)  { errEl.textContent = 'Pilih pangkalan tujuan.'; errEl.classList.remove('hidden'); return; }
  if (!pangkalanNama)      { errEl.textContent = 'Nama pangkalan manual wajib diisi.'; errEl.classList.remove('hidden'); return; }
  if (!jumlahKirim)                              { errEl.textContent = 'Jumlah terkirim wajib diisi.'; errEl.classList.remove('hidden'); return; }
  if (!_laporanPhotos['PENGIRIMAN'])             { errEl.textContent = 'Foto pengiriman (tabung terkirim) wajib diambil.'; errEl.classList.remove('hidden'); return; }
  if (!_laporanPhotos['PANGKALAN'])              { errEl.textContent = 'Foto kondisi pangkalan wajib diambil.'; errEl.classList.remove('hidden'); return; }

  UI.setLoading(btn, true, 'Mendeteksi lokasi...');
  try {
    _laporanGPS = await Camera.getLocation(150, 20000);
  } catch (err) {
    UI.setLoading(btn, false);
    errEl.textContent = 'Gagal mendeteksi lokasi: ' + err.message;
    errEl.classList.remove('hidden');
    return;
  }

  UI.setLoading(btn, true, 'Mengupload foto...');

  // Upload 3 foto ke Drive
  const uploads = {};
  const photoTypes = Object.keys(_laporanPhotos);
  for (const type of photoTypes) {
    const upRes = await API.uploadImage(_laporanPhotos[type], type);
    if (!upRes.success) {
      UI.setLoading(btn, false);
      errEl.textContent = `Gagal upload foto ${type}: ${upRes.message}`;
      errEl.classList.remove('hidden');
      return;
    }
    uploads[type] = upRes.data.file_url;
  }

  UI.setLoading(btn, true, 'Mengirim laporan...');

const body = {
    jadwal_id:            jadwalId,
    tanggal,
    pangkalan_nama:       pangkalanNama,
    jumlah_kirim:         jumlahKirim,
    jumlah_retur:         jumlahRetur,
    foto_pengiriman_url:  uploads['PENGIRIMAN'] || '',
    foto_retur_url:       uploads['RETUR']      || '',
    foto_pangkalan_url:   uploads['PANGKALAN']  || '',
    lat:                  _laporanGPS.lat,
    lng:                  _laporanGPS.lng,
    akurasi:              _laporanGPS.akurasi,
  };

  const res = await API.driver.submitLaporan(body);
  UI.setLoading(btn, false);

  if (res.success || res.code === 202) {
    _laporanPhotos = {}; _laporanGPS = null;
    UI.toast(res.message, 'success');
    setTimeout(() => showSection('dashboard'), 1000);
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

// ============================================================
// RIWAYAT LAPORAN
// ============================================================

async function loadRiwayat() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Riwayat Laporan</h2><p class="page-sub">Laporan pengiriman yang pernah Anda kirimkan.</p></div>
    <div class="filter-bar">
      <input type="month" id="riwayat-bulan" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchRiwayat()"/>
    </div>
    <div id="riwayat-list" class="space-y-3">${skeletonList(4)}</div>`;
  await fetchRiwayat();
}

async function fetchRiwayat() {
  const el  = document.getElementById('riwayat-list');
  el.innerHTML = skeletonList(4);
  const res = await API.driver.getRiwayatLaporan({ bulan: document.getElementById('riwayat-bulan')?.value });
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  el.innerHTML = res.data.laporan.length ? res.data.laporan.map(l => `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(l.pangkalan_nama)}</span>
            ${UI.badge(l.status, l.status)}
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <div>📅 ${UI.formatDate(l.tanggal)}</div>
            <div>⏰ ${l.jam_laporan || '-'}</div>
            <div>📦 Kirim: <span class="font-medium text-slate-700 dark:text-slate-300">${l.jumlah_kirim}</span></div>
            <div>↩️ Retur: <span class="font-medium text-slate-700 dark:text-slate-300">${l.jumlah_retur || 0}</span></div>
          </div>
          ${l.catatan_operator ? `<div class="mt-2 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-amber-700 dark:text-amber-400">📝 Catatan Operator: ${UI.escapeHtml(l.catatan_operator)}</div>` : ''}
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          ${l.foto_pengiriman_url ? `<a href="${l.foto_pengiriman_url}" target="_blank" class="btn-secondary text-xs py-1 px-2">📷 Kirim</a>` : ''}
          ${l.foto_pangkalan_url  ? `<a href="${l.foto_pangkalan_url}" target="_blank" class="btn-secondary text-xs py-1 px-2">🏪 Pkln</a>`  : ''}
        </div>
      </div>
    </div>`).join('') : UI.emptyState('Tidak ada laporan pada bulan ini.', '📋');
}

// ── Tiny skeleton helpers ──
function skeletonCards() {
  return `<div class="space-y-4 animate-pulse">
    <div class="card h-32 bg-slate-200 dark:bg-slate-800"></div>
    <div class="grid grid-cols-2 gap-4">
      <div class="card h-24 bg-slate-200 dark:bg-slate-800"></div>
      <div class="card h-24 bg-slate-200 dark:bg-slate-800"></div>
    </div>
  </div>`;
}
function skeletonList(n) {
  return `<div class="space-y-3 animate-pulse">${Array(n).fill('<div class="card h-24 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div>`;
}
function skeletonLine() {
  return `<div class="animate-pulse py-4 flex gap-3">${Array(4).fill('<div class="flex-1 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>').join('')}</div>`;
}
