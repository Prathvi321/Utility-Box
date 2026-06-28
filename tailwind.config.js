/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f5f7f3',
          100: '#eef2e7',
          200: '#dce5d0',
          300: '#c5d4b8',
          400: '#a8bfa0',
          500: '#7B9669',
          600: '#6b8a5d',
          700: '#5a764f',
          800: '#4a5f42',
          900: '#404E3B',
        },
        stone: {
          25: '#fafaf8',
          50: '#f5f5f3',
          100: '#ebe9e6',
          200: '#e2dfda',
          300: '#d4cfca',
          400: '#b8afa6',
          500: '#8b8680',
          600: '#6C8480',
          700: '#5a7270',
          800: '#485d5b',
          900: '#404e4d',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Geist', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

