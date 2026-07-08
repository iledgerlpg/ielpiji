/**
 * ILPG Frontend — hrd-dashboard.js
 * Semua logika HRD Dashboard: stat cards, tabel user, absensi monitor,
 * catatan, tugas admin, jadwal piket, dan data perusahaan.
 */

// ── Guard ──
const SESSION = Auth.guard(['HRD']);
if (!SESSION) throw new Error('Unauthorized');

function parsePermissions(user) {
  const raw = user?.permissions;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
// ── Page state ──
let allUsers = [], allAbsensi = [], allTugas = [], allPiket = [], allCatatan = [];
let activeSection = 'dashboard';

// ── Sidebar nav config ──
const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',       icon: 'home' },
  { id: 'users',       label: 'Manajemen User',  icon: 'users' },
  { id: 'absensi',     label: 'Monitor Absensi', icon: 'clock' },
  { id: 'perusahaan',  label: 'Data Perusahaan', icon: 'building' },
  { id: 'tugas',       label: 'Tugas Staff Admin', icon: 'checklist' },
  { id: 'piket',       label: 'Jadwal Piket',    icon: 'calendar' },
  { id: 'catatan',     label: 'Catatan',         icon: 'note' },
];

const ICONS = {
  home: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  users: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  clock: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  building: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
  checklist: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
  calendar: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
  note: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
};

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  UI.init();
  document.getElementById('topbar-title').textContent = 'HRD Dashboard';
  showSection('dashboard');
  renderImpersonateSwitcher(); 
  renderImpersonateBanner();
});

// ============================================================
// SIDEBAR
// ============================================================

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-item w-full text-left" id="nav-${item.id}" onclick="showSection('${item.id}')">
      ${ICONS[item.icon] || ''}
      <span class="nav-label">${item.label}</span>
    </button>`).join('');
}


function showSection(id) {
  activeSection = id;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${id}`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = NAV_ITEMS.find(n => n.id === id)?.label || 'HRD';

  const main = document.getElementById('main-content');
  main.innerHTML = '';

  const loaders = {
    dashboard:  loadDashboard,
    users:      loadUsers,
    absensi:    loadAbsensi,
    perusahaan: loadPerusahaan,
    tugas:      loadTugas,
    piket:      loadPiket,
    catatan:    loadCatatan,
  };

  if (loaders[id]) loaders[id]();
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard(tanggal = UI.todayInputValue()) {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Selamat datang, ${UI.escapeHtml(SESSION.nama)} 👋</h2>
      <p class="page-sub">Ringkasan kehadiran & aktivitas hari ini</p>
    </div>
    <div class="flex items-center gap-2 mb-5">
      <input type="date" id="dash-date" class="form-input w-auto" value="${tanggal}" onchange="loadDashboard(this.value)"/>
    </div>
    <div id="dash-stats" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      ${skeletonCards(3)}
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Sudah Absen
        </h3>
        <div id="dash-sudah" class="space-y-2"></div>
      </div>
      <div class="card">
        <h3 class="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Belum Absen
        </h3>
        <div id="dash-belum" class="space-y-2"></div>
      </div>
    </div>
    <div class="card mt-4">
      <h3 class="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
        Menunggu Persetujuan <span id="pending-count" class="ml-1"></span>
      </h3>
      <div id="dash-pending"></div>
    </div>`;

  const res = await API.hrd.getDashboard({ tanggal });
  if (activeSection !== 'dashboard') return;   // 
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const { sudah_absen, belum_absen, pending_approval } = res.data;

  // Stat cards
  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon bg-green-100 dark:bg-green-900/40">✅</div>
      <div>
        <div class="stat-label">Sudah Absen</div>
        <div class="stat-value text-green-600 dark:text-green-400">${sudah_absen.length}</div>
        <div class="stat-sub">karyawan</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-red-100 dark:bg-red-900/40">⏰</div>
      <div>
        <div class="stat-label">Belum Absen</div>
        <div class="stat-value text-red-600 dark:text-red-400">${belum_absen.length}</div>
        <div class="stat-sub">karyawan</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-amber-100 dark:bg-amber-900/40">🔔</div>
      <div>
        <div class="stat-label">Pending Approval</div>
        <div class="stat-value text-amber-600 dark:text-amber-400">${pending_approval.length}</div>
        <div class="stat-sub">akun baru</div>
      </div>
    </div>`;

  // Sudah absen
  document.getElementById('dash-sudah').innerHTML = sudah_absen.length
    ? sudah_absen.map(u => `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm">${UI.escapeHtml(u.nama.charAt(0))}</div>
            <div>
              <div class="text-sm font-medium text-slate-900 dark:text-white">${UI.escapeHtml(u.nama)}</div>
              <div class="text-xs text-slate-500">${UI.badge(u.role, u.role)}</div>
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400">${u.jam_masuk || '-'}</div>
        </div>`).join('')
    : UI.emptyState('Belum ada yang absen hari ini.', '⏳');

  // Belum absen
  document.getElementById('dash-belum').innerHTML = belum_absen.length
    ? belum_absen.map(u => `
        <div class="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">${UI.escapeHtml(u.nama.charAt(0))}</div>
          <div>
            <div class="text-sm font-medium text-slate-900 dark:text-white">${UI.escapeHtml(u.nama)}</div>
            <div class="text-xs text-slate-500">${UI.badge(u.role, u.role)}</div>
          </div>
        </div>`).join('')
    : UI.emptyState('Semua sudah absen! 🎉', '✅');

  // Pending
  document.getElementById('pending-count').innerHTML = pending_approval.length ? UI.badge(pending_approval.length, 'PENDING') : '';
  document.getElementById('dash-pending').innerHTML = pending_approval.length
    ? pending_approval.map(u => `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div>
            <div class="text-sm font-medium text-slate-900 dark:text-white">${UI.escapeHtml(u.nama)}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${UI.escapeHtml(u.email)} · ${UI.badge(u.role, u.role)}</div>
          </div>
          <div class="flex gap-2">
            <button class="btn-success text-xs py-1 px-3" onclick="approveUser('${u.user_id}','APPROVE')">Setujui</button>
            <button class="btn-danger text-xs py-1 px-3"  onclick="approveUser('${u.user_id}','REJECT')">Tolak</button>
          </div>
        </div>`).join('')
    : UI.emptyState('Tidak ada akun yang menunggu persetujuan.', '👍');
}

// ============================================================
// USERS
// ============================================================

async function loadUsers() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header flex-row items-center justify-between gap-4" style="flex-direction:row;display:flex;align-items:center;">
      <div><h2 class="page-title">Manajemen User</h2><p class="page-sub">Kelola akun karyawan perusahaan Anda.</p></div>
      <button class="btn-primary shrink-0" onclick="openUserModal()">+ Tambah User</button>
    </div>
    <div class="filter-bar">
      <input type="text" id="user-search" class="form-input w-48" placeholder="Cari nama / email..." oninput="filterUsers()"/>
      <select id="user-role-filter" class="form-select w-40" onchange="filterUsers()">
        <option value="">Semua Role</option>
        <option>OPERATOR</option><option>DRIVER</option><option>KERNET</option><option>STAFF_ADMIN</option>
      </select>
      <select id="user-status-filter" class="form-select w-36" onchange="filterUsers()">
        <option value="">Semua Status</option>
        <option>ACTIVE</option><option>PENDING</option><option>INACTIVE</option>
      </select>
    </div>
<div id="users-container" class="table-wrapper">
  <table><thead><tr>
    <th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th class="text-center">Akses Operator</th><th class="text-right">Aksi</th>
  </tr></thead>
  <tbody id="users-table-body"></tbody></table>
</div>`;

  const res = await API.hrd.getUsers();
  if (activeSection !== 'users') return;   // ← tambahkan
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  allUsers = res.data.users;
  renderUsers(allUsers);
}

function filterUsers() {
  const q      = document.getElementById('user-search')?.value.toLowerCase() || '';
  const role   = document.getElementById('user-role-filter')?.value || '';
  const status = document.getElementById('user-status-filter')?.value || '';
  const filtered = allUsers.filter(u =>
    (!q      || u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!role   || u.role   === role) &&
    (!status || u.status === status)
  );
  renderUsers(filtered);
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
tbody.innerHTML = users.length ? users.map(u => {
  const permsArr = parsePermissions(u);   // ← ganti blok try/catch dengan ini
  const hasOperatorAccess = permsArr.includes('OPERATOR');

    const operatorToggle = u.role === 'STAFF_ADMIN' ? `
      <button
        class="text-xs py-1 px-2.5 rounded-full font-semibold transition-colors ${
          hasOperatorAccess
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
        }"
        title="${hasOperatorAccess ? 'Klik untuk cabut akses impersonate Operator' : 'Klik untuk beri akses impersonate Operator'}"
        onclick="toggleStaffOperatorAccess('${u.user_id}')">
        ${hasOperatorAccess ? '🎭 Operator: ON' : '🔒 Operator: OFF'}
      </button>` : '<span class="text-xs text-slate-300 dark:text-slate-700">—</span>';

    return `
    <tr>
      <td>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">${UI.escapeHtml(u.nama.charAt(0))}</div>
          <div class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(u.nama)}</div>
        </div>
      </td>
      <td class="text-slate-500 dark:text-slate-400 text-xs">${UI.escapeHtml(u.email)}</td>
      <td>${UI.badge(u.role.replace('_',' '), u.role)}</td>
      <td>${UI.badge(u.status, u.status)}</td>
      <td class="text-center">${operatorToggle}</td>
      <td class="text-right">
        <div class="flex gap-1 justify-end">
          ${u.status === 'PENDING' ? `<button class="btn-success text-xs py-1 px-2" onclick="approveUser('${u.user_id}','APPROVE')">✓ Setujui</button>` : ''}
          <button class="btn-secondary text-xs py-1 px-2" onclick="openUserModalById('${u.user_id}')">Edit</button>
          <button class="btn-danger text-xs py-1 px-2"    onclick="deleteUserById('${u.user_id}')">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6">${UI.emptyState('Tidak ada user ditemukan.', '👤')}</td></tr>`;
}

/** Cari user dari cache allUsers berdasarkan ID, lalu buka modal edit (hindari inject JSON ke onclick). */
function openUserModalById(userId) {
  const user = allUsers.find(u => u.user_id === userId);
  if (!user) { UI.toast('Data user tidak ditemukan.', 'error'); return; }
  openUserModal(user);
}

/** Cari user dari cache allUsers berdasarkan ID, lalu konfirmasi hapus. */
function deleteUserById(userId) {
  const user = allUsers.find(u => u.user_id === userId);
  if (!user) { UI.toast('Data user tidak ditemukan.', 'error'); return; }
  deleteUser(userId, user.nama);
}

function openUserModal(user = null) {
  const isEdit = !!user;

  // Parse permissions user yang sedang diedit
let userPerms = [];
if (isEdit) userPerms = parsePermissions(user);

  // Daftar permission yang bisa diberikan (sesuai role)
  const permOptions = [
    { value: 'OPERATOR',    label: 'Akses sebagai Operator' },
    { value: 'DRIVER',      label: 'Akses sebagai Driver' },
    { value: 'STAFF_ADMIN', label: 'Akses sebagai Staff Admin' },
  ];

  // Hanya tampilkan permission yang relevan berdasarkan role target
  const targetRole = user?.role || 'OPERATOR';
  const relevantPerms = {
    STAFF_ADMIN: ['OPERATOR'],
    DRIVER:      [],
    KERNET:      [],
    OPERATOR:    [],
  }[targetRole] || [];

  const modal = document.createElement('div');
  modal.id    = 'user-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">${isEdit ? 'Edit' : 'Tambah'} User</h3>
        <button class="btn-icon" onclick="document.getElementById('user-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Nama Lengkap *</label>
            <input id="um-nama" class="form-input" value="${UI.escapeHtml(user?.nama || '')}" placeholder="Nama Lengkap"/>
          </div>
          <div>
            <label class="form-label">No. HP</label>
            <input id="um-hp" class="form-input" value="${UI.escapeHtml(user?.no_hp || '')}" placeholder="081xxxxxxx"/>
          </div>
        </div>
        <div>
          <label class="form-label">Email *</label>
          <input id="um-email" class="form-input" type="email"
            value="${UI.escapeHtml(user?.email || '')}"
            placeholder="email@pt.com"
            ${isEdit ? 'disabled style="opacity:.6"' : ''}/>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Role *</label>
            <select id="um-role" class="form-select"
              ${user?.role === 'HRD' ? 'disabled' : ''}
              onchange="updatePermissionOptions()">
              <option ${user?.role==='OPERATOR'?'selected':''}>OPERATOR</option>
              <option ${user?.role==='DRIVER'?'selected':''}>DRIVER</option>
              <option ${user?.role==='KERNET'?'selected':''}>KERNET</option>
              <option ${user?.role==='STAFF_ADMIN'?'selected':''}>STAFF_ADMIN</option>
            </select>
          </div>
          <div>
            <label class="form-label">${isEdit ? 'Sandi Baru (kosongkan jika tidak ganti)' : 'Sandi *'}</label>
            <input id="um-pass" class="form-input" type="password"
              placeholder="${isEdit ? 'Kosongkan jika tidak ganti' : 'Min. 6 karakter'}"/>
          </div>
        </div>

        <!-- Permission Section -->
        <div id="um-permissions-section" class="${targetRole !== 'STAFF_ADMIN' ? 'hidden' : ''}">
          <label class="form-label">Izin Tambahan</label>
          <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-2">
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">
              User ini bisa beralih (impersonate) ke role berikut:
            </p>
            <div id="um-permissions-list">
              ${permOptions
                .filter(p => relevantPerms.includes(p.value))
                .map(p => `
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" class="um-perm-cb" value="${p.value}"
                      ${userPerms.includes(p.value) ? 'checked' : ''}/>
                    <span class="text-sm text-slate-700 dark:text-slate-200">${p.label}</span>
                  </label>`).join('')}
            </div>
          </div>
        </div>

        <div id="user-modal-error" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="um-btn" class="btn-primary w-full justify-center"
          onclick="saveUser(${isEdit ? `'${user.user_id}'` : 'null'})">
          ${isEdit ? 'Simpan Perubahan' : 'Buat User'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// Update daftar permission saat role berubah
function updatePermissionOptions() {
  const role = document.getElementById('um-role')?.value;
  const section = document.getElementById('um-permissions-section');
  const list    = document.getElementById('um-permissions-list');
  if (!section || !list) return;

  const permMap = {
    STAFF_ADMIN: [{ value: 'OPERATOR', label: 'Akses sebagai Operator' }],
    DRIVER:      [],
    KERNET:      [],
    OPERATOR:    [],
  };

  const perms = permMap[role] || [];
  if (!perms.length) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  list.innerHTML = perms.map(p => `
    <label class="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" class="um-perm-cb" value="${p.value}"/>
      <span class="text-sm text-slate-700 dark:text-slate-200">${p.label}</span>
    </label>`).join('');
}
async function saveUser(userId) {
  const btn   = document.getElementById('um-btn');
  const errEl = document.getElementById('user-modal-error');
  errEl.classList.add('hidden');

  const nama  = document.getElementById('um-nama').value.trim();
  const email = document.getElementById('um-email').value.trim();
  const role  = document.getElementById('um-role').value;
  const pass  = document.getElementById('um-pass').value;
  const hp    = document.getElementById('um-hp').value.trim();

  // Kumpulkan permissions yang dicentang
  const permissions = Array.from(document.querySelectorAll('.um-perm-cb:checked'))
    .map(cb => cb.value);

  if (!nama) {
    errEl.textContent = 'Nama wajib diisi.';
    errEl.classList.remove('hidden'); return;
  }
  if (!userId && (!email || !pass)) {
    errEl.textContent = 'Email dan sandi wajib diisi untuk user baru.';
    errEl.classList.remove('hidden'); return;
  }

  UI.setLoading(btn, true, 'Menyimpan...');

  const body = userId
    ? { user_id: userId, nama, no_hp: hp, role, permissions, ...(pass ? { new_password: pass } : {}) }
    : { nama, email, password: pass, role, no_hp: hp, permissions };

  const res = userId ? await API.hrd.updateUser(body) : await API.hrd.createUser(body);
  UI.setLoading(btn, false);

  if (res.success) {
    UI.toast(userId ? 'User berhasil diupdate.' : 'User berhasil dibuat.', 'success');
    document.getElementById('user-modal').remove();
    loadUsers();
  } else {
    errEl.textContent = res.message;
    errEl.classList.remove('hidden');
  }
}

async function deleteUser(userId, nama) {
  const ok = await UI.confirm(`Nonaktifkan akun "${nama}"? Akun tidak akan bisa login, tapi data tetap tersimpan.`, 'Nonaktifkan User');
  if (!ok) return;
  const res = await API.hrd.deleteUser({ user_id: userId });
  if (res.success) { UI.toast('User berhasil dinonaktifkan.', 'success'); loadUsers(); }
  else UI.toast(res.message, 'error');
}

async function approveUser(userId, action) {
  const label = action === 'APPROVE' ? 'setujui' : 'tolak';
  const ok = await UI.confirm(`${action === 'APPROVE' ? 'Setujui' : 'Tolak'} akun ini?`, 'Konfirmasi');
  if (!ok) return;
  const res = await API.hrd.approveUser({ user_id: userId, action });
  if (res.success) { UI.toast(`Akun berhasil di-${label}.`, 'success'); loadDashboard(); }
  else UI.toast(res.message, 'error');
}
async function toggleStaffOperatorAccess(userId) {
  const user = allUsers.find(u => u.user_id === userId);
  if (!user) { UI.toast('Data user tidak ditemukan.', 'error'); return; }
  if (user.role !== 'STAFF_ADMIN') return;

  const permsArr = parsePermissions(user);   // ← ganti blok try/catch dengan ini
  const hasAccess = permsArr.includes('OPERATOR');
  const newPerms  = hasAccess
    ? permsArr.filter(p => p !== 'OPERATOR')
    : [...permsArr, 'OPERATOR'];

  const ok = await UI.confirm(
    hasAccess
      ? `Cabut akses impersonate Operator dari "${UI.escapeHtml(user.nama)}"?`
      : `Berikan akses impersonate Operator ke "${UI.escapeHtml(user.nama)}"?`,
    'Konfirmasi'
  );
  if (!ok) return;

  const res = await API.hrd.updateUser({
    user_id:     userId,
    nama:        user.nama,
    no_hp:       user.no_hp || '',
    role:        user.role,
    permissions: newPerms,
  });

  if (res.success) {
    UI.toast(hasAccess ? 'Akses Operator dicabut.' : 'Akses Operator diberikan.', 'success');
    loadUsers();
  } else {
    UI.toast(res.message, 'error');
  }
}
// ============================================================
// ABSENSI
// ============================================================

async function loadAbsensi() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Monitor Absensi</h2><p class="page-sub">Pantau kehadiran karyawan harian, mingguan, dan bulanan.</p></div>
    <div class="filter-bar">
      <input type="date" id="abs-tanggal" class="form-input w-44" onchange="fetchAbsensi()"/>
      <input type="month" id="abs-bulan" class="form-input w-40" onchange="fetchAbsensi()"/>
      <select id="abs-role" class="form-select w-36" onchange="fetchAbsensi()">
        <option value="">Semua Role</option>
        <option>OPERATOR</option><option>DRIVER</option><option>KERNET</option><option>STAFF_ADMIN</option>
      </select>
      <button class="btn-secondary" onclick="document.getElementById('abs-tanggal').value='';document.getElementById('abs-bulan').value='';document.getElementById('abs-role').value='';fetchAbsensi()">Reset</button>
    </div>
    <div id="abs-container" class="table-wrapper">
      <table><thead><tr>
        <th>Nama</th><th>Role</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Akurasi GPS</th><th>Foto</th>
      </tr></thead>
      <tbody id="abs-table-body"></tbody></table>
    </div>`;

  document.getElementById('abs-bulan').value = UI.currentMonthValue();
  await fetchAbsensi();
}

async function fetchAbsensi() {
  const params = {
    tanggal: document.getElementById('abs-tanggal')?.value || undefined,
    bulan:   document.getElementById('abs-bulan')?.value   || undefined,
    role:    document.getElementById('abs-role')?.value    || undefined,
  };
  // Jika tanggal diisi, hapus bulan (prioritas tanggal)
  if (params.tanggal) delete params.bulan;

  const tbody = document.getElementById('abs-table-body');
  tbody.innerHTML = `<tr><td colspan="7"><div class="py-4">${skeletonLine()}</div></td></tr>`;

  const res = await API.hrd.getAbsensi(params);
  if (activeSection !== 'absensi') return;   // ← tambahkan
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  allAbsensi = res.data.absensi;

  tbody.innerHTML = allAbsensi.length ? allAbsensi.map(a => `
    <tr>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(a.nama)}</td>
      <td>${UI.badge(a.role, a.role)}</td>
      <td class="text-slate-500 dark:text-slate-400 text-xs">${UI.formatDate(a.tanggal)}</td>
      <td class="font-mono text-sm text-slate-700 dark:text-slate-300">${a.jam_masuk || '-'}</td>
      <td class="font-mono text-sm ${a.jam_pulang ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}">${a.jam_pulang || 'Belum pulang'}</td>
      <td class="text-xs text-slate-500">${a.akurasi_masuk ? `${a.akurasi_masuk}m` : '-'}</td>
      <td>
        ${a.foto_masuk_url ? `<a href="${a.foto_masuk_url}" target="_blank" class="text-blue-500 hover:underline text-xs">Masuk</a>` : '-'}
        ${a.foto_pulang_url ? ` · <a href="${a.foto_pulang_url}" target="_blank" class="text-blue-500 hover:underline text-xs">Pulang</a>` : ''}
      </td>
    </tr>`).join('') : `<tr><td colspan="7">${UI.emptyState('Tidak ada data absensi.', '📋')}</td></tr>`;
}

// ============================================================
// DATA PERUSAHAAN
// ============================================================

async function loadPerusahaan() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Data Perusahaan</h2><p class="page-sub">Kelola informasi resmi perusahaan Anda.</p></div>
    <div class="card max-w-2xl" id="perusahaan-form">
      <div class="space-y-4 animate-pulse">
        ${Array(6).fill('<div class="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>').join('')}
      </div>
    </div>`;

  const res = await API.hrd.getPerusahaan();
  if (activeSection !== 'perusahaan') return; 
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  const d = res.data;

  document.getElementById('perusahaan-form').innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Nama PT *</label><input id="p-nama" class="form-input" value="${UI.escapeHtml(d.nama_pt||'')}" placeholder="PT Maju Jaya"/></div>
        <div><label class="form-label">Kode Unik</label><input class="form-input opacity-60" value="${UI.escapeHtml(d.kode_unik||'')}" disabled/></div>
      </div>
      <div><label class="form-label">Email PT</label><input id="p-email" class="form-input" type="email" value="${UI.escapeHtml(d.email_pt||'')}" placeholder="info@pt.com"/></div>
      <div><label class="form-label">Alamat</label><input id="p-alamat" class="form-input" value="${UI.escapeHtml(d.alamat||'')}" placeholder="Jl. Merpati No.42..."/></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">No. Telepon</label><input id="p-telp" class="form-input" value="${UI.escapeHtml(d.no_telp||'')}" placeholder="02112345678"/></div>
        <div><label class="form-label">NPWP</label><input id="p-npwp" class="form-input" value="${UI.escapeHtml(d.npwp||'')}" placeholder="00.000.000.0-000.000"/></div>
      </div>
      <div><label class="form-label">Website</label><input id="p-web" class="form-input" value="${UI.escapeHtml(d.website||'')}" placeholder="https://www.pt.com"/></div>
      <div class="flex justify-end pt-2">
        <button id="save-pt-btn" class="btn-primary" onclick="savePerusahaan()">Simpan Perubahan</button>
      </div>
    </div>`;
}

async function savePerusahaan() {
  const btn = document.getElementById('save-pt-btn');
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = await API.hrd.updatePerusahaan({
    nama_pt:  document.getElementById('p-nama').value.trim(),
    email_pt: document.getElementById('p-email').value.trim(),
    alamat:   document.getElementById('p-alamat').value.trim(),
    no_telp:  document.getElementById('p-telp').value.trim(),
    npwp:     document.getElementById('p-npwp').value.trim(),
    website:  document.getElementById('p-web').value.trim(),
  });
  UI.setLoading(btn, false);
  if (res.success) UI.toast('Data perusahaan berhasil disimpan.', 'success');
  else UI.toast(res.message, 'error');
}

// ============================================================
// TUGAS ADMIN
// ============================================================

async function loadTugas() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header flex-row items-center justify-between" style="flex-direction:row;display:flex;align-items:center;">
      <div><h2 class="page-title">Tugas Staff Admin</h2><p class="page-sub">Buat dan pantau tugas untuk staff administrasi.</p></div>
      <button class="btn-primary shrink-0" onclick="openTugasModal()">+ Buat Tugas</button>
    </div>
    <div class="filter-bar">
      <select id="tugas-status-filter" class="form-select w-40" onchange="filterTugas()">
        <option value="">Semua Status</option><option>OPEN</option><option>IN_PROGRESS</option><option>DONE</option>
      </select>
    </div>
    <div id="tugas-list" class="space-y-3"></div>`;

  const res = await API.hrd.getTugasAdmin();
  if (activeSection !== 'tugas') return;   // ← tambahkan
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  allTugas = res.data.tugas;
  renderTugas(allTugas);
}

function filterTugas() {
  const s = document.getElementById('tugas-status-filter')?.value || '';
  renderTugas(s ? allTugas.filter(t => t.status === s) : allTugas);
}

function renderTugas(tugas) {
  const el = document.getElementById('tugas-list');
  el.innerHTML = tugas.length ? tugas.map(t => `
    <div class="card">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(t.judul)}</h4>
            ${UI.badge(t.status, t.status)}
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${UI.escapeHtml(t.deskripsi)}</p>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">${UI.formatDateTime(t.created_at)} · ${t.untuk_user_id ? 'Ditugaskan ke user tertentu' : 'Semua Staff Admin'}</div>
        </div>
        ${t.file_url ? `<a href="${t.file_url}" target="_blank" class="btn-secondary text-xs py-1 px-2 shrink-0">📎 File</a>` : ''}
      </div>
    </div>`).join('') : UI.emptyState('Belum ada tugas yang dibuat.', '📋');
}

function openTugasModal() {
  const modal = document.createElement('div');
  modal.id    = 'tugas-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Buat Tugas Baru</h3>
        <button class="btn-icon" onclick="document.getElementById('tugas-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Judul Tugas *</label><input id="t-judul" class="form-input" placeholder="Judul singkat tugas"/></div>
        <div><label class="form-label">Deskripsi *</label><textarea id="t-desc" class="form-textarea" rows="3" placeholder="Penjelasan detail tugas..."></textarea></div>
        <div><label class="form-label">URL File (opsional)</label><input id="t-file" class="form-input" placeholder="https://drive.google.com/..."/></div>
        <div id="tugas-error" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="t-btn" class="btn-primary w-full justify-center" onclick="saveTugas()">Buat Tugas</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveTugas() {
  const btn   = document.getElementById('t-btn');
  const errEl = document.getElementById('tugas-error');
  const judul = document.getElementById('t-judul').value.trim();
  const desc  = document.getElementById('t-desc').value.trim();
  if (!judul || !desc) { errEl.textContent = 'Judul dan deskripsi wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Membuat...');
  const res = await API.hrd.createTugasAdmin({ judul, deskripsi: desc, file_url: document.getElementById('t-file').value.trim() });
  UI.setLoading(btn, false);
  if (res.success) { UI.toast('Tugas berhasil dibuat.', 'success'); document.getElementById('tugas-modal').remove(); loadTugas(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

// ============================================================
// JADWAL PIKET
// ============================================================

async function loadPiket() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header flex-row items-center justify-between" style="flex-direction:row;display:flex;align-items:center;">
      <div><h2 class="page-title">Jadwal Piket</h2><p class="page-sub">Atur jadwal piket Staff Admin.</p></div>
      <button class="btn-primary shrink-0" onclick="openPiketModal()">+ Tambah Jadwal</button>
    </div>
    <div class="filter-bar">
      <input type="month" id="piket-bulan" class="form-input w-40" value="${UI.currentMonthValue()}" onchange="fetchPiket()"/>
    </div>
    <div id="piket-container" class="table-wrapper">
      <table><thead><tr><th>Nama Staff</th><th>Tanggal</th><th>Shift</th><th>Keterangan</th></tr></thead>
      <tbody id="piket-tbody"></tbody></table>
    </div>`;

  await fetchPiket();

  // Ambil daftar Staff Admin untuk dropdown
  const usersRes = await API.hrd.getUsers({ role: 'STAFF_ADMIN', status: 'ACTIVE' });
  window._staffList = usersRes.success ? usersRes.data.users : [];
}

async function fetchPiket() {
  const tbody = document.getElementById('piket-tbody');
  tbody.innerHTML = `<tr><td colspan="4"><div class="py-4">${skeletonLine()}</div></td></tr>`;
  const res = await API.hrd.getJadwalPiket({ bulan: document.getElementById('piket-bulan')?.value });
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  allPiket = res.data.jadwal;
  const usersRes = await API.hrd.getUsers({ role: 'STAFF_ADMIN' });
  if (activeSection !== 'piket') return; 
  const users = usersRes.success ? usersRes.data.users : [];
  const userMap = {};
  users.forEach(u => { userMap[u.user_id] = u.nama; });
  tbody.innerHTML = allPiket.length ? allPiket.map(p => `
    <tr>
      <td class="font-medium text-slate-900 dark:text-white">${UI.escapeHtml(userMap[p.user_id] || p.user_id)}</td>
      <td class="text-slate-500 dark:text-slate-400 text-sm">${UI.formatDate(p.tanggal)}</td>
      <td class="text-slate-700 dark:text-slate-300">${UI.escapeHtml(p.shift)}</td>
      <td class="text-slate-500 dark:text-slate-400 text-sm">${UI.escapeHtml(p.keterangan || '-')}</td>
    </tr>`).join('') : `<tr><td colspan="4">${UI.emptyState('Belum ada jadwal piket.', '📅')}</td></tr>`;
}

function openPiketModal() {
  const staffOpts = (window._staffList || []).map(u => `<option value="${u.user_id}">${UI.escapeHtml(u.nama)}</option>`).join('');
  const modal = document.createElement('div');
  modal.id    = 'piket-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Tambah Jadwal Piket</h3>
        <button class="btn-icon" onclick="document.getElementById('piket-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Staff Admin *</label><select id="pk-user" class="form-select"><option value="">-- Pilih Staff --</option>${staffOpts}</select></div>
        <div><label class="form-label">Tanggal *</label><input id="pk-tgl" type="date" class="form-input" value="${UI.todayInputValue()}"/></div>
        <div><label class="form-label">Shift / Tugas *</label><input id="pk-shift" class="form-input" placeholder="Shift Pagi / Kebersihan / dll"/></div>
        <div><label class="form-label">Keterangan</label><input id="pk-ket" class="form-input" placeholder="Opsional..."/></div>
        <div id="piket-error" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="pk-btn" class="btn-primary w-full justify-center" onclick="savePiket()">Simpan Jadwal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function savePiket() {
  const btn   = document.getElementById('pk-btn');
  const errEl = document.getElementById('piket-error');
  const userId = document.getElementById('pk-user').value;
  const tgl    = document.getElementById('pk-tgl').value;
  const shift  = document.getElementById('pk-shift').value.trim();
  if (!userId || !tgl || !shift) { errEl.textContent = 'Staff, tanggal, dan shift wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Menyimpan...');
  const res = await API.hrd.createJadwalPiket({ user_id: userId, tanggal: tgl, shift, keterangan: document.getElementById('pk-ket').value.trim() });
  UI.setLoading(btn, false);
  if (res.success) { UI.toast('Jadwal piket berhasil ditambahkan.', 'success'); document.getElementById('piket-modal').remove(); fetchPiket(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

// ============================================================
// CATATAN
// ============================================================

async function loadCatatan() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header flex-row items-center justify-between" style="flex-direction:row;display:flex;align-items:center;">
      <div><h2 class="page-title">Catatan & Pengumuman</h2><p class="page-sub">Kirim catatan atau pengumuman ke karyawan.</p></div>
      <button class="btn-primary shrink-0" onclick="openCatatanModal()">+ Buat Catatan</button>
    </div>
    <div class="filter-bar">
      <select id="cat-tipe" class="form-select w-40" onchange="fetchCatatan()">
        <option value="">Semua Tipe</option><option>CATATAN</option><option>PENGUMUMAN</option><option>TUGAS</option>
      </select>
    </div>
    <div id="catatan-list" class="space-y-3"></div>`;
  await fetchCatatan();
}

async function fetchCatatan() {
  const el = document.getElementById('catatan-list');
  el.innerHTML = `<div class="animate-pulse space-y-3">${Array(3).fill('<div class="card h-20"></div>').join('')}</div>`;
  const res = await API.hrd.getCatatan({ tipe: document.getElementById('cat-tipe')?.value || undefined });
  if (activeSection !== 'catatan') return;   // ← tambahkan
  if (!res.success) { UI.toast(res.message, 'error'); return; }
  allCatatan = res.data.catatan;
  el.innerHTML = allCatatan.length ? allCatatan.map(c => `
    <div class="card">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-slate-900 dark:text-white">${UI.escapeHtml(c.judul)}</span>
            ${UI.badge(c.tipe, null)}
            ${c.untuk_role !== 'ALL' ? UI.badge(c.untuk_role.replace('_',' '), c.untuk_role) : '<span class="badge badge-gray">Semua</span>'}
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1.5">${UI.escapeHtml(c.isi)}</p>
          <div class="text-xs text-slate-400 dark:text-slate-600 mt-2">${UI.formatDateTime(c.created_at)}</div>
        </div>
      </div>
    </div>`).join('') : UI.emptyState('Belum ada catatan.', '📝');
}

function openCatatanModal() {
  const modal = document.createElement('div');
  modal.id    = 'catatan-modal';
  modal.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 class="font-semibold text-slate-900 dark:text-white">Buat Catatan</h3>
        <button class="btn-icon" onclick="document.getElementById('catatan-modal').remove()">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div><label class="form-label">Judul *</label><input id="cn-judul" class="form-input" placeholder="Judul catatan..."/></div>
        <div><label class="form-label">Isi *</label><textarea id="cn-isi" class="form-textarea" rows="4" placeholder="Tulis isi catatan..."></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tipe</label>
            <select id="cn-tipe" class="form-select">
              <option>PENGUMUMAN</option><option>CATATAN</option><option>TUGAS</option>
            </select>
          </div>
          <div>
            <label class="form-label">Ditujukan ke Role</label>
            <select id="cn-role" class="form-select">
              <option value="ALL">Semua</option><option value="OPERATOR">Operator</option>
              <option value="DRIVER">Driver/Kernet</option><option value="STAFF_ADMIN">Staff Admin</option>
            </select>
          </div>
        </div>
        <div id="catatan-error" class="hidden bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3"></div>
        <button id="cn-btn" class="btn-primary w-full justify-center" onclick="saveCatatan()">Kirim Catatan</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveCatatan() {
  const btn   = document.getElementById('cn-btn');
  const errEl = document.getElementById('catatan-error');
  const judul = document.getElementById('cn-judul').value.trim();
  const isi   = document.getElementById('cn-isi').value.trim();
  if (!judul || !isi) { errEl.textContent = 'Judul dan isi wajib diisi.'; errEl.classList.remove('hidden'); return; }
  UI.setLoading(btn, true, 'Mengirim...');
  const res = await API.hrd.createCatatan({ judul, isi, tipe: document.getElementById('cn-tipe').value, untuk_role: document.getElementById('cn-role').value });
  UI.setLoading(btn, false);
  if (res.success) { UI.toast('Catatan berhasil dikirim.', 'success'); document.getElementById('catatan-modal').remove(); fetchCatatan(); }
  else { errEl.textContent = res.message; errEl.classList.remove('hidden'); }
}

// ── Tiny helpers ──
function skeletonCards(n) {
  return Array(n).fill(`<div class="stat-card animate-pulse"><div class="stat-icon bg-slate-200 dark:bg-slate-700"></div><div class="space-y-2 flex-1"><div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div><div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div></div></div>`).join('');
}
function skeletonLine() {
  return `<div class="animate-pulse flex gap-3">${Array(4).fill('<div class="flex-1 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>').join('')}</div>`;
}
