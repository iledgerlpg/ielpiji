/**
 * ILPG Frontend — operator-dashboard.js
 *
 * Perubahan dari revisi terakhir:
 * 1. Urutan tabel Jadwal Harian: Tanggal, SPBE, Rit, Pangkalan, Target Kirim, Retur, Driver 1, Driver 2/Kernet, Aksi.
 * 2. Upload Excel + Download template untuk Jadwal Harian menggunakan NAMA Driver (bukan ID).
 * 3. Input Rit diubah menjadi string bebas (DO1, DO2, Stock Gudang, dsb).
 * 4. Stok gudang: retur TIDAK menambah balik stok.
 * 5. Bukti TF wajib jika ada nominal transfer.
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
  { id: 'rekap-pangkalan',    label: 'Rekap Operasional Pangkalan', icon: 'store' },
  { id: 'bayar-refill',       label: 'Pembayaran Refill',     icon: 'money' },
  { id: 'bayar-bh',           label: 'Pembayaran Bagi Hasil', icon: 'money' },
  { id: 'monitoring-bayar',   label: 'Monitoring Pembayaran', icon: 'chart' },
  { id: 'stok-gudang',        label: 'Stok Agen',           icon: 'box' },
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

const SIDEBAR_STATE = {
  shipping: false,
  operasional: false,
  setting: false
};

function buildChild(id){
  const item = NAV_ITEMS.find(n=>n.id===id);

  return `
    <button class="nav-item nav-child w-full text-left"
      id="nav-${id}"
      onclick="showSection('${id}')">
      ${SVG[item.icon]}
      <span class="nav-label">${item.label}</span>
    </button>
  `;
}

function toggleSidebarGroup(group){
  SIDEBAR_STATE[group]=!SIDEBAR_STATE[group];
  buildSidebar();
  document.getElementById(`nav-${activeSection}`)?.classList.add('active');
}
function toggleGroup(group) {
  SIDEBAR_OPEN[group] = !SIDEBAR_OPEN[group];

  const body = document.getElementById(`group-${group}`);
  const arrow = document.getElementById(`arrow-${group}`);

  if (!body) return;

  body.classList.toggle('hidden');

  if (arrow) {
    arrow.style.transform = SIDEBAR_OPEN[group]
      ? 'rotate(90deg)'
      : 'rotate(0deg)';
  }
}
const SIDEBAR_OPEN = {
  shipping: true,
  operasional: false,
  setting: false
};
function buildSidebar() {

  const nav = document.getElementById('sidebar-nav');

  const sections = [
   {
      id:'shipping',
      label:'iShipping',
      items:['jadwal-harian','laporan-pengiriman','monitoring-kirim','master-sa','stok-gudang']
    },
    {
      id:'operasional',
      label:'iOperasional',
      items:['bayar-refill','bayar-bh','monitoring-bayar','rekap-pangkalan']
    },
    {
      id:'setting',
      label:'Setting',
      items:['pangkalan','spbe']
    }
  ];

  nav.innerHTML = `
      <button class="nav-item w-full text-left"
        id="nav-dashboard"
        onclick="showSection('dashboard')">

        ${SVG.home}
        <span class="nav-label">Dashboard</span>

      </button>

      ${sections.map(sec=>`

      <div class="nav-group">

        <button
          class="nav-item w-full text-left"
          onclick="toggleGroup('${sec.id}')">

          ${
            sec.id==='shipping'
            ? SVG.truck
            : sec.id==='operasional'
            ? SVG.box
            : SVG.store
          }

          <span class="nav-label">${sec.label}</span>

          <span
            id="arrow-${sec.id}"
            style="
              margin-left:auto;
              transition:.25s;
              transform:${SIDEBAR_OPEN[sec.id]?'rotate(90deg)':'rotate(0deg)'};
            ">
            ▶
          </span>

        </button>

        <div
          id="group-${sec.id}"
          class="${SIDEBAR_OPEN[sec.id]?'':'hidden'}">

          ${
            sec.items.map(id=>{

              const item=NAV_ITEMS.find(n=>n.id===id);

              return `
                <button
                  class="nav-item w-full text-left"
                  id="nav-${id}"
                  onclick="showSection('${id}')"
                  style="padding-left:42px">

                  ${SVG[item.icon]}
                  <span class="nav-label">${item.label}</span>

                </button>
              `;

            }).join('')
          }

        </div>

      </div>

      `).join('')}
  `;
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
    'laporan-pengiriman': loadLaporanPengiriman,
    'monitoring-kirim':   loadMonitoringKirim,
    'master-sa':          loadMasterSA,
    'rekap-pangkalan':    loadRekapPangkalan,
    'bayar-refill':       () => loadPembayaran('REFILL'),
    'bayar-bh':           () => loadPembayaran('BAGI_HASIL'),
    'monitoring-bayar':   loadMonitoringBayar,
    'stok-gudang':        loadStokGudang,
    'pangkalan':          loadPangkalan,
    'spbe':               loadSPBE,
  };
  if (loaders[id]) loaders[id]();
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
      <div class="card"><h3 class="font-semibold text-slate-900 dark:text-white mb-3">Driver Belum Lapor</h3><div id="dash-belum-lapor" class="space-y-2"></div></div>
      <div class="card"><h3 class="font-semibold text-slate-900 dark:text-white mb-3">Pangkalan Belum Bayar</h3><div id="dash-belum-bayar" class="space-y-2"></div></div>
    </div>`;
  await fetchDashboard();
}

async function fetchDashboard() {
  const tanggal = document.getElementById('dash-tgl')?.value || UI.todayInputValue();
  const res = await API.operator.getDashboard({ tanggal });
  if (activeSection !== 'dashboard') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const d = res.data;
  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📋</div><div><div class="stat-label">Jadwal Hari Ini</div><div class="stat-value">${d.jadwal_hari}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div><div><div class="stat-label">Sudah Lapor</div><div class="stat-value text-green-600">${d.driver_sudah_lapor}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-red-100 dark:bg-red-900/40">⏳</div><div><div class="stat-label">Belum Lapor</div><div class="stat-value text-red-500">${d.driver_belum_lapor?.length || 0}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-amber-100 dark:bg-amber-900/40">💰</div><div><div class="stat-label">Belum Bayar</div><div class="stat-value text-amber-600">${d.pangkalan_belum_bayar?.length || 0}</div></div></div>`;
  document.getElementById('dash-belum-lapor').innerHTML = d.driver_belum_lapor?.length
    ? d.driver_belum_lapor.map(x => `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div><div class="text-sm font-medium text-slate-900 dark:text-white">${UI.escapeHtml(x.driver_nama)}</div>
          <div class="text-xs text-slate-500">${UI.escapeHtml(x.pangkalan_nama)} · Rit/DO: ${UI.escapeHtml(x.rit)}</div></div>
          <button class="btn-secondary text-xs py-1 px-2" onclick="showSection('laporan-pengiriman')">Detail</button>
        </div>`).join('')
    : UI.emptyState('Semua driver sudah lapor! 🎉', '✅');
  document.getElementById('dash-belum-bayar').innerHTML = d.pangkalan_belum_bayar?.length
    ? d.pangkalan_belum_bayar.map(x => `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div class="text-sm font-medium text-slate-900 dark:text-white">${UI.escapeHtml(x.nama)}</div>
          <button class="btn-primary text-xs py-1 px-3" onclick="showSection('bayar-refill')">Bayar</button>
        </div>`).join('')
    : UI.emptyState('Semua pangkalan sudah bayar! 🎉', '💚');
}

// ============================================================
// JADWAL HARIAN — Urutan Baru & Upload/Download pakai Nama Driver
// ============================================================

async function loadJadwalHarian() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem;">
      <div>
        <h2 class="page-title">Jadwal Harian</h2>
        <p class="page-sub">Atur jadwal pengiriman driver ke pangkalan.</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn-secondary text-sm" onclick="downloadTemplateJadwal(this)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Template Excel
        </button>
        <label class="btn-secondary text-sm cursor-pointer" title="Upload Excel Jadwal">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Upload Excel
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="uploadJadwalExcel(this)"/>
        </label>
        <button class="btn-primary" onclick="openJadwalModal()">+ Tambah Manual</button>
      </div>
    </div>
    <div class="filter-bar">
      <input type="date"  id="jh-tgl" class="form-input w-44" value="${UI.todayInputValue()}" onchange="fetchJadwalHarian()"/>
      <input type="month" id="jh-bln" class="form-input w-40" onchange="fetchJadwalHarian()"/>
      <button class="btn-secondary text-sm" onclick="document.getElementById('jh-tgl').value='';document.getElementById('jh-bln').value='';fetchJadwalHarian()">Reset</button>
    </div>
    <div id="jh-import-status" class="hidden mb-4"></div>
    <div class="table-wrapper">
      <table><thead><tr>
        <th>Tanggal</th>
        <th>SPBE</th>
        <th>Rit</th>
        <th>Nama Pangkalan</th>
        <th>Target Kirim</th>
        <th>Retur</th>
        <th>Driver 1</th>
        <th>Driver 2 / Kernet</th>
        <th class="text-right">Aksi</th>
      </tr></thead>
      <tbody id="jh-tbody"></tbody></table>
    </div>`;
  await fetchJadwalHarian();
}

async function fetchJadwalHarian() {
  const tbody = document.getElementById('jh-tbody');
  tbody.innerHTML = `<tr><td colspan="9">${skLine()}</td></tr>`;
  const params = { tanggal: document.getElementById('jh-tgl')?.value || undefined, bulan: document.getElementById('jh-bln')?.value || undefined };
  if (params.tanggal) delete params.bulan;
  const res = await API.operator.getJadwalHarian(params);
  if (activeSection !== 'jadwal-harian') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  tbody.innerHTML = res.data.jadwal.length ? res.data.jadwal.map(j => `
    <tr>
      <td class="text-xs text-slate-500">${UI.formatDateShort(j.tanggal)}</td>
      <td class="text-slate-500 text-xs">${UI.escapeHtml(j.spbe_nama)}</td>
      <td class="font-semibold">${UI.escapeHtml(j.rit)}</td>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(j.pangkalan_nama)}</td>
      <td>${j.jumlah_kirim} <span class="text-slate-400 text-xs">tabung</span></td>
      <td>${j.jumlah_retur || 0} <span class="text-slate-400 text-xs">tabung</span></td>
      <td class="text-sm">${UI.escapeHtml(j.driver1_nama)}</td>
      <td class="text-sm">${j.driver2_nama && j.driver2_nama !== '-' ? UI.escapeHtml(j.driver2_nama) : '-'}</td>
      <td class="text-right">
        <button class="btn-danger text-xs py-1 px-2" onclick="deleteJadwalHarian('${j.jadwal_id}')">Hapus</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="9">${UI.emptyState('Belum ada jadwal.','📋')}</td></tr>`;
}

/** Download template Excel (.xlsx) asli untuk Jadwal Harian */
async function downloadTemplateJadwal(btnEl) {
  const btn = btnEl || null;
  try {
    if (btn) UI.setLoading(btn, true, 'Menyiapkan...');
    if (!window.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    const [pangRes, spbeRes, driverRes] = await Promise.all([
      API.operator.getPangkalan({ status: 'ACTIVE' }),
      API.operator.getSPBE({ status: 'ACTIVE' }),
      API.operator.getDrivers(),
    ]);
    const daftarPangkalan = pangRes.success ? (pangRes.data.pangkalan || []) : [];
    const daftarSPBE      = spbeRes.success ? (spbeRes.data.spbe || []) : [];
    const daftarDriver    = driverRes.success ? (driverRes.data.drivers || []) : [];

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Petunjuk ──
    const petunjukAOA = [
      ['PETUNJUK PENGISIAN TEMPLATE JADWAL HARIAN — ILPG'],
      [''],
      ['Kolom', 'Keterangan'],
      ['tanggal', 'Format YYYY-MM-DD, contoh: 2024-01-15'],
      ['spbe', 'Nama SPBE — HARUS SAMA PERSIS dengan sheet "Referensi SPBE"'],
      ['rit', 'Nomor atau nama rit (contoh: 1, DO1, Stock Gudang)'],
      ['pangkalan', 'Nama pangkalan — HARUS SAMA PERSIS dengan sheet "Referensi Pangkalan"'],
      ['jumlah_kirim', 'Angka target pengiriman (tabung)'],
      ['jumlah_retur', 'Angka target retur (boleh 0)'],
      ['driver1_nama', 'Nama driver utama (WAJIB) — SAMA PERSIS dengan sheet "Referensi Driver"'],
      ['driver2_nama', 'Nama kernet / driver 2 (boleh kosong) — SAMA PERSIS dengan sheet "Referensi Driver"'],
      ['keterangan', 'Catatan bebas (boleh kosong)'],
      [''],
      ['⚠ Isi data mulai dari sheet "Data Jadwal", baris 2 (setelah header).'],
      ['⚠ JANGAN mengubah nama kolom pada header sheet "Data Jadwal".'],
      ['⚠ Nama pangkalan/SPBE/Driver tidak boleh typo — cek daftar resmi di sheet Referensi.'],
    ];
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukAOA);
    wsPetunjuk['!cols']   = [{ wch: 18 }, { wch: 75 }];
    wsPetunjuk['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

    // ── Sheet 2: Data Jadwal (header + 1 baris contoh) ──
    const headers = ['tanggal','spbe','rit','pangkalan','jumlah_kirim','jumlah_retur','driver1_nama','driver2_nama','keterangan'];
    const contoh  = [
      '2024-01-15', 
      daftarSPBE[0]?.nama || 'NAMA_SPBE_DISINI', 
      'DO1',
      daftarPangkalan[0]?.nama || 'NAMA_PANGKALAN_DISINI',
      100, 0, 
      daftarDriver[0]?.nama || 'NAMA_DRIVER_1', 
      '', 
      'Opsional',
    ];
    const wsData = XLSX.utils.aoa_to_sheet([headers, contoh]);
    wsData['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 26 },
      { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Jadwal');

    // ── Sheet 3: Referensi Pangkalan ──
    const wsRefPang = XLSX.utils.aoa_to_sheet([
      ['Nama Pangkalan'],
      ...(daftarPangkalan.length ? daftarPangkalan.map(p => [p.nama]) : [['(Belum ada data pangkalan aktif)']]),
    ]);
    wsRefPang['!cols'] = [{ wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsRefPang, 'Referensi Pangkalan');

    // ── Sheet 4: Referensi SPBE ──
    const wsRefSpbe = XLSX.utils.aoa_to_sheet([
      ['Nama SPBE'],
      ...(daftarSPBE.length ? daftarSPBE.map(s => [s.nama]) : [['(Belum ada data SPBE aktif)']]),
    ]);
    wsRefSpbe['!cols'] = [{ wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsRefSpbe, 'Referensi SPBE');

    // ── Sheet 5: Referensi Driver ──
    const wsRefDriver = XLSX.utils.aoa_to_sheet([
      ['Nama Driver / Kernet'],
      ...(daftarDriver.length ? daftarDriver.map(d => [d.nama]) : [['(Belum ada data driver)']]),
    ]);
    wsRefDriver['!cols'] = [{ wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsRefDriver, 'Referensi Driver');

    XLSX.writeFile(wb, 'template_jadwal_harian_ILPG.xlsx');
    UI.toast('Template Excel berhasil didownload.', 'success');
  } catch (err) {
    UI.toast(`Gagal membuat template: ${err.message}`, 'error');
  } finally {
    if (btn) UI.setLoading(btn, false);
  }
}

/** Upload & parse file Excel/CSV Jadwal Harian */
async function uploadJadwalExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl = document.getElementById('jh-import-status');
  statusEl.className = 'mb-4 card bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300';
  statusEl.textContent = '⏳ Membaca file...';
  statusEl.classList.remove('hidden');

  try {
    const rows = await parseCSVOrExcel(file);
    if (!rows || rows.length < 2) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ File kosong atau format salah. Gunakan template yang sudah disediakan.';
      input.value = '';
      return;
    }

    const headers = rows[0].map(h => String(h).trim().toLowerCase());
    const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
    const reqCols  = ['tanggal','spbe','rit','pangkalan','driver1_nama'];
    const missing  = reqCols.filter(c => !headers.includes(c));
    if (missing.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Kolom wajib tidak ditemukan: ${missing.join(', ')}. Pastikan menggunakan template resmi.`;
      input.value = '';
      return;
    }

    const mapped = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? '').trim(); });
      return obj;
    }).filter(r => r.tanggal && r.pangkalan && r.spbe && r.driver1_nama);

    if (!mapped.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Tidak ada baris data valid setelah header.';
      input.value = '';
      return;
    }

// ── Kirim nama langsung, tidak perlu resolve ke ID lagi ──
    const resolved = mapped.map(r => ({
      tanggal: r.tanggal,
      spbe_nama: r.spbe,
      rit: r.rit,
      pangkalan_nama: r.pangkalan,
      jumlah_kirim: r.jumlah_kirim,
      jumlah_retur: r.jumlah_retur,
      driver1_nama: r.driver1_nama,
      driver2_nama: r.driver2_nama,
      keterangan: r.keterangan,
    }));
    const notFound = [];

    if (notFound.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.innerHTML = `❌ ${notFound.length} baris gagal dicocokkan:<br/>${notFound.slice(0, 8).map(m => UI.escapeHtml(m)).join('<br/>')}${notFound.length > 8 ? `<br/>...dan ${notFound.length - 8} lainnya.` : ''}<br/>Cek ejaan nama pada sheet Referensi.`;
      input.value = '';
      return;
    }

    statusEl.textContent = `⏳ Mengirim ${resolved.length} baris ke server...`;
    const res = await API.operator.importJadwalHarian({ rows: resolved });
    input.value = '';

    if (res.success) {
      statusEl.className = 'mb-4 card bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700';
      statusEl.textContent = `✅ ${res.data.inserted} jadwal berhasil diimport dari ${resolved.length} baris.`;
      fetchJadwalHarian();
    } else {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Import gagal: ${res.message}`;
    }
  } catch (err) {
    statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
    statusEl.textContent = `❌ Gagal membaca file: ${err.message}`;
    input.value = '';
  }
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
          <div><label class="form-label">Rit *</label><input id="jm-rit" type="text" class="form-input" placeholder="Contoh: DO1, Stock Gudang"/></div>
        </div>
        <div><label class="form-label">Pangkalan *</label><select id="jm-pangkalan" class="form-select"><option value="">Memuat...</option></select></div>
        <div><label class="form-label">SPBE *</label><select id="jm-spbe" class="form-select"><option value="">Memuat...</option></select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Target Kirim *</label><input id="jm-kirim" type="number" class="form-input" placeholder="0" min="0"/></div>
          <div><label class="form-label">Target Retur</label><input id="jm-retur" type="number" class="form-input" placeholder="0" min="0"/></div>
        </div>
        <div><label class="form-label">Driver 1 *</label><select id="jm-driver1" class="form-select"><option value="">Memuat...</option></select></div>
        <div><label class="form-label">Driver 2 / Kernet</label><select id="jm-driver2" class="form-select"><option value="">-- Opsional --</option></select></div>
        <div><label class="form-label">Keterangan</label><input id="jm-ket" class="form-input" placeholder="Opsional..."/></div>
        <div id="jm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="jm-btn" class="btn-primary w-full justify-center" onclick="saveJadwal()">Simpan Jadwal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  loadJadwalDropdowns();
}

async function loadJadwalDropdowns() {
  const [pangRes, spbeRes, driverRes] = await Promise.all([
    API.operator.getPangkalan({ status: 'ACTIVE' }),
    API.operator.getSPBE({ status: 'ACTIVE' }),
    API.operator.getDrivers(),
  ]);
  const fillByNama = (id, items) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">-- Pilih --</option>` + (items || []).map(i => `<option value="${UI.escapeHtml(i.nama)}">${UI.escapeHtml(i.nama)}</option>`).join('');
  };
  if (pangRes.success) {
    fillByNama('jm-pangkalan', pangRes.data.pangkalan);
    // Opsi khusus "Gudang" — cukup nama bebas, tidak perlu match ke master pangkalan
    document.getElementById('jm-pangkalan').insertAdjacentHTML('beforeend', `<option value="Gudang">📦 Gudang</option>`);
  }
  if (spbeRes.success) fillByNama('jm-spbe', spbeRes.data.spbe);
  if (!driverRes.success) { UI.toast(driverRes.message || 'Gagal memuat daftar driver.', 'error'); return; }
  const drivers = driverRes.data.drivers;
  fillByNama('jm-driver1', drivers);
  document.getElementById('jm-driver2').innerHTML =
    `<option value="">-- Opsional --</option>` +
    drivers.map(d => `<option value="${UI.escapeHtml(d.nama)}">${UI.escapeHtml(d.nama)}${d.role === 'KERNET' ? ' (Kernet)' : ''}</option>`).join('');
}

async function saveJadwal() {
  const btn   = document.getElementById('jm-btn');
  const errEl = document.getElementById('jm-err');
  errEl.classList.add('hidden');
  const body = {
    tanggal:        document.getElementById('jm-tgl').value,
    rit:            document.getElementById('jm-rit').value.trim(),
    pangkalan_nama: document.getElementById('jm-pangkalan').value,
    spbe_nama:      document.getElementById('jm-spbe').value,
    jumlah_kirim:   Number(document.getElementById('jm-kirim').value),
    jumlah_retur:   Number(document.getElementById('jm-retur').value || 0),
    driver1_nama:   document.getElementById('jm-driver1').value,
    driver2_nama:   document.getElementById('jm-driver2').value,
    keterangan:     document.getElementById('jm-ket').value.trim(),
  };
  if (!body.tanggal || !body.rit || !body.spbe_nama || !body.pangkalan_nama || !body.jumlah_kirim || !body.driver1_nama) {
    errEl.textContent = 'Tanggal, Rit, SPBE, pangkalan, target kirim, dan driver 1 wajib diisi.';
    errEl.classList.remove('hidden'); return;
  }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = await API.operator.createJadwalHarian(body);
  UI.setLoading(btn, false);
  if (res.success) { UI.toast('Jadwal berhasil ditambahkan.', 'success'); document.getElementById('jh-modal').remove(); fetchJadwalHarian(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

async function deleteJadwalHarian(id) {
  if (!await UI.confirm('Hapus jadwal ini?', 'Konfirmasi Hapus')) return;
  const res = await API.operator.deleteJadwalHarian({ jadwal_id: id });
  if (res.success) { UI.toast('Jadwal dihapus.', 'success'); fetchJadwalHarian(); }
  else UI.toast(res.message, 'error');
}
// ============================================================
// LAPORAN PENGIRIMAN - Menggunakan loadLaporan & fetchLaporan
// ============================================================

async function loadLaporanPengiriman() {
  const main = document.getElementById('main-content');
  const today = new Date().toISOString().split('T')[0];

  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem;">
      <div>
        <h2 class="page-title">Laporan Pengiriman</h2>
        <p class="page-sub">Rekapitulasi riwayat pengiriman berdasarkan periode.</p>
      </div>
      <button class="btn-primary" onclick="exportLaporan()">Export Laporan</button>
    </div>
    
    <!-- Filter Rentang Tanggal -->
    <div class="filter-bar flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">Dari Tgl:</label>
        <input type="date" id="lp-start" class="form-input w-36 text-sm" value="${today}" onchange="fetchLaporanPengiriman()"/>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">Sampai Tgl:</label>
        <input type="date" id="lp-end" class="form-input w-36 text-sm" value="${today}" onchange="fetchLaporanPengiriman()"/>
      </div>
      <button class="btn-secondary text-sm py-1.5 ml-auto" onclick="fetchLaporanPengiriman()">Tampilkan</button>
    </div>

    <div id="lp-container" class="table-wrapper overflow-x-auto">
       <div class="animate-pulse p-4 text-slate-400">Memuat data...</div>
    </div>`;
  
  await fetchLaporanPengiriman();
}

// 1. Membersihkan URL Google Drive
function cleanImageUrl(url) {
    if (!url) return '';
    
    // Jika sudah format direct link, biarkan saja
    if (url.includes('uc?export=view')) return url;
    
    // Jika format lama, baru kita konversi
    if (url.includes('drive.google.com')) {
        return url.replace('/view?usp=sharing', '/uc?export=view')
                  .replace('/file/d/', '/uc?id=')
                  .replace('/view', '');
    }
    return url;
}

// 2. Mengambil ID File
function extractFileId(url) {
    if (!url) return null;
    const directId = url.match(/id=([A-Za-z0-9_-]+)/);
    const fileId = url.match(/\/d\/([A-Za-z0-9_-]+)/);
    return directId ? directId[1] : (fileId ? fileId[1] : null);
}

// 3. Merender Thumbnail dengan Pengaman (Fallback)
function renderThumb(url) {
      const id = extractFileId(url);
      if (!id) return '-';
      
      // sz=w400 untuk resolusi thumbnail yang tajam di kotak besar
      const thumbUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
      
      // Link baru sesuai request: langsung tembak ke raw image tanpa UI Google Drive
      const directViewUrl = `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`;
      
      return `<a href="${directViewUrl}" target="_blank" class="block overflow-hidden rounded shadow mx-auto h-32 w-32">
                <img src="${thumbUrl}" 
                     class="h-full w-full object-cover hover:scale-110 transition-transform duration-300" 
                     loading="lazy" 
                     onerror="this.onerror=null; this.src='https://placehold.co/150x150/e2e8f0/64748b?text=Cek+Foto';"
                     alt="Bukti" />
              </a>`;
    }

// 3. FUNGSI UTAMA LAPORAN PENGIRIMAN
async function fetchLaporanPengiriman() {
  const start = document.getElementById('lp-start')?.value;
  const end   = document.getElementById('lp-end')?.value;
  
  if (start > end) { 
    UI.toast('Rentang tanggal tidak valid.', 'warning'); 
    return; 
  }
  const container = document.getElementById('lp-container');
  container.innerHTML = '<div class="animate-pulse p-4 text-slate-400">Memuat data...</div>';
  
  const res = await API.operator.getLaporanPengiriman({ start_date: start, end_date: end });
  
  if (activeSection !== 'laporan' && activeSection !== 'laporan-pengiriman') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  container.innerHTML = `
<table class="w-full text-sm">
    <thead>
        <tr class="text-slate-500 dark:text-slate-400">
            <th class="text-left p-2 border-b border-slate-200 dark:border-slate-700">Tanggal</th>
            <th class="text-left p-2 border-b border-slate-200 dark:border-slate-700">Driver</th>
            <th class="text-left p-2 border-b border-slate-200 dark:border-slate-700">Pangkalan</th>
            <th class="text-center p-2 border-b border-slate-200 dark:border-slate-700">Kirim</th>
            <th class="text-center p-2 border-b border-slate-200 dark:border-slate-700">Retur</th>
            <th class="text-center p-2 border-b border-slate-200 dark:border-slate-700">Status</th>
            <th class="text-center p-2 border-b border-slate-200 dark:border-slate-700">Foto</th>
            <th class="text-right p-2 border-b border-slate-200 dark:border-slate-700">Aksi</th>
        </tr>
    </thead>
    <tbody>
        ${
            res.data.laporan.length
            ? res.data.laporan.map(l => {
                const hasPhoto = l.foto_pengiriman_url || l.foto_retur_url || l.foto_pangkalan_url;
                
                return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700">${UI.formatDateShort(l.tanggal)}</td>
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700 font-medium">${UI.escapeHtml(l.driver_nama)}</td>
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700">${UI.escapeHtml(l.pangkalan_nama)}</td>
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700 text-center font-semibold">${l.jumlah_kirim}</td>
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700 text-center">${l.jumlah_retur || 0}</td>
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700 text-center">${UI.badge(l.status, l.status)}</td>
                    
                    <!-- Eksekusi fungsi renderThumb -->
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700">
                        <div class="flex gap-1.5 justify-center items-center">
                            ${hasPhoto ? `
                                ${renderThumb(l.foto_pengiriman_url, 'Kirim')}
                                ${renderThumb(l.foto_retur_url, 'Retur')}
                                ${renderThumb(l.foto_pangkalan_url, 'Pangkalan')}
                            ` : `<span class="text-slate-400 text-xs">-</span>`}
                        </div>
                    </td>
                    
                    <td class="p-2 border-b border-slate-200 dark:border-slate-700 text-right">
                        <div class="flex gap-3 items-center justify-end">
                            ${l.status !== 'VERIFIED' ? `<button class="text-blue-600 hover:text-blue-800 text-xs font-semibold" onclick="verifikasiLaporanPengiriman('${l.laporan_id}')">Verifikasi</button>` : ''}
                            <button class="text-red-600 hover:text-red-800 text-xs font-semibold" onclick="hapusLaporanPengiriman('${l.laporan_id}')">Hapus</button>
                        </div>
                    </td>
                </tr>
            `}).join('')
            : `<tr><td colspan="8">${UI.emptyState('Belum ada laporan','📋')}</td></tr>`
        }
    </tbody>
</table>`;
}
async function verifikasiLaporanPengiriman(id) {
  const res = await API.operator.updateLaporanPengiriman({ laporan_id: id, status: 'VERIFIED' });
  if (res.success) { UI.toast('Laporan diverifikasi.', 'success'); fetchLaporanPengiriman(); }
  else UI.toast(res.message, 'error');
}

async function hapusLaporanPengiriman(id) {
  if (!await UI.confirm('Hapus laporan ini?', 'Konfirmasi')) return;
  const res = await API.operator.deleteLaporanPengiriman({ laporan_id: id });
  if (res.success) { UI.toast('Laporan dihapus.', 'success'); fetchLaporanPengiriman(); }
  else UI.toast(res.message, 'error');
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
  tbody.innerHTML = `<tr><td colspan="7">${skLine()}</td></tr>`;
  const res = await API.operator.getMonitoringPengiriman({ bulan: month, tahun: year });
  if (activeSection !== 'monitoring-kirim') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const data  = res.data.monitoring;
  const total = { sa: 0, jadwal: 0, kirim: 0, retur: 0 };
  data.forEach(d => { total.sa += d.total_sa; total.jadwal += d.total_jadwal; total.kirim += d.total_kirim; total.retur += d.total_retur; });
  document.getElementById('mk-summary').innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-slate-100 dark:bg-slate-800">📊</div><div><div class="stat-label">Total Alokasi SA</div><div class="stat-value">${UI.formatNumber(total.sa)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📋</div><div><div class="stat-label">Total Dijadwalkan</div><div class="stat-value">${UI.formatNumber(total.jadwal)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div><div><div class="stat-label">Total Terkirim</div><div class="stat-value text-green-600">${UI.formatNumber(total.kirim)}</div></div></div>`;
  tbody.innerHTML = data.length ? data.map(d => {
    const selisihSA = d.selisih_sa_kirim, selisihJ = d.selisih_jadwal_kirim;
    return `<tr>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(d.nama)}</td>
      <td class="text-center">${UI.formatNumber(d.total_sa)}</td>
      <td class="text-center">${UI.formatNumber(d.total_jadwal)}</td>
      <td class="text-center font-semibold">${UI.formatNumber(d.total_kirim)}</td>
      <td class="text-center text-slate-500">${UI.formatNumber(d.total_retur)}</td>
      <td class="text-center ${selisihSA > 0 ? 'text-red-500' : selisihSA < 0 ? 'text-amber-500' : 'text-green-600'} font-semibold">${selisihSA > 0 ? '+' : ''}${UI.formatNumber(selisihSA)}</td>
      <td class="text-center ${selisihJ > 0 ? 'text-red-500' : selisihJ < 0 ? 'text-amber-500' : 'text-green-600'} font-semibold">${selisihJ > 0 ? '+' : ''}${UI.formatNumber(selisihJ)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7">${UI.emptyState('Belum ada data monitoring.','📊')}</td></tr>`;
}

// ============================================================
// MASTER SA — Pakai Nama Pangkalan & Tombol Edit Manual
// ============================================================

// ============================================================
// MASTER SA — Filter Rentang Tanggal di Halaman Utama
// ============================================================

async function loadMasterSA() {
  const main = document.getElementById('main-content');
  const today = new Date().toISOString().split('T')[0];

  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Master SA</h2><p class="page-sub">Alokasi harian per pangkalan.</p></div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn-secondary text-sm" onclick="downloadTemplateMasterSA(this)">⬇️ Template Excel</button>
        <label class="btn-secondary text-sm cursor-pointer">
          ⬆️ Upload Excel
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="uploadMasterSAExcel(this)"/>
        </label>
        <button class="btn-primary" onclick="openEditMasterSAModal()">+ Tambah/Edit Manual</button>
      </div>
    </div>

    <div class="filter-bar flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">Dari Tgl:</label>
        <input type="date" id="sa-start" class="form-input w-36 text-sm" value="${today}" onchange="fetchMasterSA()"/>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">Sampai Tgl:</label>
        <input type="date" id="sa-end" class="form-input w-36 text-sm" value="${today}" onchange="fetchMasterSA()"/>
      </div>
      <button class="btn-secondary text-sm py-1.5 ml-auto" onclick="fetchMasterSA()">Tampilkan</button>
    </div>

    <div id="sa-import-status" class="hidden mb-4"></div>
    <div id="sa-container" class="table-wrapper">
      <div class="animate-pulse p-4 text-slate-400">Memuat data...</div>
    </div>`;

  await fetchMasterSA();
}

async function fetchMasterSA() {
  const start = document.getElementById('sa-start')?.value;
  const end   = document.getElementById('sa-end')?.value;

  if (start > end) {
    UI.toast('Tanggal awal tidak boleh lebih besar dari tanggal akhir.', 'warning');
    return;
  }

  const startDate = new Date(start);
  const endDate   = new Date(end);

  const tahun = startDate.getFullYear();
  const bulan = String(startDate.getMonth() + 1).padStart(2, '0');
  const namaBulan = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const startDay = startDate.getDate();
  let endDay = endDate.getDate();

  if (startDate.getMonth() !== endDate.getMonth() || startDate.getFullYear() !== endDate.getFullYear()) {
    UI.toast('Tampilan tabel dibatasi hingga akhir bulan dari tanggal awal yang dipilih.', 'info');
    endDay = new Date(tahun, startDate.getMonth() + 1, 0).getDate();
  }

  const bulanStr = `${tahun}-${bulan}`;

  const [res, spbeRes, stokRes] = await Promise.all([
    API.operator.getMasterSA({ bulan, tahun }),
    API.operator.getSPBE({ status: 'ACTIVE' }),
    API.operator.getStokGudang({ bulan: bulanStr })
  ]);

  if (activeSection !== 'master-sa') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const data = res.data.master_sa;
  window._masterSAData = data;

  const spbeList = spbeRes.success ? spbeRes.data.spbe : [];
  const pembelianList = stokRes.success ? stokRes.data.pembelian : [];

  const daysToShow = [];
  for (let i = startDay; i <= endDay; i++) daysToShow.push(i);

  const dailyTotals = {};
  daysToShow.forEach(d => { dailyTotals[d] = 0; });
  let grandTotal = 0;

  // 1. Render Baris Pangkalan
  const bodyHtml = data.map(row => {
    let rowTotal = 0;
const cells = daysToShow.map(d => {
      const key  = `tgl_${String(d).padStart(2, '0')}`;
      const vKey = `${key}_v`;
      const val  = Number(row[key] || 0);
      const isVerified = row[vKey] === true || row[vKey] === 'TRUE' || row[vKey] === 1 || row[vKey] === '1';
      dailyTotals[d] += val;
      rowTotal += val;

      if (!val) {
        return `<td class="text-center text-xs border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700"></td>`;
      }
      return `<td class="text-center text-xs border border-slate-100 dark:border-slate-800 p-0">
        <button
          class="w-full h-full py-1 font-semibold transition-colors ${isVerified ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}"
          title="${isVerified ? 'Klik untuk batal verifikasi' : 'Klik untuk verifikasi'}"
          onclick="toggleVerifikasiMasterSACell('${row.sa_id}', ${d}, this)">
          ${val}${isVerified ? ' ✓' : ''}
        </button>
      </td>`;
    }).join('');

    grandTotal += rowTotal;

    return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td style="left:0;min-width:180px;width:180px;"
          class="font-medium text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 p-2
                 sticky bg-white dark:bg-slate-900 z-20
                 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        ${UI.escapeHtml(row.pangkalan_nama)}
      </td>
      ${cells}
      <td style="right:0;min-width:60px;"
          class="text-center font-bold text-blue-600 border border-slate-100 dark:border-slate-800
                 sticky bg-white dark:bg-slate-900 z-20
                 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        ${rowTotal}
      </td>
    </tr>`;
  }).join('');

// 2. Kalkulasi SPBE & Pembelian — dicocokkan berdasarkan NAMA (bukan spbe_id,
  // karena sheet PEMBELIAN_STOK sekarang hanya menyimpan nama_spbe)
  const spbeData = {};
  spbeList.forEach(s => {
    spbeData[s.nama] = { nama: s.nama, daily: {}, total: 0 };
    daysToShow.forEach(d => spbeData[s.nama].daily[d] = 0);
  });

  if (pembelianList && pembelianList.length) {
    pembelianList.forEach(p => {
      const pDay = parseInt(p.tanggal.split('-')[2], 10);
      const key  = p.nama_spbe;
      if (spbeData[key] && spbeData[key].daily[pDay] !== undefined) {
        spbeData[key].daily[pDay] += Number(p.jumlah);
        spbeData[key].total += Number(p.jumlah);
      }
    });
  }

  const dailyTotalSPBE = {};
  let grandTotalSPBE = 0;
  daysToShow.forEach(d => {
    let sum = 0;
    spbeList.forEach(s => { sum += spbeData[s.nama].daily[d]; });
    dailyTotalSPBE[d] = sum;
    grandTotalSPBE += sum;
  });

  const dailyStock = {};
  let runningStock = 0;
  daysToShow.forEach((d, index) => {
    const tHarian = dailyTotals[d] || 0;
    const tSpbe   = dailyTotalSPBE[d] || 0;
    runningStock  = index === 0 ? tSpbe - tHarian : runningStock + tSpbe - tHarian;
    dailyStock[d] = runningStock;
  });

  // 3. Baris SPBE
  let spbeRowsHtml = '';
  spbeList.forEach(s => {
    const cells = daysToShow.map(d => {
      const val = spbeData[s.nama].daily[d];
      return `<td class="text-center text-xs border border-slate-200 dark:border-slate-700 ${val > 0 ? 'text-green-600 font-semibold' : 'text-slate-400'}">${val || 0}</td>`;
    }).join('');
    spbeRowsHtml += `
      <tr class="bg-slate-50 dark:bg-slate-800/40">
        <td style="left:0;min-width:180px;width:180px;"
            class="font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 p-2
                   sticky bg-slate-50 dark:bg-slate-800/40 z-20
                   shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
          ⤷ SPBE: ${UI.escapeHtml(s.nama)}
        </td>
        ${cells}
        <td style="right:0;min-width:60px;"
            class="text-center font-bold text-green-600 border border-slate-200 dark:border-slate-700
                   sticky bg-slate-50 dark:bg-slate-800/40 z-20
                   shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]">
          ${spbeData[s.nama].total}
        </td>
      </tr>`;
  });
  
  // 4. Footer
  const footerHtml = `
    <tr class="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
      <td style="left:0;min-width:180px;width:180px;"
          class="p-2 border border-slate-200 dark:border-slate-700
                 sticky bg-slate-100 dark:bg-slate-800 z-20
                 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        TOTAL HARIAN
      </td>
      ${daysToShow.map(d => `
        <td class="text-center text-xs border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400">
          ${dailyTotals[d] || 0}
        </td>`).join('')}
      <td style="right:0;min-width:60px;"
          class="text-center border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400
                 sticky bg-slate-100 dark:bg-slate-800 z-20
                 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        ${grandTotal}
      </td>
    </tr>

    ${spbeRowsHtml}

    <tr class="bg-green-50 dark:bg-green-900/30 font-bold text-green-700 dark:text-green-400">
      <td style="left:0;min-width:180px;width:180px;"
          class="p-2 border border-slate-200 dark:border-slate-700
                 sticky bg-green-50 dark:bg-green-900/30 z-20
                 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        TOTAL PEMBELIAN SPBE
      </td>
      ${daysToShow.map(d => `<td class="text-center text-xs border border-slate-200 dark:border-slate-700">${dailyTotalSPBE[d] || 0}</td>`).join('')}
      <td style="right:0;min-width:60px;"
          class="text-center border border-slate-200 dark:border-slate-700
                 sticky bg-green-50 dark:bg-green-900/30 z-20
                 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        ${grandTotalSPBE}
      </td>
    </tr>

    <tr class="bg-amber-50 dark:bg-amber-900/30 font-bold text-amber-700 dark:text-amber-400">
      <td style="left:0;min-width:180px;width:180px;"
          class="p-2 border border-slate-200 dark:border-slate-700
                 sticky bg-amber-50 dark:bg-amber-900/30 z-20
                 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        STOCK GUDANG
      </td>
      ${daysToShow.map(d => `
        <td class="text-center text-xs border border-slate-200 dark:border-slate-700 ${dailyStock[d] < 0 ? 'text-red-500' : ''}">
          ${dailyStock[d]}
        </td>`).join('')}
      <td style="right:0;min-width:60px;"
          class="text-center border border-slate-200 dark:border-slate-700
                 sticky bg-amber-50 dark:bg-amber-900/30 z-20
                 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        -
      </td>
    </tr>`;

  document.getElementById('sa-container').innerHTML = data.length ? `
    <table style="min-width:1000px" class="border-collapse border border-slate-200 dark:border-slate-700 w-full">
      <thead>
        <tr>
          <th rowspan="2"
              style="left:0;min-width:180px;width:180px;top:0;"
              class="align-middle border border-slate-200 dark:border-slate-700 p-2
                     sticky bg-slate-100 dark:bg-slate-800 z-30
                     shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
            Pangkalan
          </th>
          <th colspan="${daysToShow.length}"
              style="top:0;"
              class="text-center bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700
                     font-bold text-xs tracking-wider text-slate-700 dark:text-slate-200 py-1 sticky z-10">
            ${namaBulan.toUpperCase()}
          </th>
          <th rowspan="2"
              style="right:0;min-width:60px;top:0;"
              class="text-center align-middle border border-slate-200 dark:border-slate-700
                     sticky bg-slate-100 dark:bg-slate-800 z-30
                     shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.15)]">
            Total
          </th>
        </tr>
<tr>
  ${daysToShow.map(d => `
    <th style="top:0;"
        class="text-center text-xs border border-slate-200 dark:border-slate-700
               font-semibold w-8 sticky bg-slate-100 dark:bg-slate-800 z-10">
      <div class="flex flex-col items-center gap-0.5 py-0.5">
        <span>${String(d).padStart(2, '0')}</span>
        <div class="flex gap-0.5">
          <button type="button"
            class="text-[9px] leading-none px-1 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800"
            title="Verifikasi semua (tgl ${d})"
            onclick="verifyAllMasterSADay(${d}, true, this)">✓</button>
          <button type="button"
            class="text-[9px] leading-none px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800"
            title="Batal verifikasi semua (tgl ${d})"
            onclick="verifyAllMasterSADay(${d}, false, this)">✗</button>
        </div>
      </div>
    </th>`).join('')}
</tr>
      </thead>
      <tbody>${bodyHtml}</tbody>
      <tfoot>${footerHtml}</tfoot>
    </table>` : UI.emptyState('Belum ada data alokasi untuk periode ini.', '📊');
}
async function toggleVerifikasiMasterSACell(saId, hari, btnEl) {
  const wasVerified = btnEl.classList.contains('bg-green-100');
  btnEl.disabled = true;
  const res = await API.operator.verifyMasterSA({ sa_id: saId, tanggal: hari, verified: !wasVerified });
  btnEl.disabled = false;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const nowVerified = res.data.verified;
  const val = btnEl.textContent.replace('✓', '').trim();

  if (nowVerified) {
    btnEl.classList.add('bg-green-100','dark:bg-green-900/40','text-green-700','dark:text-green-400');
    btnEl.classList.remove('text-blue-700','dark:text-blue-400','hover:bg-amber-50','dark:hover:bg-amber-900/20');
    btnEl.title = 'Klik untuk batal verifikasi';
    btnEl.textContent = `${val} ✓`;
  } else {
    btnEl.classList.remove('bg-green-100','dark:bg-green-900/40','text-green-700','dark:text-green-400');
    btnEl.classList.add('text-blue-700','dark:text-blue-400','hover:bg-amber-50','dark:hover:bg-amber-900/20');
    btnEl.title = 'Klik untuk verifikasi';
    btnEl.textContent = val;
  }

  // sinkronkan cache lokal agar tidak hilang saat re-render
  const rec = (window._masterSAData || []).find(r => r.sa_id === saId);
  if (rec) rec[`tgl_${String(hari).padStart(2, '0')}_v`] = nowVerified;
}
/** Download template Excel (.xlsx) pakai NAMA PANGKALAN */
async function downloadTemplateMasterSA(btnEl) {
  const btn = btnEl || null;
  try {
    if (btn) UI.setLoading(btn, true, 'Menyiapkan...');
    if (!window.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    const pangRes = await API.operator.getPangkalan({ status: 'ACTIVE' });
    const daftarPangkalan = pangRes.success ? (pangRes.data.pangkalan || []) : [];

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Petunjuk ──
    const petunjukAOA = [
      ['PETUNJUK PENGISIAN TEMPLATE MASTER SA — ILPG'],
      [''],
      ['Kolom', 'Keterangan'],
      ['pangkalan_nama', 'Nama pangkalan — HARUS SAMA PERSIS dengan sheet "Referensi Pangkalan"'],
      ['tgl_01 s/d tgl_31', 'Jumlah alokasi tabung untuk tanggal tersebut (isi 0 jika tidak ada)'],
      [''],
      ['ℹ Satu baris = satu pangkalan untuk bulan yang dipilih.'],
      ['⚠ Pilih bulan target di filter aplikasi SEBELUM klik Upload Excel.'],
      ['⚠ Isi data mulai dari sheet "Data Master SA", baris 2. Jangan ubah nama header.'],
    ];
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukAOA);
    wsPetunjuk['!cols']   = [{ wch: 20 }, { wch: 60 }];
    wsPetunjuk['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

    // ── Sheet 2: Data Master SA (data real, sesuai rentang) ──
    const saStart   = document.getElementById('sa-start')?.value;
    const saEnd     = document.getElementById('sa-end')?.value;
    const startDate = saStart ? new Date(saStart) : new Date();
    const endDate   = saEnd   ? new Date(saEnd)   : new Date();

    const startDay = startDate.getDate();
    let endDay     = endDate.getDate();

    if (startDate.getMonth() !== endDate.getMonth() || startDate.getFullYear() !== endDate.getFullYear()) {
      endDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    }

    const days = [];
    for (let d = startDay; d <= endDay; d++) {
      days.push(`tgl_${String(d).padStart(2, '0')}`);
    }

    const headers = ['pangkalan_nama', ...days];

const existingData = window._masterSAData || [];
    const dataRows = daftarPangkalan.map(p => {
      const existing = existingData.find(d => d.pangkalan_nama === p.nama) || {};
      return [p.nama, ...days.map(key => Number(existing[key] || 0))];
    });

    const wsData = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    wsData['!cols'] = [{ wch: 30 }, ...Array(days.length).fill({ wch: 7 })];
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Master SA');

    // ── Sheet 3: Referensi Pangkalan ──
    const wsRefPang = XLSX.utils.aoa_to_sheet([
      ['Nama Pangkalan'],
      ...(daftarPangkalan.length ? daftarPangkalan.map(p => [p.nama]) : [['(Belum ada data pangkalan aktif)']]),
    ]);
    wsRefPang['!cols'] = [{ wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsRefPang, 'Referensi Pangkalan');

    const bulanNama = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(' ', '_');
    const rangeStr  = startDay === endDay ? `tgl${startDay}` : `tgl${startDay}-${endDay}`;

    XLSX.writeFile(wb, `master_sa_${bulanNama}_${rangeStr}_ILPG.xlsx`);
    UI.toast('Data Master SA berhasil didownload.', 'success');
  } catch (err) {
    UI.toast(`Gagal membuat template: ${err.message}`, 'error');
  } finally {
    if (btn) UI.setLoading(btn, false);
  }
}
async function verifyAllMasterSADay(hari, verified, btnEl) {
  const data = window._masterSAData || [];
  const key  = `tgl_${String(hari).padStart(2, '0')}`;

  // Hanya baris yang punya angka > 0 di tanggal ini yang ikut diverifikasi
  const targets = data.filter(r => Number(r[key] || 0) > 0);
  if (!targets.length) {
    UI.toast(`Tidak ada data (angka) pada tanggal ${hari} untuk diverifikasi.`, 'info');
    return;
  }

  const original = btnEl.textContent;
  btnEl.disabled = true;
  btnEl.textContent = '…';

  const res = await API.operator.verifyMasterSABatch({
    sa_ids: targets.map(r => r.sa_id),
    tanggal: hari,
    verified,
  });

  btnEl.disabled = false;
  btnEl.textContent = original;

  if (!res.success) { UI.toast(res.message, 'error'); return; }

  UI.toast(res.message, 'success');
  fetchMasterSA(); // re-render tabel supaya semua tombol angka di kolom ini ikut update
}
/** Upload & parse file Excel/CSV Master SA pakai NAMA PANGKALAN langsung */
async function uploadMasterSAExcel(input) {
  const file = input.files[0];
  if (!file) return;

  // Ambil bulan & tahun dari filter sa-start yang aktif di halaman
  const saStart   = document.getElementById('sa-start')?.value;
  const startDate = saStart ? new Date(saStart) : new Date();
  const tahun     = String(startDate.getFullYear());
  const bulanNum  = String(startDate.getMonth() + 1).padStart(2, '0');
  const bulanLabel = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const statusEl = document.getElementById('sa-import-status');
  statusEl.className = 'mb-4 card bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300';
  statusEl.textContent = '⏳ Membaca file...';
  statusEl.classList.remove('hidden');

  try {
    const rows = await parseCSVOrExcel(file);
    if (!rows || rows.length < 2) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ File kosong atau format salah.';
      input.value = ''; return;
    }

    const headers  = rows[0].map(h => String(h).trim().toLowerCase());
    const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));

    if (!headers.includes('pangkalan_nama')) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Kolom "pangkalan_nama" tidak ditemukan. Pastikan menggunakan template resmi terbaru.';
      input.value = ''; return;
    }

    const mapped = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? '').trim(); });
      return obj;
    }).filter(r => r.pangkalan_nama);

    if (!mapped.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Tidak ada baris data valid.';
      input.value = ''; return;
    }

    statusEl.textContent = `⏳ Mengirim ${mapped.length} data Master SA ke server untuk ${bulanLabel}...`;
    const res = await API.operator.importMasterSA({ rows: mapped, bulan: bulanNum, tahun });
    input.value = '';

// ganti bagian if (res.success) di uploadMasterSAExcel
if (res.success) {
  statusEl.className = 'mb-4 card bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700';
  statusEl.textContent = `✅ Import ${bulanLabel} selesai — ${res.data.inserted} baru ditambahkan, ${res.data.updated} data ditimpa.`;
  fetchMasterSA();
    } else {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Import gagal: ${res.message}`;
    }
  } catch (err) {
    statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
    statusEl.textContent = `❌ Gagal membaca file: ${err.message}`;
    input.value = '';
  }
}

/** Form Modal Untuk Input / Edit Manual Master SA (Per Tanggal dalam Rentang) */
async function openEditMasterSAModal() {
  const currentMonth = document.getElementById('sa-bln')?.value || UI.currentMonthValue();
  const [tahun, bulan] = currentMonth.split('-');

  const saStart  = document.getElementById('sa-start')?.value;
  const saEnd    = document.getElementById('sa-end')?.value;
  const startDay = saStart ? new Date(saStart).getDate() : 1;
  const rawEnd   = saEnd   ? new Date(saEnd).getDate()   : 31;
  const endDay   = rawEnd < startDay ? startDay : rawEnd;

  const days = [];
  for (let d = startDay; d <= endDay; d++) days.push(d);

  const pangRes = await API.operator.getPangkalan({ status: 'ACTIVE' });
  const pangkalanList = pangRes.success ? pangRes.data.pangkalan : [];

window._samLocalData = pangkalanList.map(p => {
    const existing = (window._masterSAData || []).find(d => d.pangkalan_nama === p.nama) || {};
    const row = { pangkalan_nama: p.nama };
    for (let i = 1; i <= 31; i++) {
      const key = `tgl_${String(i).padStart(2, '0')}`;
      row[key] = Number(existing[key] || 0);
    }
    return row;
  });

  const modal = document.createElement('div');
  modal.id = 'sam-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';

  const rangeLabel = startDay === endDay ? `Tgl ${startDay}` : `Tgl ${startDay} s/d ${endDay}`;

  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-white">Update Alokasi Harian — ${bulan}/${tahun}</h3>
          <p class="text-xs text-slate-500 mt-1">
            Rentang: <span class="font-semibold text-blue-600 dark:text-blue-400">${rangeLabel}</span>
            — Edit alokasi per tanggal untuk setiap pangkalan.
          </p>
        </div>
        <button class="btn-icon" onclick="document.getElementById('sam-modal').remove()">✕</button>
      </div>

      <div class="flex-1 overflow-hidden p-4 flex flex-col">
        <div id="sam-table-wrap" class="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700"></div>
        <div id="sam-err" class="hidden mt-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 shrink-0"></div>
      </div>

      <div class="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
        <button class="btn-secondary" onclick="document.getElementById('sam-modal').remove()">Batal</button>
        <button id="sam-btn" class="btn-primary" onclick="saveMasterSAManual('${tahun}', '${bulan}')">Simpan</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  window.updateSamCell = function(pangkalanIdx, tgl, value) {
    const key = `tgl_${String(tgl).padStart(2, '0')}`;
    window._samLocalData[pangkalanIdx][key] = Number(value) || 0;

    const rowTotal = days.reduce((sum, d) => {
      const k = `tgl_${String(d).padStart(2, '0')}`;
      return sum + (window._samLocalData[pangkalanIdx][k] || 0);
    }, 0);
    const rowTotalEl = document.getElementById(`sam-row-total-${pangkalanIdx}`);
    if (rowTotalEl) rowTotalEl.textContent = rowTotal;

    days.forEach(d => {
      const colSum = window._samLocalData.reduce((sum, r) => {
        const k = `tgl_${String(d).padStart(2, '0')}`;
        return sum + (r[k] || 0);
      }, 0);
      const colEl = document.getElementById(`sam-col-total-${d}`);
      if (colEl) colEl.textContent = colSum;
    });

    const grand = window._samLocalData.reduce((sum, r) => {
      return sum + days.reduce((s, d) => {
        const k = `tgl_${String(d).padStart(2, '0')}`;
        return s + (r[k] || 0);
      }, 0);
    }, 0);
    const grandEl = document.getElementById('sam-grand-total');
    if (grandEl) grandEl.textContent = grand;
  };

  const COL_PANG_W  = 180;
  const COL_DAY_W   = 60;
  const COL_TOTAL_W = 70;

  const thDays = days.map(d =>
    `<th style="min-width:${COL_DAY_W}px;width:${COL_DAY_W}px;top:0;"
         class="text-center text-xs font-semibold border border-slate-200 dark:border-slate-700 px-1 py-2
                sticky bg-slate-100 dark:bg-slate-800 z-10">
      ${String(d).padStart(2, '0')}
    </th>`
  ).join('');

  const bodyRows = window._samLocalData.map((row, idx) => {
    const rowTotal = days.reduce((sum, d) => {
      const k = `tgl_${String(d).padStart(2, '0')}`;
      return sum + (row[k] || 0);
    }, 0);

    const cells = days.map(d => {
      const key = `tgl_${String(d).padStart(2, '0')}`;
      const val = row[key] ?? 0;
      return `<td style="min-width:${COL_DAY_W}px;width:${COL_DAY_W}px;"
                  class="border border-slate-100 dark:border-slate-800 p-1">
        <input type="number" min="0"
          class="w-full text-center text-sm font-semibold text-blue-600 dark:text-blue-400
                 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg py-1
                 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value="${val}"
          onchange="window.updateSamCell(${idx}, ${d}, this.value)" />
      </td>`;
    }).join('');

    return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <td style="min-width:${COL_PANG_W}px;width:${COL_PANG_W}px;left:0;"
          class="font-medium text-sm text-slate-700 dark:text-slate-200
                 border border-slate-100 dark:border-slate-800 px-3 py-2
                 sticky bg-white dark:bg-slate-900 z-20 whitespace-nowrap
                 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        ${idx + 1}. ${UI.escapeHtml(row.pangkalan_nama)}
      </td>
      ${cells}
      <td id="sam-row-total-${idx}"
          style="min-width:${COL_TOTAL_W}px;width:${COL_TOTAL_W}px;right:0;"
          class="text-center font-bold text-emerald-600 dark:text-emerald-400
                 border border-slate-100 dark:border-slate-800 px-2
                 sticky bg-white dark:bg-slate-900 z-20
                 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        ${rowTotal}
      </td>
    </tr>`;
  }).join('');

  const colTotals = days.map(d => {
    const sum = window._samLocalData.reduce((s, r) => {
      const k = `tgl_${String(d).padStart(2, '0')}`;
      return s + (r[k] || 0);
    }, 0);
    return `<td id="sam-col-total-${d}"
                style="min-width:${COL_DAY_W}px;width:${COL_DAY_W}px;"
                class="text-center text-xs font-bold text-blue-700 dark:text-blue-400
                       border border-slate-200 dark:border-slate-700 py-2">
      ${sum}
    </td>`;
  }).join('');

  const grandTotal = window._samLocalData.reduce((sum, r) => {
    return sum + days.reduce((s, d) => {
      const k = `tgl_${String(d).padStart(2, '0')}`;
      return s + (r[k] || 0);
    }, 0);
  }, 0);

  document.getElementById('sam-table-wrap').innerHTML = `
    <table class="border-collapse w-full text-sm" style="table-layout:fixed;">
      <thead>
        <tr>
          <th style="min-width:${COL_PANG_W}px;width:${COL_PANG_W}px;left:0;top:0;"
              class="text-left text-xs font-semibold border border-slate-200 dark:border-slate-700
                     px-3 py-2 sticky bg-slate-100 dark:bg-slate-800 z-30 whitespace-nowrap
                     shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
            Pangkalan
          </th>
          ${thDays}
          <th style="min-width:${COL_TOTAL_W}px;width:${COL_TOTAL_W}px;right:0;top:0;"
              class="text-center text-xs font-semibold border border-slate-200 dark:border-slate-700
                     px-2 py-2 sticky bg-slate-100 dark:bg-slate-800 z-30 whitespace-nowrap
                     shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.15)]">
            Total
          </th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>
        <tr class="bg-blue-50 dark:bg-blue-900/30 font-bold">
          <td style="min-width:${COL_PANG_W}px;width:${COL_PANG_W}px;left:0;"
              class="text-xs font-bold text-slate-700 dark:text-slate-200
                     border border-slate-200 dark:border-slate-700 px-3 py-2
                     sticky bg-blue-50 dark:bg-blue-900/30 z-20
                     shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
            TOTAL HARIAN
          </td>
          ${colTotals}
          <td id="sam-grand-total"
              style="min-width:${COL_TOTAL_W}px;width:${COL_TOTAL_W}px;right:0;"
              class="text-center font-bold text-emerald-600 dark:text-emerald-400
                     border border-slate-200 dark:border-slate-700 px-2
                     sticky bg-blue-50 dark:bg-blue-900/30 z-20
                     shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]">
            ${grandTotal}
          </td>
        </tr>
      </tfoot>
    </table>`;
}

async function saveMasterSAManual(tahun, bulan) {
  const btn   = document.getElementById('sam-btn');
  const errEl = document.getElementById('sam-err');
  errEl.classList.add('hidden');

  UI.setLoading(btn, true, 'Menyimpan...');

const rowsToSave = window._samLocalData;

  const res = await API.operator.importMasterSA({ rows: rowsToSave, bulan, tahun });
  UI.setLoading(btn, false);

  if (res.success) {
    UI.toast('Data Master SA berhasil diupdate.', 'success');
    document.getElementById('sam-modal').remove();
    fetchMasterSA();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}
// ============================================================
// PEMBAYARAN — bukti TF wajib jika ada nominal transfer
// ============================================================

async function loadPembayaran(tipe) {
  const label = tipe === 'REFILL' ? 'Pembayaran Refill' : 'Pembayaran Bagi Hasil';
  const main  = document.getElementById('main-content');
  const today = new Date().toISOString().split('T')[0];
  const firstDay = today.slice(0, 7) + '-01';

 // SESUDAH
main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.5rem;">
      <div>
        <h2 class="page-title">${label}</h2>
        <p class="page-sub">${tipe === 'REFILL' ? 'Tagihan dihitung otomatis dari Master SA yang sudah diverifikasi (✓).' : 'Tagihan dan realisasi pembayaran pangkalan.'}</p>
      </div>
    </div>

    <div class="filter-bar flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium whitespace-nowrap">Dari Tgl:</label>
        <input type="date" id="bp-start" class="form-input w-36 text-sm" value="${firstDay}" onchange="fetchPembayaran('${tipe}')"/>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium whitespace-nowrap">Sampai Tgl:</label>
        <input type="date" id="bp-end" class="form-input w-36 text-sm" value="${today}" onchange="fetchPembayaran('${tipe}')"/>
      </div>
<select id="bp-status" class="form-select w-36 text-sm" onchange="filterPembayaranTable()">
  <option value="">Semua Status</option>
  <option value="LUNAS">Lunas</option>
  <option value="SEBAGIAN">Sebagian</option>
  <option value="BELUM">Belum Bayar</option>
  <option value="SALDO_AGEN">Saldo Agen</option>
</select>
      <input type="text" id="bp-search" class="form-input w-44 text-sm" placeholder="Cari pangkalan..."
        oninput="filterPembayaranTable()"/>
      <button class="btn-secondary text-sm py-1.5" onclick="
        document.getElementById('bp-start').value='${firstDay}';
        document.getElementById('bp-end').value='${today}';
        document.getElementById('bp-status').value='';
        document.getElementById('bp-search').value='';
        fetchPembayaran('${tipe}')">Reset</button>
    </div>

    <div id="bp-import-status" class="hidden mb-4"></div>

    <div id="bp-summary" class="grid grid-cols-3 gap-4 mb-4">${skCards(3)}</div>

    <div class="table-wrapper overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr>
            <th class="text-left p-3">Pangkalan</th>
            <th class="text-center p-3">Tgl Bayar Terakhir</th>
            <th class="text-center p-3">Total Kirim</th>
            <th class="text-center p-3">Tagihan</th>
            <th class="text-center p-3">Terbayar</th>
            <th class="text-center p-3">Sisa</th>
            <th class="text-center p-3">Status</th>
            <th class="text-right p-3">Aksi</th>
          </tr>
        </thead>
        <tbody id="bp-tbody"></tbody>
      </table>
    </div>`;

  await fetchPembayaran(tipe);
}
async function downloadTemplateBrimola(btnEl) {
  const btn = btnEl || null;
  try {
    if (btn) UI.setLoading(btn, true, 'Menyiapkan...');
    if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

    const pangRes = await API.operator.getPangkalan({ status: 'ACTIVE' });
    const daftarPangkalan = pangRes.success ? (pangRes.data.pangkalan || []) : [];

    const wb = XLSX.utils.book_new();

    // Sheet 1: Petunjuk
    const petunjukAOA = [
      ['PETUNJUK PENGISIAN TEMPLATE PEMBAYARAN BRIMOLA — ILPG'],
      [''],
      ['Kolom', 'Keterangan'],
      ['tanggal_bayar', 'Format YYYY-MM-DD, contoh: 2025-07-01'],
      ['pangkalan_nama', 'Nama pangkalan — HARUS SAMA PERSIS dengan sheet "Referensi Pangkalan"'],
      ['jumlah_tabung', 'Jumlah tabung yang dibayar via Brimola (angka)'],
      ['keterangan', 'Catatan opsional (boleh kosong)'],
      [''],
      ['ℹ Nominal akan dihitung otomatis: jumlah_tabung × harga refill pangkalan.'],
      ['⚠ Jangan ubah nama header di sheet "Data Brimola".'],
    ];
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukAOA);
    wsPetunjuk['!cols'] = [{ wch: 18 }, { wch: 65 }];
    wsPetunjuk['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

    // Sheet 2: Data Brimola
    const headers = ['tanggal_bayar', 'pangkalan_nama', 'jumlah_tabung', 'keterangan'];
    const contoh = [UI.todayInputValue(), daftarPangkalan[0]?.nama || 'NAMA_PANGKALAN', 100, ''];
    const wsData = XLSX.utils.aoa_to_sheet([headers, contoh]);
    wsData['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Brimola');

    // Sheet 3: Referensi Pangkalan (dengan harga refill)
    const wsRef = XLSX.utils.aoa_to_sheet([
      ['Nama Pangkalan', 'Harga Refill/Tabung'],
      ...(daftarPangkalan.length
        ? daftarPangkalan.map(p => [p.nama, p.harga_refill || 0])
        : [['(Belum ada data pangkalan aktif)', '']]),
    ]);
    wsRef['!cols'] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi Pangkalan');

    XLSX.writeFile(wb, `template_brimola_${UI.currentMonthValue()}_ILPG.xlsx`);
    UI.toast('Template Brimola berhasil didownload.', 'success');
  } catch (err) {
    UI.toast(`Gagal membuat template: ${err.message}`, 'error');
  } finally {
    if (btn) UI.setLoading(btn, false);
  }
}
async function uploadBrimolaExcel(input) {
  const file = input.files[0];
  if (!file) return;

  const bulan = document.getElementById('bp-bln')?.value || UI.currentMonthValue();
  const statusEl = document.getElementById('bp-import-status');
  statusEl.className = 'mb-4 card bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300';
  statusEl.textContent = '⏳ Membaca file...';
  statusEl.classList.remove('hidden');

  try {
    if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

    const rows = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const sheetName = wb.SheetNames.includes('Data Brimola') ? 'Data Brimola' : wb.SheetNames[0];
          resolve(XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }));
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsArrayBuffer(file);
    });

    if (!rows || rows.length < 2) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ File kosong atau format salah.';
      input.value = ''; return;
    }

    const headers = rows[0].map(h => String(h).trim().toLowerCase());
    const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
    const reqCols = ['tanggal_bayar', 'pangkalan_nama', 'jumlah_tabung'];
    const missing = reqCols.filter(c => !headers.includes(c));

    if (missing.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Kolom wajib tidak ditemukan: ${missing.join(', ')}. Gunakan template resmi.`;
      input.value = ''; return;
    }

    const mapped = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? '').trim(); });
      return obj;
    }).filter(r => r.tanggal_bayar && r.pangkalan_nama && r.jumlah_tabung);

    if (!mapped.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Tidak ada baris data valid.';
      input.value = ''; return;
    }

    // Validasi nama pangkalan
    statusEl.textContent = '⏳ Memvalidasi nama pangkalan...';
    const pangRes = await API.operator.getPangkalan({ status: 'ACTIVE' });
    if (!pangRes.success) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Gagal memuat data pangkalan untuk validasi.';
      input.value = ''; return;
    }

    const norm = s => String(s || '').trim().toLowerCase();
    const pangMap = new Map((pangRes.data.pangkalan || []).map(p => [norm(p.nama), p.nama]));

    const resolved = [];
    const notFound = [];
    mapped.forEach((r, idx) => {
      const namaAsli = pangMap.get(norm(r.pangkalan_nama));
      if (!namaAsli) {
        notFound.push(`Baris ${idx + 2}: "${r.pangkalan_nama}" tidak ditemukan`);
        return;
      }
      resolved.push({
        tanggal_bayar: r.tanggal_bayar,
        pangkalan_nama: namaAsli,
        jumlah_tabung: Number(r.jumlah_tabung) || 0,
        keterangan: r.keterangan || '',
      });
    });

    if (notFound.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.innerHTML = `❌ ${notFound.length} baris gagal dicocokkan:<br/>${notFound.slice(0, 8).map(m => UI.escapeHtml(m)).join('<br/>')}${notFound.length > 8 ? `<br/>...dan ${notFound.length - 8} lainnya.` : ''}<br/>Cek ejaan nama pada sheet Referensi.`;
      input.value = ''; return;
    }

    statusEl.textContent = `⏳ Mengirim ${resolved.length} baris ke server...`;
    const res = await API.operator.importPembayaranRefill({ rows: resolved });
    input.value = '';

    if (res.success) {
      statusEl.className = 'mb-4 card bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700';
      statusEl.textContent = `✅ ${res.data.inserted} pembayaran Brimola berhasil diimport. ${res.data.skipped ? `(${res.data.skipped} baris dilewati — harga refill tidak ditemukan)` : ''}`;
      fetchPembayaran('REFILL');
    } else {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Import gagal: ${res.message}`;
    }
  } catch (err) {
    statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
    statusEl.textContent = `❌ Gagal membaca file: ${err.message}`;
    input.value = '';
  }
}
async function fetchPembayaran(tipe) {
  const start = document.getElementById('bp-start')?.value;
  const end   = document.getElementById('bp-end')?.value;
  if (start > end) { UI.toast('Rentang tanggal tidak valid.', 'warning'); return; }

  const tbody = document.getElementById('bp-tbody');
  tbody.innerHTML = `<tr><td colspan="8">${skLine()}</td></tr>`;

  const bulan = start ? start.slice(0, 7) : UI.currentMonthValue();
  const fn    = tipe === 'REFILL' ? API.operator.getPembayaranRefill : API.operator.getPembayaranBagiHasil;
  const res   = await fn({ bulan, start_date: start, end_date: end });

  const expectedSection = tipe === 'REFILL' ? 'bayar-refill' : 'bayar-bh';
  if (activeSection !== expectedSection) return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

// SESUDAH
  const data = res.data.pembayaran || [];
  window._pembayaranTipe    = tipe;
  window._pembayaranAllRows = data; // array per owner (REFILL & BAGI_HASIL sekarang sama strukturnya)

  const totalTagihan = data.reduce((s, o) => s + o.total_tagihan, 0);
  const totalBayar   = data.reduce((s, o) => s + o.total_bayar, 0);
  const lunasCount   = data.filter(o => o.status === 'LUNAS').length;

  document.getElementById('bp-summary').innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-slate-100 dark:bg-slate-800">💰</div>
      <div><div class="stat-label">Total Tagihan</div>
      <div class="stat-value text-lg">${UI.formatRupiah(totalTagihan)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div>
      <div><div class="stat-label">Total Terbayar</div>
      <div class="stat-value text-lg text-green-600">${UI.formatRupiah(totalBayar)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">🏦</div>
      <div><div class="stat-label">Owner Lunas</div>
      <div class="stat-value">${lunasCount}/${data.length}</div></div></div>`;

  filterPembayaranTable();
}

window._bpExpandedOwners = window._bpExpandedOwners || new Set();

function toggleOwnerPembayaran(ownerKey) {
  if (window._bpExpandedOwners.has(ownerKey)) window._bpExpandedOwners.delete(ownerKey);
  else window._bpExpandedOwners.add(ownerKey);
  filterPembayaranTable();
}
function filterPembayaranTable() {
  const statusFilter = document.getElementById('bp-status')?.value || '';
  const searchFilter = (document.getElementById('bp-search')?.value || '').toLowerCase();
  const tipe         = window._pembayaranTipe || 'REFILL';
  const allOwners    = window._pembayaranAllRows || [];

  const tbody = document.getElementById('bp-tbody');
  if (!tbody) return;

  let html = '';

allOwners.forEach((ownerData, idx) => {
  const ownerKey = ownerData.owner || `owner-${idx}`;

  // Filter di level OWNER dulu
  if (statusFilter && ownerData.status !== statusFilter) return;

  const filteredPangkalan = (ownerData.pangkalan || []).filter(p => {
    const matchSearch = !searchFilter ||
      p.nama.toLowerCase().includes(searchFilter) ||
      ownerData.owner.toLowerCase().includes(searchFilter);
    return matchSearch;
  });
  if (!filteredPangkalan.length) return;

    const isExpanded = window._bpExpandedOwners.has(ownerKey);
    const totalKirimOwner = filteredPangkalan.reduce((s, p) => s + Number(p.total_sa || 0), 0);

    html += `
      <tr class="bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
          onclick="toggleOwnerPembayaran('${ownerKey.replace(/'/g, "\\'")}')">
        <td class="p-3">
          <span class="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <span style="display:inline-block;transition:transform .15s;transform:rotate(${isExpanded ? '90deg' : '0deg'})">▶</span>
            👤 ${UI.escapeHtml(ownerData.owner)}
            <span class="text-xs font-normal text-slate-400">(${filteredPangkalan.length} pangkalan)</span>
          </span>
        </td>
        <td class="p-3 text-center text-xs text-slate-400">—</td>
        <td class="p-3 text-center font-semibold">${UI.formatNumber(totalKirimOwner)} <span class="text-slate-400 text-xs">tab</span></td>
        <td class="p-3 text-center font-bold text-red-600">${UI.formatRupiah(ownerData.total_tagihan)}</td>
        <td class="p-3 text-center font-bold text-green-600">${UI.formatRupiah(ownerData.total_bayar)}</td>
        <td class="p-3 text-center font-bold ${ownerData.sisa < 0 ? 'text-purple-600' : 'text-amber-600'}">${UI.formatRupiah(Math.abs(ownerData.sisa))}</td>
        <td class="p-3 text-center">${UI.badge(ownerData.status, ownerData.status)}</td>
        <td class="p-3"></td>
      </tr>`;

    if (!isExpanded) return;

    filteredPangkalan.forEach(p => {
      const tglTerakhir = (p.pembayaran || [])
        .map(b => b.tanggal_bayar).filter(Boolean).sort().pop() || '';
      html += `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <td class="p-3 pl-8 text-slate-700 dark:text-slate-300">
            ↳ ${UI.escapeHtml(p.nama)}
            <div class="text-xs text-slate-400 font-mono">${UI.escapeHtml(p.id_reg)}</div>
          </td>
          <td class="p-3 text-center text-xs text-slate-500">${tglTerakhir ? UI.formatDateShort(tglTerakhir) : '-'}</td>
          <td class="p-3 text-center">${UI.formatNumber(p.total_sa)} <span class="text-slate-400 text-xs">tab</span></td>
          <td class="p-3 text-center font-semibold text-red-600">${UI.formatRupiah(p.tagihan)}</td>
          <td class="p-3 text-center font-semibold text-green-600">${UI.formatRupiah(p.total_bayar)}</td>
         <td class="p-3 text-center font-semibold ${p.sisa > 0 ? 'text-amber-600' : p.sisa < 0 ? 'text-purple-600' : 'text-slate-400'}">
  ${p.sisa > 0 ? UI.formatRupiah(p.sisa) : p.sisa < 0 ? UI.formatRupiah(Math.abs(p.sisa)) : '-'}
</td>
          <td class="p-3 text-center">${UI.badge(p.status, p.status)}</td>
          <td class="p-3 text-right">
            <div class="flex gap-2 justify-end">
              ${p.status !== 'LUNAS' ? `<button class="btn-primary text-xs py-1 px-3" onclick="openPembayaranModalById('${p.pangkalan_id}','${tipe}')">Bayar</button>` : ''}
              ${(p.pembayaran || []).length ? `<button class="btn-secondary text-xs py-1 px-3" onclick="openRiwayatBayarModal('${p.pangkalan_id}','${UI.escapeHtml(p.nama)}','${UI.escapeHtml(ownerData.owner)}','${tipe}')">Riwayat</button>` : ''}
            </div>
          </td>
        </tr>`;
    });
  });

  tbody.innerHTML = html || `<tr><td colspan="8">${UI.emptyState('Tidak ada data pembayaran.', '💰')}</td></tr>`;
}
function openRiwayatBayarModal(pangkalanId, namaPangkalan, namaOwner, tipe) {
  const allOwners = window._pembayaranAllRows || [];
  let riwayat = [];
  allOwners.forEach(o => {
    const p = o.pangkalan.find(p => p.pangkalan_id === pangkalanId);
    if (p) riwayat = p.pembayaran || [];
  });

  const modal = document.createElement('div');
  modal.id    = 'riwayat-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-white">Riwayat Bayar — ${UI.escapeHtml(namaPangkalan)}</h3>
          <p class="text-xs text-slate-500 mt-0.5">Owner: ${UI.escapeHtml(namaOwner)}</p>
        </div>
        <button class="btn-icon" onclick="document.getElementById('riwayat-modal').remove()">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th class="text-left py-2">Tanggal</th>
              <th class="text-center py-2">Transfer</th>
              <th class="text-center py-2">Total</th>
              <th class="text-center py-2">Bukti</th>
              <th class="text-right py-2">Aksi</th>
            </tr>
          </thead>
          <tbody id="riwayat-tbody">
            ${riwayat.length ? riwayat.map(p => {
              // Pembayaran tanpa bukti TF & tanpa nominal transfer manual = otomatis dari Master SA (Brimola)
              const isBrimola = !p.bukti_tf_url && !(Number(p.nominal_transfer) > 0);

              return `
              <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="py-2 text-xs text-slate-500">${UI.formatDateShort(p.tanggal_bayar)}</td>
                <td class="py-2 text-center">${UI.formatRupiah(p.nominal_transfer || 0)}</td>
                <td class="py-2 text-center font-semibold text-green-600">${UI.formatRupiah(p.total_bayar || 0)}</td>
                <td class="py-2 text-center">
                  ${p.bukti_tf_url
                    ? `<a href="${p.bukti_tf_url}" target="_blank" class="text-blue-600 underline text-xs">Lihat</a>`
                    : '<span class="text-slate-300 text-xs">-</span>'}
                </td>
                <td class="py-2 text-right">
                  ${isBrimola
                    ? `<span class="text-xs text-slate-400 italic">Pembayaran Lewat Brimola</span>`
                    : `<div class="flex gap-2 justify-end">
                         <button class="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                           onclick="openEditPembayaranModal('${p.bayar_id}','${pangkalanId}','${UI.escapeHtml(namaPangkalan)}','${tipe}')">Edit</button>
                         <button class="text-red-600 hover:text-red-800 text-xs font-semibold"
                           onclick="hapusPembayaranRiwayat('${p.bayar_id}','${pangkalanId}','${UI.escapeHtml(namaPangkalan)}','${UI.escapeHtml(namaOwner)}','${tipe}')">Hapus</button>
                       </div>`}
                </td>
              </tr>`;
            }).join('')
            : `<tr><td colspan="5" class="text-center text-slate-400 py-6">Belum ada riwayat.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function hapusPembayaranRiwayat(bayarId, pangkalanId, namaPangkalan, namaOwner, tipe) {
  if (!await UI.confirm('Hapus data pembayaran ini?', 'Konfirmasi Hapus')) return;
  const res = await API.operator.deletePembayaran({ bayar_id: bayarId });
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  UI.toast('Pembayaran dihapus.', 'success');
  document.getElementById('riwayat-modal')?.remove();
  await fetchPembayaran(tipe);
  // buka ulang modal riwayat dengan data terbaru
  openRiwayatBayarModal(pangkalanId, namaPangkalan, namaOwner, tipe);
}

function openEditPembayaranModal(bayarId, pangkalanId, namaPangkalan, tipe) {
  // cari data lama dari cache
  const allOwners = window._pembayaranAllRows || [];
  let existing = null;
  allOwners.forEach(o => {
    const p = o.pangkalan.find(p => p.pangkalan_id === pangkalanId);
    if (p) existing = (p.pembayaran || []).find(b => b.bayar_id === bayarId);
  });
  if (!existing) { UI.toast('Data tidak ditemukan.', 'error'); return; }

  document.getElementById('riwayat-modal')?.remove();

  const modal = document.createElement('div');
  modal.id    = 'edit-pay-modal';
  modal.className = 'fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Edit Pembayaran — ${UI.escapeHtml(namaPangkalan)}</h3>
        <button class="btn-icon" onclick="document.getElementById('edit-pay-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Tanggal Bayar *</label>
          <input id="epm-tgl" type="date" class="form-input" value="${existing.tanggal_bayar}"/>
        </div>
        <div><label class="form-label">Nominal Transfer *</label>
          <input id="epm-transfer" type="number" class="form-input" value="${existing.nominal_transfer || 0}" min="0"/>
        </div>
        <div>
          <label class="form-label">Bukti Transfer (kosongkan jika tidak ganti)</label>
          <label class="flex items-center gap-2 cursor-pointer w-full">
            <div id="epm-upload-btn" class="btn-secondary text-sm flex items-center gap-2 w-full justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              <span id="epm-upload-label">${existing.bukti_tf_url ? 'Ganti Foto Bukti TF' : 'Pilih Foto Bukti TF'}</span>
            </div>
            <input id="epm-bukti-file" type="file" accept="image/*" class="hidden" onchange="previewBuktiTFEdit(this)"/>
          </label>
          ${existing.bukti_tf_url ? `
            <div class="mt-2">
              <a href="${existing.bukti_tf_url}" target="_blank" class="text-blue-600 underline text-xs">Lihat bukti TF saat ini</a>
            </div>` : ''}
          <div id="epm-bukti-preview" class="hidden mt-2">
            <img id="epm-bukti-img" src="" alt="Preview" class="w-full max-h-48 object-contain rounded-xl border border-slate-200 dark:border-slate-700"/>
          </div>
        </div>
        <div id="epm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="epm-btn" class="btn-primary w-full justify-center"
          onclick="saveEditPembayaran('${bayarId}','${pangkalanId}','${UI.escapeHtml(namaPangkalan)}','${tipe}')">
          Simpan Perubahan
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function previewBuktiTFEdit(input) {
  const file = input.files[0];
  if (!file) return;
  const label   = document.getElementById('epm-upload-label');
  const preview = document.getElementById('epm-bukti-preview');
  const img     = document.getElementById('epm-bukti-img');
  label.textContent = file.name.length > 28 ? file.name.slice(0, 25) + '...' : file.name;
  const reader = new FileReader();
  reader.onload = e => { img.src = e.target.result; preview.classList.remove('hidden'); };
  reader.readAsDataURL(file);
}

async function saveEditPembayaran(bayarId, pangkalanId, namaPangkalan, tipe) {
  const btn      = document.getElementById('epm-btn');
  const errEl    = document.getElementById('epm-err');
  errEl.classList.add('hidden');

  const tanggal   = document.getElementById('epm-tgl').value;
  const transfer  = Number(document.getElementById('epm-transfer')?.value || 0);
  const fileInput = document.getElementById('epm-bukti-file');

  if (transfer <= 0) {
    errEl.textContent = 'Nominal transfer wajib diisi.';
    errEl.classList.remove('hidden'); return;
  }

  UI.setLoading(btn, true, 'Menyimpan...');

  const body = {
    bayar_id: bayarId,
    tanggal_bayar: tanggal,
    nominal_transfer: transfer,
  };

  if (fileInput?.files[0]) {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsDataURL(fileInput.files[0]);
      });
      const uploadRes = await API.uploadImage(base64, 'BUKTI_TF');
      if (!uploadRes.success) {
        errEl.textContent = `Gagal upload foto: ${uploadRes.message}`;
        errEl.classList.remove('hidden');
        UI.setLoading(btn, false); return;
      }
      body.bukti_tf_url = uploadRes.data.file_url;
    } catch (err) {
      errEl.textContent = `Gagal upload foto: ${err.message}`;
      errEl.classList.remove('hidden');
      UI.setLoading(btn, false); return;
    }
  }

  const res = await API.operator.updatePembayaran(body);
  UI.setLoading(btn, false);

  if (res.success) {
    UI.toast('Pembayaran berhasil diupdate.', 'success');
    document.getElementById('edit-pay-modal')?.remove();
    await fetchPembayaran(tipe);
    openRiwayatBayarModal(pangkalanId, namaPangkalan, '', tipe);
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}
function openPembayaranModalById(pangkalanId, tipe) {
  const item = (window._pembayaranData || []).find(d => d.pangkalan_id === pangkalanId);
  openPembayaranModal(pangkalanId, tipe, item ? item.nama : '-');
}

function openPembayaranModal(pangkalanId, tipe, namaPangkalan) {
  const modal = document.createElement('div');
  modal.id    = 'pay-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Catat Pembayaran — ${UI.escapeHtml(namaPangkalan)}</h3>
        <button class="btn-icon" onclick="document.getElementById('pay-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Tanggal Bayar *</label>
          <input id="pm-tgl" type="date" class="form-input" value="${UI.todayInputValue()}"/>
        </div>
        <div><label class="form-label">Nominal Transfer *</label>
          <input id="pm-transfer" type="number" class="form-input" placeholder="0" min="0"/>
        </div>
        <div>
          <label class="form-label">Bukti Transfer *</label>
          <label class="flex items-center gap-2 cursor-pointer w-full">
            <div id="pm-upload-btn" class="btn-secondary text-sm flex items-center gap-2 w-full justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              <span id="pm-upload-label">Pilih Foto Bukti TF</span>
            </div>
            <input id="pm-bukti-file" type="file" accept="image/*" class="hidden"
              onchange="previewBuktiTF(this)"/>
          </label>
          <div id="pm-bukti-preview" class="hidden mt-2">
            <img id="pm-bukti-img" src="" alt="Preview"
              class="w-full max-h-48 object-contain rounded-xl border border-slate-200 dark:border-slate-700"/>
          </div>
        </div>
        <div id="pm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="pm-btn" class="btn-primary w-full justify-center"
          onclick="savePembayaran('${pangkalanId}','${tipe}')">
          Simpan Pembayaran
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
/** Tampilkan/sembunyikan label wajib pada bukti TF berdasarkan nominal transfer */
function toggleBuktiTF() {
  const transfer = Number(document.getElementById('pm-transfer')?.value || 0);
  const label    = document.getElementById('pm-bukti-required');
  if (label) label.textContent = transfer > 0 ? '* (wajib)' : '(wajib jika ada transfer)';
}
function previewBuktiTF(input) {
  const file = input.files[0];
  if (!file) return;
  const label   = document.getElementById('pm-upload-label');
  const preview = document.getElementById('pm-bukti-preview');
  const img     = document.getElementById('pm-bukti-img');
  label.textContent = file.name.length > 28 ? file.name.slice(0, 25) + '...' : file.name;
  const reader = new FileReader();
  reader.onload = e => {
    img.src = e.target.result;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}
async function savePembayaran(pangkalanId, tipe) {
  const btn      = document.getElementById('pm-btn');
  const errEl    = document.getElementById('pm-err');
  errEl.classList.add('hidden');

  const tanggal   = document.getElementById('pm-tgl').value;
  const transfer  = Number(document.getElementById('pm-transfer')?.value || 0);
  const fileInput = document.getElementById('pm-bukti-file');

  if (transfer <= 0) {
    errEl.textContent = 'Nominal transfer wajib diisi.';
    errEl.classList.remove('hidden'); return;
  }
  if (!fileInput?.files[0]) {
    errEl.textContent = 'Foto bukti transfer wajib diupload.';
    errEl.classList.remove('hidden'); return;
  }

  UI.setLoading(btn, true, 'Mengupload foto...');

  let buktiUrl = '';
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsDataURL(fileInput.files[0]);
    });
    const uploadRes = await API.uploadImage(base64, 'BUKTI_TF');
    if (!uploadRes.success) {
      errEl.textContent = `Gagal upload foto: ${uploadRes.message}`;
      errEl.classList.remove('hidden');
      UI.setLoading(btn, false); return;
    }
    buktiUrl = uploadRes.data.file_url;
  } catch (err) {
    errEl.textContent = `Gagal upload foto: ${err.message}`;
    errEl.classList.remove('hidden');
    UI.setLoading(btn, false); return;
  }

  UI.setLoading(btn, true, 'Menyimpan...');

  const fn  = tipe === 'REFILL' ? API.operator.createPembayaranRefill : API.operator.createPembayaranBagiHasil;
  const res = await fn({
    pangkalan_id:     pangkalanId,
    laporan_id:       '',
    tanggal_bayar:    tanggal,
    nominal_brimola:  0,
    nominal_transfer: transfer,
    bukti_tf_url:     buktiUrl,
  });

  UI.setLoading(btn, false);

  if (res.success) {
    UI.toast('Pembayaran berhasil dicatat.', 'success');
    document.getElementById('pay-modal').remove();
    fetchPembayaran(tipe);
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
  grandEl.classList.remove('hidden');
  grandEl.innerHTML = `
    <div class="flex items-center justify-between">
      <div><div class="text-xs text-slate-500 uppercase font-semibold tracking-wide">Grand Total Pembayaran</div>
      <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">${UI.formatRupiah(grand_total)}</div></div>
      <div class="text-3xl">💰</div>
    </div>`;
  document.getElementById('mb-list').innerHTML = monitoring.length ? monitoring.map(m => `
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(m.nama)}</h4>
        <span class="font-bold text-slate-700 dark:text-slate-300">${UI.formatRupiah(m.total_semua)}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm text-slate-500">
        <div>Refill: <span class="font-medium text-slate-700 dark:text-slate-300">${UI.formatRupiah(m.total_refill)}</span></div>
        <div>Bagi Hasil: <span class="font-medium text-slate-700 dark:text-slate-300">${UI.formatRupiah(m.total_bagi_hasil)}</span></div>
      </div>
    </div>`).join('') : UI.emptyState('Belum ada data pembayaran bulan ini.','💰');
}

// ============================================================
// STOK GUDANG — retur tidak menambah balik stok
// ============================================================
// ============================================================
// STOK GUDANG — retur tidak menambah balik stok
// ============================================================

async function loadStokGudang() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Stok Gudang</h2><p class="page-sub">Stok = Total Pembelian − Total Terkirim. Retur tidak menambah balik stok gudang.</p></div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn-secondary text-sm" onclick="downloadTemplateStokGudang(this)">⬇️ Template Excel</button>
        <label class="btn-secondary text-sm cursor-pointer">
          ⬆️ Upload Excel
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="uploadStokGudangExcel(this)"/>
        </label>
        <button class="btn-primary" onclick="openPembelianModal()">+ Tambah Pembelian</button>
      </div>
    </div>
    <div class="filter-bar">
      <input type="month" id="sg-bln" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchStok()"/>
    </div>
    <div id="sg-import-status" class="hidden mb-4"></div>
    <div id="sg-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">${skCards(4)}</div>
    <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Riwayat Pembelian</h3>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>SPBE</th>
            <th>Jumlah</th>
            <th>Keterangan</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody id="sg-tbody"></tbody>
      </table>
    </div>`;
  await fetchStok();
}
async function fetchStok() {
  const bulan = document.getElementById('sg-bln')?.value;
  
  // Colspan diubah jadi 5 karena kolom harga dan total dihapus
  document.getElementById('sg-tbody').innerHTML = `<tr><td colspan="5">${skLine()}</td></tr>`;
  
  const res = await API.operator.getStokGudang({ bulan });
  if (activeSection !== 'stok-gudang') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  
  const { total_pembelian, total_terkirim, total_retur, stok_gudang, pembelian } = res.data;
  const stokColor = stok_gudang < 0 ? 'text-red-600' : stok_gudang < 100 ? 'text-amber-600' : 'text-green-600';

  document.getElementById('sg-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon bg-blue-100 dark:bg-blue-900/40">📦</div><div><div class="stat-label">Total Pembelian</div><div class="stat-value">${UI.formatNumber(total_pembelian)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-green-100 dark:bg-green-900/40">🚚</div><div><div class="stat-label">Total Terkirim</div><div class="stat-value">${UI.formatNumber(total_terkirim)}</div></div></div>
    <div class="stat-card"><div class="stat-icon bg-slate-100 dark:bg-slate-800">↩️</div><div>
      <div class="stat-label">Total Retur</div>
      <div class="stat-value text-slate-500">${UI.formatNumber(total_retur)}</div>
      <div class="text-xs text-slate-400 mt-0.5">tidak masuk stok</div>
    </div></div>
    <div class="stat-card"><div class="stat-icon bg-amber-100 dark:bg-amber-900/40">🏭</div><div>
      <div class="stat-label">Stok Gudang</div>
      <div class="stat-value ${stokColor}">${UI.formatNumber(stok_gudang)}</div>
      <div class="text-xs text-slate-400 mt-0.5">pembelian − terkirim</div>
    </div></div>`;

  document.getElementById('sg-tbody').innerHTML = pembelian?.length ? pembelian.map(p => `
    <tr>
      <td class="text-xs text-slate-500">${UI.formatDateShort(p.tanggal)}</td>
      <td>${UI.escapeHtml(p.nama_spbe)}</td>
      <td class="font-semibold">${UI.formatNumber(p.jumlah)}</td>
      <td class="text-slate-500 text-sm">${UI.escapeHtml(p.keterangan || '-')}</td>
      <td class="text-right">
        <button class="btn-danger text-xs py-1 px-2" onclick="hapusPembelian('${p.pembelian_id}')">Hapus</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="5">${UI.emptyState('Belum ada pembelian.','📦')}</td></tr>`;
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
    if (res.success) {
      document.getElementById('bm-spbe').innerHTML =
        `<option value="">-- Pilih SPBE --</option>` +
        // FIX: value sekarang pakai nama SPBE langsung, bukan spbe_id
        res.data.spbe.map(s => `<option value="${UI.escapeHtml(s.nama)}">${UI.escapeHtml(s.nama)}</option>`).join('');
    }
  });
}

async function savePembelian() {
  const btn   = document.getElementById('bm-btn');
  const errEl = document.getElementById('bm-err');
  errEl.classList.add('hidden');

  const body  = { 
    nama_spbe: document.getElementById('bm-spbe').value, // FIX: kirim nama_spbe, bukan spbe_id
    tanggal: document.getElementById('bm-tgl').value, 
    jumlah: Number(document.getElementById('bm-jml').value), 
    keterangan: document.getElementById('bm-ket').value.trim() 
  };

  if (!body.nama_spbe || !body.jumlah) { 
    errEl.textContent = 'SPBE dan jumlah wajib diisi.'; 
    errEl.classList.remove('hidden'); 
    return; 
  }

  UI.setLoading(btn, true, 'Menyimpan...');
  const res = await API.operator.createPembelianStok(body);
  UI.setLoading(btn, false);

  if (res.success) { 
    UI.toast('Pembelian berhasil dicatat.', 'success'); 
    document.getElementById('beli-modal').remove(); 
    fetchStok();
  } else { 
    errEl.textContent = res.message; 
    errEl.classList.remove('hidden'); 
  }
}

async function hapusPembelian(id) {
  if (!await UI.confirm('Hapus data pembelian ini?')) return;
  const res = await API.operator.deletePembelianStok({ pembelian_id: id });
  if (res.success) { UI.toast('Pembelian dihapus.', 'success'); fetchStok(); }
  else UI.toast(res.message, 'error');
}
/** Download template Excel Stok Gudang dengan data real */
async function downloadTemplateStokGudang(btnEl) {
  const btn = btnEl || null;
  try {
    if (btn) UI.setLoading(btn, true, 'Menyiapkan...');
    if (!window.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    const spbeRes = await API.operator.getSPBE({ status: 'ACTIVE' });
    const daftarSPBE = spbeRes.success ? (spbeRes.data.spbe || []) : [];

    // Ambil data pembelian bulan aktif
    const bulan = document.getElementById('sg-bln')?.value || UI.currentMonthValue();
    const stokRes = await API.operator.getStokGudang({ bulan });
    const pembelianList = stokRes.success ? (stokRes.data.pembelian || []) : [];

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Petunjuk ──
    const petunjukAOA = [
      ['PETUNJUK PENGISIAN TEMPLATE STOK GUDANG — ILPG'],
      [''],
      ['Kolom', 'Keterangan'],
      ['tanggal',    'Format YYYY-MM-DD, contoh: 2025-07-01'],
      ['nama_spbe',  'Nama SPBE — HARUS SAMA PERSIS dengan sheet "Referensi SPBE"'],
      ['jumlah',     'Jumlah tabung yang dibeli (angka, wajib diisi)'],
      ['keterangan', 'Catatan bebas (boleh kosong)'],
      [''],
      ['ℹ Satu baris = satu transaksi pembelian.'],
      ['⚠ Isi data mulai dari sheet "Data Pembelian", baris 2. Jangan ubah nama header.'],
      ['⚠ Nama SPBE tidak boleh typo — cek daftar resmi di sheet Referensi SPBE.'],
    ];
    const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukAOA);
    wsPetunjuk['!cols']   = [{ wch: 15 }, { wch: 65 }];
    wsPetunjuk['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

    // ── Sheet 2: Data Pembelian (data real bulan aktif) ──
    const headers = ['tanggal', 'nama_spbe', 'jumlah', 'keterangan'];
    const dataRows = pembelianList.length
      ? pembelianList.map(p => [p.tanggal, p.nama_spbe, p.jumlah, p.keterangan || ''])
      : [[UI.todayInputValue(), daftarSPBE[0]?.nama || 'NAMA_SPBE_DISINI', 0, '']];

    const wsData = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    wsData['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Pembelian');

    // ── Sheet 3: Referensi SPBE ──
    const wsRefSPBE = XLSX.utils.aoa_to_sheet([
      ['Nama SPBE'],
      ...(daftarSPBE.length ? daftarSPBE.map(s => [s.nama]) : [['(Belum ada data SPBE aktif)']]),
    ]);
    wsRefSPBE['!cols'] = [{ wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsRefSPBE, 'Referensi SPBE');

    const bulanNama = new Date(bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(' ', '_');
    XLSX.writeFile(wb, `stok_gudang_${bulanNama}_ILPG.xlsx`);
    UI.toast('Template Stok Gudang berhasil didownload.', 'success');
  } catch (err) {
    UI.toast(`Gagal membuat template: ${err.message}`, 'error');
  } finally {
    if (btn) UI.setLoading(btn, false);
  }
}

async function uploadStokGudangExcel(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById('sg-import-status');
  statusEl.className = 'mb-4 card bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300';
  statusEl.textContent = '⏳ Membaca file...';
  statusEl.classList.remove('hidden');

  try {
    if (!window.XLSX) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    const rows = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb   = XLSX.read(data, { type: 'array' });
          const sheetName = wb.SheetNames.includes('Data Pembelian')
            ? 'Data Pembelian'
            : wb.SheetNames[0];
          resolve(XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }));
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsArrayBuffer(file);
    });

    if (!rows || rows.length < 2) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ File kosong atau format salah.';
      input.value = ''; return;
    }

    const headers  = rows[0].map(h => String(h).trim().toLowerCase());
    const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
    const reqCols  = ['tanggal', 'nama_spbe', 'jumlah'];
    const missing  = reqCols.filter(c => !headers.includes(c));

    if (missing.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Kolom wajib tidak ditemukan: ${missing.join(', ')}. Gunakan template resmi.`;
      input.value = ''; return;
    }

    const mapped = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? '').trim(); });
      return obj;
    }).filter(r => r.tanggal && r.nama_spbe && r.jumlah);

    if (!mapped.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Tidak ada baris data valid.';
      input.value = ''; return;
    }

    statusEl.textContent = '⏳ Mencocokkan nama SPBE...';
    const spbeRes = await API.operator.getSPBE({ status: 'ACTIVE' });
    if (!spbeRes.success) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = '❌ Gagal memuat data SPBE untuk validasi.';
      input.value = ''; return;
    }

    const norm       = s => String(s || '').trim().toLowerCase();
    const spbeNameMap = new Map((spbeRes.data.spbe || []).map(s => [norm(s.nama), s.nama]));

    const resolved = [];
    const notFound = [];
    mapped.forEach((r, idx) => {
      const namaAsli = spbeNameMap.get(norm(r.nama_spbe));
      if (!namaAsli) {
        notFound.push(`Baris ${idx + 2}: SPBE "${r.nama_spbe}" tidak ditemukan`);
        return;
      }
      resolved.push({
        tanggal:    r.tanggal,
        nama_spbe:  namaAsli,
        jumlah:     Number(r.jumlah) || 0,
        keterangan: r.keterangan || '',
      });
    });

    if (notFound.length) {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.innerHTML = `❌ ${notFound.length} baris gagal dicocokkan:<br/>${notFound.slice(0, 8).map(m => UI.escapeHtml(m)).join('<br/>')}${notFound.length > 8 ? `<br/>...dan ${notFound.length - 8} lainnya.` : ''}<br/>Cek ejaan nama pada sheet Referensi SPBE.`;
      input.value = ''; return;
    }

    statusEl.textContent = `⏳ Mengirim ${resolved.length} data pembelian ke server...`;
    const res = await API.operator.importPembelianStok({ rows: resolved });
    input.value = '';

    if (res.success) {
      statusEl.className = 'mb-4 card bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700';
      statusEl.textContent = `✅ ${res.data.inserted} data pembelian berhasil diimport.`;
      fetchStok();
    } else {
      statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
      statusEl.textContent = `❌ Import gagal: ${res.message}`;
    }
  } catch (err) {
    statusEl.className = 'mb-4 card bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600';
    statusEl.textContent = `❌ Gagal membaca file: ${err.message}`;
    input.value = '';
  }
}
// ============================================================
// PANGKALAN
// ============================================================

async function loadPangkalan() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
      <div><h2 class="page-title">Manajemen Pangkalan</h2><p class="page-sub">Kelola data pangkalan gas.</p></div>
      <button class="btn-primary" onclick="openPangkalanModal()">+ Tambah Pangkalan</button>
    </div>
    <div class="filter-bar">
      <input type="text" id="pkln-search" class="form-input w-48" placeholder="Cari pangkalan / owner..."
        oninput="filterPangkalan()"/>
      <select id="pkln-status" class="form-select w-36" onchange="filterPangkalan()">
        <option value="ACTIVE">Aktif</option>
        <option value="">Semua</option>
        <option value="INACTIVE">Nonaktif</option>
      </select>
    </div>
    <div class="table-wrapper">
      <table><thead><tr>
        <th>Nama</th>
        <th>Owner</th>
        <th>ID Reg</th>
        <th>DO Dimiliki</th>
        <th>Tipe Bayar</th>
        <th>Harga Refill</th>
        <th>Harga BH</th>
        <th>Status</th>
        <th class="text-right">Aksi</th>
      </tr></thead>
      <tbody id="pkln-tbody"></tbody></table>
    </div>`;
  await fetchPangkalan();
}

let _allPangkalan = [];

async function fetchPangkalan() {
  const tbody = document.getElementById('pkln-tbody');
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
  const filtered = _allPangkalan.filter(p =>
    (!q || p.nama.toLowerCase().includes(q) ||
           (p.owner || '').toLowerCase().includes(q) ||
           p.id_reg.toLowerCase().includes(q)) &&
    (!s || p.status === s)
  );
  const tbody = document.getElementById('pkln-tbody');
  if (!tbody) return;
  tbody.innerHTML = filtered.length ? filtered.map(p => `
    <tr>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(p.nama)}</td>
      <td class="text-sm text-slate-600 dark:text-slate-400">${UI.escapeHtml(p.owner || '-')}</td>
      <td class="font-mono text-xs text-slate-500">${UI.escapeHtml(p.id_reg)}</td>
      <td class="text-center text-sm">${UI.formatNumber(p.do_dimiliki || 0)}</td>
      <td>${UI.badge(p.tipe_pembayaran, null)}</td>
      <td class="text-sm">${UI.formatRupiah(p.harga_refill)}</td>
      <td class="text-sm">${UI.formatRupiah(p.harga_bagi_hasil)}</td>
      <td>${UI.badge(p.status, p.status)}</td>
      <td class="text-right">
        <div class="flex gap-1 justify-end">
          <button class="btn-secondary text-xs py-1 px-2"
            onclick="openPangkalanModalById('${p.pangkalan_id}')">Edit</button>
          <button class="btn-danger text-xs py-1 px-2"
            onclick="hapusPangkalanById('${p.pangkalan_id}')">Nonaktifkan</button>
        </div>
      </td>
    </tr>`).join('')
  : `<tr><td colspan="9">${UI.emptyState('Tidak ada pangkalan.','🏪')}</td></tr>`;
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
          <div><label class="form-label">Nama *</label>
            <input id="pm-nama" class="form-input" value="${UI.escapeHtml(data?.nama||'')}" placeholder="Nama Pangkalan"/></div>
          <div><label class="form-label">ID Reg *</label>
            <input id="pm-idreg" class="form-input" value="${UI.escapeHtml(data?.id_reg||'')}" placeholder="REG-001"/></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Owner</label>
            <input id="pm-owner" class="form-input" value="${UI.escapeHtml(data?.owner||'')}" placeholder="Nama pemilik pangkalan"/></div>
          <div><label class="form-label">DO Dimiliki</label>
            <input id="pm-do" type="number" class="form-input" value="${data?.do_dimiliki||0}" min="0"/></div>
        </div>
        <div><label class="form-label">Alamat</label>
          <input id="pm-alamat" class="form-input" value="${UI.escapeHtml(data?.alamat||'')}" placeholder="Alamat lengkap..."/></div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="form-label">Tipe Bayar</label>
            <select id="pm-tipe" class="form-select">
              <option ${data?.tipe_pembayaran==='REFILL'?'selected':''}>REFILL</option>
              <option ${data?.tipe_pembayaran==='BAGI_HASIL'?'selected':''}>BAGI_HASIL</option>
              <option ${data?.tipe_pembayaran==='KEDUANYA'?'selected':''}>KEDUANYA</option>
            </select>
          </div>
          <div><label class="form-label">Harga Refill</label>
            <input id="pm-hrefill" type="number" class="form-input" value="${data?.harga_refill||0}" min="0"/></div>
          <div><label class="form-label">Harga BH</label>
            <input id="pm-hbh" type="number" class="form-input" value="${data?.harga_bagi_hasil||0}" min="0"/></div>
        </div>
        <div id="pm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="pm-btn" class="btn-primary w-full justify-center"
          onclick="savePangkalan('${data?.pangkalan_id||''}')">
          ${data ? 'Simpan Perubahan' : 'Tambah Pangkalan'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
async function savePangkalan(id) {
  const btn = document.getElementById('pm-btn');
  const errEl = document.getElementById('pm-err');
  errEl.classList.add('hidden');
  const body = {
    nama:             document.getElementById('pm-nama').value.trim(),
    id_reg:           document.getElementById('pm-idreg').value.trim(),
    owner:            document.getElementById('pm-owner').value.trim(),
    do_dimiliki:      Number(document.getElementById('pm-do').value || 0),
    alamat:           document.getElementById('pm-alamat').value.trim(),
    tipe_pembayaran:  document.getElementById('pm-tipe').value,
    harga_refill:     Number(document.getElementById('pm-hrefill').value),
    harga_bagi_hasil: Number(document.getElementById('pm-hbh').value),
  };
  if (!body.nama || !body.id_reg) {
    errEl.textContent = 'Nama dan ID Registrasi wajib diisi.';
    errEl.classList.remove('hidden'); return;
  }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = id
    ? await API.operator.updatePangkalan({ pangkalan_id: id, ...body })
    : await API.operator.createPangkalan(body);
  UI.setLoading(btn, false);
  if (res.success) {
    UI.toast(id ? 'Pangkalan diupdate.' : 'Pangkalan ditambahkan.', 'success');
    document.getElementById('pkln-modal').remove();
    fetchPangkalan();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

function openPangkalanModalById(id) {
  const data = _allPangkalan.find(p => p.pangkalan_id === id);
  if (!data) { UI.toast('Data pangkalan tidak ditemukan.', 'error'); return; }
  openPangkalanModal(data);
}

async function hapusPangkalanById(id) {
  const data = _allPangkalan.find(p => p.pangkalan_id === id);
  if (!await UI.confirm(`Nonaktifkan pangkalan "${UI.escapeHtml(data?.nama || 'ini')}"?`)) return;
  const res = await API.operator.deletePangkalan({ pangkalan_id: id });
  if (res.success) { UI.toast('Pangkalan dinonaktifkan.', 'success'); fetchPangkalan(); }
  else UI.toast(res.message, 'error');
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
  const res = await API.operator.getSPBE();
  if (activeSection !== 'spbe') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  window._allSPBE = res.data.spbe;
  document.getElementById('spbe-tbody').innerHTML = res.data.spbe.length ? res.data.spbe.map(s => `
    <tr>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(s.nama)}</td>
      <td class="text-slate-500 text-sm">${UI.escapeHtml(s.alamat || '-')}</td>
      <td>${UI.badge(s.status, s.status)}</td>
      <td class="text-right">
        <div class="flex gap-1 justify-end">
          <button class="btn-secondary text-xs py-1 px-2" onclick="openSPBEModalById('${s.spbe_id}')">Edit</button>
          <button class="btn-danger text-xs py-1 px-2"    onclick="hapusSPBEById('${s.spbe_id}')">Nonaktifkan</button>
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="4">${UI.emptyState('Belum ada SPBE.','⛽')}</td></tr>`;
}

function openSPBEModalById(id) {
  const data = (window._allSPBE || []).find(s => s.spbe_id === id);
  if (!data) { UI.toast('Data SPBE tidak ditemukan.', 'error'); return; }
  openSPBEModal(data);
}

async function hapusSPBEById(id) {
  const data = (window._allSPBE || []).find(s => s.spbe_id === id);
  if (!await UI.confirm(`Nonaktifkan SPBE "${UI.escapeHtml(data?.nama || 'ini')}"?`)) return;
  const res = await API.operator.deleteSPBE({ spbe_id: id });
  if (res.success) { UI.toast('SPBE dinonaktifkan.', 'success'); loadSPBE(); }
  else UI.toast(res.message, 'error');
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
        <div><label class="form-label">Nama SPBE *</label><input id="sm-nama" class="form-input" value="${UI.escapeHtml(data?.nama||'')}" placeholder="Nama SPBE"/></div>
        <div><label class="form-label">Alamat</label><input id="sm-alamat" class="form-input" value="${UI.escapeHtml(data?.alamat||'')}" placeholder="Alamat SPBE"/></div>
        <div id="sm-err" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="sm-btn" class="btn-primary w-full justify-center" onclick="saveSPBE('${data?.spbe_id||''}')">
          ${data ? 'Simpan' : 'Tambah SPBE'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveSPBE(id) {
  const btn = document.getElementById('sm-btn'), errEl = document.getElementById('sm-err');
  errEl.classList.add('hidden');
  const nama = document.getElementById('sm-nama').value.trim(), alamat = document.getElementById('sm-alamat').value.trim();
  if (!nama) { errEl.textContent = 'Nama SPBE wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = id ? await API.operator.updateSPBE({ spbe_id: id, nama, alamat }) : await API.operator.createSPBE({ nama, alamat });
  UI.setLoading(btn, false);
  if (res.success) { UI.toast(id ? 'SPBE diupdate.' : 'SPBE ditambahkan.', 'success'); document.getElementById('spbe-modal').remove(); loadSPBE(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}
// ============================================================
// HELPER FUNCTIONS UNTUK EXCEL / CSV
// ============================================================

/** Memuat script eksternal (Library XLSX) secara dinamis */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Jika script sudah pernah diload, langsung resolve
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Gagal memuat script: ${src}`));
    document.head.appendChild(script);
  });
}

/** Membaca file Excel/CSV dan mengubahnya menjadi Array 2 Dimensi */
async function parseCSVOrExcel(file) {
  // Pastikan library XLSX sudah ter-load
  if (!window.XLSX) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Cari sheet bernama 'Data Master SA' (sesuai template kita). 
        // Jika tidak ada, pakai sheet pertama.
        const sheetName = workbook.SheetNames.includes('Data Master SA') 
          ? 'Data Master SA' 
          : workbook.SheetNames[0];
          
        const worksheet = workbook.Sheets[sheetName];
        
        // Konversi sheet menjadi array of arrays (header: 1)
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari browser.'));
    reader.readAsArrayBuffer(file);
  });
}
// ============================================================
// REKAP OPERASIONAL PANGKALAN
// ============================================================

async function loadRekapPangkalan() {
  const main = document.getElementById('main-content');
  const now = new Date();
  const bulanOptions = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    .map((nama, idx) => `<option value="${String(idx+1).padStart(2,'0')}" ${idx+1===now.getMonth()+1?'selected':''}>${nama}</option>`).join('');
  const tahunSekarang = now.getFullYear();
  const tahunOptions = [tahunSekarang-1, tahunSekarang, tahunSekarang+1]
    .map(t => `<option value="${t}" ${t===tahunSekarang?'selected':''}>${t}</option>`).join('');

  main.innerHTML = `
    <div class="card mb-4">
      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="form-label">Pangkalan (bisa pilih lebih dari 1)</label>
          <button type="button" class="form-input text-left w-full" id="rp-pangkalan-btn" onclick="openRekapPangkalanPicker()">
            <span id="rp-pangkalan-label" class="text-slate-500">Pilih pangkalan...</span>
          </button>
        </div>
        <div>
          <label class="form-label">Bulan</label>
          <select id="rp-bulan" class="form-select">${bulanOptions}</select>
        </div>
        <div>
          <label class="form-label">Tahun</label>
          <select id="rp-tahun" class="form-select">${tahunOptions}</select>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn-primary" onclick="fetchRekapPangkalan()">🔍 Tampilkan Rekap</button>
        <button class="btn-secondary" onclick="exportRekapPangkalanExcel(this)">⬇️ Export Excel</button>
      </div>
    </div>

    <div class="card">
      <h2 class="text-xl font-bold text-center text-blue-800 dark:text-blue-400">REKAP OPERASIONAL PANGKALAN</h2>
      <p class="text-center text-slate-500 text-sm mb-4" id="rp-periode-label">Periode: -</p>

      <div id="rp-stats" class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        ${['DO Dimiliki','Harga Tabung','Harga Bagi Hasil','Total Penerimaan','Tbg Kerjasama','Sisa Bagi Hasil'].map(l => `
          <div class="stat-card"><div><div class="stat-label">${l}</div><div class="stat-value text-lg" id="rp-stat-${l.toLowerCase().replace(/ /g,'-')}">-</div></div></div>
        `).join('')}
      </div>

      <div class="table-wrapper overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-blue-50 dark:bg-blue-900/30">
              <th class="p-2 text-left">Tanggal</th>
              <th class="p-2 text-center">Laporan Driver</th>
              <th class="p-2 text-center">Retur</th>
              <th class="p-2 text-left">Dikirim</th>
              <th class="p-2 text-center">Master SA</th>
              <th class="p-2 text-center">Pengiriman</th>
              <th class="p-2 text-center">Nominal Dibayar</th>
              <th class="p-2 text-center">Brimola Oleh</th>
              <th class="p-2 text-center">Bayar Brimola</th>
              <th class="p-2 text-center">Bukti TF</th>
              <th class="p-2 text-center">Bagi Hasil</th>
              <th class="p-2 text-center">Total Tbg</th>
            </tr>
          </thead>
          <tbody id="rp-tbody">
            <tr><td colspan="12" class="text-center text-slate-400 py-6">Pilih Pangkalan, Bulan & Tahun, lalu klik Tampilkan Rekap.</td></tr>
          </tbody>
          <tfoot>
            <tr class="bg-slate-100 dark:bg-slate-800 font-bold">
              <td class="p-2">TOTAL</td>
              <td class="p-2 text-center" id="rp-total-laporan">0</td>
              <td class="p-2 text-center" id="rp-total-retur">0</td>
              <td></td>
              <td class="p-2 text-center" id="rp-total-sa">0</td>
              <td class="p-2 text-center" id="rp-total-kirim">0</td>
              <td class="p-2 text-center" id="rp-total-bayar">0</td>
              <td></td>
              <td class="p-2 text-center" id="rp-total-brimola">0</td>
              <td></td>
              <td class="p-2 text-center" id="rp-total-bh">0</td>
              <td class="p-2 text-center" id="rp-total-tbg">0</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;

  window._rpSelectedPangkalan = [];
}

async function openRekapPangkalanPicker() {
  const res = await API.operator.getPangkalan({ status: 'ACTIVE' });
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const list = res.data.pangkalan;
  const selected = new Set((window._rpSelectedPangkalan || []).map(p => p.pangkalan_id));

  const modal = document.createElement('div');
  modal.id = 'rp-picker-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Pilih Pangkalan</h3>
        <button class="btn-icon" onclick="document.getElementById('rp-picker-modal').remove()">✕</button>
      </div>
      <div class="p-4 overflow-y-auto flex-1 space-y-2">
        ${list.map(p => `
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <input type="checkbox" value="${p.pangkalan_id}" data-nama="${UI.escapeHtml(p.nama)}" class="rp-pkln-cb" ${selected.has(p.pangkalan_id) ? 'checked' : ''}/>
            <span class="text-sm text-slate-700 dark:text-slate-200">${UI.escapeHtml(p.nama)}</span>
          </label>
        `).join('')}
      </div>
      <div class="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
        <button class="btn-secondary" onclick="document.getElementById('rp-picker-modal').remove()">Batal</button>
        <button class="btn-primary" onclick="confirmRekapPangkalanPicker()">Pilih</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function confirmRekapPangkalanPicker() {
  const checked = Array.from(document.querySelectorAll('.rp-pkln-cb:checked'));
  window._rpSelectedPangkalan = checked.map(cb => ({ pangkalan_id: cb.value, nama: cb.dataset.nama }));
  const label = document.getElementById('rp-pangkalan-label');
  label.textContent = window._rpSelectedPangkalan.length
    ? window._rpSelectedPangkalan.map(p => p.nama).join(', ')
    : 'Pilih pangkalan...';
  label.classList.toggle('text-slate-500', window._rpSelectedPangkalan.length === 0);
  document.getElementById('rp-picker-modal').remove();
}

async function fetchRekapPangkalan() {
  const selected = window._rpSelectedPangkalan || [];
  if (!selected.length) { UI.toast('Pilih minimal satu pangkalan.', 'warning'); return; }
  const bulan = document.getElementById('rp-bulan').value;
  const tahun = document.getElementById('rp-tahun').value;

  document.getElementById('rp-tbody').innerHTML = `<tr><td colspan="12">${skLine()}</td></tr>`;

  const res = await API.operator.getRekapPangkalan({ pangkalan_ids: selected.map(p => p.pangkalan_id).join(','), bulan, tahun });
  if (activeSection !== 'rekap-pangkalan') return;
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const d = res.data;
  window._rpLastData = d;

  document.getElementById('rp-periode-label').textContent = `Periode: ${d.pangkalan_nama} — ${document.getElementById('rp-bulan').selectedOptions[0].text} ${d.tahun}`;
  document.getElementById('rp-stat-do-dimiliki').textContent    = UI.formatNumber(d.do_dimiliki);
  document.getElementById('rp-stat-harga-tabung').textContent   = UI.formatRupiah(d.harga_tabung);
  document.getElementById('rp-stat-harga-bagi-hasil').textContent = UI.formatRupiah(d.harga_bagi_hasil);
  document.getElementById('rp-stat-total-penerimaan').textContent = UI.formatNumber(d.total_penerimaan);
  document.getElementById('rp-stat-tbg-kerjasama').textContent   = UI.formatNumber(d.tbg_kerjasama);
  document.getElementById('rp-stat-sisa-bagi-hasil').textContent = UI.formatRupiah(d.sisa_bagi_hasil);

  const rows = d.rows || [];
  // Helper: kosongkan tampilan kalau nilainya 0 (bukan "0" atau "Rp.0")
  const fmtRp = v => Number(v || 0) === 0 ? '' : UI.formatRupiah(v);
  const fmtN  = v => Number(v || 0) === 0 ? '' : UI.formatNumber(v);

  document.getElementById('rp-tbody').innerHTML = rows.length ? rows.map(r => `
    <tr class="border-b border-slate-100 dark:border-slate-800">
      <td class="p-2 text-xs text-slate-500">${UI.formatDateShort(r.tanggal)}</td>
      <td class="p-2 text-center">${fmtN(r.laporan_driver)}</td>
      <td class="p-2 text-center">${fmtN(r.retur)}</td>
      <td class="p-2 text-sm">${UI.escapeHtml(r.dikirim === '-' ? '' : r.dikirim)}</td>
      <td class="p-2 text-center">${fmtN(r.master_sa)}</td>
      <td class="p-2 text-center">${fmtN(r.pengiriman)}</td>
      <td class="p-2 text-center">${fmtRp(r.nominal_dibayar)}</td>
      <td class="p-2 text-center text-xs">${UI.escapeHtml(r.brimola_oleh)}</td>
      <td class="p-2 text-center">${fmtRp(r.bayar_brimola)}</td>
      <td class="p-2 text-center">
        ${fmtRp(r.bukti_tf)}
        ${r.bukti_tf_url ? `<a href="${r.bukti_tf_url}" target="_blank" class="text-blue-600 underline text-xs ml-1">(lihat)</a>` : ''}
      </td>
      <td class="p-2 text-center">${fmtRp(r.bagi_hasil)}</td>
      <td class="p-2 text-center font-semibold ${r.total_tabung < 0 ? 'text-red-500' : 'text-green-600'}">${fmtRp(r.total_tabung)}</td>
    </tr>`).join('') : `<tr><td colspan="12" class="text-center text-slate-400 py-6">Belum ada data untuk periode ini.</td></tr>`;

  document.getElementById('rp-total-laporan').textContent = UI.formatNumber(rows.reduce((s,r)=>s+Number(r.laporan_driver||0),0));
  document.getElementById('rp-total-retur').textContent   = UI.formatNumber(rows.reduce((s,r)=>s+Number(r.retur||0),0));
  document.getElementById('rp-total-sa').textContent      = UI.formatNumber(rows.reduce((s,r)=>s+Number(r.master_sa||0),0));
  document.getElementById('rp-total-kirim').textContent   = UI.formatNumber(rows.reduce((s,r)=>s+Number(r.pengiriman||0),0));
  document.getElementById('rp-total-bayar').textContent   = UI.formatRupiah(rows.reduce((s,r)=>s+Number(r.nominal_dibayar||0),0));
  document.getElementById('rp-total-brimola').textContent = UI.formatRupiah(rows.reduce((s,r)=>s+Number(r.bayar_brimola||0),0));
  document.getElementById('rp-total-bh').textContent      = UI.formatRupiah(rows.reduce((s,r)=>s+Number(r.bagi_hasil||0),0));
  document.getElementById('rp-total-tbg').textContent     = UI.formatRupiah(rows.reduce((s,r)=>s+Number(r.total_tabung||0),0));
}

async function exportRekapPangkalanExcel(btnEl) {
  const d = window._rpLastData;
  if (!d) { UI.toast('Tampilkan rekap terlebih dahulu sebelum export.', 'warning'); return; }
  const btn = btnEl || null;
  try {
    if (btn) UI.setLoading(btn, true, 'Menyiapkan...');
    if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

    const headers = ['Tanggal','Laporan Driver','Retur','Dikirim','Master SA','Pengiriman','Nominal Dibayar','Brimola Oleh','Bayar Brimola','Bukti TF','Bagi Hasil','Total Tbg'];
    const dataRows = (d.rows || []).map(r => [
      r.tanggal, r.laporan_driver, r.retur, r.dikirim, r.master_sa, r.pengiriman,
      r.nominal_dibayar, r.brimola_oleh, r.bayar_brimola, r.bukti_tf, r.bagi_hasil, r.total_tabung,
    ]);

    const wb = XLSX.utils.book_new();
    const summaryAOA = [
      ['REKAP OPERASIONAL PANGKALAN'],
      [`Pangkalan: ${d.pangkalan_nama}`],
      [`Periode: ${d.bulan}/${d.tahun}`],
      [''],
      ['DO Dimiliki', d.do_dimiliki],
      ['Harga Tabung', d.harga_tabung],
      ['Harga Bagi Hasil', d.harga_bagi_hasil],
      ['Total Penerimaan', d.total_penerimaan],
      ['Tbg Kerjasama', d.tbg_kerjasama],
      ['Sisa Bagi Hasil', d.sisa_bagi_hasil],
      [''],
      headers,
      ...dataRows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryAOA);
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
    XLSX.writeFile(wb, `rekap_operasional_${d.pangkalan_nama.replace(/[^a-z0-9]/gi,'_')}_${d.bulan}-${d.tahun}.xlsx`);
    UI.toast('Rekap berhasil diexport.', 'success');
  } catch (err) {
    UI.toast(`Gagal export: ${err.message}`, 'error');
  } finally {
    if (btn) UI.setLoading(btn, false);
  }
}
// ── Skeleton helpers ──
function skCards(n) { return `<div class="grid grid-cols-2 md:grid-cols-${n} gap-4 animate-pulse">${Array(n).fill('<div class="card h-20 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div>`; }
function skList(n)  { return `<div class="space-y-3 animate-pulse">${Array(n).fill('<div class="card h-20 bg-slate-200 dark:bg-slate-800"></div>').join('')}</div>`; }
function skLine()   { return `<div class="animate-pulse py-3 flex gap-3">${Array(5).fill('<div class="flex-1 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>').join('')}</div>`; }
