/**
 * ILPG Frontend — operator-dashboard.js
 * Semua logika Operator: dashboard, jadwal harian, laporan pengiriman,
 * monitoring, pembayaran refill & bagi hasil, stok gudang, pangkalan, SPBE.
 */

const SESSION = Auth.guard(['OPERATOR']);
if (!SESSION) throw new Error('Unauthorized');

let activeSection = 'dashboard';

const NAV_ITEMS = [
  { id: 'dashboard',          label: 'Dashboard',              icon: 'home' },
  { id: 'jadwal-harian',      label: 'Jadwal Harian',         icon: 'calendar' },
  { id: 'laporan-pengiriman', label: 'Laporan Pengiriman',    icon: 'truck' },
  { id: 'monitoring-kirim',   label: 'Monitoring Pengiriman', icon: 'chart' },
  { id: 'master-sa',          label: 'Master SA',             icon: 'table' },
  { id: 'bayar-refill',       label: 'Pembayaran Refill',     icon: 'money' },
  { id: 'bayar-bh',           label: 'Pembayaran Bagi Hasil', icon: 'money' },
  { id: 'monitoring-bayar',   label: 'Monitoring Pembayaran', icon: 'chart' },
  { id: 'stok-gudang',        label: 'Stok Gudang',           icon: 'box' },
  { id: 'pangkalan',          label: 'Pangkalan',             icon: 'store' },
  { id: 'spbe',               label: 'SPBE',                  icon: 'fuel' },
];

const SVG = {
  home: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  calendar: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
  truck: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m8-11h3l3 5v4h-3m-3 1H9m0-10v10"/></svg>',
  chart: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
  table: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
  money: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  box: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  store: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
  fuel: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h2l1-3h12l1 3h2M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9M8 10V7M16 10V7"/></svg>',
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  UI.init();
  showSection('dashboard');
});

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const sections = [
    { label: 'Utama', items: ['dashboard'] },
    { label: 'Pengiriman', items: ['jadwal-harian','laporan-pengiriman','monitoring-kirim','master-sa'] },
    { label: 'Pembayaran', items: ['bayar-refill','bayar-bh','monitoring-bayar'] },
    { label: 'Stok & Master', items: ['stok-gudang','pangkalan','spbe'] },
  ];

  nav.innerHTML = sections.map(sec => `
    <div class="nav-section-label text-xs text-slate-400 dark:text-slate-600 font-semibold uppercase tracking-widest px-3 pt-4 pb-1">${sec.label}</div>
    ${sec.items.map(id => {
      const item = NAV_ITEMS.find(n => n.id === id);
      return `<button class="nav-item w-full text-left" id="nav-${id}" onclick="showSection('${id}')">
        ${SVG[item.icon] || ''}<span class="nav-label">${item.label}</span>
      </button>`;
    }).join('')}`).join('');
}

function showSection(id) {
  activeSection = id;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${id}`)?.classList.add('active');
  const item = NAV_ITEMS.find(n => n.id === id);
  document.getElementById('topbar-title').textContent = item?.label || 'Operator';

  const loaders = {
    'dashboard':          loadDashboard,
    'jadwal-harian':      loadJadwalHarian,
    'laporan-pengiriman': loadLaporan,
    'monitoring-kirim':   loadMonitoringKirim,
    'master-sa':          loadMasterSA,
    'bayar-refill':       () => loadPembayaran('REFILL'),
    'bayar-bh':           () => loadPembayaran('BAGI_HASIL'),
    'monitoring-bayar':   loadMonitoringBayar,
    'stok-gudang':        loadStokGudang,
    'pangkalan':          loadPangkalan,
    'spbe':               loadSPBE,
  };
  if (loaders[id]) loaders[id]();
}

// Map tipe pembayaran -> id section, dipakai untuk guard race-condition.
function sectionForTipe(tipe) {
  return tipe === 'REFILL' ? 'bayar-refill' : 'bayar-bh';
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Operator Dashboard</h2><p class="page-sub">Ringkasan aktivitas pengiriman & pembayaran hari ini.</p></div>
    <div class="filter-bar">
      <input type="date" id="dash-tgl" class="form-input w-44" value="${UI.todayInputValue()}" onchange="fetchDashboard()"/>
    </div>
    <div id="dash-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">${skCards(4)}</div>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Driver Belum Lapor</h3>
        <div id="dash-belum-lapor" class="space-y-2"></div>
      </div>
      <div class="card">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Pangkalan Belum Bayar</h3>
        <div id="dash-belum-bayar" class="space-y-2"></div>
      </div>
    </div>`;
  await fetchDashboard();
}

async function fetchDashboard() {
  const tanggal = document.getElementById('dash-tgl')?.value || UI.todayInputValue();
  const res = await API.operator.getDashboard({ tanggal });
  if (activeSection !== 'dashboard') return; // section sudah berpindah, jangan sentuh DOM lama
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const d = res.data;

  const statsEl = document.getElementById('dash-stats');
  if (!statsEl) return;
  statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📋</div><div><div class="stat-label">Jadwal Hari Ini</div><div class="stat-value">${d.jadwal_hari}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div><div><div class="stat-label">Sudah Lapor</div><div class="stat-value text-green-600">${d.driver_sudah_lapor}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-red-100 dark:bg-red-900/40">⏳</div><div><div class="stat-label">Belum Lapor</div><div class="stat-value text-red-500">${d.driver_belum_lapor?.length || 0}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-amber-100 dark:bg-amber-900/40">💰</div><div><div class="stat-label">Belum Bayar</div><div class="stat-value text-amber-600">${d.pangkalan_belum_bayar?.length || 0}</div></div></div>`;

  document.getElementById('dash-belum-lapor').innerHTML = d.driver_belum_lapor?.length
    ? d.driver_belum_lapor.map(x => `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div><div class="text-sm font-medium text-slate-900 dark:text-white">${x.driver_nama}</div>
          <div class="text-xs text-slate-500">${x.pangkalan_nama} · Rit ${x.rit}</div></div>
          <button class="btn-secondary text-xs py-1 px-2" onclick="showSection('laporan-pengiriman')">Detail</button>
        </div>`).join('')
    : UI.emptyState('Semua driver sudah lapor! 🎉', '✅');

  document.getElementById('dash-belum-bayar').innerHTML = d.pangkalan_belum_bayar?.length
    ? d.pangkalan_belum_bayar.map(x => `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div class="text-sm font-medium text-slate-900 dark:text-white">${x.nama}</div>
          <button class="btn-primary text-xs py-1 px-3" onclick="showSection('bayar-refill')">Bayar</button>
        </div>`).join('')
    : UI.emptyState('Semua pangkalan sudah bayar! 🎉', '💚');
}

// ============================================================
// JADWAL HARIAN
// ============================================================

async function loadJadwalHarian() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Jadwal Harian</h2><p class="page-sub">Atur jadwal pengiriman driver ke pangkalan.</p></div>
      <div class="flex gap-2 flex-wrap">
        <button id="jh-hapus-btn" class="btn-danger hidden" onclick="deleteSelectedJadwal()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Hapus Terpilih (<span id="jh-hapus-count">0</span>)
        </button>
        <button class="btn-primary" onclick="openJadwalModal()">+ Tambah Jadwal</button>
      </div>
    </div>
    <div class="filter-bar">
      <input type="date" id="jh-tgl" class="form-input w-44" value="${UI.todayInputValue()}" onchange="fetchJadwalHarian()"/>
      <input type="month" id="jh-bln" class="form-input w-40" onchange="fetchJadwalHarian()"/>
      <button class="btn-secondary text-sm" onclick="document.getElementById('jh-tgl').value='';document.getElementById('jh-bln').value='';fetchJadwalHarian()">Reset</button>
    </div>
    <style>
      .jh-row-even { background: #ffffff; }
      .jh-row-odd  { background: #f1f5f9; }
      .dark .jh-row-even { background: #0f172a; }
      .dark .jh-row-odd  { background: #1e293b; }
      .jh-row-even:hover { background: #f8fafc !important; }
      .jh-row-odd:hover  { background: #e2e8f0 !important; }
      .dark .jh-row-even:hover { background: rgba(30,41,59,.5) !important; }
      .dark .jh-row-odd:hover  { background: rgba(51,65,85,.5) !important; }
      .jh-group-sep td { border-top: 2px solid #94a3b8 !important; }
      .dark .jh-group-sep td { border-top-color: #475569 !important; }
      input[type="checkbox"].jh-check { width:1rem; height:1rem; cursor:pointer; accent-color:#2563eb; }
    </style>
    <div class="table-wrapper">
      <table><thead><tr>
        <th style="width:2.5rem;">
          <input type="checkbox" class="jh-check" id="jh-check-all" title="Pilih semua" onchange="toggleSelectAllJadwal(this)"/>
        </th>
        <th>Tanggal</th><th>SPBE</th><th>Rit</th><th>Nama Pangkalan</th>
        <th>Target Kirim</th><th>Retur</th><th>Driver 1</th><th>Driver 2 / Kernet</th>
        <th class="text-right">Aksi</th>
      </tr></thead>
      <tbody id="jh-tbody"></tbody></table>
    </div>`;
  await fetchJadwalHarian();
}

async function fetchJadwalHarian() {
  const tbody = document.getElementById('jh-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="10">${skLine()}</td></tr>`;
  const params = { tanggal: document.getElementById('jh-tgl')?.value || undefined, bulan: document.getElementById('jh-bln')?.value || undefined };
  if (params.tanggal) delete params.bulan;

  const res = await API.operator.getJadwalHarian(params);
  if (activeSection !== 'jadwal-harian') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const body = document.getElementById('jh-tbody');
  if (!body) return;

  const jadwal = res.data.jadwal;
  if (!jadwal.length) {
    body.innerHTML = `<tr><td colspan="10">${UI.emptyState('Belum ada jadwal.','📋')}</td></tr>`;
    return;
  }

  // Tentukan warna grup: setiap kombinasi SPBE+Rit yang berbeda berganti warna
  let groupIndex = -1;
  let lastGroupKey = null;

  body.innerHTML = jadwal.map((j, i) => {
    const groupKey = `${j.spbe_nama}|||${j.rit}`;
    const isNewGroup = groupKey !== lastGroupKey;
    if (isNewGroup) { groupIndex++; lastGroupKey = groupKey; }

    const rowClass = groupIndex % 2 === 0 ? 'jh-row-even' : 'jh-row-odd';
    const sepClass = isNewGroup && i > 0 ? 'jh-group-sep' : '';

    return `
    <tr class="${rowClass} ${sepClass}" style="border-top:none;">
      <td style="text-align:center;">
        <input type="checkbox" class="jh-check jh-row-check" data-id="${j.jadwal_id}" onchange="onJadwalCheckChange()"/>
      </td>
      <td class="text-xs text-slate-500">${UI.formatDateShort(j.tanggal)}</td>
      <td class="text-xs font-medium text-slate-700 dark:text-slate-300">${UI.escapeHtml(j.spbe_nama)}</td>
      <td class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(String(j.rit))}</td>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(j.pangkalan_nama)}</td>
      <td>${j.jumlah_kirim} <span class="text-slate-400 text-xs">tab</span></td>
      <td>${j.jumlah_retur || 0} <span class="text-slate-400 text-xs">tab</span></td>
      <td class="text-sm">${UI.escapeHtml(j.driver1_nama)}</td>
      <td class="text-sm">${j.driver2_nama && j.driver2_nama !== '-' ? UI.escapeHtml(j.driver2_nama) : '-'}</td>
      <td class="text-right">
        <button class="btn-danger text-xs py-1 px-2" onclick="deleteJadwalHarian('${j.jadwal_id}')">Hapus</button>
      </td>
    </tr>`;
  }).join('');

  // Reset tombol hapus terpilih
  _updateBulkDeleteBtn();
}

// ── Checkbox helpers ──

function onJadwalCheckChange() {
  const all   = document.querySelectorAll('.jh-row-check');
  const allCb = document.getElementById('jh-check-all');
  if (allCb) allCb.checked = all.length > 0 && [...all].every(c => c.checked);
  _updateBulkDeleteBtn();
}

function toggleSelectAllJadwal(masterCb) {
  document.querySelectorAll('.jh-row-check').forEach(c => { c.checked = masterCb.checked; });
  _updateBulkDeleteBtn();
}

function _updateBulkDeleteBtn() {
  const selected = document.querySelectorAll('.jh-row-check:checked');
  const btn      = document.getElementById('jh-hapus-btn');
  const count    = document.getElementById('jh-hapus-count');
  if (!btn) return;
  if (selected.length > 0) {
    btn.classList.remove('hidden');
    if (count) count.textContent = selected.length;
  } else {
    btn.classList.add('hidden');
  }
}

async function deleteSelectedJadwal() {
  const checked = [...document.querySelectorAll('.jh-row-check:checked')];
  if (!checked.length) return;
  const ok = await UI.confirm(`Hapus ${checked.length} jadwal yang dipilih? Tindakan ini tidak bisa dibatalkan.`, 'Konfirmasi Hapus');
  if (!ok) return;

  const ids = checked.map(c => c.dataset.id);
  let deleted = 0, failed = 0;
  for (const id of ids) {
    const res = await API.operator.deleteJadwalHarian({ jadwal_id: id });
    if (res.success) deleted++; else failed++;
  }
  if (deleted) UI.toast(`${deleted} jadwal berhasil dihapus.${failed ? ` ${failed} gagal.` : ''}`, deleted ? 'success' : 'error');
  fetchJadwalHarian();
}

function openJadwalModal() {
  const modal = document.createElement('div');
  modal.id    = 'jh-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <h3 class="font-semibold text-slate-900 dark:text-white">Tambah Jadwal Harian</h3>
        <button class="btn-icon" onclick="document.getElementById('jh-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Tanggal *</label><input id="jm-tgl" type="date" class="form-input" value="${UI.todayInputValue()}"/></div>
          <div><label class="form-label">Rit *</label><input id="jm-rit" type="number" class="form-input" value="1" min="1"/></div>
        </div>
        <div><label class="form-label">Pangkalan *</label>
          <select id="jm-pangkalan" class="form-select"><option value="">Memuat...</option></select>
        </div>
        <div><label class="form-label">SPBE *</label>
          <select id="jm-spbe" class="form-select"><option value="">Memuat...</option></select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Target Kirim *</label><input id="jm-kirim" type="number" class="form-input" placeholder="0" min="0"/></div>
          <div><label class="form-label">Target Retur</label><input id="jm-retur" type="number" class="form-input" placeholder="0" min="0"/></div>
        </div>
        <div><label class="form-label">Driver 1 *</label>
          <select id="jm-driver1" class="form-select"><option value="">Memuat...</option></select>
        </div>
        <div><label class="form-label">Driver 2 / Kernet</label>
          <select id="jm-driver2" class="form-select"><option value="">-- Opsional --</option></select>
        </div>
        <div><label class="form-label">Keterangan</label><input id="jm-ket" class="form-input" placeholder="Opsional..."/></div>
        <div id="jm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="jm-btn" class="btn-primary w-full justify-center" onclick="saveJadwal()">Simpan Jadwal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  loadJadwalDropdowns();
}

async function loadJadwalDropdowns() {
  const [pangRes, spbeRes, userRes] = await Promise.all([
    API.operator.getPangkalan({ status: 'ACTIVE' }),
    API.operator.getSPBE({ status: 'ACTIVE' }),
    API.hrd.getUsers({ role: 'DRIVER', status: 'ACTIVE' }),
  ]);
  // Modal mungkin sudah ditutup user selagi request berjalan — cek dulu sebelum mengisi dropdown.
  if (!document.getElementById('jh-modal')) return;

  const fill = (id, items, valKey, labelKey) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">-- Pilih --</option>` + (items || []).map(i => `<option value="${i[valKey]}">${i[labelKey]}</option>`).join('');
  };
  if (pangRes.success) fill('jm-pangkalan', pangRes.data.pangkalan, 'pangkalan_id', 'nama');
  if (spbeRes.success) fill('jm-spbe', spbeRes.data.spbe, 'spbe_id', 'nama');
  if (userRes.success) {
    const drivers = userRes.data.users;
    fill('jm-driver1', drivers, 'user_id', 'nama');
    const driver2El = document.getElementById('jm-driver2');
    if (driver2El) {
      driver2El.innerHTML =
        `<option value="">-- Opsional --</option>` +
        drivers.map(d => `<option value="${d.user_id}">${d.nama}</option>`).join('');
    }
  }
}

async function saveJadwal() {
  const btn   = document.getElementById('jm-btn');
  const errEl = document.getElementById('jm-err');
  errEl.classList.add('hidden');
  const body = {
    tanggal: document.getElementById('jm-tgl').value,
    rit: Number(document.getElementById('jm-rit').value),
    pangkalan_id: document.getElementById('jm-pangkalan').value,
    spbe_id: document.getElementById('jm-spbe').value,
    jumlah_kirim: Number(document.getElementById('jm-kirim').value),
    jumlah_retur: Number(document.getElementById('jm-retur').value || 0),
    driver1_id: document.getElementById('jm-driver1').value,
    driver2_id: document.getElementById('jm-driver2').value,
    keterangan: document.getElementById('jm-ket').value.trim(),
  };
  if (!body.tanggal || !body.pangkalan_id || !body.driver1_id) {
    errEl.textContent = 'Tanggal, pangkalan, dan driver 1 wajib diisi.';
    errEl.classList.remove('hidden'); return;
  }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = await API.operator.createJadwalHarian(body);
  UI.setLoading(btn, false);
  if (res.success) {
    UI.toast('Jadwal berhasil ditambahkan.', 'success');
    document.getElementById('jh-modal')?.remove();
    if (activeSection === 'jadwal-harian') fetchJadwalHarian();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function deleteJadwalHarian(id) {
  if (!await UI.confirm('Hapus jadwal ini?', 'Konfirmasi Hapus')) return;
  const res = await API.operator.deleteJadwalHarian({ jadwal_id: id });
  if (res.success) {
    UI.toast('Jadwal dihapus.', 'success');
    if (activeSection === 'jadwal-harian') fetchJadwalHarian();
  } else {
    UI.toast(res.message, 'error');
  }
}

// ============================================================
// LAPORAN PENGIRIMAN
// ============================================================

async function loadLaporan() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Laporan Pengiriman</h2><p class="page-sub">Daftar laporan pengiriman dari semua driver.</p></div>
    <div class="filter-bar">
      <input type="date" id="lp-tgl" class="form-input w-44" onchange="fetchLaporan()"/>
      <input type="month" id="lp-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchLaporan()"/>
      <select id="lp-status" class="form-select w-36" onchange="fetchLaporan()">
        <option value="">Semua Status</option><option>SUBMITTED</option><option>VERIFIED</option><option>REVISED</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table><thead><tr><th>Tanggal</th><th>Driver</th><th>Pangkalan</th><th>Kirim</th><th>Retur</th><th>Status</th><th>Foto</th><th class="text-right">Aksi</th></tr></thead>
      <tbody id="lp-tbody"></tbody></table>
    </div>`;
  await fetchLaporan();
}

async function fetchLaporan() {
  const tbody = document.getElementById('lp-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8">${skLine()}</td></tr>`;
  const params = {
    tanggal: document.getElementById('lp-tgl')?.value || undefined,
    bulan:   document.getElementById('lp-bln')?.value || undefined,
    status:  document.getElementById('lp-status')?.value || undefined,
  };
  if (params.tanggal) delete params.bulan;

  const res = await API.operator.getLaporanPengiriman(params);
  if (activeSection !== 'laporan-pengiriman') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const body = document.getElementById('lp-tbody');
  if (!body) return;
  body.innerHTML = res.data.laporan.length ? res.data.laporan.map(l => `
    <tr>
      <td class="text-xs text-slate-500">${UI.formatDateShort(l.tanggal)}<br/><span class="font-mono">${l.jam_laporan || ''}</span></td>
      <td class="font-medium text-slate-900 dark:text-white text-sm">${l.driver_nama}</td>
      <td class="text-sm">${l.pangkalan_nama}</td>
      <td class="font-semibold">${l.jumlah_kirim}</td>
      <td class="text-slate-500">${l.jumlah_retur || 0}</td>
      <td>${UI.badge(l.status, l.status)}</td>
      <td class="text-xs space-x-1">
        ${l.foto_pengiriman_url ? `<a href="${l.foto_pengiriman_url}" target="_blank" class="text-blue-500 hover:underline">📷</a>` : ''}
        ${l.foto_pangkalan_url  ? `<a href="${l.foto_pangkalan_url}" target="_blank" class="text-blue-500 hover:underline">🏪</a>` : ''}
      </td>
      <td class="text-right">
        <div class="flex gap-1 justify-end">
          <button class="btn-secondary text-xs py-1 px-2" onclick="verifikasiLaporan('${l.laporan_id}')">Verifikasi</button>
          <button class="btn-danger text-xs py-1 px-2"    onclick="hapusLaporan('${l.laporan_id}')">Hapus</button>
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="8">${UI.emptyState('Belum ada laporan.','📋')}</td></tr>`;
}

async function verifikasiLaporan(id) {
  const res = await API.operator.updateLaporanPengiriman({ laporan_id: id, status: 'VERIFIED' });
  if (res.success) {
    UI.toast('Laporan diverifikasi.', 'success');
    if (activeSection === 'laporan-pengiriman') fetchLaporan();
  } else {
    UI.toast(res.message, 'error');
  }
}

async function hapusLaporan(id) {
  if (!await UI.confirm('Hapus laporan ini?', 'Konfirmasi')) return;
  const res = await API.operator.deleteLaporanPengiriman({ laporan_id: id });
  if (res.success) {
    UI.toast('Laporan dihapus.', 'success');
    if (activeSection === 'laporan-pengiriman') fetchLaporan();
  } else {
    UI.toast(res.message, 'error');
  }
}

// ============================================================
// MONITORING PENGIRIMAN
// ============================================================

async function loadMonitoringKirim() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Monitoring Pengiriman</h2><p class="page-sub">Perbandingan Master SA vs Jadwal Harian vs Laporan Realisasi.</p></div>
    <div class="filter-bar">
      <input type="month" id="mk-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchMonitoringKirim()"/>
    </div>
    <div id="mk-summary" class="grid grid-cols-3 gap-4 mb-4">${skCards(3)}</div>
    <div class="table-wrapper">
      <table><thead><tr>
        <th>Pangkalan</th>
        <th class="text-center">Alokasi SA</th>
        <th class="text-center">Dijadwalkan</th>
        <th class="text-center">Terkirim</th>
        <th class="text-center">Retur</th>
        <th class="text-center">Selisih SA</th>
        <th class="text-center">Selisih Jadwal</th>
      </tr></thead>
      <tbody id="mk-tbody"></tbody></table>
    </div>`;
  await fetchMonitoringKirim();
}

async function fetchMonitoringKirim() {
  const bulan = document.getElementById('mk-bln')?.value || UI.currentMonthValue();
  const [year, month] = bulan.split('-');
  const tbody = document.getElementById('mk-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7">${skLine()}</td></tr>`;

  const res = await API.operator.getMonitoringPengiriman({ bulan: month, tahun: year });
  if (activeSection !== 'monitoring-kirim') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const data  = res.data.monitoring;
  const total = { sa: 0, jadwal: 0, kirim: 0, retur: 0 };
  data.forEach(d => { total.sa += d.total_sa; total.jadwal += d.total_jadwal; total.kirim += d.total_kirim; total.retur += d.total_retur; });

  const summaryEl = document.getElementById('mk-summary');
  if (!summaryEl) return;
  summaryEl.innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-slate-100 dark:bg-slate-800">📊</div><div><div class="stat-label">Total Alokasi SA</div><div class="stat-value">${UI.formatNumber(total.sa)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📋</div><div><div class="stat-label">Total Dijadwalkan</div><div class="stat-value">${UI.formatNumber(total.jadwal)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div><div><div class="stat-label">Total Terkirim</div><div class="stat-value text-green-600">${UI.formatNumber(total.kirim)}</div></div></div>`;

  const body = document.getElementById('mk-tbody');
  if (!body) return;
  body.innerHTML = data.length ? data.map(d => {
    const selisihSA     = d.selisih_sa_kirim;
    const selisihJadwal = d.selisih_jadwal_kirim;
    return `
      <tr>
        <td class="font-medium text-slate-900 dark:text-white">${d.nama}</td>
        <td class="text-center">${UI.formatNumber(d.total_sa)}</td>
        <td class="text-center">${UI.formatNumber(d.total_jadwal)}</td>
        <td class="text-center font-semibold">${UI.formatNumber(d.total_kirim)}</td>
        <td class="text-center text-slate-500">${UI.formatNumber(d.total_retur)}</td>
        <td class="text-center ${selisihSA > 0 ? 'text-red-500' : selisihSA < 0 ? 'text-amber-500' : 'text-green-600'} font-semibold">${selisihSA > 0 ? '+' : ''}${UI.formatNumber(selisihSA)}</td>
        <td class="text-center ${selisihJadwal > 0 ? 'text-red-500' : selisihJadwal < 0 ? 'text-amber-500' : 'text-green-600'} font-semibold">${selisihJadwal > 0 ? '+' : ''}${UI.formatNumber(selisihJadwal)}</td>
      </tr>`;
  }).join('') : `<tr><td colspan="7">${UI.emptyState('Belum ada data monitoring.','📊')}</td></tr>`;
}

// ============================================================
// MASTER SA
// ============================================================

async function loadMasterSA() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Master SA</h2><p class="page-sub">Alokasi bulanan per pangkalan (tgl 1-31).</p></div>
    <div class="filter-bar">
      <input type="month" id="sa-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchMasterSA()"/>
    </div>
    <div id="sa-container" class="table-wrapper overflow-x-auto">
      <div class="animate-pulse p-4 text-slate-400">Memuat data...</div>
    </div>`;
  await fetchMasterSA();
}

async function fetchMasterSA() {
  const bulan = document.getElementById('sa-bln')?.value || UI.currentMonthValue();
  const [year, month] = bulan.split('-');
  const res = await API.operator.getMasterSA({ bulan: month, tahun: year });
  if (activeSection !== 'master-sa') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const data = res.data.master_sa;
  const days = Array.from({length: 31}, (_, i) => i + 1);

  const containerEl = document.getElementById('sa-container');
  if (!containerEl) return;
  containerEl.innerHTML = data.length ? `
    <table style="min-width:900px">
      <thead><tr>
        <th>Pangkalan</th>
        ${days.map(d => `<th class="text-center text-xs">${d}</th>`).join('')}
        <th class="text-center">Total</th>
      </tr></thead>
      <tbody>
        ${data.map(row => {
          let total = 0;
          const cells = days.map(d => {
            const key = `tgl_${String(d).padStart(2,'0')}`;
            const val = Number(row[key] || 0);
            total += val;
            return `<td class="text-center text-xs ${val > 0 ? 'font-semibold text-blue-700 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}">${val || ''}</td>`;
          }).join('');
          return `<tr><td class="font-medium text-slate-900 dark:text-white">${row.pangkalan_nama}</td>${cells}<td class="text-center font-bold text-blue-600">${total}</td></tr>`;
        }).join('')}
      </tbody>
    </table>` : UI.emptyState('Belum ada data Master SA untuk bulan ini.','📊');
}

// ============================================================
// PEMBAYARAN
// ============================================================

async function loadPembayaran(tipe) {
  const label = tipe === 'REFILL' ? 'Pembayaran Refill' : 'Pembayaran Bagi Hasil';
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">${label}</h2><p class="page-sub">Tagihan dan realisasi pembayaran pangkalan.</p></div>
    <div class="filter-bar">
      <input type="month" id="bp-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchPembayaran('${tipe}')"/>
    </div>
    <div id="bp-summary" class="grid grid-cols-3 gap-4 mb-4">${skCards(3)}</div>
    <div id="bp-list" class="space-y-3">${skList(4)}</div>`;
  await fetchPembayaran(tipe);
}

async function fetchPembayaran(tipe) {
  const bulan = document.getElementById('bp-bln')?.value || UI.currentMonthValue();
  const fn    = tipe === 'REFILL' ? API.operator.getPembayaranRefill : API.operator.getPembayaranBagiHasil;
  const res   = await fn({ bulan });
  if (activeSection !== sectionForTipe(tipe)) return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const data = res.data.pembayaran || [];
  const totalTagihan = data.reduce((s, d) => s + (d.tagihan || 0), 0);
  const totalBayar   = data.reduce((s, d) => s + (d.total_bayar || 0), 0);
  const lunas        = data.filter(d => d.status === 'LUNAS').length;

  const summaryEl = document.getElementById('bp-summary');
  if (!summaryEl) return;
  summaryEl.innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-slate-100 dark:bg-slate-800">💰</div><div><div class="stat-label">Total Tagihan</div><div class="stat-value text-lg">${UI.formatRupiah(totalTagihan)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div><div><div class="stat-label">Total Terbayar</div><div class="stat-value text-lg text-green-600">${UI.formatRupiah(totalBayar)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">🏦</div><div><div class="stat-label">Pangkalan Lunas</div><div class="stat-value">${lunas}/${data.length}</div></div></div>`;

  const listEl = document.getElementById('bp-list');
  if (!listEl) return;
  listEl.innerHTML = data.length ? data.map(d => `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-slate-900 dark:text-white">${d.nama}</span>
            ${UI.badge(d.status, d.status)}
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
            <div class="text-slate-500">Terkirim: <span class="font-medium text-slate-700 dark:text-slate-300">${d.total_kirim} tab</span></div>
            <div class="text-slate-500">Harga/tab: <span class="font-medium">${UI.formatRupiah(d.harga)}</span></div>
            <div class="text-slate-500">Tagihan: <span class="font-semibold text-red-600">${UI.formatRupiah(d.tagihan)}</span></div>
            <div class="text-slate-500">Terbayar: <span class="font-semibold text-green-600">${UI.formatRupiah(d.total_bayar)}</span></div>
            ${d.sisa > 0 ? `<div class="col-span-2 text-slate-500">Sisa: <span class="font-semibold text-amber-600">${UI.formatRupiah(d.sisa)}</span></div>` : ''}
          </div>
        </div>
        ${d.status !== 'LUNAS' ? `
          <button class="btn-primary text-xs py-2 px-3 shrink-0" onclick="openPembayaranModal('${d.pangkalan_id}','${tipe}','${d.nama}')">Bayar</button>` : ''}
      </div>
    </div>`).join('') : UI.emptyState('Belum ada data pembayaran.', '💰');
}

function openPembayaranModal(pangkalanId, tipe, namaPangkalan) {
  const isRefill = tipe === 'REFILL';
  const modal = document.createElement('div');
  modal.id    = 'pay-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Catat Pembayaran — ${namaPangkalan}</h3>
        <button class="btn-icon" onclick="document.getElementById('pay-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Tanggal Bayar *</label><input id="pay-tgl" type="date" class="form-input" value="${UI.todayInputValue()}"/></div>
        <div class="bg-blue-50 dark:bg-blue-950/30 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          ${isRefill ? '💡 Bisa via Brimola, Transfer, atau keduanya.' : '⚠️ Bagi Hasil wajib via Transfer + bukti TF.'}
        </div>
        ${isRefill ? `
          <div><label class="form-label">Nominal Brimola (opsional)</label>
            <input id="pay-brimola" type="number" class="form-input" placeholder="0" min="0"/>
          </div>` : ''}
        <div><label class="form-label">Nominal Transfer ${!isRefill ? ' *' : '(opsional)'}</label>
          <input id="pay-transfer" type="number" class="form-input" placeholder="0" min="0"/>
        </div>
        ${!isRefill ? `
          <div><label class="form-label">Bukti Transfer *</label>
            <input id="pay-bukti" type="url" class="form-input" placeholder="URL bukti TF di Drive..."/>
          </div>` : ''}
        <div id="pay-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="pay-btn" class="btn-primary w-full justify-center" onclick="savePembayaran('${pangkalanId}','${tipe}')">Simpan Pembayaran</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function savePembayaran(pangkalanId, tipe) {
  const btn       = document.getElementById('pay-btn');
  const errEl     = document.getElementById('pay-err');
  errEl.classList.add('hidden');
  const isRefill  = tipe === 'REFILL';
  const tanggal   = document.getElementById('pay-tgl').value;
  const brimola   = Number(document.getElementById('pay-brimola')?.value || 0);
  const transfer  = Number(document.getElementById('pay-transfer')?.value || 0);
  const buktiUrl  = document.getElementById('pay-bukti')?.value.trim() || '';

  if (!isRefill && transfer <= 0) { errEl.textContent = 'Nominal transfer wajib untuk Bagi Hasil.'; errEl.classList.remove('hidden'); return; }
  if (!isRefill && !buktiUrl)     { errEl.textContent = 'Bukti transfer wajib untuk Bagi Hasil.'; errEl.classList.remove('hidden'); return; }
  if (isRefill && brimola <= 0 && transfer <= 0) { errEl.textContent = 'Isi minimal satu metode pembayaran.'; errEl.classList.remove('hidden'); return; }

  UI.setLoading(btn, true, 'Menyimpan...');
  const fn  = tipe === 'REFILL' ? API.operator.createPembayaranRefill : API.operator.createPembayaranBagiHasil;
  const res = await fn({ pangkalan_id: pangkalanId, laporan_id: '', tanggal_bayar: tanggal, nominal_brimola: brimola, nominal_transfer: transfer, bukti_tf_url: buktiUrl });
  UI.setLoading(btn, false);
  if (res.success) {
    UI.toast('Pembayaran berhasil dicatat.', 'success');
    document.getElementById('pay-modal')?.remove();
    if (activeSection === sectionForTipe(tipe)) fetchPembayaran(tipe);
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

// ============================================================
// MONITORING PEMBAYARAN
// ============================================================

async function loadMonitoringBayar() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Monitoring Pembayaran</h2><p class="page-sub">Rekap semua pembayaran pangkalan dalam satu bulan.</p></div>
    <div class="filter-bar">
      <input type="month" id="mb-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchMonitoringBayar()"/>
    </div>
    <div id="mb-grand" class="card mb-4 hidden"></div>
    <div id="mb-list" class="space-y-3">${skList(4)}</div>`;
  await fetchMonitoringBayar();
}

async function fetchMonitoringBayar() {
  const bulan = document.getElementById('mb-bln')?.value || UI.currentMonthValue();
  const res   = await API.operator.getMonitoringPembayaran({ bulan });
  if (activeSection !== 'monitoring-bayar') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const { monitoring, grand_total } = res.data;
  const grandEl = document.getElementById('mb-grand');
  if (!grandEl) return;
  grandEl.classList.remove('hidden');
  grandEl.innerHTML = `
    <div class="flex items-center justify-between">
      <div><div class="text-xs text-slate-500 uppercase font-semibold tracking-wide">Grand Total Pembayaran</div><div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">${UI.formatRupiah(grand_total)}</div></div>
      <div class="text-3xl">💰</div>
    </div>`;

  const listEl = document.getElementById('mb-list');
  if (!listEl) return;
  listEl.innerHTML = monitoring.length ? monitoring.map(m => `
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-slate-900 dark:text-white">${m.nama}</h4>
        <span class="font-bold text-slate-700 dark:text-slate-300">${UI.formatRupiah(m.total_semua)}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm text-slate-500">
        <div>Refill: <span class="font-medium text-slate-700 dark:text-slate-300">${UI.formatRupiah(m.total_refill)}</span></div>
        <div>Bagi Hasil: <span class="font-medium text-slate-700 dark:text-slate-300">${UI.formatRupiah(m.total_bagi_hasil)}</span></div>
      </div>
    </div>`).join('') : UI.emptyState('Belum ada data pembayaran bulan ini.','💰');
}

// ============================================================
// STOK GUDANG
// ============================================================

let _spbeNameMap = {};

async function loadStokGudang() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Stok Gudang</h2><p class="page-sub">Kalkulasi stok refill: pembelian dikurangi pengiriman bersih.</p></div>
      <button class="btn-primary" onclick="openPembelianModal()">+ Tambah Pembelian</button>
    </div>
    <div class="filter-bar">
      <input type="month" id="sg-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchStok()"/>
    </div>
    <div id="sg-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">${skCards(4)}</div>
    <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Riwayat Pembelian</h3>
    <div class="table-wrapper">
      <table><thead><tr><th>Tanggal</th><th>SPBE</th><th>Jumlah</th><th>Harga/tab</th><th>Total</th><th>Keterangan</th><th class="text-right">Aksi</th></tr></thead>
      <tbody id="sg-tbody"></tbody></table>
    </div>`;
  await fetchStok();
}

async function fetchStok() {
  const bulan = document.getElementById('sg-bln')?.value;
  const tbody = document.getElementById('sg-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7">${skLine()}</td></tr>`;

  // Ambil daftar SPBE untuk resolve nama (data pembelian cuma punya spbe_id).
  const spbeRes = await API.operator.getSPBE();
  if (activeSection !== 'stok-gudang') return;
  if (spbeRes.success) {
    _spbeNameMap = {};
    spbeRes.data.spbe.forEach(s => { _spbeNameMap[s.spbe_id] = s.nama; });
  }

  const res = await API.operator.getStokGudang({ bulan });
  if (activeSection !== 'stok-gudang') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const { total_pembelian, total_terkirim, total_retur, stok_gudang, pembelian } = res.data;
  const stokColor = stok_gudang < 0 ? 'text-red-600' : stok_gudang < 100 ? 'text-amber-600' : 'text-green-600';

  const statsEl = document.getElementById('sg-stats');
  if (!statsEl) return;
  statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📦</div><div><div class="stat-label">Total Beli</div><div class="stat-value">${UI.formatNumber(total_pembelian)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">🚚</div><div><div class="stat-label">Terkirim</div><div class="stat-value">${UI.formatNumber(total_terkirim)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-amber-100 dark:bg-amber-900/40">↩️</div><div><div class="stat-label">Retur</div><div class="stat-value">${UI.formatNumber(total_retur)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-slate-100 dark:bg-slate-800">🏭</div><div><div class="stat-label">Stok Gudang</div><div class="stat-value ${stokColor}">${UI.formatNumber(stok_gudang)}</div></div></div>`;

  const body = document.getElementById('sg-tbody');
  if (!body) return;
  body.innerHTML = pembelian?.length ? pembelian.map(p => `
    <tr>
      <td class="text-xs text-slate-500">${UI.formatDateShort(p.tanggal)}</td>
      <td>${_spbeNameMap[p.spbe_id] || p.spbe_id}</td>
      <td class="font-semibold">${UI.formatNumber(p.jumlah)}</td>
      <td class="text-slate-500">${UI.formatRupiah(p.harga_satuan)}</td>
      <td class="font-semibold">${UI.formatRupiah(p.total)}</td>
      <td class="text-slate-500 text-sm">${p.keterangan || '-'}</td>
      <td class="text-right">
        <button class="btn-danger text-xs py-1 px-2" onclick="hapusPembelian('${p.pembelian_id}')">Hapus</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="7">${UI.emptyState('Belum ada pembelian.','📦')}</td></tr>`;
}

function openPembelianModal() {
  const modal = document.createElement('div');
  modal.id    = 'beli-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Tambah Pembelian Stok</h3>
        <button class="btn-icon" onclick="document.getElementById('beli-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">SPBE *</label><select id="bm-spbe" class="form-select"><option value="">Memuat...</option></select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Tanggal *</label><input id="bm-tgl" type="date" class="form-input" value="${UI.todayInputValue()}"/></div>
          <div><label class="form-label">Jumlah (tabung) *</label><input id="bm-jml" type="number" class="form-input" placeholder="0" min="1"/></div>
        </div>
        <div><label class="form-label">Harga/tabung *</label><input id="bm-harga" type="number" class="form-input" placeholder="0" min="0"/></div>
        <div><label class="form-label">Keterangan</label><input id="bm-ket" class="form-input" placeholder="Opsional..."/></div>
        <div id="bm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="bm-btn" class="btn-primary w-full justify-center" onclick="savePembelian()">Simpan Pembelian</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  API.operator.getSPBE({ status: 'ACTIVE' }).then(res => {
    const el = document.getElementById('bm-spbe');
    if (!el) return; // modal sudah ditutup sebelum request selesai
    if (res.success) {
      el.innerHTML = `<option value="">-- Pilih SPBE --</option>` + res.data.spbe.map(s => `<option value="${s.spbe_id}">${s.nama}</option>`).join('');
    }
  });
}

async function savePembelian() {
  const btn   = document.getElementById('bm-btn');
  const errEl = document.getElementById('bm-err');
  errEl.classList.add('hidden');
  const body  = { spbe_id: document.getElementById('bm-spbe').value, tanggal: document.getElementById('bm-tgl').value, jumlah: Number(document.getElementById('bm-jml').value), harga_satuan: Number(document.getElementById('bm-harga').value), keterangan: document.getElementById('bm-ket').value.trim() };
  if (!body.spbe_id || !body.jumlah || !body.harga_satuan) { errEl.textContent = 'SPBE, jumlah, dan harga wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = await API.operator.createPembelianStok(body);
  UI.setLoading(btn, false);
  if (res.success) {
    UI.toast('Pembelian berhasil dicatat.', 'success');
    document.getElementById('beli-modal')?.remove();
    if (activeSection === 'stok-gudang') fetchStok();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function hapusPembelian(id) {
  if (!await UI.confirm('Hapus data pembelian ini?')) return;
  const res = await API.operator.deletePembelianStok({ pembelian_id: id });
  if (res.success) {
    UI.toast('Pembelian dihapus.', 'success');
    if (activeSection === 'stok-gudang') fetchStok();
  } else {
    UI.toast(res.message, 'error');
  }
}

// ============================================================
// PANGKALAN
// ============================================================

let _allPangkalan = [];

async function loadPangkalan() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Manajemen Pangkalan</h2><p class="page-sub">Kelola data pangkalan gas.</p></div>
      <button class="btn-primary" onclick="openPangkalanModal()">+ Tambah Pangkalan</button>
    </div>
    <div class="filter-bar">
      <input type="text" id="pkln-search" class="form-input w-48" placeholder="Cari pangkalan..." oninput="filterPangkalan()"/>
      <select id="pkln-status" class="form-select w-36" onchange="filterPangkalan()"><option value="ACTIVE">Aktif</option><option value="">Semua</option><option value="INACTIVE">Nonaktif</option></select>
    </div>
    <div class="table-wrapper">
      <table><thead><tr><th>Nama</th><th>ID Reg</th><th>Tipe Bayar</th><th>Harga Refill</th><th>Harga BH</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
      <tbody id="pkln-tbody"></tbody></table>
    </div>`;
  await fetchPangkalan();
}

async function fetchPangkalan() {
  const tbody = document.getElementById('pkln-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7">${skLine()}</td></tr>`;

  const res = await API.operator.getPangkalan();
  if (activeSection !== 'pangkalan') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  _allPangkalan = res.data.pangkalan;
  filterPangkalan();
}

function filterPangkalan() {
  const q = document.getElementById('pkln-search')?.value.toLowerCase() || '';
  const s = document.getElementById('pkln-status')?.value || '';
  const filtered = _allPangkalan.filter(p => (!q || p.nama.toLowerCase().includes(q) || p.id_reg.toLowerCase().includes(q)) && (!s || p.status === s));
  const tbody = document.getElementById('pkln-tbody');
  if (!tbody) return;
  tbody.innerHTML = filtered.length ? filtered.map(p => `
    <tr>
      <td class="font-medium text-slate-900 dark:text-white">${p.nama}</td>
      <td class="font-mono text-xs text-slate-500">${p.id_reg}</td>
      <td>${UI.badge(p.tipe_pembayaran, null)}</td>
      <td class="text-sm">${UI.formatRupiah(p.harga_refill)}</td>
      <td class="text-sm">${UI.formatRupiah(p.harga_bagi_hasil)}</td>
      <td>${UI.badge(p.status, p.status)}</td>
      <td class="text-right">
        <div class="flex gap-1 justify-end">
          <button class="btn-secondary text-xs py-1 px-2" onclick="openPangkalanModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">Edit</button>
          <button class="btn-danger text-xs py-1 px-2"    onclick="hapusPangkalan('${p.pangkalan_id}','${p.nama}')">Nonaktifkan</button>
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="7">${UI.emptyState('Tidak ada pangkalan.','🏪')}</td></tr>`;
}

function openPangkalanModal(data = null) {
  const modal = document.createElement('div');
  modal.id    = 'pkln-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <h3 class="font-semibold text-slate-900 dark:text-white">${data ? 'Edit' : 'Tambah'} Pangkalan</h3>
        <button class="btn-icon" onclick="document.getElementById('pkln-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Nama Pangkalan *</label><input id="pkln-nama" class="form-input" value="${data?.nama||''}" placeholder="Nama Pangkalan"/></div>
          <div><label class="form-label">ID Registrasi *</label><input id="pkln-idreg" class="form-input" value="${data?.id_reg||''}" placeholder="REG-001"/></div>
        </div>
        <div><label class="form-label">Alamat</label><input id="pkln-alamat" class="form-input" value="${data?.alamat||''}" placeholder="Alamat lengkap..."/></div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="form-label">Tipe Bayar</label>
            <select id="pkln-tipe" class="form-select">
              <option ${data?.tipe_pembayaran==='REFILL'?'selected':''}>REFILL</option>
              <option ${data?.tipe_pembayaran==='BAGI_HASIL'?'selected':''}>BAGI_HASIL</option>
              <option ${data?.tipe_pembayaran==='KEDUANYA'?'selected':''}>KEDUANYA</option>
            </select>
          </div>
          <div><label class="form-label">Harga Refill/tab</label><input id="pkln-hrefill" type="number" class="form-input" value="${data?.harga_refill||0}" min="0"/></div>
          <div><label class="form-label">Harga BH/tab</label><input id="pkln-hbh" type="number" class="form-input" value="${data?.harga_bagi_hasil||0}" min="0"/></div>
        </div>
        <div id="pkln-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="pkln-btn" class="btn-primary w-full justify-center" onclick="savePangkalan('${data?.pangkalan_id||''}')">
          ${data ? 'Simpan Perubahan' : 'Tambah Pangkalan'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function savePangkalan(id) {
  const btn   = document.getElementById('pkln-btn');
  const errEl = document.getElementById('pkln-err');
  errEl.classList.add('hidden');
  const body = { nama: document.getElementById('pkln-nama').value.trim(), id_reg: document.getElementById('pkln-idreg').value.trim(), alamat: document.getElementById('pkln-alamat').value.trim(), tipe_pembayaran: document.getElementById('pkln-tipe').value, harga_refill: Number(document.getElementById('pkln-hrefill').value), harga_bagi_hasil: Number(document.getElementById('pkln-hbh').value) };
  if (!body.nama || !body.id_reg) { errEl.textContent = 'Nama dan ID Registrasi wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = id ? await API.operator.updatePangkalan({ pangkalan_id: id, ...body }) : await API.operator.createPangkalan(body);
  UI.setLoading(btn, false);
  if (res.success) {
    UI.toast(id ? 'Pangkalan diupdate.' : 'Pangkalan ditambahkan.', 'success');
    document.getElementById('pkln-modal')?.remove();
    if (activeSection === 'pangkalan') fetchPangkalan();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function hapusPangkalan(id, nama) {
  if (!await UI.confirm(`Nonaktifkan pangkalan "${nama}"?`)) return;
  const res = await API.operator.deletePangkalan({ pangkalan_id: id });
  if (res.success) {
    UI.toast('Pangkalan dinonaktifkan.', 'success');
    if (activeSection === 'pangkalan') fetchPangkalan();
  } else {
    UI.toast(res.message, 'error');
  }
}

// ============================================================
// SPBE
// ============================================================

async function loadSPBE() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Manajemen SPBE</h2><p class="page-sub">Kelola data Stasiun Pengisian Bulk Elpiji.</p></div>
      <button class="btn-primary" onclick="openSPBEModal()">+ Tambah SPBE</button>
    </div>
    <div class="table-wrapper">
      <table><thead><tr><th>Nama SPBE</th><th>Alamat</th><th>Status</th><th class="text-right">Aksi</th></tr></thead>
      <tbody id="spbe-tbody"></tbody></table>
    </div>`;
  await fetchSPBE();
}

async function fetchSPBE() {
  const tbody = document.getElementById('spbe-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4">${skLine()}</td></tr>`;

  const res = await API.operator.getSPBE();
  if (activeSection !== 'spbe') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const body = document.getElementById('spbe-tbody');
  if (!body) return;
  body.innerHTML = res.data.spbe.length ? res.data.spbe.map(s => `
    <tr>
      <td class="font-medium text-slate-900 dark:text-white">${s.nama}</td>
      <td class="text-slate-500 text-sm">${s.alamat || '-'}</td>
      <td>${UI.badge(s.status, s.status)}</td>
      <td class="text-right">
        <div class="flex gap-1 justify-end">
          <button class="btn-secondary text-xs py-1 px-2" onclick="openSPBEModal(${JSON.stringify(s).replace(/"/g,'&quot;')})">Edit</button>
          <button class="btn-danger text-xs py-1 px-2" onclick="hapusSPBE('${s.spbe_id}','${s.nama}')">Nonaktifkan</button>
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="4">${UI.emptyState('Belum ada SPBE.','⛽')}</td></tr>`;
}

function openSPBEModal(data = null) {
  const modal = document.createElement('div');
  modal.id    = 'spbe-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">${data ? 'Edit' : 'Tambah'} SPBE</h3>
        <button class="btn-icon" onclick="document.getElementById('spbe-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Nama SPBE *</label><input id="sm-nama" class="form-input" value="${data?.nama||''}" placeholder="Nama SPBE"/></div>
        <div><label class="form-label">Alamat</label><input id="sm-alamat" class="form-input" value="${data?.alamat||''}" placeholder="Alamat SPBE"/></div>
        <div id="sm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="sm-btn" class="btn-primary w-full justify-center" onclick="saveSPBE('${data?.spbe_id||''}')">
          ${data ? 'Simpan' : 'Tambah SPBE'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveSPBE(id) {
  const btn   = document.getElementById('sm-btn');
  const errEl = document.getElementById('sm-err');
  errEl.classList.add('hidden');
  const nama   = document.getElementById('sm-nama').value.trim();
  const alamat = document.getElementById('sm-alamat').value.trim();
  if (!nama) { errEl.textContent = 'Nama SPBE wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = id ? await API.operator.updateSPBE({ spbe_id: id, nama, alamat }) : await API.operator.createSPBE({ nama, alamat });
  UI.setLoading(btn, false);
  if (res.success) {
    UI.toast(id ? 'SPBE diupdate.' : 'SPBE ditambahkan.', 'success');
    document.getElementById('spbe-modal')?.remove();
    if (activeSection === 'spbe') fetchSPBE();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function hapusSPBE(id, nama) {
  if (!await UI.confirm(`Nonaktifkan SPBE "${nama}"?`)) return;
  const res = await API.operator.deleteSPBE({ spbe_id: id });
  if (res.success) {
    UI.toast('SPBE dinonaktifkan.', 'success');
    if (activeSection === 'spbe') fetchSPBE();
  } else {
    UI.toast(res.message, 'error');
  }
}

// ── Skeleton helpers ──
function skCards(n) { return `<div class="grid grid-cols-2 md:grid-cols-${n} gap-4 animate-pulse">${Array(n).fill('<div class="card h-20 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div>`; }
function skList(n)  { return `<div class="space-y-3 animate-pulse">${Array(n).fill('<div class="card h-20 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div>`; }
function skLine()   { return `<div class="animate-pulse py-3 flex gap-3">${Array(5).fill('<div class="flex-1 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>').join('')}</div>`; }
