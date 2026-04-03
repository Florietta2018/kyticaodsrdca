// Súbor: src/content/config.ts
import { defineCollection, z } from 'astro:content';

// Vytvoríme definíciu (schému) pre našu kolekciu príspevkov "blog"
const blogCollection = defineCollection({
  type: 'content', // Znamená, že príspevky budú písané v Markdown alebo MDX
  schema: z.object({
    title: z.string(),                                  // Nadpis (povinný text)
    description: z.string(),                            // Krátky popis (povinný text)
    pubDate: z.date(),                                  // Dátum publikácie (povinný dátum)
    image: z.object({
      url: z.string(),                                  // URL adresa obrázku (povinný text)
      alt: z.string(),                                  // Alternatívny text pre obrázok (povinný text)
    }),
    tags: z.array(z.string()),                          // Značky (nepovinné pole textových reťazcov)
  }),
});

// Exportujeme našu kolekciu, aby ju Astro mohlo použiť
export const collections = {
  'blog': blogCollection,
};