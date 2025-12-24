import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

/**
 * Target browser for build
 * Can be: 'chrome' | 'firefox' | 'edge'
 */
const targetBrowser = (process.env.BROWSER || 'chrome') as 'chrome' | 'firefox' | 'edge';

/**
 * Manifest path based on target browser
 */
const manifestPath = `./src/manifests/${targetBrowser}.json`;

/**
 * Output directory based on target browser
 */
const outDir = `dist/${targetBrowser}`;

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: manifestPath,
      additionalInputs: [
        'src/pages/options/index.html',
        'src/pages/sidepanel/index.html',
        'src/pages/popup/index.html',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Global browser type constants for conditional code
    __BROWSER__: JSON.stringify(targetBrowser),
    __IS_CHROME__: targetBrowser === 'chrome',
    __IS_FIREFOX__: targetBrowser === 'firefox',
    __IS_EDGE__: targetBrowser === 'edge',
  },
  build: {
    outDir,
    // Ensure source maps for debugging
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
