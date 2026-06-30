/**
 * ILPG Frontend — config.js
 * Konfigurasi global aplikasi. SATU-SATUNYA tempat untuk set API_URL.
 * File ini di-load PALING AWAL, sebelum api.js, di semua halaman.
 */

window.ILPG_CONFIG = {
  // Ganti dengan URL Web App hasil Deploy di Google Apps Script.
  // Cara dapatkan: GAS Script Editor → Deploy → Manage deployments → copy "Web app URL"
  API_URL: 'https://script.google.com/macros/s/AKfycby6tZRCqitPsCB0O4RGQZhV5ighpIueMlCexwj2lH0Uost8F7DXxMD1-7Y-AYzeVepgMg/exec',
};
