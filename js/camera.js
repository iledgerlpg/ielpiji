/**
 * ILPG Frontend — camera.js
 * Mendukung kamera depan (absensi, selfie, di-mirror) dan kamera belakang
 * (laporan pengiriman, tidak di-mirror). Tangkap foto via Canvas tanpa
 * distorsi aspect ratio, lalu kompresi otomatis sebelum upload.
 */

const Camera = (() => {
  let _stream      = null;
  let _videoEl     = null;
  let _facingMode  = 'user'; // dipakai capture() untuk tahu apakah perlu mirror

  // ============================================================
  // KONFIGURASI
  // ============================================================

  const CONFIG = {
    maxWidth:      1280,   // batas lebar output, tinggi menyesuaikan rasio asli
    jpegQuality:   0.60,   // 60% → target 50-200KB
    maxSizeBytes:  2.5 * 1024 * 1024, // 2.5MB hard limit
  };

  function buildConstraints(facingMode, exact) {
    return {
      video: {
        facingMode: exact ? { exact: facingMode } : facingMode,
        width:      { ideal: 1280 },
        height:     { ideal: 720 },
      },
      audio: false,
    };
  }

  // ============================================================
  // INIT KAMERA
  // ============================================================

  /**
   * Inisialisasi stream kamera ke elemen <video>.
   * @param {HTMLVideoElement} videoEl - Elemen video target
   * @param {'user'|'environment'} facingMode - 'user' = kamera depan (default), 'environment' = kamera belakang
   * @returns {Promise<boolean>} true jika berhasil
   */
  async function init(videoEl, facingMode = 'user') {
    _videoEl    = videoEl;
    _facingMode = facingMode;

    // Stop stream lama jika ada
    if (_stream) stop();

    try {
      _stream = await navigator.mediaDevices.getUserMedia(buildConstraints(facingMode, true));
    } catch (err) {
      // Fallback: coba tanpa exact (untuk support browser/device lebih luas)
      if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
        try {
          _stream = await navigator.mediaDevices.getUserMedia(buildConstraints(facingMode, false));
        } catch (fallbackErr) {
          throw new Error(`Kamera tidak bisa diakses: ${fallbackErr.message}`);
        }
      } else if (err.name === 'NotAllowedError') {
        throw new Error('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
      } else {
        throw new Error(`Kamera error: ${err.message}`);
      }
    }

    _videoEl.srcObject = _stream;
    // Mirror hanya untuk kamera depan (selfie). Kamera belakang harus tampil normal.
    _videoEl.style.transform = (facingMode === 'user') ? 'scaleX(-1)' : 'none';

    await new Promise((resolve, reject) => {
      _videoEl.onloadedmetadata = resolve;
      _videoEl.onerror = reject;
    });
    await _videoEl.play();
    return true;
  }

  // ============================================================
  // AMBIL FOTO
  // ============================================================

  /**
   * Tangkap frame dari video, gambar ke canvas sesuai rasio asli video
   * (tidak distorsi/gepeng), lalu kompresi.
   * @returns {Promise<{base64: string, sizeKB: number, width: number, height: number}>}
   */
  async function capture() {
    if (!_videoEl || !_stream) {
      throw new Error('Kamera belum diinisialisasi. Panggil Camera.init() terlebih dahulu.');
    }

    const vw = _videoEl.videoWidth;
    const vh = _videoEl.videoHeight;
    if (!vw || !vh) {
      throw new Error('Video belum siap. Coba lagi sesaat.');
    }

    // Hitung ukuran output dengan mempertahankan aspect ratio asli video
    const scale = Math.min(1, CONFIG.maxWidth / vw);
    const outW  = Math.round(vw * scale);
    const outH  = Math.round(vh * scale);

    const canvas = document.createElement('canvas');
    canvas.width  = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    if (_facingMode === 'user') {
      // Mirror gambar (selfie mode - kamera depan perlu di-flip)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(_videoEl, -outW, 0, outW, outH);
      ctx.restore();
    } else {
      // Kamera belakang: tampilkan apa adanya, tanpa mirror
      ctx.drawImage(_videoEl, 0, 0, outW, outH);
    }

    // Kompresi JPEG
    let base64 = canvas.toDataURL('image/jpeg', CONFIG.jpegQuality);
    let sizeBytes = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);

    // Jika masih terlalu besar, kompresi lebih lanjut (tetap pertahankan rasio)
    if (sizeBytes > CONFIG.maxSizeBytes) {
      const reducedQuality = CONFIG.jpegQuality * 0.7;
      const smallerScale   = 0.75;
      const sW = Math.round(outW * smallerScale);
      const sH = Math.round(outH * smallerScale);
      const smallerCanvas  = document.createElement('canvas');
      smallerCanvas.width  = sW;
      smallerCanvas.height = sH;
      const sCtx = smallerCanvas.getContext('2d');
      sCtx.drawImage(canvas, 0, 0, sW, sH);
      base64     = smallerCanvas.toDataURL('image/jpeg', reducedQuality);
      sizeBytes  = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);
      return { base64, dataUrl: base64, sizeKB: Math.round(sizeBytes / 1024), width: sW, height: sH };
    }

    return {
      base64,
      dataUrl:   base64,
      sizeKB:    Math.round(sizeBytes / 1024),
      width:     outW,
      height:    outH,
    };
  }

  // ============================================================
  // STOP KAMERA
  // ============================================================

  function stop() {
    if (_stream) {
      _stream.getTracks().forEach(t => t.stop());
      _stream = null;
    }
    if (_videoEl) {
      _videoEl.srcObject = null;
      _videoEl.style.transform = '';
    }
  }

  function isActive() { return !!_stream; }

  // ============================================================
  // GPS HELPER — Anti-Fake GPS
  // ============================================================

  /**
   * Ambil lokasi GPS dengan akurasi tinggi.
   * Tolak jika akurasi lebih dari maxAccuracyMeters.
   * @param {number} maxAccuracyMeters - Batas akurasi (default 100m)
   * @param {number} timeoutMs - Timeout (default 15000ms)
   * @returns {Promise<{lat: number, lng: number, akurasi: number}>}
   */
  async function getLocation(maxAccuracyMeters = 100, timeoutMs = 15000) {
    if (!navigator.geolocation) {
      throw new Error('Browser ini tidak mendukung GPS. Gunakan browser modern.');
    }

    return new Promise((resolve, reject) => {
      let retryCount = 0;
      const maxRetries = 3;

      function tryGetLocation() {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, accuracy } = pos.coords;
            if (accuracy > maxAccuracyMeters) {
              retryCount++;
              if (retryCount < maxRetries) {
                // Coba lagi — GPS mungkin perlu warm-up
                setTimeout(tryGetLocation, 2000);
              } else {
                reject(new Error(
                  `Akurasi GPS terlalu rendah (${Math.round(accuracy)}m). ` +
                  `Keluar ke ruangan terbuka dan aktifkan GPS, lalu coba lagi.`
                ));
              }
              return;
            }
            resolve({ lat, lng, akurasi: Math.round(accuracy) });
          },
          (err) => {
            const messages = {
              1: 'Izin lokasi ditolak. Aktifkan GPS di pengaturan browser.',
              2: 'Sinyal GPS tidak tersedia. Pastikan GPS aktif.',
              3: 'Waktu tunggu GPS habis. Coba lagi.',
            };
            reject(new Error(messages[err.code] || `GPS error: ${err.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout:            timeoutMs,
            maximumAge:         0, // Selalu ambil lokasi fresh, bukan cache
          }
        );
      }

      tryGetLocation();
    });
  }

  // ============================================================
  // CAMERA MODAL HELPER
  // ============================================================

  /**
   * Buka modal kamera inline, tangkap foto, return base64.
   * @param {string} modalId - ID elemen modal yang berisi <video> dan <canvas>
   * @param {string} videoId - ID elemen <video>
   * @param {string} captureBtn - ID tombol capture
   * @param {Function} onCapture - Callback({base64, sizeKB}) setelah foto diambil
   * @param {'user'|'environment'} facingMode - Kamera yang dipakai
   */
  async function openModal(modalId, videoId, captureBtn, onCapture, facingMode = 'user') {
    const modal  = document.getElementById(modalId);
    const video  = document.getElementById(videoId);
    const btn    = document.getElementById(captureBtn);
    if (!modal || !video || !btn) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
      await init(video, facingMode);
      btn.onclick = async () => {
        try {
          const result = await capture();
          stop();
          modal.classList.add('hidden');
          modal.classList.remove('flex');
          if (onCapture) onCapture(result);
        } catch (err) {
          UI.toast(err.message, 'error');
        }
      };
    } catch (err) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      UI.toast(err.message, 'error');
    }
  }

  return { init, capture, stop, isActive, getLocation, openModal };
})();

window.Camera = Camera;
