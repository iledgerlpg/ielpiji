/**
 * ILPG Frontend — camera.js
 * Kamera depan wajib (facingMode: "user"), tangkap foto via Canvas,
 * kompresi otomatis sebelum upload.
 */

const Camera = (() => {
  let _stream   = null;
  let _videoEl  = null;
  let _canvasEl = null;

  // ============================================================
  // KONFIGURASI
  // ============================================================

  const CONFIG = {
    width:         640,
    height:        480,
    jpegQuality:   0.60,   // 60% → target 50-200KB
    maxSizeBytes:  2.5 * 1024 * 1024, // 2.5MB hard limit
    constraints: {
      video: {
        facingMode: { exact: 'user' }, // WAJIB kamera depan
        width:      { ideal: 1280 },
        height:     { ideal: 720 },
      },
      audio: false,
    },
    // Fallback jika exact: 'user' tidak tersedia (beberapa device desktop)
    constraintsFallback: {
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    },
  };

  // ============================================================
  // INIT KAMERA
  // ============================================================

  /**
   * Inisialisasi stream kamera ke elemen <video>.
   * @param {HTMLVideoElement} videoEl - Elemen video target
   * @returns {Promise<boolean>} true jika berhasil
   */
  async function init(videoEl) {
    _videoEl = videoEl;

    // Stop stream lama jika ada
    if (_stream) stop();

    try {
      _stream = await navigator.mediaDevices.getUserMedia(CONFIG.constraints);
    } catch (err) {
      // Fallback: coba tanpa exact (untuk support browser lebih luas)
      if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
        try {
          _stream = await navigator.mediaDevices.getUserMedia(CONFIG.constraintsFallback);
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
   * Tangkap frame dari video, gambar ke canvas, dan kompresi.
   * @param {HTMLCanvasElement} [canvasEl] - Canvas opsional (jika null, dibuat internal)
   * @returns {Promise<{base64: string, sizeKB: number, width: number, height: number}>}
   */
  async function capture(canvasEl = null) {
    if (!_videoEl || !_stream) {
      throw new Error('Kamera belum diinisialisasi. Panggil Camera.init() terlebih dahulu.');
    }

    const canvas = canvasEl || document.createElement('canvas');
    canvas.width  = CONFIG.width;
    canvas.height = CONFIG.height;
    const ctx = canvas.getContext('2d');

    // Mirror gambar (selfie mode - kamera depan perlu di-flip)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(_videoEl, -CONFIG.width, 0, CONFIG.width, CONFIG.height);
    ctx.restore();

    // Kompresi JPEG
    let base64 = canvas.toDataURL('image/jpeg', CONFIG.jpegQuality);
    let sizeBytes = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);

    // Jika masih terlalu besar, kompresi lebih lanjut
    if (sizeBytes > CONFIG.maxSizeBytes) {
      const reducedQuality = CONFIG.jpegQuality * 0.7;
      const smallerCanvas  = document.createElement('canvas');
      smallerCanvas.width  = 480;
      smallerCanvas.height = 360;
      const sCtx = smallerCanvas.getContext('2d');
      sCtx.drawImage(canvas, 0, 0, 480, 360);
      base64     = smallerCanvas.toDataURL('image/jpeg', reducedQuality);
      sizeBytes  = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);
    }

    return {
      base64,
      dataUrl:   base64,
      sizeKB:    Math.round(sizeBytes / 1024),
      width:     canvas.width,
      height:    canvas.height,
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
   * Utility fungsi high-level yang membungkus seluruh alur kamera.
   * @param {string} modalId - ID elemen modal yang berisi <video> dan <canvas>
   * @param {string} videoId - ID elemen <video>
   * @param {string} captureBtn - ID tombol capture
   * @param {Function} onCapture - Callback({base64, sizeKB}) setelah foto diambil
   */
  async function openModal(modalId, videoId, captureBtn, onCapture) {
    const modal  = document.getElementById(modalId);
    const video  = document.getElementById(videoId);
    const btn    = document.getElementById(captureBtn);
    if (!modal || !video || !btn) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
      await init(video);
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
