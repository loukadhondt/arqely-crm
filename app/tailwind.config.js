/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { brand: { DEFAULT: '#0A0A0A', dark: '#000000', light: '#F1F1F1' } } } },
  plugins: [],
}
