import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap'; // 1. Importujeme sitemap

// https://astro.build/config
export default defineConfig({
  site: 'https://kyticaodsrdca.sk',
  integrations: [
 sitemap() // 2. Pridáme sitemap do integrácií
  ],
  vite: {
    build: {
      // Zachová klasický zápis media queries (max-width: ...) namiesto
      // range syntaxe (width <= ...), aby responzívne štýly fungovali
      // aj na starších mobilných prehliadačoch (iOS < 16.4, staršie WebView)
      cssTarget: ['chrome61', 'edge79', 'firefox60', 'safari11']
    }
  }
});