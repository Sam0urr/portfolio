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
    /** Each tag renders as a chip button and a list item, so a blank one would ship an unlabeled control: fail the build instead. */
    tags: z.array(z.string().trim().min(1)),
    keywords: z.array(z.string().trim().min(1)).optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Fact row (Location · Year · Role · Method); each cell renders only when set. */
    location: z.string().optional(),
    year: z.number().int().optional(),
    role: z.string().optional(),
    method: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    /** Mono line above the h1, specific to the page (the home dateline is not reused here). */
    kicker: z.string().trim().min(1).optional(),
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
