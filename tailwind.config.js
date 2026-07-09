/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // Discover mana aja class Tailwind yang benar-benar dipakai, di semua HTML & JS
  // (JS di-scan juga karena beberapa dashboard nyusun className/innerHTML lewat JS).
  content: [
    './index.html',
    './pages/**/*.html',
    './js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
      },
      animation: {
        'fade-in': 'fadeIn .25s ease',
        'scale-in': 'scaleIn .2s ease',
        'slide-in': 'slideIn .25s ease',
        'slide-up': 'slideUp .4s ease',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        scaleIn: { '0%': { transform: 'scale(.95)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        slideIn: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
