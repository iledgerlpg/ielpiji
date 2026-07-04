/**
 * ILPG Frontend — config.js
 * Konfigurasi global aplikasi. SATU-SATUNYA tempat untuk set API_URL.
 * File ini di-load PALING AWAL, sebelum api.js, di semua halaman.
 */

window.ILPG_CONFIG = {
  // Ganti dengan URL Web App hasil Deploy di Google Apps Script.
  // Cara dapatkan: GAS Script Editor → Deploy → Manage deployments → copy "Web app URL"
  API_URL: 'https://script.google.com/macros/s/AKfycbxuc3aLBSNQkPDIN3VvPpjfgSeMWct0GwkSt5ix6-TeXUQUPq7mXGN93mE8VtcA_QfOkA/exec',
};
