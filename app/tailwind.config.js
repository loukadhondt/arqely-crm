/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { brand: { DEFAULT: '#7C5CFF', dark: '#5B3FE0', light: '#EEE9FF' } } } },
  plugins: [],
}
