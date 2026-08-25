import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Build-time mirror of the Sveltia CMS field validation in
 * public/admin/config.yml.
 *
 * The CMS enforces these limits in the editing UI; this schema enforces the
 * same limits at build time, so a hand-edited file or a bad merge fails the
 * build instead of silently shipping over-length copy.
 * If you change a limit here, change it in config.yml too.
 */
const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/pages' }),
  schema: z.object({
    meta: z.object({
      title: z.string().min(1).max(60),
      description: z.string().min(1).max(155),
    }),
    hero: z.object({
      eyebrow: z.string().max(40),
      heading: z.string().min(1).max(90),
      body: z.string().min(1).max(300),
      primaryCta: ctaSchema,
      secondaryCta: ctaSchema,
      // Source-relative path written by the CMS, e.g.
      // "/src/assets/uploads/hero-innovation-lab.jpg".
      background: z.string().min(1),
      backgroundAlt: z.string().min(1),
      stats: z
        .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
        .length(4),
    }),
    faq: z.object({
      heading: z.string().min(1),
      items: z
        .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
        .min(1),
    }),
  }),
});

export const collections = { pages };
