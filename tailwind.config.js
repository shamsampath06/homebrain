/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#080B12',
          900: '#0D1220',
          850: '#101627',
          800: '#141C2E',
          750: '#1A243B',
          700: '#222F4C',
          600: '#334469'
        },
        brand: {
          50: '#fffbed',
          100: '#fff4c2',
          200: '#fce68a',
          300: '#f8d45a',
          400: '#eabd3d',
          500: '#d99b18',
          600: '#b7790f',
          700: '#965b0c',
          800: '#7c480f',
          900: '#693b12',
          950: '#3d2108',
        },
        family: {
          warm: '#fbf7ec',
          card: '#ffffff',
          darkCard: '#121A2A',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          indigo: '#6366f1',
          violet: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        'glass-glow': '0 0 25px -5px rgba(217, 155, 24, 0.25)',
        'spatial': '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'card': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 4px 20px -2px rgba(0, 0, 0, 0.03)'
      }
    },
  },
  plugins: [],
}
