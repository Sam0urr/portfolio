export type NoteCardProps = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date string, e.g. "2026-05-12". */
  date: string;
  tags: string[];
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

/**
 * One note in the list. The whole card is clickable via the title link's
 * ::after pseudo-element, which keeps a single focus stop per card.
 */
export default function NoteCard({ slug, title, summary, date, tags }: NoteCardProps) {
  const href = `/notes/${slug}/`;
  const formattedDate = formatNoteDate(date);

  return (
    <article className="group relative rounded-lg border border-line bg-surface p-5 transition-colors duration-200 hover:border-accent focus-within:border-accent focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-paper sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl leading-snug text-ink sm:text-2xl">
          <a
            href={href}
            className="transition-colors duration-200 group-hover:text-accent focus-visible:outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']"
          >
            {title}
          </a>
        </h2>
        <time dateTime={date} className="font-mono text-xs text-muted">
          {formattedDate}
        </time>
      </div>

      {summary ? <p className="mt-2 font-body text-base leading-relaxed text-muted">{summary}</p> : null}

      {tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
