# Build CSS (Tailwind)

Dulu pakai Tailwind CDN (`cdn.tailwindcss.com`) yang compile CSS di browser
tiap halaman dibuka — lambat & bukan buat production. Sekarang di-build jadi
file statis.

## Cara build ulang (kalau ada class Tailwind baru dipakai)
```bash
npm install
npm run build:css
```
Ini akan scan semua `pages/*.html`, `index.html`, dan `js/**/*.js`, lalu
generate `css/tailwind.css` (yang di-link dari semua halaman).

## Kalau mau nambah class komponen custom (dulu ditulis pakai @apply)
Edit `css/input.css` di dalam blok `@layer components`, lalu build ulang.
JANGAN taruh `@apply` di `<style>` inline halaman HTML — itu nggak akan
ke-proses Tailwind dan class-nya nggak akan jalan.
