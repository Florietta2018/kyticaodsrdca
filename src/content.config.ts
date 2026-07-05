// Súbor: src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Vytvoríme definíciu (schému) pre našu kolekciu príspevkov "blog"
const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),                                  // Nadpis (povinný text)
    description: z.string(),                            // Krátky popis (povinný text)
    pubDate: z.date(),                                  // Dátum publikácie (povinný dátum)
    image: z.object({
      url: image(),                                     // URL adresa obrázku (bude spracovaná cez astro:assets)
      alt: z.string(),                                  // Alternatívny text pre obrázok (povinný text)
    }),
    tags: z.array(z.string()),                          // Značky (nepovinné pole textových reťazcov)
  }),
});

// Exportujeme našu kolekciu, aby ju Astro mohlo použiť
export const collections = {
  'blog': blogCollection,
};
