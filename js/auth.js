/**
 * ILPG Frontend — auth.js
 * Manajemen sesi: simpan/ambil/hapus token, redirect berdasarkan role,
 * guard halaman, dan handle unauthorized.
 */

const Auth = (() => {
  const SESSION_KEY = 'ilpg_session';

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }

  function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      token:      data.token,
      user_id:    data.user_id,
      nama:       data.nama,
      email:      data.email,
      role:       data.role,
      pt_id:      data.pt_id,
      kode_unik:  data.kode_unik,
      nama_pt:    data.nama_pt,
      foto_url:   data.foto_url || '',
      token_exp:  data.token_exp,
      saved_at:   new Date().toISOString(),
    }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    const s = getSession();
    if (!s || !s.token || !s.token_exp) return false;
    if (new Date() > new Date(s.token_exp)) { clearSession(); return false; }
    return true;
  }

  function getRole() { return getSession()?.role || null; }
  function getUser() { return getSession(); }

  // ============================================================
  // ROLE → DASHBOARD URL MAP
  // ============================================================

  const ROLE_DASHBOARDS = {
    HRD:        '/pages/hrd-dashboard',
    OPERATOR:   '/pages/operator-dashboard',
    DRIVER:     '/pages/driver-dashboard',
    KERNET:     '/pages/driver-dashboard',
    STAFF_ADMIN:'/pages/staff-dashboard',
  };

  function getDashboardUrl(role) {
    return ROLE_DASHBOARDS[role] || '/pages/login';
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function login(kodeUnik, email, password) {
    const res = await API.auth.login({ kode_unik: kodeUnik, email, password });
    if (res.success) {
      saveSession(res.data);
      return { success: true, redirectUrl: getDashboardUrl(res.data.role) };
    }
    return { success: false, message: res.message };
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function logout() {
    try { await API.auth.logout(); } catch (_) {}
    clearSession();
    window.location.replace('/pages/login');
  }

  // ============================================================
  // UNAUTHORIZED HANDLER
  // ============================================================

  function handleUnauthorized() {
    clearSession();
    UI.toast('Sesi berakhir. Silakan login kembali.', 'warning');
    setTimeout(() => window.location.replace('/pages/login'), 15000);
  }

  // ============================================================
  // PAGE GUARD — panggil di setiap halaman yang butuh auth
  // ============================================================

  /**
   * Memastikan user sudah login dan memiliki role yang sesuai.
   * Jika tidak, redirect ke halaman yang tepat.
   * @param {string[]|null} allowedRoles - Array role yang diizinkan, null = semua role
   * @returns {Object|null} - Data session jika valid
   */
  function guard(allowedRoles = null) {
    if (!isLoggedIn()) {
      window.location.replace('/pages/login');
      return null;
    }
    const session = getSession();
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      window.location.replace(getDashboardUrl(session.role));
      return null;
    }
    return session;
  }

  /**
   * Guard untuk halaman login — jika sudah login, redirect ke dashboard.
   */
  function guardLogin() {
    if (isLoggedIn()) {
      window.location.replace(getDashboardUrl(getRole()));
    }
  }

  // ============================================================
  // REGISTER PT
  // ============================================================

  async function registerPT(formData) {
    const res = await API.auth.registerPT(formData);
    return res;
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  async function requestReset(kodeUnik, email) {
    return API.auth.resetPassword({ kode_unik: kodeUnik, email });
  }

  async function confirmReset(kodeUnik, email, otp, newPassword) {
    return API.auth.confirmReset({ kode_unik: kodeUnik, email, otp, new_password: newPassword });
  }

  return {
    getSession, saveSession, clearSession,
    isLoggedIn, getRole, getUser,
    getDashboardUrl,
    login, logout, handleUnauthorized,
    guard, guardLogin,
    registerPT, requestReset, confirmReset,
  };
})();

window.Auth = Auth;

// ============================================================
// IMPERSONATE — Dropdown Switcher (ditaruh dekat toggle dark/light)
// ============================================================

const ROLE_LABEL = {
  HRD:         'HRD',
  OPERATOR:    'Operator',
  DRIVER:      'Driver',
  KERNET:      'Kernet',
  STAFF_ADMIN: 'Staff Admin',
};

/**
 * Render dropdown "Ganti Role" di topbar, tepat di sebelah tombol dark/light mode
 * ([data-toggle-theme]). Hanya muncul jika:
 *  - User sedang impersonate (butuh cara balik), ATAU
 *  - User punya izin impersonate (field `permissions` di data user, diatur HRD).
 * Kalau tidak punya izin & tidak sedang impersonate → dropdown tidak dirender sama sekali.
 */
async function renderImpersonateSwitcher() {
  const session = Auth.getSession();
  if (!session) return;

  // Hindari duplikat kalau fungsi ini dipanggil ulang (misal setelah switch role)
  document.getElementById('impersonate-switcher')?.remove();

  let permissions = [];
  if (!session.original_role) {
    // Hanya cek izin kalau BUKAN sedang dalam mode impersonate.
    const res = await API.auth.getMyPermissions();
    if (res.success) permissions = res.data.permissions || [];
  }

  // Tidak sedang impersonate DAN tidak ada izin sama sekali → jangan render apapun
  if (!session.original_role && !permissions.length) return;

  let optionsHtml = '';
  if (session.original_role) {
    optionsHtml += `<option value="__restore__">↩ Kembali ke ${ROLE_LABEL[session.original_role] || session.original_role}</option>`;
  }
  permissions.forEach(role => {
    optionsHtml += `<option value="${role}">🎭 Sebagai ${ROLE_LABEL[role] || role}</option>`;
  });

  const wrap = document.createElement('div');
  wrap.id = 'impersonate-switcher';
  wrap.className = 'inline-flex items-center';
  wrap.innerHTML = `
    <select id="impersonate-select"
      class="text-xs font-semibold rounded-lg border border-purple-300 dark:border-purple-700
             bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300
             px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400
             max-w-[170px]">
      <option value="" selected disabled>${session.original_role ? '⚡ ' + ROLE_LABEL[session.role] : '🎭 Ganti Role'}</option>
      ${optionsHtml}
    </select>`;

  wrap.querySelector('#impersonate-select').addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    if (val === '__restore__') handleRestoreRole();
    else handleSwitchRole(val);
  });

  // Ambil SEMUA toggle tema, lalu pilih yang bukan di dalam sidebar/nav
  // (halaman ini bisa punya lebih dari satu toggle: topbar & sidebar footer/mobile).
  const themeBtnCandidates = Array.from(document.querySelectorAll('[data-toggle-theme]'));
  const themeBtn = themeBtnCandidates.find(
    el => !el.closest('aside, nav, #sidebar, .sidebar, #sidebar-nav')
  ) || themeBtnCandidates[0];

  if (themeBtn && themeBtn.parentElement) {
    themeBtn.parentElement.insertBefore(wrap, themeBtn);
  } else {
    (document.querySelector('#topbar, .topbar, header') || document.body).appendChild(wrap);
  }
}
window.renderImpersonateSwitcher = renderImpersonateSwitcher;
