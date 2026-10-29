import { defineConfig } from 'vite';

// The Pages workflow supplies /<repository-name>/. Use '/' for local development.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  esbuild: {
    jsx: 'automatic',
  },
});
