import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    // Question crops are tiny but numerous. Keep them as separate files instead
    // of inlining base64 into the bundle, so the JS stays small and cacheable.
    assetsInlineLimit: (filePath) =>
      filePath.replace(/\\/g, '/').includes('/questions/images/') ? false : undefined,
  },
})
