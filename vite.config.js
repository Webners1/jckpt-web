import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: './public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'static/*',
          dest: './'
        }
      ]
    })
  ],
  server: {
    port: 3000,
    open: true,
  }
});
