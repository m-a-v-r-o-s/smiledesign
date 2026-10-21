import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev` (port 3002) proxies the API to `npm start` (port 3001).
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 }, // no data: fonts, keeps the CSP at font-src 'self'
  server: { proxy: { '/api': 'http://localhost:3001' } },
})
