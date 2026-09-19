import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import NoteCard from './NoteCard';

export type NoteSummary = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date string, e.g. "2026-05-12". */
  date: string;
  tags: string[];
};

export type UpcomingNote = {
  status: string;
  title: string;
  teaser: string;
};

export type Props = {
  notes: NoteSummary[];
  upcoming: UpcomingNote[];
};

const DEBOUNCE_MS = 120;
const QUERY_PARAM = 'q';
const TAGS_PARAM = 'tags';

/** Lowercase + collapse whitespace so matching is insensitive to case and spacing. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Tag chip order: most-used first, then alphabetical for ties. */
function deriveTags(notes: NoteSummary[]): string[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

function readUrlState(knownTags: string[]): { query: string; tags: string[] } {
  if (typeof window === 'undefined') return { query: '', tags: [] };
  const params = new URLSearchParams(window.location.search);
  const query = params.get(QUERY_PARAM) ?? '';
  const known = new Set(knownTags);
  const tags = (params.get(TAGS_PARAM) ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && known.has(tag));
  return { query, tags: [...new Set(tags)] };
}

function writeUrlState(query: string, tags: string[]): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set(QUERY_PARAM, trimmed);
  if (tags.length > 0) params.set(TAGS_PARAM, tags.join(','));
  // Keep commas readable in the address bar.
  const search = params.toString().replace(/%2C/gi, ',');
  const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}

/**
 * Notes index: search + tag filter over a static list of notes, plus a
 * "Coming soon" section. Hydrated with client:visible; safe to render on the
 * server (no window access at module scope).
 */
export default function NotesExplorer({ notes, upcoming }: Props) {
  const inputId = useId();
  const countId = useId();
  const tagsHeadingId = useId();
  const comingSoonHeadingId = useId();

  const allTags = useMemo(() => deriveTags(notes), [notes]);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Becomes true once the URL has been read on the client; URL writes wait for it
  // so the initial (empty) server state never clobbers a shared link.
  const [ready, setReady] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read ?q= and ?tags= on mount.
  useEffect(() => {
    const initial = readUrlState(allTags);
    setQuery(initial.query);
    setDebouncedQuery(initial.query);
    setSelectedTags(initial.tags);
    setReady(true);
  }, [allTags]);

  // Mirror the effective filter state back to the URL.
  useEffect(() => {
    if (!ready) return;
    writeUrlState(debouncedQuery, selectedTags);
  }, [ready, debouncedQuery, selectedTags]);

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
    if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      setDebouncedQuery(value);
    }, DEBOUNCE_MS);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  function clearAll() {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    setQuery('');
    setDebouncedQuery('');
    setSelectedTags([]);
  }

  const filteredNotes = useMemo(() => {
    const terms = normalise(debouncedQuery).split(' ').filter(Boolean);
    return notes.filter((note) => {
      if (selectedTags.length > 0 && !selectedTags.every((tag) => note.tags.includes(tag))) {
        return false;
      }
      if (terms.length === 0) return true;
      const haystack = normalise(`${note.title} ${note.summary} ${note.tags.join(' ')}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [notes, debouncedQuery, selectedTags]);

  const isFiltering = debouncedQuery.trim().length > 0 || selectedTags.length > 0;
  const total = notes.length;
  const shown = filteredNotes.length;
  const resultText = isFiltering
    ? shown === 0
      ? `No notes match. ${total} ${total === 1 ? 'note' : 'notes'} in total.`
      : `Showing ${shown} of ${total} ${total === 1 ? 'note' : 'notes'}.`
    : `${total} ${total === 1 ? 'note' : 'notes'}.`;

  return (
    <div className="font-body text-ink">
      {/* Search */}
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search notes
        </label>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search notes…"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={countId}
          className="w-full rounded-lg border border-line bg-surface py-2.5 pl-11 pr-4 text-base text-ink placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper"
        />
      </div>

      {/* Tag chips */}
      {allTags.length > 0 ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span id={tagsHeadingId} className="font-mono text-xs uppercase tracking-wider text-muted">
              Filter by tag
            </span>
            {selectedTags.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="font-mono text-xs text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-sm"
              >
                Clear tags
              </button>
            ) : null}
          </div>
          <ul aria-labelledby={tagsHeadingId} className="mt-2 flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const pressed = selectedTags.includes(tag);
              return (
                <li key={tag}>
                  <button
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => toggleTag(tag)}
                    className={
                      pressed
                        ? 'rounded-full border border-ink bg-ink px-3 py-1 text-sm text-paper transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper'
                        : 'rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted transition-colors duration-200 hover:border-accent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper'
                    }
                  >
                    {tag}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Result count (live region) */}
      <p id={countId} aria-live="polite" aria-atomic="true" className="mt-6 font-mono text-xs text-muted">
        {resultText}
      </p>

      {/* Notes list */}
      {shown > 0 ? (
        <ul className="mt-4 grid gap-4 sm:gap-5">
          {filteredNotes.map((note) => (
            <li key={note.slug}>
              <NoteCard
                slug={note.slug}
                title={note.title}
                summary={note.summary}
                date={note.date}
                tags={note.tags}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-line px-6 py-10 text-center">
          <p className="font-display text-lg text-ink">
            {total === 0 ? 'No notes yet.' : 'No notes match that search.'}
          </p>
          {isFiltering ? (
            <>
              <p className="mt-2 text-sm text-muted">Try a different word, or remove a tag.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-ink transition-colors duration-200 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                Clear search and tags
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Coming soon */}
      {upcoming.length > 0 ? (
        <section aria-labelledby={comingSoonHeadingId} className="mt-14 border-t border-line pt-8">
          <h2 id={comingSoonHeadingId} className="font-display text-2xl text-ink">
            Coming soon
          </h2>
          <p className="mt-1 text-sm text-muted">Drafts and topics I&rsquo;m working on next.</p>
          <ul className="mt-6 grid gap-6">
            {upcoming.map((item) => (
              <li key={`${item.status}-${item.title}`} className="grid gap-1">
                <span className="inline-flex w-fit items-center rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider text-accent">
                  {item.status}
                </span>
                <h3 className="font-display text-lg leading-snug text-ink">{item.title}</h3>
                {item.teaser ? <p className="text-sm leading-relaxed text-muted">{item.teaser}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
