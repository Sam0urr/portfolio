import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import NoteCard from './NoteCard';

export type NoteSummary = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date string, e.g. "2026-05-12". */
  date: string;
  tags: string[];
  /** Minutes; optional, shown after the date as "· 9 min". */
  readingTime?: number;
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
  const trimmed = query.trim();
  const pairs: string[] = [];
  if (trimmed) pairs.push(`${QUERY_PARAM}=${encodeURIComponent(trimmed)}`);
  // Commas stay readable in the address bar; spaces are %20, as in the tag links on notes
  // (Note.astro), so arriving from one leaves the URL exactly as written.
  if (tags.length > 0) pairs.push(`${TAGS_PARAM}=${tags.map(encodeURIComponent).join(',')}`);
  const search = pairs.join('&');
  const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, '', next);
  }
}

/**
 * Notes index: search + tag filter over a static list of notes ("§ 01 · Notes"),
 * plus the "§ 02 · Forthcoming" drafts. Hydrated with client:visible; safe to
 * render on the server (no window access at module scope).
 *
 * Styling reuses the shell's component classes (.field-rule, .chips/.chip,
 * .rows/.row, .section-head, .meta, .lede, .ui-link) so the list is the same
 * ledger as the home page; Tailwind utilities only add vertical rhythm.
 */
export default function NotesExplorer({ notes, upcoming }: Props) {
  const inputId = useId();
  const countId = useId();
  const tagsHeadingId = useId();
  const ledgerHeadingId = useId();
  const forthcomingHeadingId = useId();

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

  // Every term must appear somewhere in title + summary + tags (AND semantics).
  const terms = useMemo(() => normalise(debouncedQuery).split(' ').filter(Boolean), [debouncedQuery]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedTags.length > 0 && !selectedTags.every((tag) => note.tags.includes(tag))) {
        return false;
      }
      if (terms.length === 0) return true;
      const haystack = normalise(`${note.title} ${note.summary} ${note.tags.join(' ')}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [notes, terms, selectedTags]);

  const isFiltering = terms.length > 0 || selectedTags.length > 0;
  const total = notes.length;
  const shown = filteredNotes.length;
  const noun = total === 1 ? 'note' : 'notes';
  const resultText = isFiltering
    ? shown === 0
      ? `No notes match. ${total} ${noun} in total.`
      : `Showing ${shown} of ${total} ${noun}.`
    : `${total} ${noun}.`;

  return (
    <div className="notes-explorer">
      {/* Search: a bare rule, mono placeholder; the label is for assistive tech only. */}
      <div className="mt-2">
        <label htmlFor={inputId} className="sr-only">
          Search notes
        </label>
        <input
          id={inputId}
          type="search"
          className="field-rule"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search notes…"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={countId}
        />
      </div>

      {/* Tag chips: multi-select, AND. */}
      {allTags.length > 0 ? (
        <div className="mt-6">
          <span id={tagsHeadingId} className="sr-only">
            Filter by tag
          </span>
          <ul aria-labelledby={tagsHeadingId} className="chips">
            {allTags.map((tag) => {
              const pressed = selectedTags.includes(tag);
              return (
                <li key={tag}>
                  <button type="button" className="chip" aria-pressed={pressed} onClick={() => toggleTag(tag)}>
                    {tag}
                  </button>
                </li>
              );
            })}
          </ul>
          {selectedTags.length > 0 ? (
            <p className="mt-3 mb-0">
              <button type="button" className="ui-link cursor-pointer" onClick={() => setSelectedTags([])}>
                Clear tags →
              </button>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* The ledger */}
      <section className="section notes-ledger" aria-labelledby={ledgerHeadingId}>
        <h2 id={ledgerHeadingId} className="section-head">
          § 01 · Notes
        </h2>
        {/* Result count: a live region for assistive tech, visible only while filtering
            (the h1 already carries the total). */}
        <p id={countId} aria-live="polite" aria-atomic="true" className={isFiltering ? 'meta mb-4' : 'sr-only'}>
          {resultText}
        </p>
        {shown > 0 ? (
          <ul className={ready ? 'rows rows-live' : 'rows'}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.slug}
                slug={note.slug}
                title={note.title}
                summary={note.summary}
                date={note.date}
                tags={note.tags}
                readingTime={note.readingTime}
                terms={terms}
              />
            ))}
          </ul>
        ) : (
          <p className="lede">{total === 0 ? 'Nothing here yet.' : 'Nothing matches that yet.'}</p>
        )}
      </section>

      {/* Forthcoming: drafts on surface, no links. */}
      {upcoming.length > 0 ? (
        <section className="section" aria-labelledby={forthcomingHeadingId}>
          <h2 id={forthcomingHeadingId} className="section-head">
            § 02 · Forthcoming
          </h2>
          <ul className="rows rows-forthcoming">
            {upcoming.map((item) => (
              <li key={`${item.status}-${item.title}`} className="row row-muted row-forthcoming">
                <p className="row-meta">{item.status}</p>
                <div className="row-body">
                  <h3 className="row-title">{item.title}</h3>
                  {item.teaser ? <p className="row-summary">{item.teaser}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
