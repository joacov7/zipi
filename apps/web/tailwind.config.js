/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zipi: {
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
        },
      },
    },
  },
  plugins: [],
};
