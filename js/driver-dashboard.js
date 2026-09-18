<!DOCTYPE html>
<html lang="id" class="">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
  <meta name="theme-color" content="#1d4ed8"/>
  <title>ILPG — Driver Dashboard</title>
  <link rel="manifest" href="/manifest.json"/>
  <link rel="icon" href="/assets/icon-192.png"/>
  <link rel="stylesheet" href="/css/tailwind.css"/>
  <style>
    :root { --ease-out: cubic-bezier(0.16, 1, 0.3, 1); }
    * { scroll-behavior: smooth; }

    #sidebar { transition: transform 300ms var(--ease-out); will-change: transform; }
    #sidebar-overlay { transition: opacity 250ms ease; opacity: 0; }
    #sidebar-overlay:not(.hidden) { opacity: 1; }

    .btn-icon, .btn-danger, .btn-primary, button {
      transition: background-color 180ms ease, color 180ms ease, transform 120ms ease, box-shadow 180ms ease;
    }
    .btn-icon:active, .btn-danger:active, .btn-primary:active { transform: scale(0.92); }
    .btn-icon:hover { transform: translateY(-1px); }
    [data-user-avatar] { transition: transform 200ms var(--ease-out), box-shadow 200ms ease; }
    [data-user-avatar]:hover { transform: scale(1.06); }
    [data-toggle-theme] { transition: transform 400ms var(--ease-out); }

    #avatar-dropdown { transform-origin: top right; }
    @keyframes scale-in {
      0% { opacity: 0; transform: scale(0.9) translateY(-6px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-scale-in { animation: scale-in 180ms var(--ease-out); }

    @keyframes content-fade-in {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    #main-content.content-enter { animation: content-fade-in 320ms var(--ease-out); }

    @keyframes title-fade {
      0% { opacity: 0; transform: translateY(-4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    #topbar-title.title-enter { animation: title-fade 250ms var(--ease-out); }

    @keyframes badge-pop {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.25); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    [data-queue-badge]:not(.hidden) { animation: badge-pop 300ms var(--ease-out); }

    /* Camera modal */
    #camera-modal { transition: opacity 220ms ease; }
    #camera-modal.hidden { opacity: 0; pointer-events: none; }
    #camera-modal:not(.hidden) { opacity: 1; }
    @keyframes modal-pop {
      0% { opacity: 0; transform: scale(0.94) translateY(8px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    #camera-modal:not(.hidden) > div { animation: modal-pop 240ms var(--ease-out); }
    #camera-capture-btn { transition: transform 120ms ease, box-shadow 180ms ease; }
    #camera-capture-btn:active { transform: scale(0.95); }

    /* Offline bar */
    #offline-bar { transition: transform 280ms var(--ease-out), opacity 280ms ease; transform: translateY(100%); }
    #offline-bar:not(.hidden) { transform: translateY(0); opacity: 1; animation: offline-slide-up 280ms var(--ease-out); }
    @keyframes offline-slide-up {
      0% { transform: translateY(100%); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }

    .card-compact, .badge { transition: transform 180ms var(--ease-out), box-shadow 180ms ease; }
    .toast, [data-toast] { animation: toast-in 220ms var(--ease-out); }
    @keyframes toast-in {
      0% { opacity: 0; transform: translateY(12px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    #sidebar-nav > * { transition: background-color 160ms ease, transform 140ms ease; }
    #sidebar-nav > *:active { transform: scale(0.97); }
  </style>
</head>
<body class="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">

<!-- SIDEBAR -->
<aside id="sidebar" class="sidebar fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 md:translate-x-0 -translate-x-full">
  <div class="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-800 shrink-0">
    <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" fill="#fff"/><path d="M10 4v12M4 10h12" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" opacity=".4"/></svg>
    </div>
    <div class="nav-label">
      <div class="font-bold text-slate-900 dark:text-white text-sm">ILPG</div>
      <div class="text-xs text-slate-400">Driver</div>
    </div>
  </div>
  <nav class="flex-1 overflow-y-auto py-3 px-3 space-y-0.5" id="sidebar-nav"></nav>
  <div class="border-t border-slate-200 dark:border-slate-800 p-3 shrink-0">
    <div class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
      <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0" data-user-avatar>D</div>
      <div class="user-info min-w-0 flex-1">
        <div class="text-sm font-medium text-slate-900 dark:text-white truncate" data-user-nama>Driver</div>
        <div class="text-xs text-slate-500" data-user-role>DRIVER</div>
      </div>
      <button data-toggle-theme class="btn-icon text-xs" data-theme-icon title="Ganti tema">🌙</button>
    </div>
  </div>
</aside>

<div id="sidebar-overlay" class="fixed inset-0 bg-black/40 z-30 hidden md:hidden" onclick="toggleSidebar()"></div>

<!-- TOPBAR -->
<header class="fixed top-0 right-0 left-0 md:left-[260px] h-16 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3">
  <button class="btn-icon md:hidden" onclick="toggleSidebar()">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
  </button>
  <div class="flex-1 min-w-0">
    <h1 class="text-base font-semibold text-slate-900 dark:text-white truncate" id="topbar-title">Driver Dashboard</h1>
  </div>
  <button class="btn-icon relative" onclick="showQueueModal()">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
    <span data-queue-badge class="hidden absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">0</span>
  </button>
  <button data-toggle-theme class="btn-icon" data-theme-icon>🌙</button>
  <div class="relative" id="avatar-menu">
    <button class="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-indigo-400 transition-all" data-user-avatar onclick="toggleAvatarMenu()">D</button>
    <div id="avatar-dropdown" class="hidden absolute right-0 top-12 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-scale-in">
      <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <div class="text-sm font-semibold text-slate-900 dark:text-white truncate" data-user-nama>—</div>
        <div class="text-xs text-slate-500 truncate" data-user-email>—</div>
      </div>
      <button class="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2" data-logout>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>Keluar
      </button>
    </div>
  </div>
</header>

<!-- MAIN -->
<main class="pt-16 md:ml-[260px] min-h-screen">
  <div class="p-4 md:p-6 max-w-4xl mx-auto" id="main-content">
    <div class="flex items-center justify-center h-64 text-slate-400 animate-pulse">Memuat dashboard...</div>
  </div>
</main>

<!-- CAMERA MODAL -->
<div id="camera-modal" class="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
  <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
      <h3 class="font-semibold text-slate-900 dark:text-white" id="camera-modal-title">Ambil Foto</h3>
      <button class="btn-icon" onclick="Camera.stop();UI.closeModal('camera-modal')">✕</button>
    </div>
    <div class="p-4 space-y-3">
      <div class="relative bg-slate-900 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
        <video id="camera-video" autoplay playsinline muted class="w-full h-full object-cover"></video>
        <div class="absolute inset-4 border-2 border-white/20 rounded-xl pointer-events-none"></div>
      </div>
      <canvas id="camera-canvas" class="hidden"></canvas>
      <p class="text-xs text-slate-500 text-center">📸 Pastikan wajah atau objek terlihat jelas</p>
      <button id="camera-capture-btn" class="btn-primary w-full justify-center py-3 text-sm">📷 Ambil Foto</button>
    </div>
  </div>
</div>

<!-- OFFLINE BAR -->
<div id="offline-bar" class="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-sm py-2 px-4 hidden">
  ⚡ Tidak ada koneksi — Data akan dikirim otomatis saat online.
</div>

<!-- SCRIPTS -->
<script src="/js/config.js"></script>
<script src="/js/api.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/db.js"></script>
<script src="/js/ui.js"></script>
<script src="/js/camera.js"></script>
<script src="/js/driver-dashboard.js"></script>
<script>
  function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const open = sb.classList.contains('-translate-x-full');
    sb.classList.toggle('-translate-x-full', !open);
    ov.classList.toggle('hidden', !open);
  }

  function toggleAvatarMenu() {
    const dd = document.getElementById('avatar-dropdown');
    const willOpen = dd.classList.contains('hidden');
    if (willOpen) {
      dd.classList.remove('hidden');
      dd.classList.remove('animate-scale-in');
      void dd.offsetWidth;
      dd.classList.add('animate-scale-in');
    } else {
      dd.classList.add('hidden');
    }
  }
  document.addEventListener('click', e => { if (!document.getElementById('avatar-menu')?.contains(e.target)) document.getElementById('avatar-dropdown')?.classList.add('hidden'); });

  async function showQueueModal() {
    const items = await DB.getQueue();
    const pending = items.filter(i => i.status==='PENDING').length;
    if (!pending) { UI.toast('Tidak ada data offline yang tertunda.','info'); return; }
    const ok = await UI.confirm(`Terdapat ${pending} data yang belum terkirim. Kirim sekarang?`, 'Antrian Offline');
    if (ok) { const r = await DB.flushQueue(); UI.toast(`${r.flushed} data terkirim.`, 'success'); UI.updateQueueBadge(); }
  }

  // Animasikan setiap perubahan konten utama & judul topbar
  (function watchContentTransitions() {
    const mainContent = document.getElementById('main-content');
    const topbarTitle = document.getElementById('topbar-title');
    function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    if (mainContent) { new MutationObserver(() => replay(mainContent, 'content-enter')).observe(mainContent, { childList: true }); }
    if (topbarTitle) { new MutationObserver(() => replay(topbarTitle, 'title-enter')).observe(topbarTitle, { characterData: true, childList: true, subtree: true }); }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
    const s = Auth.getSession();
    if (s) {
      document.querySelectorAll('[data-user-nama]').forEach(el => el.textContent = s.nama);
      document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = s.email);
      document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = s.role);
      document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = s.nama.charAt(0).toUpperCase());
    }

    window.addEventListener('online', () => { document.getElementById('offline-bar').classList.add('hidden'); DB.flushQueue().then(r => { if (r.flushed > 0) UI.toast(`${r.flushed} data terkirim.`, 'success'); }); });
    window.addEventListener('offline', () => { document.getElementById('offline-bar').classList.remove('hidden'); });
    if (!navigator.onLine) document.getElementById('offline-bar').classList.remove('hidden');
  });
</script>
</body>
</html>
