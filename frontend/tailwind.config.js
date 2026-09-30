/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: '#0a0d14',
          card: '#131823',
          border: '#232d42',
          neonCyan: '#00f5ff',
          neonGold: '#ffd700',
          neonPink: '#ff007f',
          neonGreen: '#00ff88',
          neonRed: '#ff3366',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.5s infinite alternate',
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'scaleUp': 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 15px rgba(255, 51, 102, 0.5)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 35px rgba(255, 51, 102, 0.9)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      }
    },
  },
  plugins: [],
}
