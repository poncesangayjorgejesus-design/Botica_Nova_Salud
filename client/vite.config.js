import { defineConfig } from 'vite';

// En desarrollo: backend local por defecto en el puerto 3001.
// Para otro puerto: $env:NOVA_API_PROXY = 'http://127.0.0.1:3000'
const backend = process.env.NOVA_API_PROXY || 'http://127.0.0.1:3001';

export default defineConfig({
  root: 'client',
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': { target: backend, changeOrigin: true },
    },
  },
});
