/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zipi: {
          // orange brand palette
          50: '#fef9ec',
          100: '#fdf0ca',
          200: '#fadf90',
          300: '#f7c84e',
          400: '#f5b220',
          500: '#ef9008',
          600: '#d46a04',
          700: '#b04a07',
          800: '#8f390d',
          900: '#762f0f',
          950: '#441604',
          // warm neutral design tokens
          ink: '#1a1714',
          muted: '#6b6760',
          faint: '#a39e95',
          rim: '#ebe7df',
          bg: '#f4f2ee',
          surface: '#ffffff',
          surface2: '#f2efe9',
        },
      },
      fontFamily: {
        sans: ["'Hanken Grotesk'", 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        zipi: '0 1px 2px rgba(20,16,10,0.04), 0 6px 16px -12px rgba(20,16,10,0.16)',
      },
    },
  },
  plugins: [],
};
