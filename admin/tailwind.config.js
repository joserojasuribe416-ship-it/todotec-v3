/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFD100',
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#FFD100',
        },
        blue: {
          DEFAULT: '#1E3A8A',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#1D4ED8',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
        todotec: {
          yellow: '#FFD100',
          blue: '#1E3A8A',
          'blue-light': '#1D4ED8',
        }
      },
    },
  },
  plugins: [],
}
