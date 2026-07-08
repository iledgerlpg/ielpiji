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
// ── SWITCH ROLE BANNER ──

function renderImpersonateBanner() {
  const session = Auth.getSession();
  if (!session?.original_role) return;

  // Tampilkan banner impersonate di atas topbar
  const existing = document.getElementById('impersonate-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'impersonate-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: linear-gradient(90deg, #7c3aed, #4f46e5);
    color: white; text-align: center; padding: 8px 16px;
    font-size: 13px; font-weight: 600; display: flex;
    align-items: center; justify-content: center; gap: 12px;
  `;
  banner.innerHTML = `
    <span>⚡ Mode Impersonate: <strong>${session.role}</strong> (asli: ${session.original_role})</span>
    <button onclick="handleRestoreRole()"
      style="background:white;color:#4f46e5;border:none;border-radius:8px;
             padding:3px 12px;font-size:12px;font-weight:700;cursor:pointer;">
      ✕ Kembali ke ${session.original_role}
    </button>
  `;
  document.body.prepend(banner);

  // Geser topbar ke bawah banner
  const topbar = document.querySelector('.topbar, header, #topbar');
  if (topbar) topbar.style.marginTop = '36px';
}

async function handleSwitchRole(targetRole) {
  const res = await API.auth.switchRole({ target_role: targetRole });
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  // Update session
  const session = Auth.getSession();
  Auth.saveSession({
    ...session,
    token:         res.data.token,
    role:          res.data.role,
    original_role: res.data.original_role,
  });

  UI.toast(`Beralih ke ${res.data.role}`, 'success');

  // Redirect ke dashboard role yang sesuai
  const rolePages = {
    OPERATOR:    '/operator-dashboard.html',
    DRIVER:      '/driver-dashboard.html',
    KERNET:      '/driver-dashboard.html',
    STAFF_ADMIN: '/staff-dashboard.html',
  };
  const page = rolePages[res.data.role];
  if (page) setTimeout(() => { window.location.href = page; }, 500);
}

async function handleRestoreRole() {
  const res = await API.auth.restoreRole();
  if (!res.success) { UI.toast(res.message, 'error'); return; }

  const session = Auth.getSession();
  Auth.saveSession({
    ...session,
    token:         res.data.token,
    role:          res.data.role,
    original_role: null,
  });

  UI.toast(`Kembali ke ${res.data.role}`, 'success');

  const rolePages = {
    HRD:         '/hrd-dashboard.html',
    STAFF_ADMIN: '/staff-dashboard.html',
  };
  const page = rolePages[res.data.role];
  if (page) setTimeout(() => { window.location.href = page; }, 500);
}
