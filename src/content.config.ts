import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content collections. Entry `id` is the filename without extension and doubles as
 * the public slug: /notes/<id>/, /projects/<id>/, and /<id>/ for pages.
 * Dates are coerced to `Date` objects (frontmatter uses YYYY-MM-DD).
 */

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    summary: z.string(),
    tags: z.array(z.string()),
    keywords: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.number().int().optional(),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
  }),
});

/** The "In preparation" list on the Notes index. */
const upcoming = defineCollection({
  loader: file('./src/content/upcoming.json'),
  schema: z.object({
    id: z.string(),
    status: z.enum(['Drafting', 'Researching', 'Planned']),
    title: z.string(),
    teaser: z.string(),
  }),
});

export const collections = { notes, projects, pages, upcoming };
