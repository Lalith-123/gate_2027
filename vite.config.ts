import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base works both on GitHub Pages (/gate_2027/) and Vercel (/),
  // and keeps asset URLs valid without any Node-only globals.
  base: './',
  build: {
    // Question crops are tiny but numerous. Keep them as separate files instead
    // of inlining base64 into the bundle, so the JS stays small and cacheable.
    assetsInlineLimit: (filePath) =>
      filePath.replace(/\\/g, '/').includes('/questions/images/') ? false : undefined,
  },
})
