/** @type {import('tailwindcss').Config} */
export default {
  // Scan all component and page files for class usage
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Custom font stack — Inter loaded via Google Fonts in index.html
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Brand colour ramp (indigo-based)
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        // Dark surface tones
        surface: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
      },
      // Custom animations
      animation: {
        'fade-in':    'fadeIn 0.5s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      // Extended backdrop blur
      backdropBlur: { xs: '2px' },
      // Glow box shadows
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.35)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.35)',
        'card':        '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
