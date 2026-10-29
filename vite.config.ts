import { defineConfig } from 'vite';

// shadejoryan.github.io is a GitHub Pages user site, so assets are served
// directly from the domain root instead of /<repository-name>/.
export default defineConfig({
  base: '/',
  esbuild: {
    jsx: 'automatic',
  },
});
