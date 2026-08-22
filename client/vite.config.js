import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // 'hidden' generates source maps for error tracking tools
    // but does NOT embed them inline (avoids eval() CSP violation)
    sourcemap: 'hidden',
  },
})
