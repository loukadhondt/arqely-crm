import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// VITE_BASE = '/arqely-crm/' on GitHub Pages, '/' on Vercel/Netlify or custom domain
export default defineConfig({ plugins: [react()], base: process.env.VITE_BASE || '/' })
