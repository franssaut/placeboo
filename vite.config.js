import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        semuaAlat: resolve(__dirname, 'semua-alat.html'),
        batchQueue: resolve(__dirname, 'batch-queue.html'),
        riwayatUnduhan: resolve(__dirname, 'riwayat-unduhan.html'),
      },
    },
  },
});
