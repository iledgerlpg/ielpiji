/**
 * ILPG Frontend — staff-dashboard.js
 * Semua logika Staff Admin: dashboard, absensi (foto+GPS), tugas, catatan, jadwal piket.
 */

const SESSION = Auth.guard(['STAFF_ADMIN']);
if (!SESSION) throw new Error('Unauthorized');

let activeSection = 'dashboard';
let _absenPhotoB64 = null;
let _absenGPS      = null;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',     icon: 'home' },
  { id: 'absensi',   label: 'Absensi',       icon: 'clock' },
  { id: 'tugas',     label: 'Tugas Saya',    icon: 'check' },
  { id: 'catatan',   label: 'Catatan',       icon: 'note' },
  { id: 'piket',     label: 'Jadwal Piket',  icon: 'calendar' },
];

const ICONS = {
  home:     '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  clock:    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  check:    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
  note:     '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
  calendar: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
};

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  UI.init();
  showSection('dashboard');
  renderImpersonateSwitcher(); 
  renderImpersonateBanner();
});

function buildSidebar() {
  document.getElementById('sidebar-nav').innerHTML = NAV_ITEMS.map(n =>
    `<button class="nav-item w-full text-left" id="nav-${n.id}" onclick="showSection('${n.id}')">${ICONS[n.icon]||''}<span class="nav-label">${n.label}</span></button>`
  ).join('');
}

function showSection(id) {
  activeSection = id;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${id}`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = NAV_ITEMS.find(n => n.id === id)?.label || 'Staff Admin';
  ({ dashboard: loadDashboard, absensi: loadAbsensi, tugas: loadTugas, catatan: loadCatatan, piket: loadPiket })[id]?.();
}
// ── DASHBOARD ──
async function loadDashboard() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Halo, ${UI.escapeHtml(SESSION.nama)}! 👋</h2><p class="page-sub">Ringkasan aktivitas Staff Admin hari ini.</p></div>
    <div id="dash-content" class="space-y-4"><div class="animate-pulse space-y-3">${Array(3).fill('<div class="card h-20 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div></div>`;

  const res = await API.staff.getDashboard();
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const { absensi_hari, tugas_aktif, tugas } = res.data;

  const absenOk    = !!absensi_hari?.jam_masuk;
  const absenDone  = !!absensi_hari?.jam_pulang;

  document.getElementById('dash-content').innerHTML = `
    <div class="card border-l-4 ${absenDone ? 'border-green-500' : absenOk ? 'border-amber-500' : 'border-red-500'}">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Absensi Hari Ini</div>
          <div class="text-lg font-bold text-slate-900 dark:text-white mt-1">${absenDone ? 'Sudah Pulang ✅' : absenOk ? 'Sudah Masuk ⏰' : 'Belum Absen ⚠️'}</div>
          ${absensi_hari ? `<div class="text-sm text-slate-500 mt-1">Masuk: <span class="font-mono font-medium">${absensi_hari.jam_masuk}</span>${absensi_hari.jam_pulang ? ` · Pulang: <span class="font-mono font-medium">${absensi_hari.jam_pulang}</span>` : ''}</div>` : ''}
        </div>
        <div class="text-3xl">${absenDone ? '✅' : absenOk ? '⏰' : '⚠️'}</div>
      </div>
      ${!absenDone ? `<div class="mt-3"><button class="btn-primary text-sm py-2" onclick="showSection('absensi')">${!absenOk ? '📍 Absen Masuk' : '📍 Absen Pulang'}</button></div>` : ''}
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="stat-card">
        <div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📋</div>
        <div><div class="stat-label">Tugas Aktif</div><div class="stat-value">${tugas_aktif}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-amber-100 dark:bg-amber-900/40">⏳</div>
        <div><div class="stat-label">Sedang Dikerjakan</div><div class="stat-value">${tugas?.filter(t => t.status === 'IN_PROGRESS').length || 0}</div></div>
      </div>
    </div>

    ${tugas?.length ? `
    <div class="card">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-3">📋 Tugas Terbaru</h3>
      <div class="space-y-2">
        ${tugas.slice(0, 3).map(t => `
          <div class="flex items-start justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div><div class="text-sm font-medium text-slate-900 dark:text-white">${UI.escapeHtml(t.judul)}</div><div class="text-xs text-slate-500 mt-0.5">${UI.escapeHtml(t.deskripsi?.substring(0,60))}${t.deskripsi?.length > 60 ? '...' : ''}</div></div>
            ${UI.badge(t.status, t.status)}
          </div>`).join('')}
      </div>
      <button class="text-sm text-blue-500 hover:underline mt-3" onclick="showSection('tugas')">Lihat semua tugas →</button>
    </div>` : ''}`;
}

// ── ABSENSI ──
async function loadAbsensi() {
  const main = document.getElementById('main-content');
  const res  = await API.staff.getDashboard();
  const absenHari  = res.success ? res.data.absensi_hari : null;
  const sudahMasuk = !!absenHari?.jam_masuk;
  const sudahPulang= !!absenHari?.jam_pulang;

  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Absensi</h2><p class="page-sub">Catat kehadiran Anda dengan foto selfie dan GPS.</p></div>

    <div class="card mb-4">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Status Hari Ini</h3>
      <div class="flex gap-4">
        <div class="flex-1 text-center py-3 rounded-xl ${sudahMasuk ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800'}">
          <div class="text-2xl mb-1">${sudahMasuk ? '✅' : '⏳'}</div>
          <div class="text-xs font-medium text-slate-700 dark:text-slate-300">Masuk</div>
          <div class="text-xs text-slate-500 font-mono">${absenHari?.jam_masuk || '—'}</div>
        </div>
        <div class="flex-1 text-center py-3 rounded-xl ${sudahPulang ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800'}">
          <div class="text-2xl mb-1">${sudahPulang ? '✅' : '⏳'}</div>
          <div class="text-xs font-medium text-slate-700 dark:text-slate-300">Pulang</div>
          <div class="text-xs text-slate-500 font-mono">${absenHari?.jam_pulang || '—'}</div>
        </div>
      </div>
    </div>

    ${sudahPulang ? `<div class="card text-center py-10"><div class="text-4xl mb-3">✅</div><div class="font-semibold text-slate-900 dark:text-white">Absensi hari ini sudah lengkap!</div></div>` : `
    <div class="card space-y-4">
      <h3 class="font-semibold text-slate-900 dark:text-white">${!sudahMasuk ? '📍 Absen Masuk' : '📍 Absen Pulang'}</h3>
      <div class="bg-blue-50 dark:bg-blue-950/30 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        ℹ️ Foto diambil via <strong>kamera depan</strong>. Lokasi tidak ditampilkan di layar.
      </div>

      <!-- Foto -->
      <div>
        <label class="form-label">Foto Selfie *</label>
        <div class="aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onclick="openStaffCamera()">
          <div id="staff-photo-ph" class="text-center space-y-2"><div class="text-3xl">📷</div><div class="text-sm text-slate-500">Tap untuk ambil foto</div></div>
          <img id="staff-photo-img" class="hidden absolute inset-0 w-full h-full object-cover" src="" alt="Foto"/>
        </div>
      </div>

      <!-- GPS -->
      <div id="staff-gps-box" class="flex items-center gap-3 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800">
        <div class="text-xl">📡</div>
        <div class="flex-1">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-300">Lokasi GPS</div>
          <div id="staff-gps-txt" class="text-xs text-slate-500">Belum diambil</div>
        </div>
        <button id="staff-gps-btn" class="btn-secondary text-xs py-1.5 px-3" onclick="getStaffGPS()">Ambil Lokasi</button>
      </div>

      <div id="staff-abs-err" class="hidden bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400"></div>
      <button id="staff-abs-btn" class="btn-primary w-full justify-center py-3" onclick="submitStaffAbsen('${!sudahMasuk ? 'masuk' : 'pulang'}')">
        ${!sudahMasuk ? 'Kirim Absen Masuk' : 'Kirim Absen Pulang'}
      </button>
    </div>`}`;
}

async function openStaffCamera() {
  UI.openModal('camera-modal');
  document.getElementById('camera-modal-title').textContent = 'Foto Selfie Absensi';
  try {
    await Camera.init(document.getElementById('camera-video'));
    document.getElementById('camera-capture-btn').onclick = async () => {
      const r = await Camera.capture();
      _absenPhotoB64 = r.base64;
      document.getElementById('staff-photo-img').src = r.base64;
      document.getElementById('staff-photo-img').classList.remove('hidden');
      document.getElementById('staff-photo-ph').classList.add('hidden');
      Camera.stop(); UI.closeModal('camera-modal');
      UI.toast(`📸 Foto diambil (${r.sizeKB}KB)`, 'success');
    };
  } catch (err) { Camera.stop(); UI.closeModal('camera-modal'); UI.toast(err.message, 'error'); }
}

async function getStaffGPS() {
  const btn = document.getElementById('staff-gps-btn');
  const txt = document.getElementById('staff-gps-txt');
  UI.setLoading(btn, true, 'Mendeteksi...');
  txt.textContent = 'Mendeteksi...';
  try {
    _absenGPS = await Camera.getLocation(100, 20000);
    txt.textContent = `✅ Terdeteksi (±${_absenGPS.akurasi}m)`;
    document.getElementById('staff-gps-box').classList.add('bg-green-50', 'dark:bg-green-900/20');
    UI.toast(`Lokasi terdeteksi (±${_absenGPS.akurasi}m)`, 'success');
  } catch (err) { txt.textContent = '❌ ' + err.message; UI.toast(err.message, 'error'); }
  UI.setLoading(btn, false);
}

async function submitStaffAbsen(tipe) {
  const btn   = document.getElementById('staff-abs-btn');
  const errEl = document.getElementById('staff-abs-err');
  errEl.classList.add('hidden');
  if (!_absenPhotoB64) { errEl.textContent = 'Foto selfie wajib diambil.'; errEl.classList.remove('hidden'); return; }
  if (!_absenGPS)      { errEl.textContent = 'Lokasi GPS belum diambil.';  errEl.classList.remove('hidden'); return; }

  UI.setLoading(btn, true, 'Mengupload foto...');
  const imgType  = tipe === 'masuk' ? 'ABSEN_MASUK' : 'ABSEN_PULANG';
  const upRes    = await API.uploadImage(_absenPhotoB64, imgType);
  if (!upRes.success) { UI.setLoading(btn, false); errEl.textContent = upRes.message; errEl.classList.remove('hidden'); return; }

  UI.setLoading(btn, true, 'Mengirim absensi...');
  const body     = { [`foto_${tipe}_url`]: upRes.data.file_url, [`lat_${tipe}`]: _absenGPS.lat, [`lng_${tipe}`]: _absenGPS.lng, [`akurasi_${tipe}`]: _absenGPS.akurasi };
  const endpoint = tipe === 'masuk' ? API.staff.absenMasuk : API.staff.absenPulang;
  const res      = await endpoint(body);
  UI.setLoading(btn, false);

  if (res.success || res.code === 202) {
    _absenPhotoB64 = null; _absenGPS = null;
    UI.toast(res.message, 'success');
    setTimeout(() => showSection('dashboard'), 1000);
  } else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

// ── TUGAS ──
async function loadTugas() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Tugas Saya</h2><p class="page-sub">Daftar tugas dari HRD yang perlu dikerjakan.</p></div>
    <div class="filter-bar">
      <select id="tugas-filter" class="form-select w-40" onchange="filterTugasStaff()">
        <option value="">Semua Status</option><option>OPEN</option><option>IN_PROGRESS</option><option>DONE</option>
      </select>
    </div>
    <div id="tugas-list" class="space-y-3"><div class="animate-pulse space-y-3">${Array(3).fill('<div class="card h-24 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div></div>`;

  const res = await API.staff.getTugas();
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  window._allTugasStaff = res.data.tugas;
  filterTugasStaff();
}

function filterTugasStaff() {
  const s = document.getElementById('tugas-filter')?.value || '';
  const list = (window._allTugasStaff || []).filter(t => !s || t.status === s);
  const el   = document.getElementById('tugas-list');
  el.innerHTML = list.length ? list.map(t => `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(t.judul)}</span>
            ${UI.badge(t.status, t.status)}
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400">${UI.escapeHtml(t.deskripsi)}</p>
          <div class="text-xs text-slate-400 mt-2">${UI.formatDateTime(t.created_at)}</div>
        </div>
        <div class="flex flex-col gap-2 shrink-0">
          ${t.file_url ? `<a href="${t.file_url}" target="_blank" class="btn-secondary text-xs py-1 px-2">📎 File</a>` : ''}
          ${t.status === 'OPEN' ? `<button class="btn-primary text-xs py-1 px-2" onclick="updateTugas('${t.tugas_id}','IN_PROGRESS')">Ambil Alih</button>` : ''}
          ${t.status === 'IN_PROGRESS' && t.dikerjakan_oleh === SESSION.user_id ? `<button class="btn-success text-xs py-1 px-2" onclick="updateTugas('${t.tugas_id}','DONE')">✅ Selesai</button>` : ''}
        </div>
      </div>
    </div>`).join('') : UI.emptyState('Tidak ada tugas ditemukan.', '📋');
}

async function updateTugas(id, status) {
  const label = { IN_PROGRESS: 'Ambil alih', DONE: 'Selesaikan' }[status];
  if (!await UI.confirm(`${label} tugas ini?`)) return;
  const res = await API.staff.updateStatusTugas({ tugas_id: id, status });
  if (res.success) { UI.toast(`Status tugas diubah ke ${status}.`, 'success'); loadTugas(); }
  else UI.toast(res.message, 'error');
}

// ── CATATAN ──
async function loadCatatan() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Catatan</h2><p class="page-sub">Catatan & pengumuman untuk Anda, serta kirim catatan.</p></div>
      <button class="btn-primary" onclick="openCatatanStaffModal()">+ Buat Catatan</button>
    </div>
    <div id="catatan-list" class="space-y-3"><div class="animate-pulse space-y-3">${Array(3).fill('<div class="card h-20 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div></div>`;

  const res = await API.staff.getCatatan();
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const catatan = res.data.catatan;
  document.getElementById('catatan-list').innerHTML = catatan.length ? catatan.map(c => `
    <div class="card">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(c.judul)}</span>
            ${UI.badge(c.tipe, null)}
            ${c.dari_user_id !== SESSION.user_id ? '<span class="badge badge-gray">Dari HRD</span>' : '<span class="badge badge-blue">Dari Saya</span>'}
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1.5">${UI.escapeHtml(c.isi)}</p>
          <div class="text-xs text-slate-400 mt-2">${UI.formatDateTime(c.created_at)}</div>
        </div>
      </div>
    </div>`).join('') : UI.emptyState('Belum ada catatan.', '📝');
}

function openCatatanStaffModal() {
  const modal = document.createElement('div');
  modal.id    = 'cn-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Buat Catatan</h3>
        <button class="btn-icon" onclick="document.getElementById('cn-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Judul *</label><input id="cn-judul" class="form-input" placeholder="Judul catatan..."/></div>
        <div><label class="form-label">Isi *</label><textarea id="cn-isi" class="form-textarea" rows="4" placeholder="Tulis isi catatan..."></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Tipe</label><select id="cn-tipe" class="form-select"><option>CATATAN</option><option>PENGUMUMAN</option></select></div>
          <div><label class="form-label">Ditujukan ke</label><select id="cn-role" class="form-select"><option value="HRD">HRD</option><option value="ALL">Semua</option></select></div>
        </div>
        <div id="cn-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="cn-btn" class="btn-primary w-full justify-center" onclick="saveCatatanStaff()">Kirim Catatan</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveCatatanStaff() {
  const btn   = document.getElementById('cn-btn');
  const errEl = document.getElementById('cn-err');
  errEl.classList.add('hidden');
  const judul = document.getElementById('cn-judul').value.trim();
  const isi   = document.getElementById('cn-isi').value.trim();
  if (!judul || !isi) { errEl.textContent = 'Judul dan isi wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Mengirim...');
  const res = await API.staff.createCatatan({ judul, isi, tipe: document.getElementById('cn-tipe').value, untuk_role: document.getElementById('cn-role').value });
  UI.setLoading(btn, false);
  if (res.success) { UI.toast('Catatan terkirim.', 'success'); document.getElementById('cn-modal').remove(); loadCatatan(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

// ── JADWAL PIKET ──
async function loadPiket() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Jadwal Piket Saya</h2><p class="page-sub">Jadwal piket dan tugas kebersihan yang ditetapkan HRD.</p></div>
    <div class="filter-bar">
      <input type="month" id="piket-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchPiketStaff()"/>
    </div>
    <div id="piket-list" class="space-y-3"><div class="animate-pulse space-y-3">${Array(3).fill('<div class="card h-16 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div></div>`;
  await fetchPiketStaff();
}

async function fetchPiketStaff() {
  const res = await API.staff.getJadwalPiket({ bulan: document.getElementById('piket-bln')?.value });
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const list = res.data.jadwal;
  document.getElementById('piket-list').innerHTML = list.length ? list.map(p => `
    <div class="card flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex flex-col items-center justify-center shrink-0">
        <div class="text-xs font-bold text-blue-700 dark:text-blue-400 leading-none">${new Date(p.tanggal).getDate()}</div>
        <div class="text-[10px] text-blue-500 uppercase">${new Date(p.tanggal).toLocaleDateString('id-ID',{month:'short'})}</div>
      </div>
      <div class="flex-1">
        <div class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(p.shift)}</div>
        ${p.keterangan ? `<div class="text-sm text-slate-500 mt-0.5">${UI.escapeHtml(p.keterangan)}</div>` : ''}
      </div>
    </div>`).join('') : UI.emptyState('Belum ada jadwal piket bulan ini.', '📅');
}
