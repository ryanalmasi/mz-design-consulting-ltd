import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

/**
 * Content schemas.
 *
 * These are validated at build time, so a typo in a project's category or a
 * missing summary fails `npm run build` rather than rendering a broken filter
 * chip in production — which is how the old site ended up with nine project
 * cards, four filter tabs and no working connection between them.
 */

export const PROJECT_CATEGORIES = [
  'Industrial',
  'Commercial',
  'Municipal',
  'Infrastructure',
] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(PROJECT_CATEGORIES),
      /** Short label shown on the card, e.g. "Earthworks". */
      discipline: z.string(),
      summary: z.string(),
      /** TODO: confirm and add real locations as they are cleared for use. */
      location: z.string().optional(),
      /** TODO: add client names where permission to name them exists. */
      client: z.string().optional(),
      year: z.number().optional(),
      image: image(),
      imageAlt: z.string(),
      /** Measured outcomes. Only include figures that can be substantiated. */
      metrics: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
          })
        )
        .default([]),
      services: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(100),
    }),
});

export const INSIGHT_TOPICS = [
  'Grading',
  'Earthworks',
  'Stormwater',
  'Transportation',
  'Industrial',
  'Regulatory',
  'Civil 3D',
] as const;

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      topic: z.enum(INSIGHT_TOPICS),
      summary: z.string(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      /** Minutes. Computed by hand so it stays honest. */
      readingTime: z.number(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, insights };
