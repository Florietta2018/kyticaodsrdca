import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap'; // 1. Importujeme sitemap

// https://astro.build/config
export default defineConfig({
  site: 'https://kyticaodsrdca.sk',
  integrations: [
 sitemap() // 2. Pridáme sitemap do integrácií
  ]
});