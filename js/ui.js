/**
 * ILPG Frontend — ui.js
 * Utilitas UI global: toast, skeleton loader, modal, dark mode, format helpers.
 * Tidak ada business logic di sini — murni presentasi.
 */

const UI = (() => {
  // ============================================================
  // DARK MODE
  // ============================================================

  const THEME_KEY = 'ilpg_theme';

  function initTheme() {
    const saved    = localStorage.getItem(THEME_KEY);
    const prefDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark   = saved ? saved === 'dark' : prefDark;
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcon(isDark);
    // Dengarkan perubahan preferensi sistem
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) toggleTheme(e.matches);
    });
  }

  function toggleTheme(force) {
    const isDark = force !== undefined ? force : !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
  }

  function updateThemeIcon(isDark) {
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.textContent = isDark ? '☀️' : '🌙';
      el.title       = isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap';
    });
  }

  // ============================================================
  // TOAST NOTIFICATIONS
  // ============================================================

  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id        = 'toast-container';
      toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  /**
   * Tampilkan toast notification.
   * @param {string} message - Pesan
   * @param {'success'|'error'|'warning'|'info'} type - Jenis notifikasi
   * @param {number} duration - Durasi dalam ms (default 3500)
   */
  function toast(message, type = 'info', duration = 3500) {
    const container = ensureToastContainer();

    const icons = {
      success: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
      error:   '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
      warning: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
      info:    '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    };

    const colors = {
      success: 'bg-green-500 dark:bg-green-600',
      error:   'bg-red-500 dark:bg-red-600',
      warning: 'bg-amber-500 dark:bg-amber-600',
      info:    'bg-blue-600 dark:bg-blue-700',
    };

    const el = document.createElement('div');
    el.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium
      ${colors[type]} transition-all duration-300 translate-x-full opacity-0`;
    el.innerHTML = `${icons[type]}<span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-1 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none">&times;</button>`;

    container.appendChild(el);

    // Animasi masuk
    requestAnimationFrame(() => {
      el.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto dismiss
    const timer = setTimeout(() => {
      el.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => el.remove(), 300);
    }, duration);

    el.addEventListener('click', () => { clearTimeout(timer); el.remove(); });
  }

  // ============================================================
  // SKELETON LOADERS
  // ============================================================

  /** Buat elemen skeleton loader */
  function skeleton(lines = 3, className = '') {
    const wrapper = document.createElement('div');
    wrapper.className = `animate-pulse space-y-3 ${className}`;
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3'];
      line.className = `h-4 bg-slate-200 dark:bg-slate-700 rounded-lg ${widths[i % widths.length]}`;
      wrapper.appendChild(line);
    }
    return wrapper;
  }

  /** Skeleton untuk kartu stat */
  function skeletonCard(count = 4) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'card animate-pulse space-y-3';
      card.innerHTML = `
        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
        <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>`;
      grid.appendChild(card);
    }
    return grid;
  }

  /** Skeleton untuk tabel */
  function skeletonTable(rows = 5, cols = 4) {
    const table = document.createElement('div');
    table.className = 'space-y-2 animate-pulse';
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('div');
      row.className = 'flex gap-3';
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg';
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    return table;
  }

  /** Replace konten dengan skeleton, return fungsi untuk restore */
  function showSkeleton(container, type = 'list', rows = 5) {
    const original = container.innerHTML;
    if (type === 'cards')      container.replaceChildren(skeletonCard());
    else if (type === 'table') container.replaceChildren(skeletonTable(rows));
    else                        container.replaceChildren(skeleton(rows));
    return () => { container.innerHTML = original; };
  }

  // ============================================================
  // LOADING BUTTON
  // ============================================================

  function setLoading(btn, loading, originalText = null) {
    if (!btn) return;
    if (loading) {
      btn._originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<svg class="animate-spin w-4 h-4 inline mr-2" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>${originalText || 'Memproses...'}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn._originalText || originalText || btn.innerHTML;
    }
  }

  // ============================================================
  // MODAL
  // ============================================================

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove('flex');
    document.body.style.overflow = '';
  }

  /** Setup semua tombol tutup modal via [data-close-modal] */
  function initModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    // Tutup saat klik backdrop
    document.querySelectorAll('[data-modal-backdrop]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) closeModal(el.id);
      });
    });
  }

  // ============================================================
  // CONFIRM DIALOG
  // ============================================================

  function confirm(message, title = 'Konfirmasi') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4';
      overlay.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-scale-in">
          <h3 class="font-semibold text-slate-900 dark:text-white text-lg">${title}</h3>
          <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${message}</p>
          <div class="flex gap-3 justify-end pt-2">
            <button id="dlg-cancel" class="btn-secondary text-sm">Batal</button>
            <button id="dlg-confirm" class="btn-danger text-sm">Ya, Lanjutkan</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#dlg-cancel').onclick  = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('#dlg-confirm').onclick = () => { overlay.remove(); resolve(true); };
    });
  }

  // ============================================================
  // SECURITY — ESCAPE HTML
  // ============================================================

  /**
   * Escape karakter HTML berbahaya dari teks yang berasal dari input user
   * (nama, judul, isi catatan, deskripsi tugas, keterangan, dll), untuk
   * mencegah stored XSS saat data tersebut di-render via innerHTML/template string.
   * WAJIB dipakai untuk semua field teks bebas yang diketik manusia.
   * TIDAK perlu dipakai untuk angka, tanggal, enum/status, atau UUID.
   */
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================
  // FORMATTERS
  // ============================================================

  function formatRupiah(num) {
    if (!num && num !== 0) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }

  function formatNumber(num) {
    return Number(num || 0).toLocaleString('id-ID');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(str) {
    if (!str) return '-';
    const d = new Date(str);
    if (isNaN(d)) return String(str);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function todayInputValue() {
    return new Date().toISOString().split('T')[0];
  }

  function currentMonthValue() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ============================================================
  // BADGE / CHIP HELPERS
  // ============================================================

  const STATUS_COLORS = {
    ACTIVE:      'badge-green',
    INACTIVE:    'badge-gray',
    PENDING:     'badge-yellow',
    SUBMITTED:   'badge-blue',
    VERIFIED:    'badge-green',
    REVISED:     'badge-yellow',
    LUNAS:       'badge-green',
    SEBAGIAN:    'badge-yellow',
    BELUM:       'badge-red',
    SALDO_AGEN:  'badge-blue',   
    OPEN:        'badge-blue',
    IN_PROGRESS: 'badge-yellow',
    DONE:        'badge-green',
    SUSPENDED:   'badge-red',
    HRD:         'badge-purple',
    OPERATOR:    'badge-blue',
    DRIVER:      'badge-indigo',
    KERNET:      'badge-indigo',
    STAFF_ADMIN: 'badge-teal',
  };

  function badge(text, status = null) {
    const colorClass = status ? (STATUS_COLORS[status] || 'badge-gray') : 'badge-gray';
    return `<span class="badge ${colorClass}">${text}</span>`;
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  function emptyState(message = 'Belum ada data.', icon = '📭') {
    return `<div class="empty-state">
      <div class="text-4xl mb-3">${icon}</div>
      <p class="text-slate-500 dark:text-slate-400 text-sm">${message}</p>
    </div>`;
  }

  // ============================================================
  // OFFLINE INDICATOR
  // ============================================================

  function initOfflineIndicator() {
    const bar = document.createElement('div');
    bar.id        = 'offline-bar';
    bar.className = 'fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-sm py-2 px-4 hidden transition-all duration-300';
    bar.innerHTML = '⚡ Tidak ada koneksi — Data baru akan dikirim otomatis saat online kembali.';
    document.body.appendChild(bar);

    function updateBar() {
      bar.classList.toggle('hidden', navigator.onLine);
      if (!navigator.onLine) {
        toast('Koneksi internet terputus. Mode offline aktif.', 'warning', 5000);
      } else {
        toast('Koneksi kembali! Mengirim data yang tertunda...', 'success');
        DB.flushQueue().then(({ flushed }) => {
          if (flushed > 0) toast(`${flushed} data berhasil dikirim.`, 'success');
        });
      }
    }

    window.addEventListener('online',  updateBar);
    window.addEventListener('offline', updateBar);
    updateBar(); // cek initial state
  }

  // ============================================================
  // SYNC MESSAGE (dari Service Worker)
  // ============================================================

  function initSWMessages() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'SYNC_SUCCESS') {
        toast(`Data "${e.data.item?.type || 'laporan'}" berhasil dikirim dari antrian offline.`, 'success');
      }
    });
  }

  // ============================================================
  // POPULATE USER INFO (sidebar / header)
  // ============================================================

  function populateUserInfo() {
    const s = Auth.getSession();
    if (!s) return;
    document.querySelectorAll('[data-user-nama]').forEach(el   => el.textContent = s.nama);
    document.querySelectorAll('[data-user-email]').forEach(el  => el.textContent = s.email);
    document.querySelectorAll('[data-user-role]').forEach(el   => el.textContent = s.role.replace('_', ' '));
    document.querySelectorAll('[data-user-pt]').forEach(el     => el.textContent = s.nama_pt);
    document.querySelectorAll('[data-user-foto]').forEach(el   => {
      if (s.foto_url) { el.src = s.foto_url; }
      else { el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden'); }
    });
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
      el.textContent = (s.nama || '?').charAt(0).toUpperCase();
    });
  }

  // ============================================================
  // SYNC QUEUE BADGE (tampilkan jumlah item offline)
  // ============================================================

  async function updateQueueBadge() {
    const count = await DB.getQueueCount();
    document.querySelectorAll('[data-queue-badge]').forEach(el => {
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
    });
  }

  // ============================================================
  // INIT GLOBAL
  // ============================================================

  function init() {
    initTheme();
    initModals();
    initOfflineIndicator();
    initSWMessages();
    populateUserInfo();
    updateQueueBadge();

    // Toggle dark mode button
    document.querySelectorAll('[data-toggle-theme]').forEach(btn => {
      btn.addEventListener('click', () => toggleTheme());
    });

    // Logout buttons
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', () => Auth.logout());
    });
  }

  return {
    initTheme, toggleTheme,
    toast, skeleton, skeletonCard, skeletonTable, showSkeleton,
    setLoading, openModal, closeModal, initModals,
    confirm, emptyState, escapeHtml,
    formatRupiah, formatNumber, formatDate, formatDateShort, formatDateTime,
    todayInputValue, currentMonthValue,
    badge, STATUS_COLORS,
    populateUserInfo, updateQueueBadge,
    init,
  };
})();

window.UI = UI;
