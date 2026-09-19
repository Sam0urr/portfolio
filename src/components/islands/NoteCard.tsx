import type { ReactNode } from 'react';

export type NoteCardProps = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date string, e.g. "2026-05-12". */
  date: string;
  tags: string[];
  /** Minutes; rendered as "· 9 min" after the date. */
  readingTime?: number;
  /** Search terms (already lower-cased) to wrap in <mark>. */
  terms?: string[];
};

/**
 * Formats an ISO date as en-GB long form, e.g. "12 May 2026".
 * Uses UTC so a bare "YYYY-MM-DD" never shifts a day in negative-offset zones.
 */
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatNoteDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return dateFormatter.format(parsed);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Wraps every case-insensitive occurrence of any term in <mark>. Longer terms are
 * tried first so a longer match wins when one term is a prefix of another.
 */
export function highlight(text: string, terms: string[] = []): ReactNode {
  const clean = [...new Set(terms.filter((term) => term.length > 0))].sort((a, b) => b.length - a.length);
  if (clean.length === 0 || text.length === 0) return text;
  const pattern = new RegExp(clean.map(escapeRegExp).join('|'), 'gi');
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (end <= start) continue;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>);
    last = end;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * One note as a hairline ledger row: mono date + read time, display-face title
 * linking to /notes/<slug>/, summary, tags on the right. Same markup and classes
 * as NoteCardStatic.astro so the Notes index and the home page read as one ledger.
 */
export default function NoteCard({ slug, title, summary, date, tags, readingTime, terms }: NoteCardProps) {
  const href = `/notes/${slug}/`;

  return (
    <li className="row">
      <div className="row-meta">
        <time dateTime={date}>{formatNoteDate(date)}</time>
        {readingTime ? <span> · {readingTime} min</span> : null}
      </div>
      <div className="row-body">
        <h2 className="row-title">
          <a href={href}>{highlight(title, terms)}</a>
        </h2>
        {summary ? <p className="row-summary">{highlight(summary, terms)}</p> : null}
      </div>
      {tags.length > 0 ? (
        <ul className="row-aside" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag}>{highlight(tag, terms)}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
