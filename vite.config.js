import { defineConfig } from 'vite';
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? './' : '/',
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist' },
  server: { host: '0.0.0.0', proxy: { '/api': 'http://127.0.0.1:3000' } }
}));
