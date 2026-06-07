/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue:    { DEFAULT: '#1E3A8A', mid: '#0067B1', light: '#EEF4FF' },
        yellow:  { DEFAULT: '#FFD100', dark: '#E6BC00' },
        ink:     '#0A0A0A',
        muted:   '#6B7280',
        surface: '#F7F8FA',
        border:  '#E5E7EB',
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'sans-serif'] },
      fontSize: {
        '5xl':  ['3rem',   { lineHeight: '1.05' }],
        '6xl':  ['3.75rem',{ lineHeight: '1.0'  }],
        '7xl':  ['4.5rem', { lineHeight: '0.95' }],
      },
    },
  },
  plugins: [],
}
