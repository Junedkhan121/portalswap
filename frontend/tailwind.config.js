/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        portal: {
          bg:      '#07090f',
          card:    '#0d1424',
          surface: '#111d33',
          raised:  '#162040',
          border:  '#1e2e4a',
          rim:     '#2a3f65',
          primary: '#3d7eff',
          purple:  '#a855f7',
          cyan:    '#00d4ff',
          green:   '#10b981',
          red:     '#ef4444',
          text:    '#e8f0ff',
          sub:     '#9ab0d4',
          muted:   '#4e6490',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-blue':   '0 0 24px rgba(61,126,255,0.25), 0 0 60px rgba(61,126,255,0.08)',
        'glow-purple': '0 0 24px rgba(168,85,247,0.25)',
        'glow-sm':     '0 0 12px rgba(61,126,255,0.2)',
        'card':        '0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
