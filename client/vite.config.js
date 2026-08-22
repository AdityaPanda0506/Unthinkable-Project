import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // 'hidden' generates .map files for error tracking
    // but does NOT embed eval() in the bundle
    sourcemap: 'hidden',
  },
})
