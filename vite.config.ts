import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { buildManifest, MANIFEST_URL } from './scripts/question-manifest.mjs';

const src = fileURLToPath(new URL('./src', import.meta.url));

/**
 * Builds the lightweight question manifest at request/build time.
 *
 * Per-year chunks are handled by `import.meta.glob` in
 * `src/data/questionLoaders.ts`, so each year is a separate lazy chunk and
 * adding `src/data/questions/gate-2027.json` is the only step required for a
 * new GATE year to appear in the app.
 */
function questionBank(): Plugin {
  let server: import('vite').ViteDevServer | undefined;
  let payload = buildManifest();
  let lastError: string | null = null;

  const serialise = () => {
    try {
      return JSON.stringify(payload.manifest);
    } catch (err) {
      lastError = (err as Error).message;
      return JSON.stringify({
        version: 1,
        total: 0,
        error: lastError,
        years: [],
        subjects: [],
        questions: [],
      });
    }
  };

  const rebuild = () => {
    payload = buildManifest();
    server?.ws.send({ type: 'full-reload' });
  };

  return {
    name: 'gate:question-bank',
    enforce: 'pre',

    buildStart() {
      payload = buildManifest();
      for (const w of payload.warnings) this.warn(w);
      if (!payload.manifest.total) this.warn('No questions found in src/data/questions');
    },

    configureServer(devServer) {
      server = devServer;
      const onEvent = (event: string) => {
        if (event === 'add' || event === 'unlink' || event === 'change') rebuild();
      };
      devServer.watcher.on('add', onEvent);
      devServer.watcher.on('unlink', onEvent);
      devServer.watcher.on('change', onEvent);

      devServer.middlewares.use((req, res, next) => {
        if (!req.url || req.url.split('?')[0] !== MANIFEST_URL) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(serialise());
      });
    },

    generateBundle() {
      payload = buildManifest();
      for (const w of payload.warnings) this.warn(w);
      this.emitFile({
        type: 'asset',
        fileName: 'data/questions.manifest.json',
        source: serialise(),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), questionBank()],
  resolve: {
    alias: {
      '@': src,
    },
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome100',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('katex')) return 'katex';
            if (id.includes('react-router')) return 'router';
            if (id.includes('react')) return 'react';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
});
