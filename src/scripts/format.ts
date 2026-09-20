/**
 * Small formatting helpers shared by layouts, components and pages (build-time safe).
 */

const enGB = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function toDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

/** "12 May 2026". Uses UTC so a bare YYYY-MM-DD never shifts a day. */
export function formatDate(input: Date | string): string {
  const date = toDate(input);
  return Number.isNaN(date.getTime()) ? String(input) : enGB.format(date);
}

/** "2026-05-12" for <time datetime> and island props. */
export function toISODate(input: Date | string): string {
  const date = toDate(input);
  return Number.isNaN(date.getTime()) ? String(input) : date.toISOString().slice(0, 10);
}

/** Reading time in whole minutes from a Markdown/MDX body (min 1). */
export function readingTime(body: string, wordsPerMinute = 220): number {
  const text = body
    .replace(/^---[\s\S]*?---/, '') // frontmatter
    .replace(/<[^>]+>/g, ' ') // inline HTML
    .replace(/[`*_>#[\]()!-]/g, ' '); // markdown punctuation
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}
